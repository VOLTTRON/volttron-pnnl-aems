from dataclasses import dataclass, field
import json
import logging
import sys
from .utils import csv_to_dict_list, split_list, load_config_file
from .helpers import NfClient, get_response

try:
    from aems.client.agent import Agent, RPC, Scheduler, run_agent
    cron = Scheduler.cron

    from volttron.utils.jsonrpc import RemoteError
    from volttron.client.messaging import headers as headers_mod
    from volttron.utils import format_timestamp, get_aware_utc_now, setup_logging
except ImportError:
    run_agent = None
    from volttron.platform.agent import utils
    from volttron.platform.agent.utils import (format_timestamp, get_aware_utc_now,
                                               setup_logging)
    from volttron.platform.jsonrpc import RemoteError
    from volttron.platform.messaging import headers as headers_mod
    from volttron.platform.scheduling import cron
    from volttron.platform.vip.agent import RPC, Agent, Core

__version__ = "0.1"
setup_logging()
_log = logging.getLogger(__name__)

POINTS_PER_REQUEST = 25
DATA_PREFIX = "devices"
WRITE_TYPE_MAP = {
    ('OBJECT_TYPE_ANALOG_VALUE', 'OBJECT_TYPE_ANALOG_INPUT', 'OBJECT_TYPE_ANALOG_OUTPUT'): "real",
    ('OBJECT_TYPE_BINARY_VALUE', 'OBJECT_TYPE_BINARY_INPUT', 'OBJECT_TYPE_BINARY_OUTPUT'): "enumerated",
    ('OBJECT_TYPE_MULTI_STATE_VALUE', 'OBJECT_TYPE_MULTI_STATE_INPUT', 'OBJECT_TYPE_MULTI_STATE_OUTPUT'): "unsigned"
                  }
DATA_TYPE_MAP = {
    'analogValue': 'OBJECT_TYPE_ANALOG_VALUE',
    'analogInput': 'OBJECT_TYPE_ANALOG_INPUT',
    'analogOutput': 'OBJECT_TYPE_ANALOG_OUTPUT',
    'binaryValue': 'OBJECT_TYPE_BINARY_VALUE',
    'binaryOutput': 'OBJECT_TYPE_BINARY_OUTPUT',
    'binaryInput': 'OBJECT_TYPE_BINARY_INPUT',
    'multiStateValue': 'OBJECT_TYPE_MULTI_STATE_VALUE',
    'multiStateInput': 'OBJECT_TYPE_MULTI_STATE_INPUT',
    'multiStateOutput': 'OBJECT_TYPE_MULTI_STATE_OUTPUT'
}
point_request_template =  """
{{
  "object_identifier": {{
    "object_type": "{data_type_value}",
    "instance": {index_value}
  }},
  "list_of_property_references": [
    {{
      "property_identifier": "PROPERTY_IDENTIFIER_PRESENT_VALUE",
      "property_array_index": 4294967295
    }}
  ]
}}
"""
read_property_multiple_template = """
{{
  "device_address": {{
    "deviceId": {device_id}
  }},
  "request": {{
    "read_property_multiple": {{
      "list_of_read_access_specifications": {read_list}
    }}
  }}
}}"""
write_property_template = """
{{
    "device_address": {{
        "deviceId": {device_id}
    }},
    "request": {{
        "write_property": {{
            "object_identifier": {{
                "object_type": "{data_type_value}",
                "instance": {index_value}
            }},
            "property_identifier": "PROPERTY_IDENTIFIER_PRESENT_VALUE",
            "property_array_index": 4294967295,
            "property_value": {{
                "@type": "type.googleapis.com/normalgw.bacnet.v2.ApplicationDataValue",
                "{bacnet_data_type}": {value}
            }},
            "priority": {write_priority}
        }}
    }}
}}"""


