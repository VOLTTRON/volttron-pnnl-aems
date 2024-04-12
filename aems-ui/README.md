# AEMS App

This app is a full stack typescript web application that is configured with cloud deployment, authentication, and database.

The current stack consists of:

- Deployment: Docker Compose
- Database: Postgres (Postgis)
- Application: Nextjs
- Authentication: Lucia
- Object Relational Mapping (ORM): Prisma
- Data Query Layer: GraphQL
- End to End Type Safety: Pothos and Apollo
- Reverse Proxy: Traefik
- TLS (SSL/HTTPS): Let's Encrypt

---

## Quick Start Guide

This guide has been written, tested, and intended for Windows and Linux installations.

---

## Prerequisites

These applications should be installed on the host machine.

- [Visual Studio Code](https://code.visualstudio.com/) - `development` (optional)
- [Git](https://git-scm.com/) - `development` (optional)
- [Node.js](https://nodejs.org/) - `development` (versions 20.x - https://nodejs.org/dist/latest-v20.x/)
- [Yarn](https://yarnpkg.com/) - `development`
- [Docker-Desktop](https://www.docker.com/products/docker-desktop) - `deployment` or Docker and Docker-Compose
  - [Docker](https://www.docker.com/products/container-runtime) - (optional)
  - [Docker-Compose](https://docs.docker.com/compose/install/) - (optional)

## Development

### Installing

Download the AEMS App source code from the repository. It's recommended to use the latest stable release from the master branch.

- [Github](https://stash.pnnl.gov/projects/AEMS/repos/aems-app/browse)

If Git is installed, you can checkout directly from Github which will make updating to the latest release easier. You will only have to clone the repository once. After that you can pull to get the latest updates. Every time the application is updated, you'll need to go through the build and deploy process.

```bash
git clone https://stash.pnnl.gov/scm/aems/aems-app.git
```

### Updating

If you downloaded directly from the Github site, then you will need to repeat all steps in this guide as you would for a new installation. If you cloned from Github then follow these steps. This will stash your configuration changes, update to the latest, and then re-apply your configuration to the updated files.

```bash
git stash
git pull
git stash pop
```

### Building

If build errors occur, it is very likely that Node.js or Yarn is out of date. The following steps assumes the user is in the main directory of the application.

Install or update all of the dependencies.

```bash
cd app
yarn install
yarn compile
yarn build
```

The client code is currently separate from the server and must be built and packaged separately. This is only necessary if changes to the client have been made.

```bash
cd client
yarn install
yarn package
```

### Quality

These should be run regularly to ensure consistent code quality.

```bash
cd app
yarn test
yarn lint
```

### Initializing

The database migrations and seeders are not automatically run for development.

To run any impending database migrations:

```bash
yarn migrate
```

To reset the database to a clean state:

> Warning: This will delete all existing data!

```bash
yarn reset
```

### Running

To start the app in development mode enter the following command from the `./app/` directory.

```bash
yarn dev
```

Type `CTRL-C` to stop the app.

### Configuration

The primary configuration file is `./app/.env`. This file should contain all of the application defaults. Changes to development configuration should be made using a new file `./app/.env.local`. App client configuration options must be prefixed with `NEXT_PUBLIC_`. These are the only variables that will be available to client-side code.

> <b>Note:</b> Only configuration that differs from the base configuration file should be specified.

#### Client

Environment variables that need to be accessed in the client code must be prefixed with `NEXT_PUBLIC_`.

#### Logging

> <b>Note:</b> All log levels should be one of the following types: trace, debug, info, warn, error, fatal

- LOG_TRANSPORTS: A comma separated list of logging transports to utilize.
- LOG_GLOBAL_LEVEL: The logging level to use for logging all API requests.
- LOG_CONSOLE_LEVEL: The logging level that should be displayed in console.
- LOG_FILE_PATH: The path to write the log file `./server.log`.
- LOG_FILE_LEVEL: The logging level that should be displayed to file.
- LOG_DATABASE_LEVEL: The logging level that should be logged to the database.
- LOG_PRISMA_LEVEL: Specify a logging level for showing Prisma database statements. This should only be used during development.

#### Session

- SESSION_MAX_AGE: The maximum age for sessions specified in seconds.

#### Authentication

- AUTH_PROVIDERS: Comma separated list of authentication providers to enable. The defaults available are local and bearer.
- PASSWORD_VALIDATE: Set to true to validate that the password meets suggested requirements.
- PASSWORD_STRENGTH: A value from 0 to 4 for required password strength.

#### General

- GRAPHQL_EDITOR: Set to true to display the GraphQL editor in production.
- SEED_DATA_PATH: Path to the JSON seed files.

#### Database

- DATABASE_URL: The complete database connection URL which is populated using the following variables.
- DATABASE_HOST: The database hostname.
- DATABASE_PORT: The database port.
- DATABASE_NAME: The database name.
- DATABASE_SCHEMA: The database schema.
- DATABASE_USERNAME: The database username.
- DATABASE_PASSWORD: The database password.

#### Services

- CLUSTER_TYPE: Dash separated list of services to run on this instance. Providing an empty string, or "services", will start all available services.
- PROXY_PROTOCOL: The protocol to use for the proxy.
- PROXY_HOST: The proxy hostname.
- PROXY_PORT: The proxy port.
- LOG_CLEAN: Set to true to delete old log records from the database on app start.

## Deployment

The following steps will need to be completed to deploy the application.

### Configuration

Configuration for docker compose can be found at `./.env`. The file `./docker-compose.yml` may need to be edited for some deployments.

### TLS (SSL/HTTPS)

TLS is provided by mkcert certificates and Let's Encrypt. The init container will generate a new certificate authority (CA) and certificates when first started or when any of them are missing. The CA will need to be added to web browsers or system for the locally signed certificates to be valid. TLS can also be provided by Let's Encrypt [https://letsencrypt.org/](https://letsencrypt.org/) for publicly facing websites that have a valid domain name.

### Docker Compose

A Docker compose file is included to manage the docker instances. The docker compose file will work in Windows, Mac, and Linux. By default the web application will be available at [https://<COMPOSE_PROJECT_NAME>.localhost](https://<COMPOSE_PROJECT_NAME>.localhost). The following commands deploy all of the docker containers.

Build the docker instances:

```bash
docker-compose build
```

Create and start the docker instances:

```bash
docker-compose up -d
```

Start the docker instances:

```bash
docker-compose start
```

Stop the docker instances:

```bash
docker-compose stop
```

Destroy the docker instances along with associated volumes:

```bash
docker-compose down -v
```

### Administration

These are the commands that can be used to interact with a docker instance. Replace `<container>` with the intended container.

SSH into a container to run commands:

> Note: Replace <container> with the desired container name. If `/bin/bash` is not found try `/bin/sh` instead.

```bash
docker exec -t -i <container> /bin/bash
```

View a container console log:

```bash
docker logs <container>
```

Export all of the images to an archive file:

> Note: Replace the tag text with the appropriate tag version number.

```powershell
$images = @(); docker-compose config | ?{$_ -match "image:.*$"} | ?{$_ -replace "${TAG}", "1.0.1"} | %{$images += ($_ -replace "image: ", "").Trim()}; docker save -o docker-images.tar $images
```

```bash
gzip docker-images.tar
```

Import the images archive file on another system:

```bash
gzip -d docker-images.tar.gz
docker load -i docker-images.tar
```

## Updating Version

To update the client version make changes within files matching these filters: `.env*,*.yml,*.json`

## License

TBD
