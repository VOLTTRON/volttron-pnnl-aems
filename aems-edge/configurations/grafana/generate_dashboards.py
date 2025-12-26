"""
Grafana Dashboard Generator
Automates generation of Grafana dashboards using templates and config.ini
Supports both file export and direct API upload to Grafana with basic authentication
"""

import json
AUTOMATED_DEVICE_DISCOVERY_NEEDED = False
import configparser
from datetime import datetime
from copy import deepcopy
import os
import re
import requests
import urllib3
import getpass
import logging
import time
from urllib.parse import urlparse
from requests.auth import HTTPBasicAuth

# Configuration path - relative to this script's location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(SCRIPT_DIR, 'config.ini')
# Allow OUTPUT_DIR to be overridden by environment variable (for container deployment)
OUTPUT_DIR = os.getenv('OUTPUT_DIR', os.path.join(SCRIPT_DIR, 'output'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)


def get_variable_values(grafana_api, datasource_uid, campus, building):
    """
    Query Grafana to get all device values from the PostgreSQL datasource
    Returns list of device names
    """
    try:
        # Query to get all RTU devices
        query = f"select topic_name from topics where topic_name like '{campus}/{building}/%/ZoneTemperature'"
        
        # Use Grafana datasource query API
        payload = {
            "queries": [{
                "datasource": {"type": "postgres", "uid": datasource_uid},
                "rawSql": query,
                "format": "table"
            }]
        }
        
        response = requests.post(
            f'{grafana_api.url}/api/ds/query',
            auth=grafana_api.auth,
            headers=grafana_api.headers,
            json=payload,
            verify=grafana_api.verify_ssl,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            devices = []
            
            # Extract device names from topic paths
            if 'results' in data:
                for result_key in data['results']:
                    result = data['results'][result_key]
                    if 'frames' in result:
                        for frame in result['frames']:
                            if 'data' in frame and 'values' in frame['data']:
                                for values in frame['data']['values']:
                                    for topic_name in values:
                                        # Extract device name from topic: campus/building/device/point
                                        parts = topic_name.split('/')
                                        if len(parts) >= 3:
                                            device = parts[2]
                                            if device not in devices:
                                                devices.append(device)
            
            return sorted(devices)
        else:
            logging.error(f"Failed to query devices: {response.status_code}")
            return []
            
    except Exception as e:
        logging.error(f"Error querying devices: {e}")
        return []


def load_config(config_file=CONFIG_PATH):
    """Load configuration from INI file"""
    config = configparser.ConfigParser()
    config.read(config_file)
    
    # Try [dashboard] section first, fallback to DEFAULT
    section = 'dashboard' if config.has_section('dashboard') else 'DEFAULT'
    
    result = {
        'campus': config.get(section, 'campus', fallback='PNNL'),
        'building': config.get(section, 'building', fallback='ROB'),
        'gateway_address': config.get(section, 'gateway-address', fallback=''),
        'prefix': config.get(section, 'prefix', fallback='rtu'),
        'num-configs': config.get(section, 'num-configs', fallback='1'),
        'output_dir': config.get(section, 'output-dir', fallback='output'),
        'timezone': config.get(section, 'timezone', fallback='America/Los_Angeles')
    }
    
    # Load device mapping if available
    #TODO: here we must get data from device registry
    if config.has_section('device_mapping'):
        result['device_mapping'] = dict(config.items('device_mapping'))
        logging.info(f"Loaded {len(result['device_mapping'])} device mappings from config")
    else:
        result['device_mapping'] = {}
        logging.warning("No device_mapping section found in config.ini")
    
    # Load PostgreSQL-DB section if available
    if config.has_section('PostgreSQL-DB'):
        result['PostgreSQL-DB'] = dict(config.items('PostgreSQL-DB'))
        logging.info(f"Loaded PostgreSQL-DB configuration")
    
    # Load viewer-user section if available
    if config.has_section('viewer-user'):
        result['viewer-user'] = dict(config.items('viewer-user'))
        logging.info(f"Loaded viewer-user configuration")
    
    return result


def load_template(template_file):
    """Load dashboard template JSON file"""
    with open(template_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def replace_topic_prefix(content, old_prefix, new_prefix):
    """Replace topic name prefix in JSON content"""
    content_str = json.dumps(content)
    content_str = content_str.replace(old_prefix, new_prefix)
    return json.loads(content_str)


def apply_device_mapping(content, device_mapping):
    """Apply device point name mapping to dashboard content"""
    if not device_mapping:
        logging.warning("No device mapping provided, skipping validation")
        return content
    
    content_str = json.dumps(content)
    
    # Extract all point names used in the dashboard
    used_points = set(re.findall(r'/([A-Za-z0-9_]+)(?:\'|\s)', content_str))
    
    # Get mapped point names (values from config)
    mapped_points = set(device_mapping.values())
    
    # Find points used in dashboard but not in mapping
    unmapped_points = used_points - mapped_points - {
        'topics', 'data', 'meter', 'air_temperature', 'Watts'  # Known non-device points
    }
    
    if unmapped_points:
        logging.warning(f"Points in dashboard not in device_mapping: {sorted(unmapped_points)}")
    
    # Find mapped points not used in dashboard
    unused_mappings = mapped_points - used_points
    if unused_mappings:
        logging.info(f"Mapped points not used in this dashboard: {sorted(unused_mappings)}")
    
    return content


def create_dashboard_for_device(template, config, datasource_uid, device):
    """
    Create a dashboard for a single device based on template
    Returns configured dashboard for the specific device
    """
    dashboard = json.loads(json.dumps(template))  # Deep copy
    
    campus = config['campus']
    building = config['building']
    
    # Replace variable references with actual device name throughout dashboard
    dashboard_str = json.dumps(dashboard)
    dashboard_str = dashboard_str.replace('$RTU_ROB', device)
    dashboard_str = dashboard_str.replace('${RTU_ROB}', device)
    dashboard_str = dashboard_str.replace('PNNL/ROB', f"{campus}/{building}")
    dashboard = json.loads(dashboard_str)
    
    # Update panel titles to remove redundant device name if it's already in title
    if 'panels' in dashboard:
        for panel in dashboard['panels']:
            if 'title' in panel:
                # If title was just the variable, replace with device name
                if panel['title'] == device:
                    continue  # Already set correctly
                # If title contains device name, keep as is
                elif device in panel['title']:
                    continue
                # Otherwise, don't add device name to avoid redundancy in single-device dashboard
    
    # Remove templating variables since we're using fixed device name
    if 'templating' in dashboard:
        dashboard['templating']['list'] = []
    
    # Update dashboard metadata
    dashboard['title'] = f"{campus} {building} - {device} Overview"
    dashboard['id'] = None
    dashboard['uid'] = None
    dashboard['version'] = 0
    
    # Update datasource UID if provided
    if datasource_uid:
        update_datasource_uid(dashboard, datasource_uid)
    
    return dashboard


def generate_rtu_overview(template, config, datasource_uid, grafana_api=None, devices=None):
    """
    Generate RTU Overview dashboard(s) from template.
    
    Returns tuple: (list of dashboards, list of devices)
    - dashboards: List of dashboard dictionaries (one per device if multiple devices found)
    - devices: List of device names that were discovered or provided
    """
    campus = config['campus']
    building = config['building']
    
    # Device selection logic
    if not AUTOMATED_DEVICE_DISCOVERY_NEEDED:
        # Get devices from config
        prefix = config.get('prefix', 'rtu')
        num_configs = int(config.get('num-configs', 1))
        discovered_devices = [f"{prefix}{str(i+1).zfill(2)}" for i in range(num_configs)]
        logging.info(f"Using devices from config: {', '.join(discovered_devices)}")
    else:
        # Automated device discovery
        discovered_devices = devices
        if discovered_devices is None and grafana_api is not None:
            logging.info(f"Querying devices from Grafana for {campus}/{building}...")
            discovered_devices = get_variable_values(grafana_api, datasource_uid, campus, building)
            if discovered_devices:
                logging.info(f"Found {len(discovered_devices)} devices: {', '.join(discovered_devices)}")
            else:
                logging.warning("No devices found, using template defaults")
                discovered_devices = None
    
    dashboards = []
    
    # If we have multiple devices, create separate dashboard for each
    if discovered_devices and len(discovered_devices) > 0:
        logging.info(f"Creating separate dashboard for each of {len(discovered_devices)} devices...")
        for device in discovered_devices:
            dashboard = create_dashboard_for_device(template, config, datasource_uid, device)
            dashboards.append({
                'dashboard': dashboard,
                'device': device,
                'filename': f"{campus}_{building}_{device}_RTU_Overview.json"
            })
    else:
        # Single device mode - keep template as is with variables
        dashboard = template.copy()
        new_prefix = f"{campus}/{building}"
        
        # Replace the topic prefix in the entire dashboard
        dashboard = replace_topic_prefix(dashboard, "PNNL/ROB", new_prefix)
        
        # Apply device mapping validation
        dashboard = apply_device_mapping(dashboard, config.get('device_mapping', {}))
        
        # Update dashboard metadata
        dashboard['title'] = f"{campus} {building} - RTU Overview"
        dashboard['id'] = None
        dashboard['uid'] = None
        dashboard['version'] = 0
        
        # Update datasource UID if provided
        if datasource_uid:
            update_datasource_uid(dashboard, datasource_uid)
        
        dashboards.append({
            'dashboard': dashboard,
            'device': None,
            'filename': f"{campus}_{building}_RTU_Overview.json"
        })
    
    return dashboards, discovered_devices


def generate_site_overview(template, config, datasource_uid, grafana_api=None, devices=None):
    """
    Generate Site Overview dashboard from template.
    
    Updates state-timeline panels to include all discovered devices dynamically.
    
    Args:
        template: Dashboard template JSON
        config: Configuration dictionary
        datasource_uid: Grafana PostgreSQL datasource UID
        grafana_api: GrafanaAPI instance (optional, for device discovery)
        devices: List of device names (optional, will query if not provided)
    
    Returns:
        Dashboard dictionary with updated queries for all devices
    """
    # Use deep copy to avoid modifying the template
    dashboard = deepcopy(template)
    
    # Build the topic prefix from config
    campus = config['campus']
    building = config['building']
    new_prefix = f"{campus}/{building}"
    
    # Auto-discover devices from Grafana if not provided
    if devices is None and grafana_api is not None:
        logging.info(f"Querying devices from Grafana for site overview...")
        devices = get_variable_values(grafana_api, datasource_uid, campus, building)
        if devices:
            logging.info(f"Found {len(devices)} devices for site overview: {', '.join(devices)}")
        else:
            logging.warning("No devices found for site overview, using template defaults")
            devices = None
    
    # Update state-timeline panels with dynamic device queries
    if devices and len(devices) > 0:
        logging.info(f"Updating state-timeline panels with {len(devices)} devices...")
        update_statetimeline_panels(dashboard, devices, campus, building)
    
    # Replace the topic prefix in the entire dashboard
    dashboard = replace_topic_prefix(dashboard, "PNNL/ROB", new_prefix)
    
    # Apply device mapping validation
    dashboard = apply_device_mapping(dashboard, config.get('device_mapping', {}))
    
    # Update dashboard metadata
    dashboard['title'] = f"{campus} {building} - Site Overview"
    dashboard['id'] = None
    dashboard['uid'] = None
    dashboard['version'] = 0
    
    # Update datasource UID if provided
    if datasource_uid:
        update_datasource_uid(dashboard, datasource_uid)
    
    return dashboard


def update_statetimeline_panels(dashboard, devices, campus, building):
    """
    Update state-timeline panels to include all discovered devices.
    
    Dynamically builds SQL queries with CASE statements for each device.
    Handles both simple queries and CTE-based queries (e.g., temperature setpoint error).
    
    Args:
        dashboard: Dashboard JSON to update
        devices: List of device names
        campus: Campus name
        building: Building name
    """
    
    # Panels that should be updated (state-timeline type)
    for panel in dashboard.get('panels', []):
        if panel.get('type') == 'state-timeline' and 'targets' in panel:
            for target in panel['targets']:
                if 'rawSql' in target:
                    query = target['rawSql']
                    
                    # Check if this is a CTE query (contains WITH clause)
                    if 'WITH' in query.upper() and 'zone_temps' in query.lower():
                        # This is the temperature setpoint error query with CTEs
                        update_cte_query(target, devices, campus, building)
                    else:
                        # Simple query - extract metric and rebuild
                        metric_match = re.search(r"'[^']+/([A-Za-z]+)'", query)
                        
                        if metric_match:
                            metric = metric_match.group(1)
                            
                            # Build CASE statements for all devices
                            case_statements = []
                            for device in devices:
                                case_stmt = f"  MAX(CASE WHEN upper(split_part(topic_name, '/', 3)) = '{device.upper()}' THEN cast(value_string as float) END) AS {device}"
                                case_statements.append(case_stmt)
                            
                            cases_sql = ',\n'.join(case_statements)
                            
                            # Build new query
                            new_query = f"""SELECT
  $__timeGroup(ts, $__interval) AS time,
{cases_sql}
FROM data
NATURAL JOIN topics
WHERE topic_name LIKE '{campus}/{building}/%/{metric}'
  AND $__timeFilter(ts)
GROUP BY 1
ORDER BY 1
"""
                            target['rawSql'] = new_query
                            logging.info(f"Updated state-timeline panel with {len(devices)} devices for metric: {metric}")


def update_cte_query(target, devices, campus, building):
    """
    Update CTE-based query (e.g., temperature setpoint error) with discovered devices.
    Uses uppercase device names in column aliases (RTU01, RTU02, etc.) to match expected format.
    
    Args:
        target: Query target to update
        devices: List of device names
        campus: Campus name
        building: Building name
    """
    # Build CASE statements for zone_temps CTE (using uppercase device names in aliases)
    temp_cases = []
    for device in devices:
        device_upper = device.upper()
        temp_case = f"    MAX(CASE WHEN upper(split_part(topic_name, '/', 3)) = '{device_upper}' THEN cast(value_string as float) END) AS {device_upper}_temp"
        temp_cases.append(temp_case)
    
    temp_cases_sql = ',\n'.join(temp_cases)
    
    # Build CASE statements for zone_setpoints CTE (using uppercase device names in aliases)
    sp_cases = []
    for device in devices:
        device_upper = device.upper()
        sp_case = f"    MAX(CASE WHEN upper(split_part(topic_name, '/', 3)) = '{device_upper}' THEN cast(value_string as float) END) AS {device_upper}_sp"
        sp_cases.append(sp_case)
    
    sp_cases_sql = ',\n'.join(sp_cases)
    
    # Build SELECT columns for final query (using uppercase device names)
    select_cols = []
    for device in devices:
        device_upper = device.upper()
        select_col = f"  t.{device_upper}_temp - s.{device_upper}_sp AS {device_upper}"
        select_cols.append(select_col)
    
    select_cols_sql = ',\n'.join(select_cols)
    
    # Build complete CTE query
    new_query = f"""WITH zone_temps AS (
  SELECT
    $__timeGroup(ts, $__interval) AS time,
{temp_cases_sql}
  FROM data
  NATURAL JOIN topics
  WHERE topic_name LIKE '{campus}/{building}/%/ZoneTemperature'
    AND $__timeFilter(ts)
  GROUP BY 1
),
zone_setpoints AS (
  SELECT
    $__timeGroup(ts, $__interval) AS time,
{sp_cases_sql}
  FROM data
  NATURAL JOIN topics
  WHERE topic_name LIKE '{campus}/{building}/%/EffectiveZoneTemperatureSetPoint'
    AND $__timeFilter(ts)
  GROUP BY 1
)
SELECT
  t.time,
{select_cols_sql}
FROM zone_temps t
JOIN zone_setpoints s ON t.time = s.time
ORDER BY t.time
"""
    
    target['rawSql'] = new_query
    logging.info(f"Updated CTE query (temperature setpoint error) with {len(devices)} devices")


def update_datasource_uid(dashboard, datasource_uid):
    """Update all datasource UIDs in dashboard"""
    # Update panel datasources
    for panel in dashboard.get('panels', []):
        if 'datasource' in panel and isinstance(panel['datasource'], dict):
            if panel['datasource'].get('type') == 'postgres':
                panel['datasource']['uid'] = datasource_uid
        
        # Update target datasources
        for target in panel.get('targets', []):
            if 'datasource' in target and isinstance(target['datasource'], dict):
                if target['datasource'].get('type') == 'postgres':
                    target['datasource']['uid'] = datasource_uid
    
    # Update templating datasources
    for template_var in dashboard.get('templating', {}).get('list', []):
        if 'datasource' in template_var and isinstance(template_var['datasource'], dict):
            if template_var['datasource'].get('type') == 'postgres':
                template_var['datasource']['uid'] = datasource_uid


def save_dashboard(dashboard, filename, output_dir='.'):
    """Save dashboard to JSON file"""
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(dashboard, f, indent=2)
    
    return filepath


def create_import_wrapper(dashboard, folder_id=0):
    """Create Grafana API import wrapper"""
    return {
        "dashboard": dashboard,
        "folderId": folder_id,
        "overwrite": False
    }


class KeycloakAPI:
    """Keycloak API client for role management"""
    
    def __init__(self, url, realm, admin_user, admin_password, verify_ssl=True):
        """
        Initialize Keycloak API client with admin authentication
        
        Args:
            url: Keycloak base URL (e.g., https://hostname/auth/sso)
            realm: Realm name (e.g., 'default')
            admin_user: Keycloak admin username
            admin_password: Keycloak admin password
            verify_ssl: Whether to verify SSL certificates (default: True)
        """
        self.url = url.rstrip('/')
        self.realm = realm
        self.admin_user = admin_user
        self.admin_password = admin_password
        self.verify_ssl = verify_ssl
        self.access_token = None
        self.headers = {
            'Content-Type': 'application/json'
        }
        
        if not verify_ssl:
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    def check_health(self):
        """
        Check if Keycloak is responding to health checks
        
        Returns:
            True if Keycloak is healthy, False otherwise
        """
        try:
            # Extract base URL without /auth/sso path for health endpoint
            # Health endpoint is at root level, not under /auth/sso
            base_url = self.url.replace('/auth/sso', '')
            health_url = f'{base_url}/health/ready'
            
            response = requests.get(
                health_url,
                verify=self.verify_ssl,
                timeout=5
            )
            
            if response.status_code == 200:
                return True
            else:
                logging.debug(f"Keycloak health check returned status {response.status_code}")
                logging.debug(f"Response: {response.text[:200]}")  # Log first 200 chars
                return False
        except Exception as e:
            logging.debug(f"Keycloak health check failed: {type(e).__name__}: {str(e)}")
            return False
    
    def authenticate(self):
        """Authenticate with Keycloak and get access token"""
        try:
            token_url = f'{self.url}/realms/master/protocol/openid-connect/token'
            data = {
                'grant_type': 'password',
                'client_id': 'admin-cli',
                'username': self.admin_user,
                'password': self.admin_password
            }
            
            response = requests.post(
                token_url,
                data=data,
                verify=self.verify_ssl,
                timeout=10
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.access_token = token_data.get('access_token')
                self.headers['Authorization'] = f'Bearer {self.access_token}'
                return True
            else:
                logging.debug(f"Keycloak authentication failed with status {response.status_code}")
                logging.debug(f"URL attempted: {token_url}")
                logging.debug(f"Response: {response.text[:200]}")  # Log first 200 chars
                return False
                
        except Exception as e:
            logging.debug(f"Keycloak authentication exception: {type(e).__name__}: {str(e)}")
            logging.debug(f"URL attempted: {token_url if 'token_url' in locals() else 'unknown'}")
            return False
    
    def wait_for_keycloak(self, max_retries=10, initial_delay=2, max_delay=60):
        """
        Wait for Keycloak to be ready with exponential backoff
        
        Args:
            max_retries: Maximum number of retry attempts (default: 10)
            initial_delay: Initial delay in seconds (default: 2)
            max_delay: Maximum delay between retries in seconds (default: 60)
        
        Returns:
            True if Keycloak becomes ready, False if all retries exhausted
        """
        logging.info("Waiting for Keycloak to be ready...")
        
        for attempt in range(max_retries):
            # First check health endpoint
            if self.check_health():
                logging.info("Keycloak health check passed")
                
                # Then try to authenticate
                if self.authenticate():
                    logging.info(f"Successfully connected to Keycloak after {attempt + 1} attempt(s)")
                    return True
            
            # Calculate delay with exponential backoff, capped at max_delay
            delay = min(initial_delay * (2 ** attempt), max_delay)
            
            if attempt < max_retries - 1:  # Don't log on last failed attempt
                logging.info(f"Keycloak not ready, retrying in {delay}s (attempt {attempt + 1}/{max_retries})...")
                time.sleep(delay)
        
        logging.warning(f"Keycloak did not become ready after {max_retries} attempts")
        return False
    
    def get_client_by_clientid(self, client_id):
        """
        Get client UUID by client ID
        
        Args:
            client_id: Client ID (e.g., 'grafana-oauth')
        
        Returns:
            Client UUID string or None if not found
        """
        try:
            if not self.access_token:
                if not self.authenticate():
                    return None
            
            url = f'{self.url}/admin/realms/{self.realm}/clients'
            params = {'clientId': client_id}
            
            response = requests.get(
                url,
                headers=self.headers,
                params=params,
                verify=self.verify_ssl,
                timeout=10
            )
            
            if response.status_code == 200:
                clients = response.json()
                if clients and len(clients) > 0:
                    return clients[0].get('id')
                else:
                    logging.error(f"Client '{client_id}' not found in realm '{self.realm}'")
                    return None
            else:
                logging.error(f"Failed to get client: {response.status_code}")
                return None
                
        except Exception as e:
            logging.error(f"Exception getting client: {e}")
            return None
    
    def role_exists(self, client_uuid, role_name):
        """
        Check if a client role exists
        
        Args:
            client_uuid: Client UUID
            role_name: Role name to check
        
        Returns:
            True if role exists, False otherwise
        """
        try:
            if not self.access_token:
                if not self.authenticate():
                    return False
            
            url = f'{self.url}/admin/realms/{self.realm}/clients/{client_uuid}/roles/{role_name}'
            
            response = requests.get(
                url,
                headers=self.headers,
                verify=self.verify_ssl,
                timeout=10
            )
            
            return response.status_code == 200
                
        except Exception as e:
            logging.error(f"Exception checking role existence: {e}")
            return False
    
    def create_client_role(self, client_uuid, role_name, description):
        """
        Create a client role
        
        Args:
            client_uuid: Client UUID
            role_name: Role name
            description: Role description
        
        Returns:
            tuple: (success, message)
        """
        try:
            if not self.access_token:
                if not self.authenticate():
                    return False, "Authentication failed"
            
            # Check if role already exists
            if self.role_exists(client_uuid, role_name):
                return True, f"Role '{role_name}' already exists"
            
            url = f'{self.url}/admin/realms/{self.realm}/clients/{client_uuid}/roles'
            
            role_data = {
                'name': role_name,
                'description': description,
                'composite': False,
                'clientRole': True
            }
            
            response = requests.post(
                url,
                headers=self.headers,
                json=role_data,
                verify=self.verify_ssl,
                timeout=10
            )
            
            if response.status_code == 201:
                return True, f"Role '{role_name}' created successfully"
            else:
                error_msg = response.text
                try:
                    error_json = response.json()
                    error_msg = error_json.get('errorMessage', error_msg)
                except:
                    pass
                return False, f"Failed to create role: {error_msg}"
                
        except Exception as e:
            return False, f"Exception creating role: {str(e)}"


class GrafanaAPI:
    """Grafana API client for dashboard management"""
    
    def __init__(self, url, username, password, verify_ssl=True):
        """
        Initialize Grafana API client with basic authentication
        
        Args:
            url: Grafana base URL (e.g., http://localhost:3000)
            username: Grafana username
            password: Grafana password
            verify_ssl: Whether to verify SSL certificates (default: True)
        """
        self.url = url.rstrip('/')
        self.username = username
        self.password = password
        self.auth = HTTPBasicAuth(username, password)
        self.verify_ssl = verify_ssl
        self.headers = {
            'Content-Type': 'application/json'
        }
        
        if not verify_ssl:
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    def test_connection(self):
        """Test connection to Grafana API"""
        try:
            response = requests.get(
                f'{self.url}/api/health',
                auth=self.auth,
                headers=self.headers,
                verify=self.verify_ssl,
                timeout=10
            )
            return response.status_code == 200
        except Exception as e:
            logging.error(f"Connection failed: {e}")
            return False
    
    def get_datasources(self):
        """Get list of datasources"""
        try:
            response = requests.get(
                f'{self.url}/api/datasources',
                auth=self.auth,
                headers=self.headers,
                verify=self.verify_ssl,
                timeout=10
            )
            if response.status_code == 200:
                return response.json()
            return []
        except Exception as e:
            logging.error(f"Failed to get datasources: {e}")
            return []
    
    def create_datasource(self, datasource_config):
        """
        Create a new datasource in Grafana
        
        Args:
            datasource_config: Datasource configuration dict
        
        Returns:
            tuple: (success, message, response_data)
        """
        try:
            response = requests.post(
                f'{self.url}/api/datasources',
                auth=self.auth,
                headers=self.headers,
                json=datasource_config,
                verify=self.verify_ssl,
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                return True, "Datasource created successfully", data
            else:
                error_msg = response.text
                try:
                    error_json = response.json()
                    error_msg = error_json.get('message', error_msg)
                except:
                    pass
                return False, f"Failed: {error_msg}", None
                
        except Exception as e:
            return False, f"Exception: {str(e)}", None
    
    def create_dashboard(self, dashboard, folder_id=0, overwrite=False):
        """
        Create or update dashboard in Grafana
        
        Args:
            dashboard: Dashboard JSON object
            folder_id: Folder ID to create dashboard in (default: 0 = General)
            overwrite: Whether to overwrite existing dashboard
        
        Returns:
            tuple: (success, message, response_data)
        """
        try:
            # Search for existing dashboard with the same title
            dashboard_title = dashboard.get('title', '')
            if dashboard_title:
                existing = self.search_dashboards(query=dashboard_title, folder_ids=[folder_id])
                
                # Filter to exact title match (search can return partial matches)
                exact_matches = [d for d in existing if d.get('title') == dashboard_title]
                
                if exact_matches:
                    # Delete existing dashboard(s) with the same title
                    for existing_dashboard in exact_matches:
                        existing_uid = existing_dashboard.get('uid')
                        if existing_uid:
                            logging.info(f"Deleting existing dashboard: {dashboard_title} (UID: {existing_uid})")
                            delete_success, delete_msg = self.delete_dashboard_by_uid(existing_uid)
                            if delete_success:
                                logging.info(f"Successfully deleted existing dashboard")
                            else:
                                logging.warning(f"Failed to delete existing dashboard: {delete_msg}")
            
            payload = {
                "dashboard": dashboard,
                "folderId": folder_id,
                "overwrite": overwrite,
                "message": f"Created via API at {datetime.now().isoformat()}"
            }
            
            response = requests.post(
                f'{self.url}/api/dashboards/db',
                auth=self.auth,
                headers=self.headers,
                json=payload,
                verify=self.verify_ssl,
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                return True, "Dashboard created successfully", data
            else:
                error_msg = response.text
                try:
                    error_json = response.json()
                    error_msg = error_json.get('message', error_msg)
                except:
                    pass
                return False, f"Failed: {error_msg}", None
                
        except Exception as e:
            return False, f"Exception: {str(e)}", None
    
    def search_dashboards(self, query=None, folder_ids=None):
        """
        Search for dashboards by title
        
        Args:
            query: Search query (dashboard title)
            folder_ids: List of folder IDs to search in
        
        Returns:
            list: List of matching dashboards
        """
        try:
            params = {'type': 'dash-db'}
            if query:
                params['query'] = query
            if folder_ids:
                params['folderIds'] = folder_ids
            
            response = requests.get(
                f'{self.url}/api/search',
                auth=self.auth,
                headers=self.headers,
                params=params,
                verify=self.verify_ssl,
                timeout=10
            )
            if response.status_code == 200:
                return response.json()
            return []
        except Exception as e:
            logging.error(f"Failed to search dashboards: {e}")
            return []
    
    def delete_dashboard_by_uid(self, dashboard_uid):
        """
        Delete a dashboard by UID
        
        Args:
            dashboard_uid: Dashboard UID to delete
        
        Returns:
            tuple: (success, message)
        """
        try:
            response = requests.delete(
                f'{self.url}/api/dashboards/uid/{dashboard_uid}',
                auth=self.auth,
                headers=self.headers,
                verify=self.verify_ssl,
                timeout=10
            )
            
            if response.status_code == 200:
                return True, "Dashboard deleted successfully"
            else:
                error_msg = response.text
                try:
                    error_json = response.json()
                    error_msg = error_json.get('message', error_msg)
                except:
                    pass
                return False, f"Failed to delete: {error_msg}"
                
        except Exception as e:
            return False, f"Exception: {str(e)}"
    
    def get_folders(self):
        """Get list of folders"""
        try:
            response = requests.get(
                f'{self.url}/api/folders',
                auth=self.auth,
                headers=self.headers,
                verify=self.verify_ssl,
                timeout=10
            )
            if response.status_code == 200:
                return response.json()
            return []
        except Exception as e:
            logging.error(f"Failed to get folders: {e}")
            return []
    
    def set_dashboard_permissions(self, dashboard_uid):
        """
        Set dashboard permissions to read-only for viewers
        
        Args:
            dashboard_uid: Dashboard UID
        
        Returns:
            tuple: (success, message)
        """
        try:
            # Get current permissions first
            response = requests.get(
                f'{self.url}/api/dashboards/uid/{dashboard_uid}/permissions',
                auth=self.auth,
                headers=self.headers,
                verify=self.verify_ssl,
                timeout=10
            )
            
            if response.status_code != 200:
                return False, f"Failed to get current permissions: {response.status_code}"
            
            # Set permissions: Admin (role:1) has Edit, Viewer (role:2) has View only
            permissions = {
                "items": [
                    {
                        "role": "Viewer",
                        "permission": 1  # 1 = View, 2 = Edit, 4 = Admin
                    },
                    {
                        "role": "Editor", 
                        "permission": 1  # Editors also get View only
                    },
                    {
                        "role": "Admin",
                        "permission": 2  # Admins get Edit permission
                    }
                ]
            }
            
            response = requests.post(
                f'{self.url}/api/dashboards/uid/{dashboard_uid}/permissions',
                auth=self.auth,
                headers=self.headers,
                json=permissions,
                verify=self.verify_ssl,
                timeout=10
            )
            
            if response.status_code == 200:
                return True, "Permissions set successfully"
            else:
                error_msg = response.text
                try:
                    error_json = response.json()
                    error_msg = error_json.get('message', error_msg)
                except:
                    pass
                return False, f"Failed to set permissions: {error_msg}"
                
        except Exception as e:
            return False, f"Exception: {str(e)}"
    
    def enable_anonymous_access(self):
        """
        Enable anonymous viewer access to Grafana dashboards
        
        This method will:
        1. Update the .env.grafana file with anonymous auth settings
        2. Restart the Grafana container to apply changes
        
        Returns:
            tuple: (success, message)
        """
        try:
            import subprocess
            
            # Path to .env.grafana file (relative to script or absolute)
            env_file_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(SCRIPT_DIR))),
                'aems-app', 'docker', '.env.grafana'
            )
            
            # Check if file exists
            if not os.path.exists(env_file_path):
                return False, f".env.grafana file not found at {env_file_path}"
            
            # Read current content
            with open(env_file_path, 'r') as f:
                content = f.read()
            
            # Check if anonymous settings already exist
            if 'GF_AUTH_ANONYMOUS_ENABLED' in content:
                logging.info("Anonymous access settings already present in .env.grafana")
            else:
                # Add anonymous access settings after database config
                lines = content.split('\n')
                insert_index = -1
                
                # Find where to insert (after GF_DATABASE_PASSWORD)
                for i, line in enumerate(lines):
                    if 'GF_DATABASE_PASSWORD' in line and not line.startswith('#'):
                        insert_index = i + 1
                        break
                
                if insert_index > 0:
                    # Insert anonymous access settings
                    lines.insert(insert_index, '')
                    lines.insert(insert_index + 1, '# Enable anonymous access for public viewing')
                    lines.insert(insert_index + 2, 'GF_AUTH_ANONYMOUS_ENABLED=true')
                    lines.insert(insert_index + 3, 'GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer')
                    
                    # Write back to file
                    with open(env_file_path, 'w') as f:
                        f.write('\n'.join(lines))
                    
                    logging.info(f"Updated {env_file_path} with anonymous access settings")
                else:
                    return False, "Could not find insertion point in .env.grafana"
            
            # Restart Grafana container
            docker_compose_dir = os.path.dirname(env_file_path)
            logging.info(f"Restarting Grafana container from {docker_compose_dir}...")
            
            # Try to restart using docker-compose
            result = subprocess.run(
                ['docker-compose', 'restart', 'grafana'],
                cwd=docker_compose_dir,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                logging.info("Grafana container restarted successfully")
                return True, "Anonymous access enabled and Grafana restarted. Public viewing is now active!"
            else:
                error_msg = result.stderr or result.stdout
                logging.warning(f"Failed to restart Grafana: {error_msg}")
                return True, f"Settings updated but restart failed: {error_msg}. Please run 'docker-compose restart grafana' manually."
                
        except subprocess.TimeoutExpired:
            return True, "Settings updated but restart timed out. Please run 'docker-compose restart grafana' manually."
        except Exception as e:
            return False, f"Exception: {str(e)}"
    
    def create_user(self, username, email, password, role='Viewer'):
        """
        Create a new user in Grafana
        
        Args:
            username: Username for the new user
            email: Email address for the new user
            password: Password for the new user
            role: User role - 'Viewer', 'Editor', or 'Admin' (default: 'Viewer')
        
        Returns:
            tuple: (success, message, user_data)
        """
        try:
            user_payload = {
                "name": username,
                "email": email,
                "login": username,
                "password": password,
                "role": role
            }
            
            response = requests.post(
                f'{self.url}/api/admin/users',
                auth=self.auth,
                headers=self.headers,
                json=user_payload,
                verify=self.verify_ssl,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                return True, f"User '{username}' created successfully with {role} role", data
            elif response.status_code == 412:
                # User already exists
                return False, f"User '{username}' already exists", None
            else:
                error_msg = response.text
                try:
                    error_json = response.json()
                    error_msg = error_json.get('message', error_msg)
                except:
                    pass
                return False, f"Failed to create user: {error_msg}", None
                
        except Exception as e:
            return False, f"Exception: {str(e)}", None


def load_grafana_config():
    """Load Grafana API configuration from config.ini"""
    config = configparser.ConfigParser()
    
    try:
        config.read(CONFIG_PATH)
        if 'grafana' in config:
            url = config.get('grafana', 'url', fallback=None)
            public_url = config.get('grafana', 'public_url', fallback=url)  # Fallback to url if public_url not set
            username = config.get('grafana', 'username', fallback=None)
            password = config.get('grafana', 'password', fallback=None)
            verify_ssl = config.getboolean('grafana', 'verify_ssl', fallback=False)
            
            if url and username and password:
                return {
                    'url': url,
                    'public_url': public_url,
                    'username': username,
                    'password': password,
                    'verify_ssl': verify_ssl
                }
            else:
                logging.warning("Incomplete Grafana credentials in config.ini")
                return None
    except Exception as e:
        logging.error(f"Could not read Grafana config: {e}")
        return None
    
    return None


def load_keycloak_config():
    """Load Keycloak API configuration from config.ini"""
    config = configparser.ConfigParser()
    
    try:
        config.read(CONFIG_PATH)
        if 'keycloak' in config:
            url = config.get('keycloak', 'url', fallback=None)
            realm = config.get('keycloak', 'realm', fallback='default')
            admin_user = config.get('keycloak', 'admin_user', fallback=None)
            admin_password = config.get('keycloak', 'admin_password', fallback=None)
            client_id = config.get('keycloak', 'client_id', fallback='grafana-oauth')
            verify_ssl = config.getboolean('keycloak', 'verify_ssl', fallback=False)
            
            if url and admin_user and admin_password:
                return {
                    'url': url,
                    'realm': realm,
                    'admin_user': admin_user,
                    'admin_password': admin_password,
                    'client_id': client_id,
                    'verify_ssl': verify_ssl
                }
            else:
                logging.warning("Incomplete Keycloak credentials in config.ini")
                return None
    except Exception as e:
        logging.error(f"Could not read Keycloak config: {e}")
        return None
    
    return None


def create_keycloak_role_for_dashboard(keycloak_api, client_uuid, dashboard_name, campus, building, device=None):
    """
    Create a Keycloak client role for a dashboard
    
    Args:
        keycloak_api: KeycloakAPI instance
        client_uuid: Grafana OAuth client UUID
        dashboard_name: Human-readable dashboard name
        campus: Campus name
        building: Building name
        device: Device name (None for site dashboard)
    
    Returns:
        tuple: (success, role_name, message)
    """
    try:
        # Generate role name based on dashboard type
        if device:
            # Unit dashboard: grafana-view-unit-{CAMPUS}_{BUILDING}_{DEVICE}
            role_name = f"grafana-view-unit-{campus}_{building}_{device}"
            description = f"View access to {campus} {building} {device} dashboard"
        else:
            # Site dashboard: grafana-view-site-{CAMPUS}_{BUILDING}
            role_name = f"grafana-view-site-{campus}_{building}"
            description = f"View access to {campus} {building} site overview dashboard"
        
        # Create the role
        success, message = keycloak_api.create_client_role(client_uuid, role_name, description)
        
        if success:
            if "already exists" in message:
                logging.info(f"Keycloak role '{role_name}' already exists")
            else:
                logging.info(f"Created Keycloak role: {role_name}")
        else:
            logging.warning(f"Failed to create Keycloak role '{role_name}': {message}")
        
        return success, role_name, message
        
    except Exception as e:
        error_msg = f"Exception creating role: {str(e)}"
        logging.error(error_msg)
        return False, None, error_msg


def main():
    """Main execution function"""
    print("=" * 60)
    print("Grafana Dashboard Generator")
    print("=" * 60)
    
    # Load configuration
    print("\n[1/6] Loading configuration from config.ini...")
    config = load_config(CONFIG_PATH)
    print(f"  Campus: {config['campus']}")
    print(f"  Building: {config['building']}")
    print(f"  Output Directory: {OUTPUT_DIR}")
    
    # Grafana API configuration
    print("\n[2/6] Loading Grafana configuration...")
    grafana_config = load_grafana_config()
    grafana_api = None
    datasource_uid = None
    folder_id = 0
    
    if grafana_config:
        logging.info(f"URL: {grafana_config['url']}")
        logging.info(f"Username: {grafana_config['username']}")
        logging.info(f"SSL Verification: {grafana_config['verify_ssl']}")
        
        print("\n[3/6] Testing Grafana API connection...")
        grafana_api = GrafanaAPI(
            url=grafana_config['url'],
            username=grafana_config['username'],
            password=grafana_config['password'],
            verify_ssl=grafana_config['verify_ssl']
        )
        
        if grafana_api.test_connection():
            logging.info("Connected to Grafana")
            
            # List available datasources and auto-select PostgreSQL
            datasources = grafana_api.get_datasources()
            postgres_ds = None
            
            if datasources:
                postgres_ds_list = [ds for ds in datasources if ds.get('type') == 'postgres']
                if postgres_ds_list:
                    postgres_ds = postgres_ds_list[0]
            
            # If no PostgreSQL datasource found, create one
            if not postgres_ds:
                logging.info("No PostgreSQL datasource found, creating one...")
                
                # Check if PostgreSQL DB config exists
                if 'PostgreSQL-DB' not in config:
                    logging.error("No PostgreSQL-DB configuration found in config.ini")
                    print("\nERROR: Missing PostgreSQL database configuration")
                    print("Please add [PostgreSQL-DB] section to config.ini with:")
                    print("  dbname = your_database_name")
                    print("  user = your_database_user")
                    print("  password = your_database_password")
                    return
                
                db_config = config['PostgreSQL-DB']
                
                # Get database connection details
                db_host = db_config.get('host', 'localhost')
                db_port = db_config.get('port', '5432')
                db_name = db_config.get('dbname', 'grafana')
                db_user = db_config.get('user', 'grafana')
                db_password = db_config.get('password', '')
                
                # Create PostgreSQL datasource configuration
                datasource_config = {
                    "name": "PostgreSQL",
                    "type": "postgres",
                    "access": "proxy",
                    "url": f"{db_host}:{db_port}",
                    "database": db_name,
                    "user": db_user,
                    "secureJsonData": {
                        "password": db_password
                    },
                    "jsonData": {
                        "sslmode": "disable",
                        "postgresVersion": 1300,
                        "timescaledb": False
                    },
                    "isDefault": True
                }
                
                success, message, data = grafana_api.create_datasource(datasource_config)
                
                if success:
                    datasource_uid = data.get('datasource', {}).get('uid')
                    logging.info(f"PostgreSQL datasource created successfully")
                    logging.info(f"Name: {datasource_config['name']}")
                    logging.info(f"UID: {datasource_uid}")
                else:
                    logging.error(f"Failed to create datasource: {message}")
                    print(f"\nERROR: Could not create PostgreSQL datasource: {message}")
                    return
            else:
                # Auto-select existing PostgreSQL datasource
                datasource_uid = postgres_ds.get('uid')
                logging.info(f"Auto-selected PostgreSQL datasource: {postgres_ds.get('name')}")
                logging.info(f"UID: {datasource_uid}")
            
            # Auto-select General folder (ID: 0)
            folders = grafana_api.get_folders()
            logging.info("Using folder: General (ID: 0)")
            
            # Enable anonymous access for public viewing
            logging.info("Configuring anonymous access...")
            anon_success, anon_message = grafana_api.enable_anonymous_access()
            if anon_success:
                logging.info("Anonymous Access Enabled")
                logging.info(anon_message)
                logging.info("Dashboards are now publicly viewable without login")
            else:
                logging.warning(f"Could not enable anonymous access: {anon_message}")
                logging.warning("Anonymous access setup incomplete")
                logging.warning(anon_message)
            
            # Create viewer user if configured
            if 'viewer-user' in config:
                viewer_config = config['viewer-user']
                viewer_username = viewer_config.get('username', 'dashboard_viewer')
                viewer_email = viewer_config.get('email', 'viewer@aems.local')
                viewer_password = viewer_config.get('password', 'ViewerPass123!')
                viewer_role = viewer_config.get('role', 'Viewer')
                
                logging.info(f"Creating viewer user: {viewer_username}")
                success, message, user_data = grafana_api.create_user(
                    username=viewer_username,
                    email=viewer_email,
                    password=viewer_password,
                    role=viewer_role
                )
                
                if success:
                    logging.info(message)
                    logging.info(f"Viewer user created: {viewer_username}")
                    logging.info(f"  Username: {viewer_username}")
                    logging.info(f"  Password: {viewer_password}")
                    logging.info(f"  Role: {viewer_role}")
                    logging.info(f"  Email: {viewer_email}")
                else:
                    if "already exists" in message:
                        logging.info(f"Viewer user '{viewer_username}' already exists")
                    else:
                        logging.warning(f"Failed to create viewer user: {message}")
        else:
            logging.error("Failed to connect to Grafana API")
            logging.error("Please check your Grafana URL and credentials in config.ini")
            print("\nERROR: Cannot connect to Grafana")
            print("Please verify:")
            print("  1. Grafana URL is correct")
            print("  2. Username and password are valid")
            print("  3. Grafana server is running and accessible")
            return
    else:
        logging.error("No Grafana configuration found in config.ini")
        logging.error("Please add [grafana] section with url, username, and password")
        print("\nERROR: Missing Grafana configuration")
        print("Please add [grafana] section to config.ini with:")
        print("  url = your_grafana_url")
        print("  username = your_username")
        print("  password = your_password")
        return
    
    # Ensure datasource UID was obtained from API
    if not datasource_uid:
        logging.error("Failed to obtain datasource UID from Grafana API")
        print("\nERROR: Could not determine PostgreSQL datasource")
        return
    
    # Load templates
    step_num = 4 if grafana_api else 3
    print(f"\n[{step_num}/6] Loading dashboard templates...")
    try:
        rtu_template = load_template(os.path.join(SCRIPT_DIR, 'rtu_overview.json'))
        logging.info("Loaded rtu_overview.json")
    except FileNotFoundError:
        logging.error("rtu_overview.json not found")
        return
    
    try:
        site_template = load_template(os.path.join(SCRIPT_DIR, 'site_overview.json'))
        logging.info("Loaded site_overview.json")
    except FileNotFoundError:
        logging.error("site_overview.json not found")
        return
    
    # Generate dashboards
    step_num += 1
    print(f"\n[{step_num}/6] Generating dashboards...")
    campus = config['campus']
    building = config['building']
    
    # Generate RTU Overview dashboards (one per device if multiple devices found)
    rtu_dashboards, devices = generate_rtu_overview(rtu_template, config, datasource_uid, grafana_api=grafana_api)
    
    # Save each RTU dashboard
    rtu_filepaths = []
    for dash_info in rtu_dashboards:
        dashboard = dash_info['dashboard']
        filename = dash_info['filename']
        device = dash_info['device']
        
        filepath = save_dashboard(dashboard, filename, OUTPUT_DIR)
        rtu_filepaths.append({'filepath': filepath, 'dashboard': dashboard, 'device': device, 'filename': filename})
        
        if device:
            logging.info(f"Generated RTU Overview for {device}: {filepath}")
        else:
            logging.info(f"Generated RTU Overview: {filepath}")
    
    # Generate Site Overview (pass devices for dynamic state-timeline panels)
    site_dashboard = generate_site_overview(site_template, config, datasource_uid, grafana_api, devices)
    site_filename = f"{campus}_{building}_Site_Overview.json"
    site_filepath = save_dashboard(site_dashboard, site_filename, OUTPUT_DIR)
    logging.info(f"Generated Site Overview: {site_filepath}")
    
    # Keycloak API configuration (for role creation)
    keycloak_config = load_keycloak_config()
    keycloak_api = None
    keycloak_client_uuid = None
    
    if keycloak_config:
        logging.info("Loading Keycloak configuration...")
        logging.info(f"URL: {keycloak_config['url']}")
        logging.info(f"Realm: {keycloak_config['realm']}")
        logging.info(f"Client ID: {keycloak_config['client_id']}")
        
        keycloak_api = KeycloakAPI(
            url=keycloak_config['url'],
            realm=keycloak_config['realm'],
            admin_user=keycloak_config['admin_user'],
            admin_password=keycloak_config['admin_password'],
            verify_ssl=keycloak_config['verify_ssl']
        )
        
        # Wait for Keycloak to be ready with retry logic
        if keycloak_api.wait_for_keycloak(max_retries=10, initial_delay=2, max_delay=60):
            logging.info("Keycloak is ready")
            
            # Get client UUID
            keycloak_client_uuid = keycloak_api.get_client_by_clientid(keycloak_config['client_id'])
            if keycloak_client_uuid:
                logging.info(f"Found Keycloak client '{keycloak_config['client_id']}' with UUID: {keycloak_client_uuid}")
            else:
                logging.warning(f"Could not find Keycloak client '{keycloak_config['client_id']}'")
                keycloak_api = None
        else:
            logging.warning("Keycloak not ready after retries - skipping role creation")
            keycloak_api = None
    else:
        logging.info("No Keycloak configuration found - skipping role creation")
    
    # Upload to Grafana via API
    dashboard_urls = {}  # Collect URLs for output file (dict with dashboard name as key)
    if grafana_api:
        step_num += 1
        print(f"\n[{step_num}/6] Uploading dashboards to Grafana...")
        
        # Upload each RTU Overview dashboard
        for rtu_info in rtu_filepaths:
            dashboard = rtu_info['dashboard']
            device = rtu_info['device']
            
            success, message, data = grafana_api.create_dashboard(dashboard, folder_id)
            
            dashboard_name = f"RTU Overview - {device}" if device else "RTU Overview"
            
            if success:
                # Get dashboard UID for setting permissions
                dashboard_uid = data.get('uid')
                
                # Set dashboard to read-only for non-admins
                if dashboard_uid:
                    perm_success, perm_message = grafana_api.set_dashboard_permissions(dashboard_uid)
                    if perm_success:
                        logging.info(f"{dashboard_name} set to read-only")
                    else:
                        logging.warning(f"Failed to set read-only for {dashboard_name}: {perm_message}")
                
                # Grafana API returns full path including subpath (e.g., /grafana/d/...)
                # Extract just the path portion and combine with public URL
                api_path = data.get('url', '')
                
                # Use public_url for user-facing dashboard links
                # Extract base domain from public URL (e.g., https://aems1.pnl.gov from https://aems1.pnl.gov/grafana)
                public_url = grafana_config.get('public_url', grafana_config['url'])
                parsed = urlparse(public_url)
                base_url = f"{parsed.scheme}://{parsed.netloc}"
                
                dashboard_url = f"{base_url}{api_path}?orgId=1"
                
                # Create Keycloak role for this dashboard
                role_created = False
                role_name = None
                if keycloak_api and keycloak_client_uuid:
                    role_success, role_name, role_message = create_keycloak_role_for_dashboard(
                        keycloak_api, keycloak_client_uuid, dashboard_name, campus, building, device
                    )
                    role_created = role_success
                
                # Add to URLs collection with role information
                dashboard_urls[dashboard_name] = {
                    'url': dashboard_url,
                    'keycloak_role': role_name,
                    'role_created': role_created
                }
                
                logging.info(f"{dashboard_name} uploaded")
                logging.info(f"URL: {dashboard_url}")
            else:
                logging.error(f"{dashboard_name} failed: {message}")
        
        # Upload Site Overview
        success, message, data = grafana_api.create_dashboard(site_dashboard, folder_id)
        
        if success:
            # Get dashboard UID for setting permissions
            dashboard_uid = data.get('uid')
            
            # Set dashboard to read-only for non-admins
            if dashboard_uid:
                perm_success, perm_message = grafana_api.set_dashboard_permissions(dashboard_uid)
                if perm_success:
                    logging.info(f"Site Overview set to read-only")
                else:
                    logging.warning(f"Failed to set read-only for Site Overview: {perm_message}")
            
            # Grafana API returns full path including subpath (e.g., /grafana/d/...)
            # Extract just the path portion and combine with public URL
            api_path = data.get('url', '')
            
            # Use public_url for user-facing dashboard links
            # Extract base domain from public URL (e.g., https://aems1.pnl.gov from https://aems1.pnl.gov/grafana)
            public_url = grafana_config.get('public_url', grafana_config['url'])
            parsed = urlparse(public_url)
            base_url = f"{parsed.scheme}://{parsed.netloc}"
            
            dashboard_url = f"{base_url}{api_path}?orgId=1"
            
            # Create Keycloak role for site dashboard
            role_created = False
            role_name = None
            if keycloak_api and keycloak_client_uuid:
                role_success, role_name, role_message = create_keycloak_role_for_dashboard(
                    keycloak_api, keycloak_client_uuid, 'Site Overview', campus, building, None
                )
                role_created = role_success
            
            # Add to URLs collection with role information
            dashboard_urls['Site Overview'] = {
                'url': dashboard_url,
                'keycloak_role': role_name,
                'role_created': role_created
            }
            
            logging.info(f"Site Overview uploaded")
            logging.info(f"URL: {dashboard_url}")
        else:
            logging.error(f"Site Overview failed: {message}")
        
        # Save dashboard URLs to separate file for easy access
        if dashboard_urls:
            urls_filename = f"{campus}_{building}_dashboard_urls.json"
            urls_filepath = os.path.join(OUTPUT_DIR, urls_filename)
            with open(urls_filepath, 'w', encoding='utf-8') as f:
                json.dump(dashboard_urls, f, indent=2, ensure_ascii=False)
            logging.info(f"Dashboard URLs saved to: {urls_filepath}")
    
    # Summary
    step_num += 1
    print(f"\n[{step_num}/6] Summary")
    print("  " + "=" * 56)
    print(f"  Campus/Building: {campus}/{building}")
    print(f"  Topic Prefix: {campus}/{building}")
    print(f"  Datasource UID: {datasource_uid}")
    print(f"  RTU Dashboards: {len(rtu_filepaths)}")
    if grafana_api:
        print(f"  Grafana URL: {grafana_config['url']}")
        print(f"  Target Folder ID: {folder_id if 'folder_id' in locals() else 0}")
    print("  " + "=" * 56)
    print("  Generated Files:")
    for rtu_info in rtu_filepaths:
        device = rtu_info['device']
        filename = rtu_info['filename']
        if device:
            print(f"    - {filename} ({device})")
        else:
            print(f"    - {filename}")
    print(f"    - {site_filename} (Site Overview)")
    print("  " + "=" * 56)
    print("\nDashboard generation complete!")
    
    if grafana_api:
        print("\nDashboards uploaded to Grafana!")
        print(f"View them at: {grafana_config['url']}/dashboards")
    else:
        print("\nUsage:")
        print("  - For Grafana UI: Upload the .json files")
        print("  - For Grafana API: Use the _import.json files")


if __name__ == "__main__":
    main()