@dataclass
class Point:
    """
    Represents a point in a Bacnet system with associated attributes and settings.

    This dataclass is designed to encapsulate all necessary metadata and properties
    of a Bacnet point, including configuration details such as object type, unit,
    device ID, and whether it's writeable. It also supports functionality for
    updating read request strings and additional initialization logic to set write
    type based on mapping.

    :ivar name: The name of the point.
    :type name: str
    :ivar index: The index value associated with the point.
    :type index: int
    :ivar bacnet_object_type: The Bacnet object type of the point.
    :type bacnet_object_type: str
    :ivar unit: The unit of measurement for the point's value.
    :type unit: str
    :ivar device_id: The unique device ID related to the point.
    :type device_id: int
    :ivar writeable: Flag indicating whether the point is writeable or not.
    :type writeable: bool
    :ivar write_priority: The priority level for writing to the point.
    :type write_priority: int
    :ivar read_request_str: JSON string used to form a read request for the point.
    :type read_request_str: str
    :ivar write_type: The write data type configured for the point.
    :type write_type: str
    :ivar null_type: Null type configuration for the point.
    :type null_type: str
    :ivar null_value: Null value representation as a string for the point.
    :type null_value: str
    """
    name: str
    index: int
    bacnet_object_type: str
    unit: str
    device_id: int
    writeable: bool = False
    write_priority: int = 16
    read_request_str: str = ""
    write_type: str = "real"
    null_type: str = "null"
    null_value: str = "true"

    def update_read_request(self, request: str):
        """
        Updates the 'read_request_str' attribute by parsing the provided JSON string.

        This method takes a JSON string as input, parses it into a dictionary, and assigns
        it to the 'read_request_str' attribute. It assumes the input string is in a valid
        JSON format. No additional validation or processing is performed beyond JSON parsing.

        :param request: The JSON string to be parsed and assigned. The string must
            be valid JSON format.
        :type request: str
        :return: None
        """
        self.read_request_str = json.loads(request)

    def __post_init__(self):
        for bacnet_type_list in WRITE_TYPE_MAP:
            if self.bacnet_object_type in bacnet_type_list:
                self.write_type = WRITE_TYPE_MAP[bacnet_type_list]
        self.write_request_dict = {"index_value": self.index, "data_type_value": self.bacnet_object_type, "write_priority": self.write_priority, 'device_id': self.device_id}


