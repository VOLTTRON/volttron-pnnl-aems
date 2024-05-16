# AEMS App

This app is a full stack typescript web application that is configured with cloud deployment, authentication, database, and an optional map tile server.

The current stack consists of:

- Deployment: Docker Compose
- Database: Postgres (Postgis)
- Map Tiles: Open Street Maps
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

These applications should be installed on the host machine. The `development` tagged prerequisites are needed for local development only.

- [Visual Studio Code](https://code.visualstudio.com/) - `development` (optional)
- [Git](https://git-scm.com/) - `development` (optional)
- [Node.js](https://nodejs.org/) - `development` (versions 20.x - https://nodejs.org/dist/latest-v20.x/)
- [Yarn](https://yarnpkg.com/) - `development`
- [Postgres](https://www.postgresql.org/) - `development` (versions 16.x)
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

### Compiling

If dependency or compile errors occur, it is very likely that Node.js or Yarn is out of date. The following steps assumes the user is in the main directory of the application.

Install or update all of the dependencies.

```bash
cd app
yarn install
yarn compile
```

### Quality

These should be run regularly to ensure consistent code quality.

```bash
cd app
yarn test
yarn lint
```

### Initializing

Local development requires an instance of Postgres with a `develop` user (default password of `password`). This user will need to be granted login, super user, and create database roles. The database migrations are not automatically run for development.

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

To build and run the app in production mode enter the following commands from the `./app/` directory.

```bash
yarn build
yarn start
```

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

#### Open Street Map (OSM)

- OSM_HOST: The open street map tile server hostname.
- OSM_PORT: The open street map tile server port.
- OSM_STYLE: The filepath to the OSM style.

#### Services

- CLUSTER_TYPE: Dash separated list of services to run on this instance. Providing an empty string, or "services", will start all available services.
- PROXY_PROTOCOL: The protocol to use for the proxy.
- PROXY_HOST: The proxy hostname.
- PROXY_PORT: The proxy port.
- LOG_CLEAN: Set to true to delete old log records from the database on app start.

## Deployment

The following steps will need to be completed to deploy the application.

## Open Street Map (OSM) Data

The map tiles are generated by a server using Open Street Map data. The visualization must credit OSM by displaying a link in the corner. The raw map data can be downloaded here: [download.geofabrik.de/north-america](https://download.geofabrik.de/north-america/us.html) Map data is enormous so it's important to combine only the areas that are needed. Osmium was utilized for combining data sources for ingest. [https://osmcode.org/libosmium](https://osmcode.org/libosmium/) Finally the combined data is then hosted using a pre-made docker container. [https://hub.docker.com/r/overv/openstreetmap-tile-server](https://hub.docker.com/r/overv/openstreetmap-tile-server)

A single OSM file will need to be placed at `./osm/region.osm.pbf` before building and starting the Docker Compose Deployment. To enable OSM Docker Compose will need to be started using either the `osm` or `osm-full` profile. The profile can be set in the `.env` file.

> <b>Note: </b> Mapbox-GL must remain at version 1.x to utilize open-source license. The OSM contribution message must also remain on the displayed map.

Combine OSM files using Osmium and Anaconda:

```bash
cd osm
osmium merge file1.osm.pbf file2.osm.pbf -o region.osm.pbf
```

### Configuration

Configuration for docker compose can be found at `./.env`. The file `./docker-compose.yml` may need to be edited for some deployments. The docker compose definition contains a few optional containers that can be enabled by adding profiles. Proxy (`proxy`) is a Traefik proxy that can server locally signed or valid internet certificates provided by Let's Encrypt. OSM (`osm`) is map file service that can be configured to provide Open Street Map tiles. Nominatim (`nom`) is an address lookup and auto-complete service that is configured to utilize the same data and area as the optional OSM container.

### TLS (SSL/HTTPS)

TLS is provided by mkcert certificates and Let's Encrypt. The init container will generate a new certificate authority (CA) and certificates when first started or when any of them are missing. The CA will need to be added to web browsers or system for the locally signed certificates to be valid. TLS can also be provided by Let's Encrypt [https://letsencrypt.org/](https://letsencrypt.org/) for publicly facing websites that have a valid domain name.

### Docker Compose

A Docker compose file is included to manage the docker instances. The docker compose file will work in Windows, Mac, and Linux. By default the web application will be available at [https://<COMPOSE_PROJECT_NAME>.localhost](https://<COMPOSE_PROJECT_NAME>.localhost). The following commands deploy all of the docker containers.

> Note: If enabling the `osm` profile the OSM setup container will need to complete data import before the OSM tile server will start.

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

