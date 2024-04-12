# Volttron PNNL AEMS

This repository contains two projects: `aems-edge` and `aems-ui`. Below are the instructions for setting up and using each project independently.

## aems-edge

### Prerequisites

- Python 3.7 or higher
- Volttron platform installed

### Installation

1. Clone the `aems-edge` repository:

    ```shell
    git clone https://github.com/your-username/aems-edge.git
    ```

2. Install the required Python packages:

    ```shell
    cd aems-edge
    pip install -r requirements.txt
    ```

### Usage

1. Start the Volttron platform:

    ```shell
    volttron -vv
    ```

2. Start the `aems-edge` agent:

    ```shell
    cd aems-edge
    python3 aems_edge.py
    ```

## aems-ui

### Prerequisites

- Node.js and npm installed

### Installation

1. Clone the `aems-ui` repository:

    ```shell
    git clone https://github.com/your-username/aems-ui.git
    ```

2. Install the required dependencies:

    ```shell
    cd aems-ui
    npm install
    ```

### Usage

1. Start the `aems-ui` development server:

    ```shell
    cd aems-ui
    npm start
    ```

2. Open your web browser and navigate to `http://localhost:3000` to access the `aems-ui` application.