@dataclass
class Device:
    device_id: int
    registry_file: str
    point_dict: dict = field(default_factory=dict)
    point_request_list: list = field(default_factory=list)
    request_list: list = field(default_factory=list)
    points_per_request: int = POINTS_PER_REQUEST
    point_map: dict = field(default_factory=dict)
    client: NfClient = None

    def __post_init__(self):
        """
        Handles post-initialization processing for the Device instance
        for data retrieval and processing.

        :return: None
        """
        self._initialize_point_dict()
        self.generate_request_list(device_id=self.device_id)

    def _initialize_point_dict(self):
        """
        Initializes the point dictionary and point map for a BACnet device.

        This method processes data from a registry CSV file to populate the point
        dictionary and point mapping attributes. It converts CSV rows into instances
        of the `Point` class, maps BACnet object types, and adjusts internal point
        structures according to the data provided in the registry file. If any
        invalid BACnet object types are encountered, they are logged and skipped.

        :param self: Instance of the enclosing class.
        """
        registry_data = csv_to_dict_list(self.registry_file)
        self._adjust_points_per_request(len(registry_data))
        for row in registry_data:
            try:
                point = Point(
                    name=row['Volttron Point Name'],
                    index=int(row['Index']),
                    bacnet_object_type=DATA_TYPE_MAP[row['BACnet Object Type']],
                    unit=row['Units'],
                    write_priority=int(row['Write Priority']),
                    writeable=True if row.get('Writable', 'true').lower() == 'true' else False,
                    device_id=self.device_id
                )
                self.point_dict[(point.index, point.bacnet_object_type)] = point
                self.point_map[point.name] = (point.index, point.bacnet_object_type)
            except KeyError:
                _log.debug(f"Invalid BACnet object type: {row['Volttron Point Name']} -- {row['BACnet Object Type']}")
                continue

    def _adjust_points_per_request(self, data_length: int):
        """
        Adjusts the value of `points_per_request` by decrementing it if
        the remainder of `data_length` divided by `points_per_request` equals 5.

        :param data_length: The length of the data that requires adjustment.
        :type data_length: int
        :return: None
        """
        while data_length % self.points_per_request == 5:
            self.points_per_request -= 1

    def generate_request_list(self, device_id: int):
        """
        Generates a list of requests to read points from a BACnet device. This method iterates over
        the point dictionary, formats multiple requests for each point, and then batches them as
        per the maximum points allowed per request. These batched requests are then added to the
        class's request list for processing.

        :param device_id: The identifier of the target BACnet device.
        :type device_id: int
        :return: None. The requests are populated within the instance's `request_list` attribute.
        """
        points = [
            point_request_template.format(
                data_type_value=point.bacnet_object_type,
                index_value=point.index
            )
            for point in self.point_dict.values()
        ]
        for point, request in zip(self.point_dict.values(), points):
            point.request = point.update_read_request(request)

        self._batch_requests(device_id, points)

    def _batch_requests(self, device_id: int, points: list):
        """
        Batch the requests for a given device by splitting the points into smaller
        chunks based on the `points_per_request` limit and formats them into the
        required structure for further processing.

        :param device_id: Identifier for the device for which the requests are being batched.
        :type device_id: int
        :param points: List of raw point requests in JSON string format that need to be batched.
        :type points: list
        :return: None
        """
        split_point_requests = split_list(
            [json.loads(request) for request in points], self.points_per_request
        )
        for batched_points in split_point_requests:
            current_points = json.dumps(batched_points)
            request_str = read_property_multiple_template.format(
                device_id=device_id,
                read_list=current_points
            )
            self.request_list.append(json.loads(request_str))

    def read_points(self):
        """
        Reads and processes a list of API requests, returning the aggregated
        values and metadata collected from the responses.

        The method iterates through the provided API request list, sending each
        request and processing the received response. It parses the response into
        values and metadata, aggregates them across all requests, and returns the
        result.

        :param self: Instance of the class.
        :return: A list containing two elements: the aggregated value dictionary
            and aggregated metadata dictionary.
        :rtype: list[dict, dict]
        """
        value_dict, metadata = {}, {}
        for request in self.request_list:
            response = self._post_request(request)
            parsed_values, parsed_metadata = self._process_response(response)
            value_dict.update(parsed_values)
            metadata.update(parsed_metadata)
        return [value_dict, metadata]

    def _process_response(self, response: dict):
        """
        Processes the response dictionary to extract relevant information. This method unpacks
        the provided response, handles potential missing keys, and consolidates data into
        value and metadata dictionaries.

        :param response: A dictionary containing the data response to be processed.
        :type response: dict
        :return: A tuple containing two dictionaries: the first dictionary stores the
                 extracted values, and the second stores associated metadata.
        :rtype: tuple[dict, dict]
        """
        value_dict, metadata = {}, {}
        for point_info in self.unpack_value_list(response):
            try:
                self._extract_point_info(point_info, value_dict, metadata)
            except KeyError as e:
                _log.debug(f"Failed to process response: Missing key {e}")
                continue
        return value_dict, metadata

    def _post_request(self, request: dict):
        """
        Sends a POST request to the REST API endpoint for BACnet confirmed services.

        This method constructs and sends a POST request to the specified API endpoint
        with the provided `request` payload. The operation is performed using the
        client instance available in the current context. The raw response obtained
        from the API is processed and transformed into the appropriate response
        format using the `get_response` method.

        :param request: The JSON payload provided to the POST request.
        :type request: dict
        :return: The response processed by the `get_response` method.
        :rtype: Any
        """
        raw_response = self.client.post("/api/v2/bacnet/confirmed-service", json=request)
        return get_response(raw_response)

    @staticmethod
    def _create_metadata_from_point(point: Point, metadata: dict):
        """
        Create a metadata dictionary from a given Point object and additional metadata.

        This method constructs a dictionary by extracting specific attributes from the
        provided Point object and combining them with additional metadata supplied
        as a dictionary. The resulting dictionary will represent the metadata for the
        point, including unit, BACnet-specific details, and other relevant information.

        :param point: The Point object containing details needed to generate the metadata.
        :type point: Point
        :param metadata: A dictionary containing additional metadata to be combined with
            the attributes extracted from the Point object.
        :type metadata: dict
        :return: A dictionary containing the compiled metadata, including unit, write type,
            BACnet instance, and BACnet object type.
        :rtype: dict
        """
        return {
            "unit": point.unit,
            "type": point.write_type,
            "bacnet_instance": point.index,
            "bacnet_type": point.bacnet_object_type
        }

    @staticmethod
    def parse_point_data(point_info: dict):
        """
        Parses point data from a dictionary and extracts specific details, including the
        object identifier's instance index, the object type, and a property value.

        :param point_info: A dictionary containing information about the point data,
            including the object identifier, instance index, object type, and a list of
            property values.
        :type point_info: dict
        :return: A tuple containing the object's instance index (int), object type
            (str), and a dictionary of property values (dict).
        :rtype: tuple
        """
        object_info = point_info['objectIdentifier']
        index = object_info['instance']
        object_type = object_info['objectType']
        value_dict = point_info['listOfResults'][0]['propertyValue']
        return index, object_type, value_dict

    @staticmethod
    def _build_read_request_string(device_id: int, read_list: list[str]) -> str:
        """
        Builds a Read Request string for a BACnet ReadPropertyMultiple request.

        :param device_id: Identifier of the target BACnet device.
        :type device_id: int
        :param read_list: A list of property names to be read from the target device.
        :type read_list: list[str]
        :return: A formatted request string containing the device ID and encoded
        :rtype: str
        """
        return read_property_multiple_template.format(
            device_id=device_id,
            read_list=json.dumps(read_list)
        )

    def _extract_point_info(self, point_info: dict, value_dict: dict, metadata: dict):
        """
        Extracts point information, updates the value dictionary with the point's value, and
        generates associated metadata.

        This method processes point data by parsing it to retrieve the index, object type,
        and values. It then retrieves the corresponding point object and determines the
        value for that specific BACnet object type. The point's value is added to the
        provided value dictionary, and metadata is created and stored in the metadata
        dictionary.

        :param point_info: A dictionary containing the data specific to the point being
            processed.
        :param value_dict: A dictionary that will be updated with the point's name as the
            key and its corresponding value as the value.
        :param metadata: A dictionary that will be updated with the point's name as the
            key and metadata generated for the point as the value.
        :return: None
        """
        index, object_type, values = self.parse_point_data(point_info)
        point = self.get_point_obj((index, object_type))
        value_dict[point.name] = self.get_value_for_type(values, point.bacnet_object_type)
        metadata[point.name] = self._create_metadata_from_point(point, metadata)

    def unpack_value_list(self, response):
        """
        Extracts a specific nested value from the provided response dictionary.

        This method navigates through the nested structure of the `response` dictionary
        and retrieves the `listOfReadAccessResults`. It handles cases where the
        expected keys might be missing by using the `get` method at each level.

        :param response: The response dictionary from which the value will be extracted.
        :type response: dict
        :return: The extracted `listOfReadAccessResults` or None if any key in the path
            is missing.
        :rtype: Any
        """
        return response.get('ack', {}).get('readPropertyMultiple', {}).get('listOfReadAccessResults', {})

    def get_point_obj(self, point_identifier: tuple):
        """
        Retrieves a point object based on its unique identifier.

        The method takes a tuple as the unique identifier for
        a point and returns the corresponding point object
        from the internal dictionary of points. It is assumed
        that the provided identifier exists in the dictionary.
        The method simplifies access to specific points in
        a structured manner.

        :param point_identifier: A tuple representing the unique identifier for
            the desired point object.
        :return: The point object associated with the given identifier.
        """
        return self.point_dict[point_identifier]

    def get_value_for_type(self, value_dict: dict, bacnet_type: str):
        """
        This method retrieves a specific value from a given dictionary based on the provided BACnet type
        or key present in the dictionary. It determines and returns the appropriate value according to
        specific matching conditions for the key or BACnet type. If no valid match is found, it raises
        a KeyError exception.

        :param value_dict: A dictionary containing various potential keys such as 'real', 'unsigned', or
                           'binarypv' whose values are used based on the supplied BACnet type.
        :type value_dict: dict
        :param bacnet_type: A string indicating the BACnet type against which specific key-value pairs
                            in the dictionary are evaluated.
        :type bacnet_type: str
        :return: This method returns the value corresponding to the matched key ('real' or 'unsigned'),
                 or a binary indication (1 or 0) derived from the 'binarypv' key if the BACnet type
                 contains 'BINARY'.
        :rtype: int or float
        :raises KeyError: If no valid key or BACnet type match is found in the provided dictionary.
        """
        if 'real' in value_dict:
            return value_dict['real']
        elif 'unsigned' in value_dict:
            return value_dict['unsigned']
        elif 'BINARY' in bacnet_type:
            return 1 if value_dict.get('binarypv') == 'BINARYPV_ACTIVE' else 0
        else:
            raise KeyError

    def get_point_value(self, point_name: str):
        """
        Fetches the value of a specified point by its name. This method retrieves the point ID
        from an internal mapping, constructs a read request string using the point's associated
        parameters, fetches the response from a device, and parses the result to extract the
        requested point's value.

        :param point_name: The name of the point whose value is to be fetched.
        :type point_name: str
        :return: Parsed value(s) of the requested point.
        :rtype: Any
        """
        point_id = self.point_map[point_name]
        point = self.get_point_obj(point_id)
        read_request = self._build_read_request_string(
            device_id=point.device_id,
            read_list=[point.read_request_str]
        )
        parsed_values = self._fetch_and_parse_response(read_request)

        return parsed_values

    def _fetch_and_parse_response(self, request_string: str):
        """
        Fetches and processes a response based on the input request string.

        This method performs the following operations:
        1. Converts the input request string from JSON format to a Python object.
        2. Sends the converted object as a request to a predefined endpoint and retrieves
           the raw response.
        3. Processes the raw response to extract parsed data.
        4. Returns the parsed data as the output.

        :param request_string: The JSON-formatted string containing information to be
            sent as part of the request.
        :type request_string: str
        :return: A collection of parsed values extracted from the processed response.
        :rtype: Any
        """
        raw_response = self._post_request(json.loads(request_string))
        parsed_values, _ = self._process_response(raw_response)
        return parsed_values

    @staticmethod
    def _build_request_str(bacnet_data_type: str, value: str, request_data: dict) -> str:
        """
        Build the BACnet write property request string.

        :param bacnet_data_type: The BACnet data type of the point.
        :param value: The value to write to the BACnet point.
        :param request_data: Additional request parameters specific to the point.
        :return: A formatted BACnet request string.
        """
        return write_property_template.format(
            bacnet_data_type=bacnet_data_type,
            value=value,
            **request_data
        )

    def set_point_value(self, point_name: str, value: float) -> None:
        """
        Sets the value of a specific point in the system. The point is identified by
        its name, and the function determines its properties, builds the appropriate
        request to interact with the system, and handles the communication with the
        target.

        The function handles nullable values, identifies the type and structure
        required for the request, and logs both the request and the response for
        debugging purposes.

        :param point_name: The name of the point to be updated.
        :type point_name: str
        :param value: The value to set for the identified point. If None, the
            point's null value is used.
        :type value: float
        :return: None
        :rtype: None
        """

        # Map point name to identifier and retrieve the point
        point_identifier = self.point_map[point_name]
        point = self.get_point_obj(point_identifier)

        # Determine the BACnet data type and final value
        bacnet_data_type = point.write_type if value is not None else point.null_type
        final_value = value if value is not None else point.null_value

        # Build the request string
        request_str = self._build_request_str(
            bacnet_data_type=bacnet_data_type,
            value=final_value,
            request_data=point.write_request_dict
        )
        _log.debug(f"Request: {request_str}")
        # Send request and log the response
        response = self._post_request(json.loads(request_str))
        _log.debug(f"Response: {response}")

    def set_point(self, point_name: str, value: float|int|bool, **kwargs):
        """
        Sets a control point to a specified value using the given parameters.

        This method allows setting a control point specified by the parameter
        `point_name` to a value of type float, int, or bool. Additional keyword
        arguments can be passed for further fine-tuned control or related operations.
        The functionality is implemented using the `set_point_value` method.

        :param point_name: The name of the control point to set.
        :type point_name: str
        :param value: The value to assign to the control point. It can be of type
            float, int, or bool.
        :param kwargs: Additional keyword arguments for optional configurations.
        :return: None
        :rtype: None
        """
        self.set_point_value(point_name, value)

    def get_point(self, point_name: str, **kwargs):
        """
        Retrieve the value of a specific point by name.

        This method fetches the value corresponding to the provided `point_name`
        and optionally allows additional parameters through `**kwargs`. It uses
        `get_point_value()` to retrieve the value and then extracts the specific
        value for the `point_name` key.

        :param point_name: The name of the point whose value is to be retrieved.
        :type point_name: str
        :param kwargs: Additional keyword arguments that might be required by
            internal logic (if any).
        :return: The value corresponding to the provided point name.
        """
        return self.get_point_value(point_name).get(point_name)


