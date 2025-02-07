# Volttron PNNL AEMS

This repository contains two projects: `aems-edge` and `aems-app`. The `aems-ui` project is deprecated and will be removed in the future.

## Autonomous Energy Management Software (AEMS)

The AEMS adds intelligent and flexible control for small- and medium-sized commercial buildings' HVAC systems. It leverages the VOLTTRON™ platform to deliver effective control and energy management solutions for rooftop units (RTUs) and heat pumps (HPs).

The AEMS contains a web-based user interface (`aems-app`) that allows building operators or occupants to easily enable energy efficiency and comfort for their building. The second component is `aems-edge`, which integrates with the VOLTTRON project and utilizes the BACnet driver for device integration, the VOLTTRON Historian for data storage, and the VOLTTRON integrated Weather.gov for forecast information.

## Overview

The AEMS system is designed to bring advanced energy efficiency and grid-responsive control to SMBs. It comprises two main components:

1. **Web-Based User Interface**: An intuitive interface that allows building managers to configure, monitor, and optimize energy usage. The web UI facilitates user interactions and data visualization for easy energy management.

2. **Edge Stack Integrated with VOLTTRON**: This component operates at the building edge, using VOLTTRON for real-time control and integration with HVAC systems, specifically RTUs and HPs. It executes optimization algorithms and communicates with the grid for demand response and energy savings.

## Key Features

1. **Energy Efficiency**: Advanced algorithms to minimize the energy consumption of RTUs and HPs while maintaining indoor comfort. Includes automated diagnostics and scheduling for optimal performance.

2. **Demand Response**: Integration with utility signals to provide grid services, allowing buildings to adjust energy usage based on grid conditions and financial incentives.

3. **User-Friendly Web Interface**: Simplified setup and management, making energy control accessible for facilities with limited technical expertise.

4. **Scalable Control**: Capable of scaling from single-building deployments to multiple locations, adapting easily to varying HVAC configurations.

## Architecture

The architecture of AEMS integrates the following elements:

- **Web Interface**: Built using modern web technologies, it provides real-time feedback and energy management capabilities.
- **Edge Control Stack**: Deployed on-site, the stack interfaces with HVAC equipment using VOLTTRON agents to execute energy optimization and respond to external commands.

## Installation and Setup

### Prerequisites

- A VOLTTRON installation is required for the edge stack. Refer to [VOLTTRON setup documentation](https://volttron.readthedocs.io/en/main/) for detailed guidance.
- The easiest way to deploy the AEMS web application is using Docker and Docker Compose.

### Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/VOLTTRON/volttron-pnnl-aems.git
   ```

2. Refer to the README in the `aems-app` and `aems-edge` directories for installation.

## Usage

- Use the web UI to configure RTUs and HPs setpoints, set schedules, enable setbacks and lockouts.
- Deploy edge agents to communicate with HVAC systems and execute control strategies.
- Enable grid-interaction features for demand response and participate in utility programs.

## Generating Certificates

### Self-Signed Certificate

To generate a self-signed certificate that can act as a Certificate Authority (CA) for testing purposes, run the following commands:

```bash
cd scripts
chmod +x generate_cert.sh
./generate_cert.sh ca
```

The generated CA certificate and private key will be placed in the `certs` directory.

### Certificate with a Common Name

To generate a certificate with a specified common name, signed by the self-signed CA, use the following command:

```bash
cd scripts
./generate_cert.sh generate <common_name> [--client|--server] [--ip <ip_address>]
```

Replace `<common_name>` with the desired common name for the certificate. The optional `--client` or `--server` parameter determines the type of certificate to generate, defaulting to a client certificate. You can also specify an IP address using `--ip`. This operation will create a new certificate and private key in the `certs` directory.

## Running Automated Tests

To run automated tests for the server, ensure you have `pytest` and `httpx` installed in your environment. You can install them using:

```bash
poetry add --group dev pytest httpx
```

Once set up, execute the tests with the following command:

```bash
# from the aems-edge/Manager direcctory
poetry run pytest
```

This will run all test cases defined in `test_server.py`, verifying both authentication and JSON-RPC functionality.

## Acknowledgements

This project is developed by PNNL with funding from the U.S. Department of Energy Building Technologies Office, aiming to advance energy management solutions for small and medium-sized buildings.
