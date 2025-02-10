# AEMS Edge Install Using Poetry

To set up the `aems-edge` component of the Autonomous Energy Management Software (AEMS) project, follow the instructions below to clone the repository and install its dependencies using Poetry.

## Prerequisites

- Ensure you have [Poetry Official Installer](https://python-poetry.org/docs/#installing-with-the-official-installer) installed. Poetry is a dependency management tool that simplifies package installations while managing virtual environments.

```bash
curl -sSL https://install.python-poetry.org | python3 -
```

## Installation Steps

1. **Clone the Repository**

   Start by cloning the `aems-edge` repository from GitHub to your local machine. Use the following commands in your terminal:

   ```bash
   git clone https://github.com/VOLTTRON/volttron-pnnl-aems.git
   cd volttron-pnnl-aems/aems-edge
   ```

### Install Dependencies with Poetry

Install the project's dependencies, which also sets up a virtual environment:

```bash
poetry install
```

This command will read the pyproject.toml file to install all required packages for development and execution, creating a isolated environment for the project.

### Verify Installation

After installation, you can verify that the application is ready to run by using the following command:

```bash
poetry run start-server --help
```

This command will display available options for running the server, confirming that your setup is correct.

For Schneider thermostat need to set:
       "Setpoint Function" - SetpointFunction =  [multiStateValue 58] = 1 to "detach"
       "Economizer Configuration" - HasEconomizer [multiStateValue 72] = [1=No economizer, 2=Has economizer] [configuration screen 5/11]
       "Mechanical Cooling Allowed" - MechanicalCoolingDuringEconomizing [multiStateValue 79] = [1=No economizer, 2=Has economizer] [configuration screen 5/11]
       "Application" -  Application [multiStateValue 119] = [1=RTU, 2=HPU] [configuration screen 8/11]