class NormalFrameworkConnector(Agent):
    def __init__(self, config_path, **kwargs):
        super().__init__(**kwargs)
        # Load and validate configuration
        config_data = load_config_file(config_path)
        self.polling_interval = 60
        self.device_dict = {}
        self.nf_client = None
        if config_data is None:
            raise ValueError("Invalid config file")
        self.validate_and_configure(config_data)

    def validate_and_configure(self, config_data: dict):
        """
        Validates the provided configuration data and configures the system based
        on the validated data.

        This method extracts and validates the essential configuration parameters
        from the given dictionary. Ensures the presence of necessary configuration
        elements such as driver configuration and device list. Configures polling
        interval and initializes devices based on the input configuration.

        :param config_data: A dictionary containing configuration data. Must
            include 'driver_config' and 'device_list' keys.
        :type config_data: dict
        :return: None
        :raises ValueError: If required configuration keys are missing, such as
            'driver_config' or 'device_list'.
        """
        self.polling_interval = config_data.get("polling_interval", 60)
        nf_config = config_data.get("driver_config")
        if not nf_config:
            raise ValueError("No driver_config found in config")
        self.nf_client = NfClient(nf_config)

        device_list = config_data.get("device_list", [])
        if not device_list:
            raise ValueError("No devices found in config")
        self.initialize_devices(device_list)

    @Core.receiver('onstart')
    def _onstart(self, sender=None, **kwargs):
        """
        Handles the start event and initializes periodic polling for the scraping service.

        This method is triggered by the framework when the component receives the
        'onstart' signal. It schedules a periodic task to execute the `scrape_all`
        method at intervals specified by `self.polling_interval`.

        :param sender: The sender object that triggered the 'onstart' event.
        :type sender: Any
        :param kwargs: Additional keyword arguments provided during the event.
        :type kwargs: dict
        :return: None
        """
        self.polling_service = self.core.periodic(self.polling_interval, self.scrape_all, wait=self.polling_interval)

    def initialize_devices(self, device_list: list, **kwargs):
        """
        Initializes devices based on the provided configuration and stores them in a dictionary
        using their respective topics as keys. Each device is instantiated with its configuration
        and the network client provided to the class. If a device's configuration lacks a 'topic',
        it is skipped, and a debug log entry is made.

        :param device_list: A list of dictionaries, each representing the configuration for
            a device to be initialized. Each dictionary must include a 'topic' key and
            other parameters necessary for device initialization.
        :param kwargs: Additional keyword arguments that may be required for device
            initialization, though they are not explicitly used in this function.
        :return: None
        """
        for device_config in device_list:
            try:
                topic = device_config.pop('topic')
            except KeyError:
                _log.debug("No topic found in config")
                continue

            device = Device(**device_config, client=self.nf_client)
            self.device_dict[topic] = device

    def get_device_by_topic(self, topic: str) -> Device:
        """
        Retrieves a device associated with the specified topic.

        This method searches for a device linked to the provided topic
        and returns the corresponding device object. The topic is used
        as a unique identifier to locate and retrieve the associated
        device instance.

        :param topic: The unique topic string used to search for the
            associated device.
        :type topic: str

        :return: The device associated with the given topic.
        :rtype: Device
        """
        return self.device_dict[topic]

    @RPC.export
    def get_point(self, device_path: str, point_name: str, **kwargs):
        """
        Gets a value for a specific point on a device.
        :param device_path: The path to the device.
        :param point_name: The name of the point to modify.
        :param kwargs: Optional additional arguments.
        :return: Status of the operation (True for success).
        """
        device = self.get_device_by_topic(device_path)
        return device.get_point(point_name, **kwargs)

    @RPC.export
    def set_point(self, device_path: str, point_name: str, point_value: float|int|bool, **kwargs):
        """
        Sets a value for a specific point on a device.
        :param device_path: The path to the device.
        :param point_name: The name of the point to modify.
        :param point_value: The value to set for the point.
        :param kwargs: Optional additional arguments.
        :return: Status of the operation (True for success).
        """

        device = self.get_device_by_topic(device_path)
        return device.set_point(point_name, point_value, **kwargs)

    @staticmethod
    def construct_topic(topic: str) -> str:
        """
        Constructs and returns a topic string by combining a constant prefix, the given topic,
        and a suffix.

        This method generates a formatted topic string using predefined components.
        It is useful for creating standardized topics required in specific contexts.

        :param topic: The central part of the topic to incorporate.
        :type topic: str
        :return: The constructed topic string by combining the prefix, the input topic,
            and the suffix.
        :rtype: str
        """
        return "/".join([DATA_PREFIX, topic, "all"])

    def scrape_all(self):
        """
        Scrapes data points from all devices in the `device_dict`, publishes the data to a
        specified topic on the pubsub system, and appends a timestamp to the headers.

        This method iterates over all the devices in the `device_dict`, constructs the
        appropriate topic for each device, retrieves the data points using the
        `read_points` method of the device, and publishes the data to the pubsub topic
        with the specified headers.

        :param self:
            The instance of the class containing the `scrape_all` method.

        :raises TimeoutError:
            If publishing the message to the pubsub system exceeds the allowed timeout.

        :return:
            None
        """
        headers = {"Date": format_timestamp(get_aware_utc_now())}
        for device_topic, device_instance in self.device_dict.items():
            full_topic = self.construct_topic(device_topic)
            data = device_instance.read_points()
            self.vip.pubsub.publish(peer='pubsub',
                                    topic=full_topic,
                                    message=data,
                                    headers=headers).get(timeout=2)


def main(argv=sys.argv):
    """Main method called by the aip."""

    if run_agent:
        run_agent(NormalFrameworkConnector)
    else:
        try:
            utils.vip_main(NormalFrameworkConnector)
        except Exception as exception:
            _log.exception('unhandled exception')
            _log.error(repr(exception))


if __name__ == '__main__':
    # Entry point for script
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        pass
