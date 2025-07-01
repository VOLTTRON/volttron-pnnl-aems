<p align="center">
  <a href="http://pnnl.gov" target="blank"><img src="./client/public/images/PNNL_Centered_Logo_Color_RGB.png" width="300" alt="PNNL Logo" /></a>
</p>
<p align="center">A full-stack and full-featured web application framework for PNNL developers.</p>
<p align="center">
<a href="https://tanuki.pnnl.gov/amelia.bleeker/skeleton" target="_blank"><img src="https://img.shields.io/badge/git-main-blue" alt="Git Repo Main" /></a>
<a href="./LICENSE.txt" target="_blank"><img src="https://img.shields.io/badge/license-pnnl-orange" alt="PNNL License" /></a>
<a href="mailto:amelia.bleeker@pnnl.gov"><img src="https://img.shields.io/badge/help-contribute-green" alt="Help Contribute" /></a>
</p>

# Skeleton App

The Skeleton App is a full-stack typescript web application framework that is configured with deployment, authentication, authorization, database, and an optional map tile server.

The current stack consists of:

- Deployment: Docker Compose
- Database: Postgres (Postgis)
- Client Application: Nextjs
- Server Application: Nestjs
- Authentication: Passport
- Object Relational Mapping (ORM): Prisma
- Data Query Layer: GraphQL
- GraphQL Client/Server: Apollo
- End to End Type Safety: Pothos
- GraphQL Subscription: Redis
- Reverse Proxy: Traefik (optional)
- TLS Certificates: Let's Encrypt (optional)
- Map Tiles: Open Street Maps and/or Open Street Map Tiles (optional)
- Address Lookup: Nominatim (optional)
- Wiki: Bookstack (optional)
- Single Sign-On (SSO): Keycloak (optional)

This guide has been written, tested, and intended for Windows and Linux installations.

---

# Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment](#deployment)
  - [Traefik Reverse Proxy (optional)](#traefik-reverse-proxy-optional)
  - [Bookstack Wiki (optional)](#bookstack-wiki-optional)
  - [Keycloak Authentication (optional)](#keycloak-authentication-optional)
  - [Nominatim (optional)](#nominatim-optional)
  - [Open Street Map Tiles (optional)](#open-street-map-tiles-optional)
  - [Configuration](#configuration)
  - [TLS (SSL/HTTPS)](#tls-sslhttps)
  - [Docker Compose](#docker-compose)
  - [Setup Keycloak](#setup-keycloak)
  - [Administration](#administration)
  - [Utilities](#utilities)
- [Development](#development)
  - [Node.js](#nodejs)
  - [Project Structure](#project-structure)
  - [Installing and Initializing the Skeleton App](#installing-and-initializing-the-skeleton-app)
    - [Subtree Method](#subtree-method)
    - [Detached Method](#detached-method)
  - [Compiling](#compiling)
  - [Quality](#quality)
  - [Initializing](#initializing)
  - [Running](#running)
  - [Configuration](#configuration-1)
    - [Client](#client)
    - [Logging](#logging)
    - [Session](#session)
    - [General](#general)
    - [Redis](#redis)
    - [Authentication](#authentication)
    - [Database](#database)
    - [External Services](#external-services)
    - [Internal Services](#internal-services)
- [Developing Towards the Skeleton Project](#developing-towards-the-skeleton-project)
  - [Branches](#branches)
  - [Workflow](#workflow)
- [License](#license)

## Prerequisites

These applications should be installed on the host machine. The `development` tagged prerequisites are needed for local development only. The `deployment` tagged prerequisites are necessary for deployment.

- [Visual Studio Code](https://code.visualstudio.com/) - `development` (optional)
- [Git](https://git-scm.com/) - `development` (optional)
- [Node.js](https://nodejs.org/) - `development` (versions 22.x - https://nodejs.org/dist/latest-v22.x/)
- [Yarn](https://yarnpkg.com/) - `development` (versions 4.x - https://yarnpkg.com/getting-started/install)
- [Postgres](https://www.postgresql.org/) - `development` (versions 16.x - https://www.postgresql.org/download/)
  - [Postgis](https://postgis.net/) - `development` (versions 3.x - https://postgis.net/install/)
- [Docker-Desktop](https://www.docker.com/products/docker-desktop) - `deployment` or Docker and Docker-Compose
  - [Docker](https://www.docker.com/products/container-runtime) - (optional)
  - [Docker-Compose](https://docs.docker.com/compose/install/) - (optional)

## Deployment

The following steps will need to be completed to deploy the application.

### Traefik Reverse Proxy (optional)

If enabling the Traefik reverse proxy the profile `proxy` will need to be enabled. The environment variable `HOSTNAME` will need to be set to something other than localhost for deployments. For testing in development environments either `localhost` or the IP address can be utilized. Likewise, any other section of the [.env](./.env) file that references `localhost` will also need to be changed.

If the deployed application needs auto-generated public certificates it will need a valid domain name. The application will also need to be reachable from the internet. The following [.env](./.env) variables will need to be set: `CERT_RESOLVER=letsencrypt` and `ADMIN_EMAIL` will need to have a valid email specified.

### Bookstack Wiki (optional)

The Bookstack wiki container is provided mostly as an example of how to configure an external application that can be secured using single sign on authentication.

### Keycloak Authentication (optional)

Keycloak is the only container that requires configuration through their user interface. The other containers are configured by default to use a realm labeled `default`. Individual clients for [server](./server/), and `wiki` if utilized, will need to be configured, and their secrets set in the [.env](./.env) file. Keycloak documentation should be consulted for configuration.

### Nominatim (optional)

By default the Nominatim container will download the required area when the containers are first started. Map data can be downloaded here: [download.geofabrik.de/north-america](https://download.geofabrik.de/north-america/us.html).

Osmium can be utilized for combining data sources. [https://osmcode.org/libosmium](https://osmcode.org/libosmium/)

Combine OSM files using Osmium and Anaconda:

```bash
cd osm
osmium merge file1.osm.pbf file2.osm.pbf -o region.osm.pbf
```

### Open Street Map Tiles (optional)

Open Street Map tiles (.mbtiles) can be utilized directly by downloading the source `.osm.pbf` file and running the following command (modify the osm.pbf filenames to the downloaded filename). The resulting `.mbtiles` file will then be used by the OSM tile server. Processing the entire planet requires a system with 128GB of memory. Already processed `.mbtiles` files are available, with a paid license, from [https://openmaptiles.com/downloads/planet/](https://openmaptiles.com/downloads/planet/). They can also be found on the internet at various locations (typically not the most up to date). You can place the already processed `planet.mbtiles` file in the [docker/map/mbtiles](./docker/map/mbtiles) directory.

Download the entire planet file using the following command:

```bash
docker run --rm -it -v $pwd/docker/map:/download openmaptiles/openmaptiles-tools download-osm planet -- -d /download
```

Convert the planet file to an mbtiles file using the following command:

```bash
docker run -it --rm -v $pwd/docker/map:/data ghcr.io/systemed/tilemaker:master /data/planet.osm.pbf --output /data/mbtiles/planet.mbtiles
```

> <b>Note: </b> If using Mapbox-GL it must remain at version 1.x to utilize open-source license. MapLibre is the preferred library since it is a maintained fork of the 1.x branch and is open source. The OSM contribution message must also remain on the displayed map.

### Configuration

Default configuration for docker compose can be found at [.env](./.env). Overrides for secrets can be placed in a [.env.secrets](./.env.secrets) file. The [.env.secrets](./.env.secrets) file will need to be set as system environment variables by either using the provided scripts ([secrets.ps1](./secrets.ps1) or [secrets.sh](./secrets.sh)) or some other means prior to building and running the containers. The PowerShell script can also unset all listed variables using the `clear` argument. There are default users with temporary passwords defined for local authentication in the [docker/seed/20211103151730-system-user.json](./docker/seed/20211103151730-system-user.json) file.

The file [docker-compose.yml](./docker-compose.yml) or [docker/docker-compose.yml](./docker/docker-compose.yml) may need to be edited for some deployments. The docker compose definition contains a few optional containers that can be enabled by adding profiles. Proxy (`proxy`) is a Traefik proxy that can serve locally signed or valid internet certificates provided by Let's Encrypt. Open Street Map (`map`) is map file service that can be configured to provide Open Street Map tiles. Nominatim (`nom`) is an address lookup and auto-complete service that is configured to utilize the same data and area as the optional map container.

### TLS (SSL/HTTPS)

TLS is provided by mkcert certificates and Let's Encrypt. The init container will generate a new certificate authority (CA) and certificates when first started or when any of them are missing. The CA will need to be added to web browsers or system for the locally signed certificates to be valid. TLS can also be provided by Let's Encrypt [https://letsencrypt.org/](https://letsencrypt.org/) for publicly facing websites that have a valid domain name. Alternatively, a certificate can be provided by a third party. The proxy configuration [file](./docker/proxy/certs-traefik.yml) will need to be edited to point to the provided certificates.

### Docker Compose

A Docker compose file is included to manage the docker instances. The docker compose file will work in Windows, Mac, and Linux. By default the web application will be available at [https://localhost](https://localhost). The following commands can be used to manage all of the docker containers.

Build the docker instances:

```bash
docker compose build
```

Create and start the docker instances:

```bash
docker compose up -d
```

Start the docker instances:

```bash
docker compose start
```

Stop the docker instances:

```bash
docker compose stop
```

Destroy the docker instances along with associated volumes:

> Warning: This command will delete all data and is not recoverable!

```bash
docker compose down -v
```

### Setup Keycloak

Follow the steps below to setup Keycloak which will allow users to register and manage their own accounts.
Registered users will still need to be granted access to the application by an administrator.

1. You will need to set a domain name or IP address as the "HOSTNAME" in the [.env](./.env) file. You can optionally set the "KEYCLOAK_DEFAULT_ROLE" to automatically assign a role to newly registered accounts. This change is not retroactive.
2. Navigate to the Keycloak admin page (replacing `localhost` with the previously set variable): [https://localhost/auth/sso/admin/master/console]()
3. Sign in using the username and password specified in the [.env](./.env) file as "KEYCLOAK_ADMIN" and "KEYCLOAK_ADMIN_PASSWORD".
4. Click the "Keycloak" drop down to create a new realm.
   ![](docs/setup-keycloak_01.PNG)
5. Set the "Realm name" to `default` and click "Create".
   ![](docs/setup-keycloak_02.PNG)
6. Navigate to "Realm settings" -> "Login" and configure as desired.
   ![](docs/setup-keycloak_03.PNG)
7. Navigate to "Clients" and click "Create client".
   ![](docs/setup-keycloak_04.PNG)
8. Set the "Client ID" to [client](./client/), optionally set the "Client Name", and click "Next".
   ![](docs/setup-keycloak_05.PNG)
9. Enable "Client authentication" and "Implicit flow" and click "Next".
   ![](docs/setup-keycloak_06.PNG)
10. Set "Valid redirect URIs" and "Valid post logout redirect URIs" to `/*` or something more specific and click "Save".
    ![](docs/setup-keycloak_07.PNG)
11. Navigate to the "Credentials" tab and copy the "Client Secret" to your clipboard.
    ![](docs/setup-keycloak_08.PNG)
12. Assign the copied client secret to the [.env](./.env) value for "KEYCLOAK_CLIENT_SECRET".
13. Redeploy the client using:

```bash
docker compose up -d
```

> <b>Note: </b> Keycloak doesn't pass roles to the client application by default. The client role scope will need to be added to the ID token. This can be done at `Client scopes -> Mappers -> client roles`. The realm groups and associated client roles will also need to be manually assigned to the user in the Keycloak admin interface. [https://www.keycloak.org/docs/latest/server_admin/#assigning-permissions-using-roles-and-groups]()

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
$images = @(); docker compose config | ?{$_ -match "image:.*$"} | ?{$_ -replace "${TAG}", "1.0.1"} | %{$images += ($_ -replace "image: ", "").Trim()}; docker save -o docker-images.tar $images
```

```bash
gzip docker-images.tar
```

Import the images archive file on another system:

```bash
gzip -d docker-images.tar.gz
docker load -i docker-images.tar
```

### Utilities

Various scripts are provided for convenience and/or a starting point for continuous integration (CI).

- `.gitlab-ci.yml`
  - This script can be copied to the new project root and modified to support building, testing, and publishing within your GitLab code repository.
- `build.*`
  - The build script (for Windows and Linux/Mac) is included for convenience. It initializes and builds all of the workspace projects in the correct order.
- `test.*`
  - The test script (for Windows and Linux/Mac) is included for convenience and works similarly to the build script except that it does code analysis and executes tests with code coverage reports.
- `env.sh`
  - The env script is used within the CI environment to read in environment variables from a file.
- `secrets.*`
  - The secrets script (for Windows and Linux/Mac) can be used in the deploy environment to read in secrets from a `.env.secrets` file.

## Development

### Node.js

Typically, installing Node.js will require you to first install Node Version Manager (NVM). Instructions for Mac and Linux can be found on the Node.js website [https://nodejs.org/en/download](https://nodejs.org/en/download). The NVM version for Windows can be downloaded here [https://github.com/coreybutler/nvm-windows/releases](https://github.com/coreybutler/nvm-windows/releases). Once you have installed NVM and restarted your console, run the following command to install the correct version of Node.js.

```bash
nvm install 22
```

### Project Structure

The project is structured into the following directories:

- [client](./client/): The client application is a Next.js application that is used to display the user interface.
- [common](./common/): The common directory contains shared code between the client and server applications.
- [docker](./docker/): The docker directory contains the docker compose files and configuration files for the production deployed application.
- [prisma](./prisma/): The Prisma directory contains the database schema and migration files.
- [server](./server/): The server application is a Nest.js application that is used to handle the backend logic, API requests, and run services.

### Installing and Initializing the Skeleton App

#### Subtree Method

One option is to use Git subtree. This will allow you to push changes to your own repository yet still pull changes and bug fixes applied to the source skeleton repository.

To initialize the skeleton subtree project run the following from your project directory. This will create a `source` folder that can then be modified as necessary. Feel free to change this folder name to something more meaningful for your project. When possible avoid making changes to skeleton files in order to make future updates easier. E.g. Instead of adding a function to an existing module, create a new module.

For more timely fixes and upgrades you can use the `develop` branch instead of `main`.

```bash
git subtree add --prefix=source https://tanuki.pnnl.gov/amelia.bleeker/skeleton.git main --squash
```

To update the skeleton subtree project run the following from your project directory.

```bash
git subtree pull --prefix=source https://tanuki.pnnl.gov/amelia.bleeker/skeleton.git main --squash
```

#### Detached Method

Download the Skeleton App source code from the repository. It's recommended to use the latest stable release from the main branch.

- [Github](https://tanuki.pnnl.gov/amelia.bleeker/skeleton)

### Compiling

Install the `yarn` package manager from the (you may have to prefix with `source/*` if using subtree) `client`, `server`, `common`, or `prisma` directory. The project hierarchy is as follows: `prisma` -> `common` -> `server` -> `client`. When a change is made to a project it may be necessary to update dependencies and/or build the application as well as any dependant applications. The following commands assumes the user is in the [client](./client/), [server](./server/), [common](./common/), or [prisma](./prisma/) directory of the application.

```bash
corepack enable
```

Install or update all of the dependencies.

```bash
yarn install
```

```bash
yarn build
```

### Quality

These should be run regularly to ensure consistent code quality. The following commands assumes the user is in the [client](./client/), [server](./server/), [common](./common/), or [prisma](./prisma/) directory of the application.

```bash
yarn test
yarn lint
yarn check
```

### Initializing

Local development requires an instance of Postgres with a `develop` user (default password of `password`). This user will need to be granted login, super user, and create database roles. The database migrations are not automatically run for development. The following commands assumes the user is in the [prisma](./prisma/) directory of the application.

To run any impending database migrations:

```bash
yarn migrate:deploy
```

To reset the database to a clean state:

> Warning: This will delete all existing data!

```bash
yarn migrate:reset
```

### Running

To start the client or server in development mode enter the following command from the [client](./client/) and [server](./server/) directory.

```bash
yarn start
```

Type `CTRL-C` to stop either application.

To build and run the either application in production mode enter the following commands from their respective directory.

```bash
yarn build
yarn start:prod
```

### Configuration

The primary production configuration file is [.env](./.env). These values get passed down to the individual production containers. The values must be assigned using their respective container environment file. The individual container environment files are located in the [docker](./docker/) directory.

> Note: Any ports listed in the environment file will be exposed in the host machine. These ports should only be specified in a production deployment if needed. The application itself will be available at [https://localhost](https://localhost) or the specified domain name.

> Note: For production deployments secrets and passwords should not be stored in the `.env` file. One option is to use the [.env.secrets](./.env.secrets) file. The secrets file will need to be set as system environment variables by either using the provided scripts ([secrets.ps1](./secrets.ps1) or [secrets.sh](./secrets.sh)).

## Developing Towards the Skeleton Project

This project utilizes a Gitflow workflow. While this method works well for small development teams, it may not be the best fit for all projects. The Gitflow workflow is a branching model that is great for projects that have a scheduled release cycle. You can read more about the Gitflow workflow [here](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow).

### Branches

- `main`: The main branch is where the source code of HEAD always reflects a production-ready state.
- `develop`: The develop branch is where the source code of HEAD always reflects a state with the latest delivered development changes for the next release.
- `feature/*`: Feature branches are used to develop new features for the upcoming or a distant future release. The essence of a feature branch is that it exists as long as the feature is in development.
- `release/*`: Release branches support preparation of a new production release. They allow for last-minute dotting of i’s and crossing t’s. Furthermore, they allow for minor bug fixes and preparing meta-data for a release.

### Workflow

- Develop new features
  1. Create a new feature branch from the `develop` branch replacing `my-feature` with a short name for your feature.
    ```bash
    git checkout -b feature/my-feature develop
    ```
  2. Make changes to the feature branch and check in often to prevent loss of work.
    ```bash
    git add .
    git commit -m "My feature commit message."
    ```
  3. Merge the feature branch into the `develop` branch. Optionally create a pull request.
    ```bash
    git checkout develop
    git merge feature/my-feature
    git branch -d feature/my-feature
    git push origin develop
    ```
- Create a release
  1. Increment the version number from `2.0.3` using [Semantic Versioning](https://semver.org/) or your project's preferred method.
      1. In VSCode go to the `Search (Ctrl+Shift+F)` tab.
      2. Enter `2.0.3` in the `Search` field.
      3. Enter your incremented version number in the `Replace` field.
      4. Press the `...` to `Expand Search Details` and enter `.env*,*.yml,*.json,*.md` in the `files to include` field.
      5. Replace all of the relevant entries.
  2. Create a new release branch from the `develop` branch using the updated release version.
    ```bash
    git checkout -b release/2.0.3 develop
    ```
  3. Make changes to the release branch.
    ```bash
    git add .
    git commit -m "Updated release version numbers."
    ```
  4. Merge the release branch into the `main` and `develop` branches.
    ```bash
    git checkout main
    git merge release/2.0.3
    git tag -a 2.0.3 -m "Tagged for new version release."
    git push origin --tags
    git push origin main
    git checkout develop
    git merge release/2.0.3
    git branch -d release/2.0.3
    git push origin develop
    ```
