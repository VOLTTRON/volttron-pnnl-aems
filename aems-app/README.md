# Skeleton App

This app is a full stack typescript web application that is configured with cloud deployment, authentication, database, and an optional map tile server.

The current stack consists of:

- Deployment: Docker Compose
- Database: Postgres (Postgis)
- Application: Nextjs
- Authentication: Lucia
- Object Relational Mapping (ORM): Prisma
- Data Query Layer: GraphQL
- GraphQL Client/Server: Apollo
- End to End Type Safety: Pothos
- GraphQL Subscription: Redis
- Reverse Proxy: Traefik (optional)
- TLS (SSL/HTTPS): Let's Encrypt (optional)
- Map Tiles: Open Street Maps and/or Open Street Map Tiles (optional)
- Address Lookup: Nominatim (optional)
- Wiki: Bookstack (optional)
- Single Sign-On (SSO): Keycloak (optional)

---

## Quick Start Guide

This guide has been written, tested, and intended for Windows and Linux installations.

---

## Prerequisites

These applications should be installed on the host machine. The `development` tagged prerequisites are needed for local development only.

- [Visual Studio Code](https://code.visualstudio.com/) - `development` (optional)
- [Git](https://git-scm.com/) - `development` (optional)
- [Node.js](https://nodejs.org/) - `development` (versions 20.x - https://nodejs.org/dist/latest-v20.x/)
- [Yarn](https://yarnpkg.com/) - `development`
- [Postgres](https://www.postgresql.org/) - `development` (versions 16.x)
- [Docker-Desktop](https://www.docker.com/products/docker-desktop) - `deployment` or Docker and Docker-Compose
  - [Docker](https://www.docker.com/products/container-runtime) - (optional)
  - [Docker-Compose](https://docs.docker.com/compose/install/) - (optional)

### Node.js
Installing Node.js will require you to first install Node Version Manager (NVM). Instructions can be found on the Node.js website. Once you have installed NVM and restarted your consel, run the following command to install the correct version of Node.js.

```bash
nvm install 20
```

## Development

### Installing

#### Preferred Method

Download the Skeleton App source code from the repository. It's recommended to use the latest stable release from the master branch.

- [Github](https://stash.pnnl.gov/projects/D3X573/repos/skeleton/browse)

#### Alternative Method

Another option is to use Git subtree. This will allow you to push changes to your own repository yet still pull changes and bug fixes applied to the source skeleton repository.

To initialize the skeleton subtree project run the following from your project directory. This will create a `source` folder that can then be modified as necessary. When possible avoid making changes to skeleton files in order to make future updates easier. E.g. Instead of adding a function to an existing module, instead create a new module.

```bash
git subtree add --prefix=source https://stash.pnnl.gov/scm/~d3x573/skeleton.git master --squash
```

To update the skeleton subtree project run the following from your project directory.

```bash
git subtree pull --prefix=source https://stash.pnnl.gov/scm/~d3x573/skeleton.git master --squash
```

### Compiling

If dependency or compile errors occur, it is very likely that Node.js or Yarn is out of date. The following commands assumes the user is in the [app](./app/) directory of the application.

Install the `yarn` package manager from the `app`, or `source/app` if using a subtree, directory.

```bash
corepack enable
```

Install or update all of the dependencies.

```bash
yarn install
yarn compile
```

### Quality

These should be run regularly to ensure consistent code quality. The following commands assumes the user is in the [app](./app/) directory of the application.

```bash
yarn test
yarn lint
```

### Initializing

Local development requires an instance of Postgres with a `develop` user (default password of `password`). This user will need to be granted login, super user, and create database roles. The database migrations are not automatically run for development. The following commands assumes the user is in the [app](./app/) directory of the application.

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

To start the app in development mode enter the following command from the [app](./app/) directory. Alternatively, the app and services can be started individually using `yarn dev:app` and `yarn dev:services`.

```bash
yarn dev
```

Type `CTRL-C` to stop the app.

To build and run the app in production mode enter the following commands from the [app](./app/) directory. Alternatively, the app and services can be started individually using `yarn start:app` and `yarn start:services`.

```bash
yarn build
yarn start
```

### Configuration

The primary application configuration file is [app/.env](./app/.env). This file should contain all of the application defaults. Changes to development configuration should be made using a new file [app/.env.local](./app/.env.local). App client configuration options must be prefixed with `NEXT_PUBLIC_`. These are the only variables that will be available to client-side code.

> <b>Note:</b> Only configuration that differs from the base configuration file should be specified.

#### Client

Environment variables that need to be accessed in the client code must be prefixed with `NEXT_PUBLIC_`.

- NEXT_PUBLIC_TITLE: The title of the application. This will be displayed in the browser tab.
- NEXT_PUBLIC_DESCRIPTION: The description of the application.
- NEXT_PUBLIC_KEYWORDS: The keywords for the application. This will be used for search engine optimization.
- NEXT_PUBLIC_ADMIN_EMAIL: The email address to use for the admin account.
- NEXT_PUBLIC_HIDDEN_ROUTES: A comma separated list of routes that should be hidden from the navigation.
- NEXT_PUBLIC_HIDDEN_LOGINS: A comma separated list of login providers that should be hidden from the login page.

Open Street Map

- NEXT_PUBLIC_MAP_DARK_STYLE: The open street map gl style URL for dark mode.
- NEXT_PUBLIC_MAP_LIGHT_STYLE: The open street map gl style URL for light mode.

#### Logging

> <b>Note:</b> All log levels should be one of the following types: trace, debug, info, warn, error, fatal

- PROJECT_NAME: The project name that gets used for the logs (and potentially other parts of the application).
- LOG_TRANSPORTS: A comma separated list of logging transports to utilize.
- LOG_GLOBAL_LEVEL: The logging level to use for logging all API requests.
- LOG_CONSOLE_LEVEL: The logging level that should be displayed in console.
- LOG_FILE_PATH: The path to write the log file `./server.log`.
- LOG_FILE_LEVEL: The logging level that should be displayed to file.
- LOG_DATABASE_LEVEL: The logging level that should be logged to the database.
- LOG_PRISMA_LEVEL: Specify a logging level for showing Prisma database statements. This should only be used during development.

#### Session

- SESSION_MAX_AGE: The maximum age for sessions specified in seconds.

#### General

- GRAPHQL_EDITOR: Set to true to display the GraphQL editor in production.
- SEED_DATA_PATH: Path to the JSON seed files.
- GRAPHQL_PUBSUB: The publish and subscribe provider to use for GraphQL. The defaults available are memory, prisma, and redis.
- FILE_UPLOAD_PATH: The path to store uploaded files.

#### Redis

- REDIS_HOST: The Redis hostname.
- REDIS_PORT: The Redis port.

#### Authentication

- AUTHENTICATE: Set to false to disable authentication and grant every all roles.
- AUTH_PROVIDERS: Comma separated list of authentication providers to enable. The defaults available are local, super, bearer, oneid, and keycloak.
- ONEID_ISSUER_URL: The base URL to use for finding the OneID well known openid configuration (minus the `.well-known/openid-configuration`).
- ONEID_CLIENT_ID: The OneID client ID if one is required.
- ONEID_CLIENT_SECRET: The OneID client secret.
- ONEID_REDIRECT_URL: The complete URL for the OneID redirect.
- ONEID_DEFAULT_ROLE: The default role to give to new users.
- KEYCLOAK_INTERNAL_REALM_URL: The internal URL for the Keycloak realm (this is necessary for Docker Compose deployments).
- KEYCLOAK_REALM_URL: The external URL for the Keycloak realm.
- KEYCLOAK_CLIENT_ID: The Keycloak client ID.
- KEYCLOAK_CLIENT_SECRET: The Keycloak client secret.
- KEYCLOAK_REDIRECT_URL: The complete URL for the Keycloak redirect.
- KEYCLOAK_DEFAULT_ROLE: The default role to give to new users.
- PASSWORD_STRENGTH: A value from 0 to 4 for required password strength.
- PASSWORD_VALIDATE: Set to true to validate that the password meets suggested requirements.

#### Database

- DATABASE_URL: The complete database connection URL which is populated using the following variables.
- DATABASE_HOST: The database hostname.
- DATABASE_PORT: The database port.
- DATABASE_NAME: The database name.
- DATABASE_SCHEMA: The database schema.
- DATABASE_USERNAME: The database username.
- DATABASE_PASSWORD: The database password.

### External Services

The application can be configured to restrict access to other internally hosted applications. These applications will be available at `<hostname>/ext/<application>`. They are configured using the following environment variables with a unique `<APPLICATION>` identifier.

- EXT\_`<APPLICATION>`\_PATH: The relative path that the application can be access at. This path must begin with `/ext/`.
- EXT\_`<APPLICATION>`\_ROLES: Comma separated list of roles that are allowed to access the application. Can also be set to `any` for unrestricted access.
- EXT\_`<APPLICATION>`\_AUTHORIZED: The internal URL to rewrite requests to when a user is authorized to access this resource.
- EXT\_`<APPLICATION>`\_UNAUTHORIZED: The external URL to rewrite requests to when a user is unauthorized to access this resource.

#### Internal Services

- CLUSTER_TYPE: Dash separated list of services to run on this instance. Providing an empty string, or "services", will start all available services.
- PROXY_PROTOCOL: The protocol to use for the proxy.
- PROXY_HOST: The proxy hostname.
- PROXY_PORT: The proxy port.
- LOG_CLEAN: Set to true to delete old log records from the database on app start.

## Deployment

The following steps will need to be completed to deploy the application.

## Traefik Reverse Proxy (optional)

If enabling the Traefik reverse proxy the profile `proxy` will need to be enabled. The environment variable `HOSTNAME` will need to be set to something other than localhost for deployments. For testing in development environments either `localhost` or the IP address can be utilized. Likewise, any other section of the [.env](./.env) file that references `localhost` will also need to be changed.

If the deployed application needs auto-generated public certificates it will need a valid domain name. The application will also need to be reachable from the internet. The following [.env](./.env) variables will need to be set: `CERT_RESOLVER=letsencrypt` and `ADMIN_EMAIL` will need to have a valid email specified.

## Bookstack Wiki (optional)

The Bookstack wiki container is provided mostly as an example of how to configure an external application that can be secured using single sign on authentication.

## Keycloak Authentication (optional)

Keycloak is the only container that requires configuration through their user interface. The other containers are configured by default to use a realm labeled `default`. Individual clients for [app](./app/), and `wiki` if utilized, will need to be configured, and their secrets set in the [.env](./.env) file. Keycloak documentation should be consulted for configuration.

## Nominatim (optional)

By default the Nominatim container will download the required area when the containers are first started. Map data can be downloaded here: [download.geofabrik.de/north-america](https://download.geofabrik.de/north-america/us.html).

Osmium can be utilized for combining data sources. [https://osmcode.org/libosmium](https://osmcode.org/libosmium/)

Combine OSM files using Osmium and Anaconda:

```bash
cd osm
osmium merge file1.osm.pbf file2.osm.pbf -o region.osm.pbf
```

## Open Street Map Tiles (optional)

Open Street Map tiles (.mbtiles) can be utilized directly by downloading the source `.osm.pbf` file and running the following command (modify the osm.pbf filenames to the downloaded filename). The resulting `.mbtiles` file will then be used by the OSM tile server. Processing the entire planet requires a system with 128GB of memory. Already processed `.mbtiles` files are available, with a paid license, from [https://openmaptiles.com/downloads/planet/](https://openmaptiles.com/downloads/planet/). They can also be found on the internet at various locations (typically not the most up to date). You can place the already processed `planet.mbtiles` file in the [docker/map/mbtiles](./docker/map/mbtiles) directory.

Download the entire planet file using the following command:

```bash
docker run --rm -it -v $pwd/docker/map:/download openmaptiles/openmaptiles-tools download-osm planet -- -d /download
```

Convert the planet file to an mbtiles file using the following command:

```bash
docker run -it --rm -v $pwd/docker/map:/data ghcr.io/systemed/tilemaker:master /data/planet.osm.pbf --output /data/mbtiles/planet.mbtiles
```

> <b>Note: </b> If using Mapbox-GL it must remain at version 1.x to utilize open-source license. MapLibre is a fork of the 1.x branch and is open source. The OSM contribution message must also remain on the displayed map.

### Configuration

Default configuration for docker compose can be found at [.env](./.env). Overrides for secrets can be placed in a [.env.secrets](./.env.secrets) file. The [.env.secrets](./.env.secrets) file will need to be set as system environment variables by either using the provided scripts ([secrets.ps1](./secrets.ps1) or [secrets.sh](./secrets.sh)) or some other means prior to building and running the containers. The PowerShell script can also unset all listed variables using the `clear` argument. There are default users with temporary passwords defined for local authentication in the [docker/init/20211103151730-system-user.json](./docker/init/20211103151730-system-user.json) file.

The file [docker-compose.yml](./docker-compose.yml) or [docker/docker-compose.yml](./docker/docker-compose.yml) may need to be edited for some deployments. The docker compose definition contains a few optional containers that can be enabled by adding profiles. Proxy (`proxy`) is a Traefik proxy that can server locally signed or valid internet certificates provided by Let's Encrypt. Open Street Map (`map`) is map file service that can be configured to provide Open Street Map tiles. Nominatim (`nom`) is an address lookup and auto-complete service that is configured to utilize the same data and area as the optional map container.

### TLS (SSL/HTTPS)

TLS is provided by mkcert certificates and Let's Encrypt. The init container will generate a new certificate authority (CA) and certificates when first started or when any of them are missing. The CA will need to be added to web browsers or system for the locally signed certificates to be valid. TLS can also be provided by Let's Encrypt [https://letsencrypt.org/](https://letsencrypt.org/) for publicly facing websites that have a valid domain name.

### Docker Compose

A Docker compose file is included to manage the docker instances. The docker compose file will work in Windows, Mac, and Linux. By default the web application will be available at [https://localhost](https://localhost). The following commands deploy all of the docker containers.

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

```bash
docker compose down -v
```

### Setup Keycloak

Follow the below steps to setup Keycloak to allow users to register and manage their own accounts.

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
8. Set the "Client ID" to [app](./app/), optionally set the "Client Name", and click "Next".
   ![](docs/setup-keycloak_05.PNG)
9. Enable "Client authentication" and "Implicit flow" and click "Next".
   ![](docs/setup-keycloak_06.PNG)
10. Set "Valid redirect URIs" and "Valid post logout redirect URIs" to `/*` or something more specific and click "Save".
    ![](docs/setup-keycloak_07.PNG)
11. Navigate to the "Credentials" tab and copy the "Client Secret" to your clipboard.
    ![](docs/setup-keycloak_08.PNG)
12. Assign the copied client secret to the [.env](./.env) value for "KEYCLOAK_CLIENT_SECRET".
13. Redeploy the app using:

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

## Developing Towards the Skeleton Project

This project utilizes a Gitflow workflow. While this method works well for the development environment at the lab, it may not be the best fit for all projects. The Gitflow workflow is a branching model that is great for projects that have a scheduled release cycle. You can read more about the Gitflow workflow [here](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow).

### Branches

- `master`: The master branch is the main branch where the source code of HEAD always reflects a production-ready state.
- `develop`: The develop branch is the main branch where the source code of HEAD always reflects a state with the latest delivered development changes for the next release.
- `feature/*`: Feature branches are used to develop new features for the upcoming or a distant future release. The essence of a feature branch is that it exists as long as the feature is in development.
- `release/*`: Release branches support preparation of a new production release. They allow for last-minute dotting of i’s and crossing t’s. Furthermore, they allow for minor bug fixes and preparing meta-data for a release.

### Workflow

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

4. Create a new release branch from the `develop` branch replacing `1.0.0` with the release version.

```bash
git checkout -b release/1.0.0 develop
```

5. Make changes to the release branch. To update the client version make changes within files matching these filters: `.env*,*.yml,*.json`

```bash
git add .
git commit -m "My release commit message."
```

6. Merge the release branch into the `master` and `develop` branches.

```bash
git checkout master
git merge release/1.0.0
git tag -a 1.0.0 -m "My release tag message."
git push origin master
git checkout develop
git merge release/1.0.0
git branch -d release/1.0.0
git push origin develop
```

## License

Copyright 2024 Battelle Memorial Institute

Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy
of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations
under the License.


                                  Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
