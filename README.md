<p align="center">
  <a href="http://pnnl.gov" target="blank"><img src="./client/public/images/PNNL_Centered_Logo_Color_RGB.png" width="300" alt="PNNL Logo" /></a>
</p>

<h1 align="center">Skeleton App</h1>

<p align="center">
  <strong>A full-stack TypeScript web application framework for PNNL developers</strong>
</p>

<p align="center">
  <a href="https://tanuki.pnnl.gov/amelia.bleeker/skeleton" target="_blank">
    <img src="https://img.shields.io/badge/version-2.0.4-blue.svg" alt="Version" />
  </a>
  <a href="https://tanuki.pnnl.gov/amelia.bleeker/skeleton" target="_blank">
    <img src="https://img.shields.io/badge/git-main-blue" alt="Git Repo Main" />
  </a>
  <a href="./LICENSE.txt" target="_blank">
    <img src="https://img.shields.io/badge/license-PNNL%2FBattelle-orange" alt="PNNL License" />
  </a>
  <a href="https://nodejs.org/dist/latest-v22.x/" target="_blank">
    <img src="https://img.shields.io/badge/node-22.x-green.svg" alt="Node.js Version" />
  </a>
  <a href="https://yarnpkg.com/getting-started/install" target="_blank">
    <img src="https://img.shields.io/badge/yarn-4.x-blue.svg" alt="Yarn Version" />
  </a>
  <a href="mailto:amelia.bleeker@pnnl.gov">
    <img src="https://img.shields.io/badge/help-contribute-green" alt="Help Contribute" />
  </a>
</p>

---

## Table of Contents

- [🚀 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Getting Started](#-getting-started)
  - [Quick Start (Docker - Recommended)](#quick-start-docker---recommended)
  - [Development Setup](#development-setup)
  - [First Steps](#first-steps)
- [📚 API Documentation](#-api-documentation)
  - [GraphQL API](#graphql-api)
  - [REST API](#rest-api)
  - [Authentication](#authentication)
- [🔒 Security](#-security)
  - [Authentication & Authorization](#authentication--authorization)
  - [Security Headers](#security-headers)
  - [Data Protection](#data-protection)
- [🛠️ Troubleshooting](#️-troubleshooting)
  - [Debugging](#debugging)
- [📈 Performance](#-performance)
  - [Optimization Guidelines](#optimization-guidelines)
  - [Monitoring](#monitoring)
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
  - [Compiling](#compiling)
  - [Quality](#quality)
  - [Initializing](#initializing)
  - [Running](#running)
  - [Configuration](#configuration-1)
- [Contributing](#contributing)
  - [Development Workflow](#development-workflow)
  - [Coding Standards](#coding-standards)
  - [Testing Requirements](#testing-requirements)
  - [Code Review Process](#code-review-process)
  - [Reporting Issues](#reporting-issues)
  - [Security Issues](#security-issues)
- [Developing Towards the Skeleton Project](#developing-towards-the-skeleton-project)
  - [Branches](#branches)
  - [Workflow](#workflow)
- [License](#license)
  - [Copyright Notice](#copyright-notice)
  - [Usage Rights](#usage-rights)
  - [Restrictions](#restrictions)
  - [Contact Information](#contact-information)
  - [Third-party Dependencies](#third-party-dependencies)

---

## 🚀 Features

- **🏗️ Modern Architecture**: Full-stack TypeScript with Next.js frontend and NestJS backend
- **🔐 Flexible Authentication**: Support for Auth.js, Passport, local auth, SSO (Keycloak), and bearer tokens
- **📊 GraphQL API**: Type-safe API with Apollo Client/Server and real-time subscriptions
- **🗄️ Database Integration**: PostgreSQL with PostGIS for geospatial data and Prisma ORM
- **🐳 Container Ready**: Docker Compose deployment with optional services
- **🌍 Geospatial Support**: Built-in mapping with MapLibre GL and OpenStreetMap tiles
- **🔒 Security First**: TLS/SSL support, role-based access control, and secure session management
- **📈 Scalable**: Redis caching, GraphQL subscriptions, and horizontal scaling support
- **🛠️ Developer Experience**: Hot reload, type safety, automated testing, and comprehensive tooling

## 🏗️ Architecture

The Skeleton App is built on a modern, scalable architecture:

### Core Stack

- **Frontend**: Next.js 14+ with React 18, TypeScript, and SCSS
- **Backend**: NestJS with Express, TypeScript, and modular architecture
- **Database**: PostgreSQL 16+ with PostGIS 3+ for geospatial data
- **ORM**: Prisma with type-safe database access and migrations
- **API**: GraphQL with Apollo Server/Client and Pothos for type safety
- **Authentication**: Auth.js (primary) with Passport.js fallback support
- **Caching**: Redis for sessions and GraphQL subscriptions
- **Deployment**: Docker Compose with multi-service orchestration

### Optional Services

- **Reverse Proxy**: Traefik with automatic TLS/SSL certificates
- **SSO**: Keycloak for enterprise authentication
- **Maps**: OpenStreetMap tiles with MapLibre GL
- **Geocoding**: Nominatim for address lookup and geocoding
- **Documentation**: BookStack wiki integration
- **Monitoring**: Built-in logging and health checks

### Key Features

- **Session Management**: JWT tokens or database session tracking
- **Real-time Updates**: GraphQL subscriptions with Redis pub/sub
- **Geospatial Queries**: PostGIS integration for location-based features
- **Role-based Security**: Granular permissions and access control
- **Multi-tenant Ready**: Configurable external service routing
- **Development Tools**: Hot reload, type checking, and automated testing
- **Type Safety**: End-to-End type safety

This guide supports Windows, Linux, and macOS installations.

### System Architecture Diagrams

The architecture is organized into multiple diagrams for clarity. Each diagram focuses on a specific aspect of the system.

#### 1. High-Level System Overview

This diagram shows the major architectural layers and how they interact.

```mermaid
graph TB
    Users([External Users<br/>Web Browsers])
    
    subgraph Edge["Edge Layer"]
        Proxy[Traefik Reverse Proxy<br/>TLS/SSL Termination<br/>Route Management]
    end
    
    subgraph AppTier["Application Tier"]
        Client[Next.js Client<br/>React Frontend]
        Server[NestJS Server<br/>GraphQL API<br/>Auth Gateway]
    end
    
    subgraph AuthTier["Authentication Tier"]
        Keycloak[Keycloak SSO<br/>OAuth/OIDC]
        AuthJS[Auth.js<br/>Session Management]
    end
    
    subgraph DataTier["Data Tier"]
        Database[(PostgreSQL<br/>+ PostGIS)]
        Redis[(Redis<br/>Cache & Pub/Sub)]
    end
    
    subgraph Optional["Optional Services<br/>(Role-Based Access)"]
        Maps[MapTiles Server]
        Geocode[Nominatim Geocoding]
        Wiki[BookStack Wiki]
    end
    
    Users -->|HTTPS| Proxy
    Proxy -->|Route: /| Client
    Proxy -->|Route: /graphql<br/>/api, /ext/*| Server
    Proxy -->|Route: /auth/sso/| Keycloak
    
    Client <-->|GraphQL/REST| Server
    Server --> AuthJS
    Server -.->|OAuth| Keycloak
    AuthJS --> Redis
    
    Server -->|Check Roles<br/>Proxy Request| Maps
    Server -->|Check Roles<br/>Proxy Request| Geocode
    Server -->|Check Roles<br/>Proxy Request| Wiki
    
    Server --> Database
    Server --> Redis
    
    classDef edge fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef app fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef auth fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef data fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef optional fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    
    class Proxy edge
    class Client,Server app
    class Keycloak,AuthJS auth
    class Database,Redis data
    class Maps,Geocode,Wiki optional
```

**Key Points:**
- **4-Tier Architecture**: Edge → Application → Authentication → Data
- **Security Gateway**: Server acts as auth gateway for optional services at `/ext/*` routes
- **Role-Based Access**: Server checks user roles before proxying to Maps/Geocode/Wiki
- **Centralized Routing**: Traefik routes `/ext/*` to Server, not directly to optional services
- **Flexible Authentication**: Supports both Auth.js (default) and Keycloak SSO

#### 2. Application Architecture

End-to-end application flow from client to server.

```mermaid
graph TB
    subgraph Build["Build System"]
        Prisma[Prisma Module<br/>Database Schema<br/>Type Generation]
        Common[Common Module<br/>Shared Types<br/>Utilities]
    end
    
    subgraph Frontend["Frontend (Next.js)"]
        Pages[Pages & Routes]
        Components[React Components]
        Queries[GraphQL Queries]
        ClientAPI[Apollo Client]
    end
    
    subgraph Backend["Backend (NestJS)"]
        GraphQL[GraphQL API<br/>Apollo Server]
        Resolvers[Resolvers]
        PothosSchema[Pothos Schema<br/>Builders]
        Services[Business Logic<br/>Services]
    end
    
    Prisma -->|Generates| Common
    Common -->|Used by| Frontend
    Common -->|Used by| Backend
    Prisma -->|Client| Backend
    
    Pages --> Components
    Components --> Queries
    Queries --> ClientAPI
    ClientAPI <-->|GraphQL/REST| GraphQL
    
    GraphQL --> Resolvers
    Resolvers --> Services
    PothosSchema --> GraphQL
    
    Services -->|Uses| Prisma
    
    classDef build fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef frontend fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef backend fill:#ce93d8,stroke:#6a1b9a,stroke-width:2px
    
    class Prisma,Common build
    class Pages,Components,Queries,ClientAPI frontend
    class GraphQL,Resolvers,PothosSchema,Services backend
```

**Key Points:**
- **Build Order**: Prisma → Common → Server/Client
- **Type Safety**: End-to-end TypeScript with generated types
- **Request Flow**: Client → Apollo Client → GraphQL API → Resolvers → Services → Prisma
- **GraphQL**: Pothos for type-safe schema building
- **Monorepo**: Shared code via common module

#### 3. Authentication & Security

Shows authentication flows and security mechanisms.

```mermaid
graph TB
    User([User])
    
    subgraph ClientAuth["Client Layer"]
        NextAuth[Auth.js Provider]
        SessionClient[Session Context]
    end
    
    subgraph ServerAuth["Server Layer"]
        Guards[Auth Guards]
        SessionMgr[Session Manager]
        TokenVerify[Token Verification]
        ExtProxy[External Service<br/>Proxy Handler]
    end
    
    subgraph AuthProviders["Authentication Providers"]
        LocalAuth[Local Auth<br/>Email/Password]
        Keycloak[Keycloak SSO<br/>OAuth/OIDC]
        OAuth[OAuth Providers<br/>Google, GitHub, etc.]
    end
    
    subgraph Storage["Session Storage"]
        Redis[(Redis<br/>Session Store)]
        Database[(PostgreSQL<br/>User Data & Roles)]
    end
    
    subgraph ExtServices["External Services<br/>(Role-Protected)"]
        Maps[MapTiles]
        Geocode[Nominatim]
        Wiki[BookStack]
    end
    
    User -->|Login Request| NextAuth
    NextAuth --> SessionClient
    
    NextAuth -->|Authenticate| LocalAuth
    NextAuth -.->|SSO| Keycloak
    NextAuth -.->|OAuth| OAuth
    
    SessionClient -->|API Calls| Guards
    SessionClient -->|/ext/* Requests| ExtProxy
    
    Guards --> TokenVerify
    Guards --> SessionMgr
    ExtProxy --> Guards
    
    ExtProxy -->|Check Role<br/>Then Proxy| Maps
    ExtProxy -->|Check Role<br/>Then Proxy| Geocode
    ExtProxy -->|Check Role<br/>Then Proxy| Wiki
    
    SessionMgr <--> Redis
    TokenVerify <--> Redis
    Guards --> Database
    
    LocalAuth --> Database
    Keycloak --> Database
    SessionMgr --> Database
    
    classDef client fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef server fill:#ce93d8,stroke:#6a1b9a,stroke-width:2px
    classDef providers fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef storage fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef external fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    
    class NextAuth,SessionClient client
    class Guards,SessionMgr,TokenVerify,ExtProxy server
    class LocalAuth,Keycloak,OAuth providers
    class Redis,Database storage
    class Maps,Geocode,Wiki external
```

**Key Points:**
- **Multi-Provider**: Supports local, SSO, and OAuth authentication
- **Session Management**: JWT tokens stored in Redis
- **Role-Based Access**: Guards enforce permissions on all endpoints including `/ext/*`
- **External Service Gateway**: Server proxies requests to Maps/Geocode/Wiki after role validation
- **EXT_*_ROLES Configuration**: Each external service has configurable role requirements
- **SSO Integration**: Optional Keycloak for enterprise environments

#### 4. Data Architecture

Details the data persistence layer and caching strategy.

```mermaid
graph TB
    subgraph Application["Application Services"]
        Server[NestJS Server]
        Services[Background Services]
    end
    
    subgraph Cache["Cache Layer"]
        Redis[(Redis)]
        SessionCache[Session Store]
        PubSub[Pub/Sub<br/>Subscriptions]
        QueryCache[Query Cache]
    end
    
    subgraph Primary["Primary Database"]
        PostgreSQL[(PostgreSQL 16+)]
        PostGIS[PostGIS Extension<br/>Geospatial Data]
        PrismaORM[Prisma ORM<br/>Query Layer]
    end
    
    subgraph Volumes["Persistent Storage"]
        DBData[/Database Files/]
        Uploads[/File Uploads/]
        ClientCache[/Build Cache/]
    end
    
    Server --> SessionCache
    Server --> QueryCache
    Server --> PubSub
    SessionCache --> Redis
    QueryCache --> Redis
    PubSub --> Redis
    
    Server --> PrismaORM
    Services --> PrismaORM
    PrismaORM --> PostgreSQL
    PostgreSQL --> PostGIS
    
    PostgreSQL -.-> DBData
    Server -.-> Uploads
    
    classDef app fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef cache fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef db fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef storage fill:#fafafa,stroke:#424242,stroke-width:2px
    
    class Server,Services app
    class Redis,SessionCache,PubSub,QueryCache cache
    class PostgreSQL,PostGIS,PrismaORM db
    class DBData,Uploads,ClientCache storage
```

**Key Points:**
- **Redis Caching**: Sessions, query results, and real-time pub/sub
- **PostgreSQL + PostGIS**: Relational data with geospatial capabilities
- **Prisma ORM**: Type-safe database queries and migrations
- **Volume Persistence**: Data survives container restarts

#### 5. Geospatial Services (Optional)

Architecture for map and geocoding features with role-based access control.

```mermaid
graph TB
    Client[Next.js Client]
    
    subgraph ServerLayer["NestJS Server Layer"]
        Server[GraphQL/REST API]
        ExtGateway[External Service<br/>Gateway /ext/*]
        RoleCheck[Role Authorization<br/>Middleware]
    end
    
    subgraph MapServices["Internal Map Services"]
        MapTiles[MapTiles Server<br/>OpenStreetMap Tiles]
        Nominatim[Nominatim<br/>Geocoding API]
    end
    
    subgraph MapData["Map Data Storage"]
        Tiles[/MBTiles Files<br/>Vector/Raster Tiles/]
        OSMData[/OSM Data<br/>.pbf Files/]
        NomDB[(Nominatim DB<br/>PostgreSQL)]
    end
    
    subgraph ClientMap["Client Components"]
        MapLibre[MapLibre GL<br/>Map Rendering]
        Geocoder[Address Search<br/>Autocomplete]
    end
    
    Client --> MapLibre
    Client --> Geocoder
    
    MapLibre -->|Request Tiles<br/>/ext/map| ExtGateway
    Geocoder -->|Search Query| Server
    
    ExtGateway --> RoleCheck
    Server -->|Geocode Request<br/>/ext/nom| ExtGateway
    
    RoleCheck -->|Authorized| MapTiles
    RoleCheck -->|Authorized| Nominatim
    
    MapTiles --> Tiles
    Nominatim --> OSMData
    Nominatim --> NomDB
    
    classDef client fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef server fill:#ce93d8,stroke:#6a1b9a,stroke-width:2px
    classDef services fill:#fff8e1,stroke:#f57f17,stroke-width:2px
    classDef data fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    
    class Client,MapLibre,Geocoder client
    class Server,ExtGateway,RoleCheck server
    class MapTiles,Nominatim services
    class Tiles,OSMData,NomDB data
```

**Key Points:**
- **Self-Hosted Maps**: No external API dependencies for tiles
- **Role-Based Gateway**: Server enforces role permissions before proxying to map services
- **Secure Access**: Client requests map tiles via `/ext/map` through the auth gateway
- **Geocoding**: Address search proxied through server with role validation
- **MapLibre GL**: Open-source map rendering library
- **Data Sharing**: Nominatim uses same OSM data as tiles
- **EXT_MAP_ROLES & EXT_NOM_ROLES**: Configurable role requirements per service

#### 6. Infrastructure & Deployment

Docker deployment architecture showing all application containers and services.

```mermaid
graph TB
    subgraph Init["Initialization Containers<br/>(Run Once)"]
        Certs[Certificate Generator<br/>mkcert + Let's Encrypt]
        Migrations[Database Migrations<br/>Prisma]
    end
    
    subgraph Proxy["Traefik Proxy"]
        TLS[TLS Termination]
        Router[Dynamic Routing]
        LetsEncrypt[Let's Encrypt<br/>ACME]
    end
    
    subgraph AppContainers["Application Containers"]
        ClientC[Client<br/>Next.js Frontend<br/>Replicable]
        ServerC[Server - Gateway<br/>NestJS API + Auth<br/>Replicable]
        ServicesC[Server - Background Services<br/>Log Management<br/>INSTANCE_TYPE=*]
        SeedersC[Server - Seeders<br/>Database Seeding<br/>INSTANCE_TYPE=^seed]
    end
    
    subgraph Optional["Optional Containers<br/>(Role-Protected via Server)"]
        MapC[Map Tiles Server<br/>OpenStreetMap]
        NomC[Nominatim Geocoding<br/>Address Lookup]
        WikiC[BookStack Wiki<br/>Documentation]
    end
    
    subgraph Secrets["Secrets Management"]
        SecretFiles[/Docker Secrets<br/>File-based/]
        EnvVars[Environment Variables<br/>Fallback]
    end
    
    subgraph Build["Multi-Stage Build Process"]
        Base[Base Image<br/>Node.js 22]
        PrismaBuild[Prisma Builder]
        CommonBuild[Common Builder]
        AppBuild[App Builder]
        Runner[Production Runner]
    end
    
    Certs -->|Provides Certs| TLS
    Migrations -->|Schema| AppContainers
    
    Router -->|Route: /| ClientC
    Router -->|Route: /graphql<br/>/api, /ext/*| ServerC
    
    ServerC -->|Internal Proxy<br/>After Role Check| MapC
    ServerC -->|Internal Proxy<br/>After Role Check| NomC
    ServerC -->|Internal Proxy<br/>After Role Check| WikiC
    
    SecretFiles -->|Mounted at<br/>/run/secrets/| AppContainers
    EnvVars -.->|Fallback| AppContainers
    
    Base --> PrismaBuild
    PrismaBuild --> CommonBuild
    CommonBuild --> AppBuild
    AppBuild --> Runner
    Runner --> AppContainers
    Runner --> Optional
    
    classDef init fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef proxy fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef containers fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef optional fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    classDef secrets fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef build fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    
    class Certs,Migrations init
    class TLS,Router,LetsEncrypt proxy
    class ClientC,ServerC,ServicesC,SeedersC containers
    class MapC,NomC,WikiC optional
    class SecretFiles,EnvVars secrets
    class Base,PrismaBuild,CommonBuild,AppBuild,Runner build
```

**Key Points:**
- **Four Server-Based Containers**: All use same `server:${TAG}` image with different configurations
  - **Server - Gateway**: Main API server (INSTANCE_TYPE=""), handles GraphQL/REST/Auth, can be replicated
  - **Server - Background Services**: Runs log management and other services (INSTANCE_TYPE=*)
  - **Server - Seeders**: Database seeding only (INSTANCE_TYPE=^seed), restarts on failure (max 3x)
  - **Client**: Next.js frontend, can be replicated for load balancing
- **Horizontal Scaling**: Both Client and Server (Gateway) support deploy.replicas for scaling
- **Automated Init**: Certificates and database migrations run once before application containers start
- **Multi-Stage Builds**: Optimized Docker images with proper dependency order (prisma → common → server/client)
- **Security Gateway**: Server (Gateway) acts as auth gateway for optional services at `/ext/*` routes
- **Route Isolation**: Traefik routes `/ext/*` only to Server, not directly to optional containers
- **Internal Network**: Optional services only accessible via Server's internal proxy after role validation
- **Secrets Management**: File-based secrets with environment variable fallback for flexibility
- **Zero-Downtime Deployments**: Traefik routing enables rolling updates without service interruption
- **Cross-Platform**: Consistent builds on Windows, Mac, and Linux

---

### Architecture Summary

The Skeleton App follows a modern **microservices architecture** with clear separation of concerns:

1. **Edge Layer**: Traefik handles TLS termination and intelligent routing
2. **Application Layer**: Separate Next.js frontend and NestJS backend services
3. **Authentication Layer**: Flexible auth with local, OAuth, and SSO support
4. **Data Layer**: PostgreSQL with PostGIS for geospatial data, Redis for caching
5. **Optional Services**: Self-hosted maps, geocoding, and documentation wiki

**Design Principles:**
- **Type Safety**: End-to-end TypeScript with generated types
- **Security**: TLS encryption, role-based access control, secrets management
- **Scalability**: Stateless services, Redis caching, horizontal scaling ready
- **Modularity**: Optional services can be enabled/disabled via Docker profiles
- **Developer Experience**: Hot reload, automated testing, comprehensive tooling

---

## 🚀 Getting Started

Get up and running with the Skeleton App:

### Quick Start (Docker - Recommended)

1. **Clone the repository**

   ```bash
   git clone https://tanuki.pnnl.gov/amelia.bleeker/skeleton.git
   cd skeleton
   ```

2. **Configure environment**

   ```bash
   # Copy and customize environment files
   cp .env.example .env
   cp .env.secrets.example .env.secrets

   # Edit '.env' and set 'HOSTNAME' to a valid hostname or your IP Address

   # Set secrets (Windows)
   .\secrets.ps1

   # Set secrets (Linux/Mac)
   source ./secrets.sh
   ```

3. **Start the application**

   ```bash
   docker compose up -d
   ```

4. **Access the application**
   - Main app: https://localhost
   - GraphQL Playground: https://localhost/graphql
   - API docs: https://localhost/swagger

### Development Setup

1. **Install prerequisites**

   - Node.js 22.x
   - Yarn 4.x
   - PostgreSQL 16+ with PostGIS 3+

2. **Setup PostgreSQL Database**

   **Install PostgreSQL:**

   **Windows:**

   ```bash
   # Download and install from https://www.postgresql.org/download/windows/
   # Or use Chocolatey
   choco install postgresql
   ```

   **macOS:**

   ```bash
   # Using Homebrew
   brew install postgresql@16 postgis

   # Start PostgreSQL service
   brew services start postgresql@16
   ```

   **Linux (Ubuntu/Debian):**

   ```bash
   # Install PostgreSQL and PostGIS
   sudo apt update
   sudo apt install postgresql-16 postgresql-16-postgis-3 postgresql-contrib

   # Start PostgreSQL service
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

   **Create Development User:**

   ```bash
   # Connect to PostgreSQL as superuser
   sudo -u postgres psql

   # Or on Windows/macOS (if postgres user doesn't exist)
   psql -U postgres
   ```

   **In the PostgreSQL prompt, create the develop user:**

   > Note: The database creation and postgis extension creation is optional and will be performed by the database migration.

   ```sql
   -- Create the develop user with required permissions
   CREATE USER develop WITH PASSWORD 'password';
   ALTER USER develop CREATEDB;
   ALTER USER develop WITH SUPERUSER;

   -- Create the skeleton database
   CREATE DATABASE skeleton OWNER develop;

   -- Connect to the skeleton database and enable PostGIS
   \c skeleton
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- Exit PostgreSQL prompt
   \q
   ```

   **Verify Database Setup:**

   ```bash
   # Test connection with develop user
   psql -U develop -d skeleton -h localhost

   # In PostgreSQL prompt, verify PostGIS installation
   SELECT PostGIS_Version();

   # Exit
   \q
   ```

3. **Build and run**

   ```bash
   # Build all modules
   ./build.sh  # or .\build.ps1 on Windows

   # Start development servers
   cd server && yarn start &
   cd client && yarn start
   ```

4. **Verify installation**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - GraphQL: http://localhost:3001/graphql

### First Steps

1. **Login as a test user** using credentials in [system-user.json](./docker/seed/20211103151730-system-user.json)
2. **Explore the GraphQL API** at `/graphql`
3. **Check the example components** in the client application
4. **Review the authentication flow** with different providers

---

## 📚 API Documentation

### GraphQL API

The application provides a comprehensive GraphQL API with the following features:

- **Endpoint**: `/graphql`
- **Playground**: Available in development mode
- **Schema**: Auto-generated from Pothos schema builders
- **Subscriptions**: Real-time updates via WebSocket
- **Authentication**: JWT tokens and session-based auth

#### Key Queries

```graphql
# Get current logged-in user
query ReadCurrent {
  readCurrent {
    id
    email
    name
    role
    image
    createdAt
    preferences
  }
}

# List users with pagination
query PageUsers($first: Int, $after: String) {
  pageUser(first: $first, after: $after) {
    edges {
      node {
        id
        email
        name
        role
        createdAt
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}

# Read specific user by ID
query ReadUser($where: UserUniqueFilter!) {
  readUser(where: $where) {
    id
    email
    name
    role
    image
    emailVerified
    createdAt
    updatedAt
  }
}

# List comments with user information
query ReadComments($paging: PagingInput, $orderBy: [CommentOrderBy!]) {
  readComments(paging: $paging, orderBy: $orderBy) {
    id
    message
    createdAt
    user {
      id
      name
      email
    }
  }
}

# Get feedback with files and assignee
query ReadFeedbacks($where: FeedbackFilter) {
  readFeedbacks(where: $where) {
    id
    message
    status
    createdAt
    user {
      id
      name
      email
    }
    assignee {
      id
      name
      email
    }
    files {
      id
      objectKey
      mimeType
      contentLength
    }
  }
}

# Search geographies by area
query AreaGeographies($area: GeographyGeoJson!) {
  areaGeographies(area: $area) {
    id
    name
    type
    group
    geojson
  }
}
```

#### Key Mutations

```graphql
# Create a new user
mutation CreateUser($create: UserCreateInput!) {
  createUser(create: $create) {
    id
    email
    name
    role
    createdAt
  }
}

# Update current user profile
mutation UpdateCurrent($update: CurrentUpdateInput!) {
  updateCurrent(update: $update) {
    id
    email
    name
    image
    preferences
  }
}

# Create a comment
mutation CreateComment($create: CommentCreateInput!) {
  createComment(create: $create) {
    id
    message
    createdAt
    user {
      id
      name
    }
  }
}

# Create feedback
mutation CreateFeedback($create: FeedbackCreateInput) {
  createFeedback(create: $create) {
    id
    message
    status
    createdAt
    user {
      id
      name
      email
    }
  }
}

# Update feedback status
mutation UpdateFeedback($where: FeedbackUniqueFilter!, $update: FeedbackUpdateInput!) {
  updateFeedback(where: $where, update: $update) {
    id
    message
    status
    updatedAt
    assignee {
      id
      name
      email
    }
  }
}

# Create a banner
mutation CreateBanner($create: BannerCreateInput!) {
  createBanner(create: $create) {
    id
    message
    expiration
    createdAt
  }
}
```

#### Subscriptions

```graphql
# Real-time user updates
subscription ReadCurrentSubscription {
  readCurrent {
    id
    email
    name
    role
    updatedAt
  }
}

# Real-time comments updates
subscription ReadCommentsSubscription {
  readComments {
    id
    message
    createdAt
    user {
      id
      name
    }
  }
}

# Real-time feedback updates
subscription ReadFeedbacksSubscription($where: FeedbackFilter) {
  readFeedbacks(where: $where) {
    id
    message
    status
    updatedAt
    user {
      id
      name
    }
    assignee {
      id
      name
    }
  }
}

# Real-time banner updates
subscription ReadBannersSubscription {
  readBanners {
    id
    message
    expiration
    createdAt
  }
}

# Real-time log monitoring
subscription ReadLogsSubscription($where: LogFilter) {
  readLogs(where: $where) {
    id
    message
    type
    createdAt
  }
}
```

#### Example Variables

```json
{
  "create": {
    "email": "user@example.com",
    "name": "John Doe",
    "password": "securePassword123",
    "role": "user"
  },
  "where": {
    "id": "clx1234567890abcdef"
  },
  "update": {
    "name": "Jane Doe",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  },
  "paging": {
    "skip": 0,
    "take": 10
  },
  "orderBy": [
    {
      "createdAt": "Desc"
    }
  ]
}
```

### REST API

Limited REST endpoints are available for specific use cases:

- **Authentication**: `/api/auth/*`
- **File uploads**: `/api/file/*`

### Authentication

The application supports multiple authentication methods:

#### Auth.js (Primary)

- **Local authentication**: Email/password
- **OAuth providers**: Configurable (Google, GitHub, etc.)
- **Session management**: JWT with database tracking

#### Keycloak SSO

- **Enterprise SSO**: OIDC/SAML integration
- **Role mapping**: Automatic role assignment
- **Multi-tenant**: Support for multiple realms

#### Bearer Tokens

- **API access**: JWT tokens for service-to-service
- **Scoped access**: Role-based permissions

---

## 🔒 Security

### Authentication & Authorization

- **Multi-factor authentication**: Configurable via Keycloak
- **Role-based access control**: Granular permissions system
- **Session management**: Secure session handling with Redis
- **Password policies**: Configurable strength requirements

### Security Headers

The application implements security best practices:

- **HTTPS enforcement**: TLS 1.2+ required
- **CORS protection**: Configurable origins
- **CSP headers**: Content Security Policy
- **Rate limiting**: API endpoint protection

### Data Protection

- **Encryption at rest**: Database encryption support
- **Encryption in transit**: TLS for all communications
- **Secrets management**: Environment-based configuration
- **Audit logging**: Comprehensive activity tracking

---

### Debugging

#### Enable Debug Logging

```bash
# Server debugging
LOG_CONSOLE_LEVEL=debug
LOG_DATABASE_LEVEL=debug

# Client debugging
NEXT_PUBLIC_DEBUG=true
```

#### Database Query Logging

```bash
# Enable Prisma query logging
LOG_PRISMA_LEVEL=info
```

---

## 📈 Performance

### Optimization Guidelines

#### Database

- **Connection pooling**: Configured via Prisma
- **Query optimization**: Use database indexes

#### Frontend

- **Code splitting**: Automatic with Next.js
- **Image optimization**: Built-in Next.js features
- **Static generation**: ISR for dynamic content

#### Backend

- **GraphQL caching**: Apollo Server cache
- **Database queries**: Efficient Prisma queries

### Monitoring

#### Health Checks

- **Application**: `/api/health`
- **Database**: Connection monitoring
- **Redis**: Cache availability

#### Metrics

- **Response times**: Built-in logging
- **Error rates**: Comprehensive error tracking
- **Resource usage**: Container monitoring

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

Default configuration for docker compose can be found at [.env](./.env). Sensitive values should be stored in [.env.secrets](./.env.secrets) file. There are default users with temporary passwords defined for local authentication in the [docker/seed/20211103151730-system-user.json](./docker/seed/20211103151730-system-user.json) file.

#### Docker Secrets Management

The application supports **Docker secrets** for secure handling of sensitive information in production deployments. This approach provides enhanced security compared to environment variables.

**How It Works:**

1. Secrets are defined in `.env.secrets` file (never commit this file!)
2. Run the secrets script to generate individual secret files in `docker/secrets/`
3. Docker Compose automatically mounts these secrets to containers at `/run/secrets/`
4. Applications read from secrets first, then fall back to environment variables
5. Third-party containers (PostgreSQL, Redis, etc.) use native secret file support

**Generate Secret Files:**

```bash
# Windows
.\secrets.ps1

# Linux/Mac
./secrets.sh
```

This generates:
1. Individual secret files in `docker/secrets/` (e.g., `database_password.txt`)
2. A `.env.secrets.docker` file with `_FILE` environment variable definitions

**Deploy with Secrets:**

```bash
# Use the generated .env.secrets.docker file
docker compose --env-file docker/.env.secrets.docker up -d
```

**Supported Secrets:**

- `SESSION_SECRET` - Server session management
- `JWT_SECRET` - JWT token signing
- `DATABASE_PASSWORD` - Main PostgreSQL database
- `REDIS_PASSWORD` - Redis authentication
- `KEYCLOAK_CLIENT_SECRET` - OAuth client secret
- `KEYCLOAK_ADMIN_PASSWORD` - Admin interface password
- `KEYCLOAK_DATABASE_PASSWORD` - Keycloak's database
- `NOMINATIM_DATABASE_PASSWORD` - Nominatim's database
- `BOOKSTACK_ROOT_PASSWORD` - Wiki database root
- `BOOKSTACK_DATABASE_PASSWORD` - Wiki database user
- `BOOKSTACK_KEYCLOAK_CLIENT_SECRET` - Wiki OAuth client

**Fallback Behavior:**

The system provides flexible secret management through conditional environment variables:

**Without Secrets (Backward Compatible):**
- Don't run `secrets.sh` / `secrets.ps1`
- Start containers normally: `docker compose up -d`
- Database containers read passwords from `.env` files (e.g., `POSTGRES_PASSWORD`)
- Everything works as before - no changes needed

**With Secrets (Enhanced Security):**
- Run `secrets.sh` / `secrets.ps1` to generate secret files
- Start containers with: `docker compose --env-file docker/.env.secrets.docker up -d`
- The `.env.secrets.docker` file sets `_FILE` variables (e.g., `POSTGRES_PASSWORD_FILE`)
- Database containers read passwords from `/run/secrets/` instead
- Plain password variables are ignored when `_FILE` is set

This provides flexibility for different deployment scenarios:
- **Development**: Use environment variables directly (simpler setup, no secrets script needed)
- **Production**: Use Docker secrets (enhanced security, run secrets script)
- **CI/CD**: Choose based on your platform's secret management capabilities

**Security Benefits:**

- ✅ Secrets never appear in container environment variables
- ✅ Secrets are not visible in `docker inspect` output
- ✅ File-based secrets can have restricted permissions (chmod 600)
- ✅ Easier secret rotation without container rebuilds
- ✅ Compatible with Docker Swarm and Kubernetes secrets

**Example Configuration:**

```yaml
# docker-compose.yml snippet
secrets:
  database_password:
    file: ./docker/secrets/database_password.txt

services:
  database:
    secrets:
      - database_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/database_password
```

See [.env.secrets.example](./.env.secrets.example) for detailed documentation and all available secrets.

The file [docker-compose.yml](./docker-compose.yml) or [docker/docker-compose.yml](./docker/docker-compose.yml) may need to be edited for some deployments. The docker compose definition contains a few optional containers that can be enabled by adding profiles. Proxy (`proxy`) is a Traefik proxy that can serve locally signed or valid internet certificates provided by Let's Encrypt. Open Street Map (`map`) is map file service that can be configured to provide Open Street Map tiles. Nominatim (`nom`) is an address lookup and auto-complete service that is configured to utilize the same data and area as the optional map container.

### TLS (SSL/HTTPS)

TLS is provided by mkcert certificates and Let's Encrypt. The init container will generate a new certificate authority (CA) and certificates when first started or when any of them are missing. The CA will need to be added to web browsers or system for the locally signed certificates to be valid. TLS can also be provided by Let's Encrypt [https://letsencrypt.org/](https://letsencrypt.org/) for publicly facing websites that have a valid domain name. Alternatively, a certificate can be provided by a third party. The proxy configuration [file](./docker/proxy/certs-traefik.yml) will need to be edited to point to the provided certificates.

### Docker Compose

A Docker compose file is included to manage the docker instances. The docker compose file will work in Windows, Mac, and Linux. By default the web application will be available at [https://localhost](https://localhost). The following commands can be used to manage all of the docker containers.

#### Multi-Stage Build Architecture

The Docker setup uses a **multi-stage build approach** that eliminates the need for shared service dependencies. Each service (client and server) builds its own copy of the prisma and common libraries, ensuring:

- ✅ **Cross-platform compatibility** across Windows, Mac, and Linux
- ✅ **Reliable builds** without complex service dependencies
- ✅ **Proper dependency order** (prisma → common → server/client)
- ✅ **Better caching** and faster rebuilds
- ✅ **Simplified deployment** without additional contexts

#### Build Commands

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

#### Build Process

Each service follows this multi-stage build pattern:

1. **Base Stage**: Sets up Node.js environment and proxy configuration
2. **Prisma Builder**: Builds the Prisma library with database client generation
3. **Common Builder**: Builds the common library using the Prisma output
4. **Application Builder**: Builds the main application (client/server) with all dependencies
5. **Runner Stage**: Creates the final production image with only necessary artifacts

This approach ensures consistent builds across all platforms while maintaining the proper dependency hierarchy required by the monorepo structure.

### Setup Keycloak

Keycloak is automatically configured for use when using the Docker Compose deployment. The below steps outline the base steps that were used to configure the default configuration.

> <b>Note: </b> At the minimum a new client secret for the default realm will need to be regerated for production deployments.

Follow the steps below to setup Keycloak which will allow users to register and manage their own accounts.
Registered users will still need to be granted access to the application by an administrator.

1. You will need to set a domain name or IP address as the "HOSTNAME" in the [.env](./.env) file. You can optionally set the "KEYCLOAK_DEFAULT_ROLE" to automatically assign a role to newly registered accounts. This change is not retroactive.
2. Navigate to the Keycloak admin page (replacing `localhost` with the previously set variable): [https://localhost/auth/sso/admin/master/console](https://localhost/auth/sso/admin/master/console)
3. Sign in using the username and password specified in the [.env](./.env) file as "KEYCLOAK_ADMIN" and "KEYCLOAK_ADMIN_PASSWORD".
4. Click the "Keycloak" drop down to create a new realm.
   ![](docs/setup-keycloak_01.PNG)
5. Set the "Realm name" to `default` and click "Create".
   ![](docs/setup-keycloak_02.PNG)
6. Navigate to "Realm settings" -> "Login" and configure as desired.
   ![](docs/setup-keycloak_03.PNG)
7. Navigate to "Clients" and click "Create client".
   ![](docs/setup-keycloak_04.PNG)
8. Set the "Client ID" to `app`, optionally set the "Client Name", and click "Next".
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

> <b>Note: </b> Keycloak doesn't pass roles to the client application by default. The client role scope will need to be added to the ID token. This can be done at `Client scopes -> Mappers -> client roles`. The realm groups and associated client roles will also need to be manually assigned to the user in the Keycloak admin interface. [https://www.keycloak.org/docs](https://www.keycloak.org/docs/latest/server_admin/#assigning-permissions-using-roles-and-groups)

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

#### `.gitlab-ci.yml`

GitLab CI/CD pipeline configuration template for automated building, testing, and publishing.

**Features:**

- **Build Stage**: Compiles all monorepo modules using the build script
- **Test Stage**: Runs code analysis, linting, and tests with coverage reporting
- **Publish Stage**: Builds and pushes Docker images for init, server, and client components
- **Services**: Configured with PostgreSQL + PostGIS for database testing
- **Artifacts**: Generates Cobertura coverage reports for GitLab integration

**Configuration:**

- Update `BASE_DIR` variable to match your project structure
- Modify `TAG_VERSION` strategy as needed for your versioning scheme
- Configure registry credentials for Docker image publishing
- Adjust PostgreSQL connection settings if needed

**Usage:**
Copy to your project root and customize variables for your GitLab repository.

#### `build.[ps1|sh]`

Cross-platform build scripts that compile all monorepo modules in the correct dependency order: Prisma → Common → Server → Client.

**Features:**

- **Clean Build**: Removes `node_modules` and build artifacts before building
- **Dependency Management**: Installs/updates yarn dependencies for each module
- **Migration Support**: Automatically applies Prisma database migrations
- **Error Handling**: Stops on first failure with detailed error reporting
- **Colored Output**: Visual feedback for build progress and status

**Usage:**

```bash
# Windows
.\build.ps1 [-c|--clean-build] [-d|--skip-dependencies] [-m|--skip-migrations] [-h|--help]

# Linux/Mac
./build.sh [-c|--clean-build] [-d|--skip-dependencies] [-m|--skip-migrations] [-h|--help]
```

**Environment Variables:**

- `CLEAN_BUILD=true` - Remove node_modules before building
- `SKIP_DEPENDENCIES=true` - Skip yarn install steps
- `SKIP_MIGRATIONS=true` - Skip Prisma migration deployment

**Build Process:**

1. **Prisma**: Builds schema, generates client, applies migrations
2. **Common**: Builds shared utilities and types
3. **Server**: Builds NestJS backend application
4. **Client**: Builds Next.js frontend application

#### `test.[ps1|sh]`

Cross-platform testing scripts that perform comprehensive code analysis and testing for all modules.

**Features:**

- **Code Quality**: ESLint linting for all modules
- **Type Safety**: TypeScript type checking
- **Test Coverage**: Jest testing with coverage reports (Cobertura format)
- **Memory Optimization**: Configures Node.js with 8GB heap for large projects
- **Selective Testing**: Option to skip coverage for faster test runs

**Usage:**

```bash
# Windows
.\test.ps1 [-c|--skip-coverage] [-h|--help]

# Linux/Mac
./test.sh [-c|--skip-coverage] [-h|--help]
```

**Environment Variables:**

- `SKIP_COVERAGE=true` - Run tests without coverage reporting
- `NODE_OPTIONS` - Automatically set to `--max-old-space-size=8192`

**Testing Process:**
For each module (Prisma, Common, Server, Client):

1. **Lint**: `yarn lint` - ESLint code quality checks
2. **Type Check**: `yarn check` - TypeScript compilation verification
3. **Test**: `yarn test:cov` - Jest tests with coverage (or `yarn test` if coverage skipped)

#### `env.sh`

Environment variable loader for CI/CD environments, compatible with Linux, FreeBSD, and macOS.

**Purpose:**

- Loads environment variables from a specified file (default: `.env`)
- Filters out comments (lines starting with `#`)
- Exports variables to the current shell session

**Usage:**

```bash
# Load from .env (default)
source ./env.sh

# Load from custom file
source ./env.sh .env.production
```

**Platform Compatibility:**

- **Linux**: Uses `xargs -d '\n'` for newline delimiter
- **FreeBSD/Darwin**: Uses `xargs -0` for null delimiter

#### `secrets.[ps1|sh]`

Secret management scripts for handling sensitive environment variables separately from main configuration.

**PowerShell Version (`secrets.ps1`):**

- **Set Mode**: Reads `.env.secrets` and sets user environment variables permanently
- **Clear Mode**: Removes previously set environment variables
- **Persistent**: Variables survive system restarts

**Usage:**

```powershell
# Set secrets as user environment variables
.\secrets.ps1

# Clear/unset all secret environment variables
.\secrets.ps1 clear
```

**Shell Version (`secrets.sh`):**

- **Session Export**: Loads secrets into current shell session
- **Temporary**: Variables only available in current session
- **Platform Compatible**: Works on Linux, FreeBSD, and macOS

**Usage:**

```bash
# Export secrets to current session
source ./secrets.sh
```

**File Format (`.env.secrets`):**

```bash
DATABASE_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
API_KEY=your_api_key
# Comments are ignored
```

#### `update-user-role.[ps1|sh]`

Database user role management scripts for updating or removing user roles directly in the PostgreSQL database through Docker containers.

**Features:**

- **Role Management**: Update or remove user roles by email address
- **Input Processing**: Automatically trims whitespace and converts roles to lowercase
- **Email Validation**: Basic email format validation before database operations
- **Docker Integration**: Connects to database container using project environment variables
- **Error Handling**: Comprehensive error checking with colored output messages
- **Empty Role Support**: Empty roles remove/clear the user's role assignment
- **Container Detection**: Verifies database container is running before attempting connection

**Usage:**

```bash
# Windows
.\update-user-role.ps1 <email> <role>
.\update-user-role.ps1 [-h|--help]

# Linux/Mac
./update-user-role.sh <email> <role>
./update-user-role.sh [-h|--help]
```

**Examples:**

```bash
# Assign admin role
.\update-user-role.ps1 user@example.com admin
./update-user-role.sh user@example.com admin

# Assign role with spaces
.\update-user-role.ps1 user@example.com "project manager"
./update-user-role.sh user@example.com "project manager"

# Remove user's role (empty string)
.\update-user-role.ps1 user@example.com ""
./update-user-role.sh user@example.com " "  # Space gets trimmed to empty
```

**Environment Variables:**

- `COMPOSE_PROJECT_NAME` - Docker Compose project name (default: skeleton)
- `DATABASE_NAME` - PostgreSQL database name (default: skeleton)
- `DATABASE_USERNAME` - PostgreSQL username (default: postgres)

**Prerequisites:**

- Database container must be running (`docker compose up -d database`)
- User must exist in the database (scripts only update existing users)
- Docker must be installed and accessible from command line

**Security:**

- Uses parameterized queries to prevent SQL injection
- Validates email format before database operations
- Provides clear feedback on operation success/failure
- Logs number of affected rows for verification

## Development

### Node.js

Typically, installing Node.js will require you to first install Node Version Manager (NVM). Instructions for Mac and Linux can be found on the Node.js website [https://nodejs.org/en/download](https://nodejs.org/en/download). The NVM version for Windows can be downloaded here [https://github.com/coreybutler/nvm-windows/releases](https://github.com/coreybutler/nvm-windows/releases). Once you have installed NVM and restarted your console, run the following command to install the correct version of Node.js.

```bash
nvm install 22
```

### Project Structure

The project is structured into the following directories:

- [client](./client/README.md): The client application is a Next.js application that is used to display the user interface.
- [common](./common/README.md): The common directory contains shared code between the client and server applications.
- [docker](./docker/README.md): The docker directory contains the docker compose files and configuration files for the production deployed application.
- [prisma](./prisma/README.md): The Prisma directory contains the database schema and migration files.
- [server](./server/README.md): The server application is a Nest.js application that is used to handle the backend logic, API requests, and run services.

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

To create a new database migration after modifying the Prisma schema:

```bash
yarn migrate:create
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

### Local Development with Docker Backend

Run the Next.js client locally with hot reload while connecting to Docker backend services (database, Redis, GraphQL API). Enables session sharing and Keycloak authentication between local and Docker environments.

#### Step 1: Configure Hostname

**⚠️ IMPORTANT: Complete this step BEFORE starting Docker containers!**

For session sharing and Keycloak authentication to work, you **cannot use `localhost`**. Configure a proper hostname first:

**Option 1: Use Your Machine's IP Address**

```bash
# Find your machine's IP address
# Windows: ipconfig
# Linux/Mac: ifconfig or ip addr

# Edit .env and set:
HOSTNAME=192.168.1.100  # Replace with your actual IP address
```

**Option 2: Use Hosts File Mapping** (Recommended)

```bash
# Add to your hosts file:
# Windows: C:\Windows\System32\drivers\etc\hosts
# Linux/Mac: /etc/hosts

192.168.1.100  myapp.local  # Replace IP with your machine's IP

# Edit .env and set:
HOSTNAME=myapp.local
```

**Why hostname configuration is critical:**
- Session cookies require matching domains between local and Docker clients
- Keycloak OAuth redirects require consistent hostname resolution
- Using `localhost` will cause authentication failures and prevent session sharing

#### Step 2: Start or Restart Docker Services

**If this is your first time starting services:**

```bash
docker compose up -d
```

**If you changed the HOSTNAME after containers were already running:**

You must regenerate certificates to include the new hostname. Use the reset script:

```bash
# Windows
.\reset-service.ps1 certs

# Linux/Mac
./reset-service.sh certs
```

This script will:
- Stop all containers
- Remove certificate volumes
- Regenerate certificates with the new hostname
- Restart all services

**Verify services are running:**

```bash
docker ps
```

You should see containers like `skeleton-proxy`, `skeleton-server`, `skeleton-database`, etc.

#### Step 3: Create Client Environment File

Create `client/.env.local` with the following configuration:

```bash
# Backend services (Docker) - replace ${HOSTNAME} with your actual configured hostname
DATABASE_HOST=myapp.local
DATABASE_PORT=6543
REDIS_HOST=myapp.local
REDIS_PORT=6379

# Backend API rewrites - replace ${HOSTNAME} with your actual configured hostname
REWRITE_AUTHJS_URL=https://myapp.local/authjs
REWRITE_GRAPHQL_URL=https://myapp.local/graphql
REWRITE_API_URL=https://myapp.local/api
REWRITE_EXT_URL=https://myapp.local/ext

# Certificate handling (automatically configured by yarn dev)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Important:** Replace `myapp.local` with your actual configured hostname (your IP address or custom hostname).

#### Step 4: Start Local Development Client

```bash
cd client
yarn dev
```

This command will:
- Automatically copy TLS certificates from Docker's `skeleton-proxy` container
- Start the HTTPS development server on port 3000
- Configure backend service connections
- Enable session sharing with Docker client

**Access your local client:**

```
https://myapp.local:3000
```

Replace `myapp.local` with your configured hostname.

#### Development Workflow

1. **Start Docker services** (once per session):
   ```bash
   docker compose up -d
   ```

2. **Start local dev client**:
   ```bash
   cd client
   yarn dev
   ```

3. **Make code changes** - Hot reload works automatically

4. **Test in both environments** - Use same login session:
   - Local dev: `https://myapp.local:3000`
   - Docker prod: `https://myapp.local`

5. **Stop local client** when done:
   ```
   CTRL-C
   ```

#### Troubleshooting

**Certificates Not Copying**

**Error**: `Docker container 'skeleton-proxy' is not running`

**Solution**: Ensure Docker services are running:
```bash
docker compose up -d
```

**Session Not Shared / Keycloak Login Fails**

**Cause**: Hostname mismatch or `localhost` being used

**Solution**:
1. Verify `.env` file has correct HOSTNAME (not `localhost`)
2. If you changed HOSTNAME, regenerate certificates using `reset-service` script
3. Ensure `client/.env.local` uses the same hostname
4. Access local client using configured hostname, not `localhost`

**Certificate Errors (ERR_TLS_CERT_ALTNAME_INVALID)**

**Cause**: Certificates don't include your hostname

**Solution**: Regenerate certificates with correct hostname:

```bash
# Windows
.\reset-service.ps1 certs

# Linux/Mac
./reset-service.sh certs
```

**Port Already in Use (port 3000)**

**Solution**: Use a different port:
```bash
# Windows
$env:PORT="3001"; yarn dev

# Linux/Mac
PORT=3001 yarn dev
```

#### Additional Notes

- Certificates are valid for 1 year (regenerate if expired using reset-service script)
- `.env.local` overrides `.env` for local development only
- Stop Docker services when not needed to free system resources

### Configuration

The primary production configuration file is [.env](./.env). These values get passed down to the individual production containers. The values must be assigned using their respective container environment file. The individual container environment files are located in the [docker](./docker/) directory.

> Note: Any ports listed in the environment file will be exposed in the host machine. These ports should only be specified in a production deployment if needed. The application itself will be available at [https://localhost](https://localhost) or the specified domain name.

> Note: For production deployments secrets and passwords should not be stored in the `.env` file. One option is to use the [.env.secrets](./.env.secrets) file. The secrets file will need to be set as system environment variables by either using the provided scripts ([secrets.ps1](./secrets.ps1) or [secrets.sh](./secrets.sh)).

- The primary default configuration file for the server and services container is located at [./server/.env](./server/.env).
- The primary default configuration file for the client container is located at [./client/.env](./client/.env).
- Override configuration files for the individual containers are located in the directory [./docker](./docker/).

#### Service Instance Configuration

The `INSTANCE_TYPE` environment variable controls which background services run in each container. This provides flexible deployment configurations for different environments and use cases.

**Basic Syntax:**
```bash
# Enable specific services
INSTANCE_TYPE=my-service,seed

# Enable all services
INSTANCE_TYPE=*

# Enable all services except specific ones
INSTANCE_TYPE=*,!log

# Run only one service then shutdown (useful for seeding)
INSTANCE_TYPE=^seed
```

**Service Types:**
- `seed` - Database seeding service
- `log` - Log management and pruning service

**Configuration Examples:**

```bash
# Production server (no background services)
INSTANCE_TYPE=""

# Development with all services
INSTANCE_TYPE=*

# Seeding container (runs seed then exits)
INSTANCE_TYPE=^seed

# Custom service mix
INSTANCE_TYPE=log
```

**Rules and Restrictions:**
- Only one shutdown service (`^service`) can be specified
- Shutdown services cannot be combined with enabled services
- Service names are case-insensitive and whitespace is ignored
- Invalid combinations will cause startup errors

#### External Routes

The application can be configured to restrict access to other internally hosted applications. These applications will be available at `<hostname>/ext/<application>`. They are configured using the following environment variables with a unique `<APPLICATION>` identifier.

- EXT\_`<APPLICATION>`\_PATH: The relative path that the application can be access at. This path must begin with `/ext/`.
- EXT\_`<APPLICATION>`\_ROLES: Comma separated list of roles that are allowed to access the application. Can also be set to `any` for unrestricted access.
- EXT\_`<APPLICATION>`\_AUTHORIZED: The internal URL to rewrite requests to when a user is authorized to access this resource.
- EXT\_`<APPLICATION>`\_UNAUTHORIZED: The external URL to rewrite requests to when a user is unauthorized to access this resource.

## Contributing

We welcome contributions to the Skeleton App! This section outlines the process for contributing to the project.

### Development Workflow

1. **Fork the repository** (if external contributor)
2. **Create a feature branch** from `develop`
3. **Make your changes** following our coding standards
4. **Test your changes** thoroughly
5. **Submit a pull request** with a clear description

### Coding Standards

#### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration rules
- Maintain 80%+ test coverage
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

#### Database Changes

- Create Prisma migrations for schema changes
- Test migrations on sample data
- Document breaking changes in PR description

#### GraphQL Schema

- Use Pothos schema builders
- Maintain backward compatibility when possible
- Update documentation for schema changes

### Testing Requirements

All contributions must include appropriate tests:

```bash
# Run all tests
./test.sh

# Run specific module tests
cd server && yarn test
cd client && yarn test
```

### Code Review Process

1. **Automated checks** must pass (linting, tests, build)
2. **Peer review** by at least one maintainer
3. **Security review** for authentication/authorization changes
4. **Performance review** for database or API changes

### Reporting Issues

When reporting bugs or requesting features:

1. **Search existing issues** first
2. **Use issue templates** when available
3. **Provide reproduction steps** for bugs
4. **Include environment details** (OS, Node.js version, etc.)

### Security Issues

For security vulnerabilities:

- **Do not** create public issues
- Email security concerns to: [amelia.bleeker@pnnl.gov](mailto:amelia.bleeker@pnnl.gov)
- Include detailed reproduction steps
- Allow time for assessment and patching

---

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
  1. Increment the version number from `2.0.4` using [Semantic Versioning](https://semver.org/) or your project's preferred method.
     1. In VSCode go to the `Search (Ctrl+Shift+F)` tab.
     2. Enter `2.0.4` in the `Search` field.
     3. Enter your incremented version number in the `Replace` field.
     4. Press the `...` to `Expand Search Details` and enter `.env*,*.yml,*.json,*.md` in the `files to include` field.
     5. Replace all of the relevant entries.
  2. Create a new release branch from the `develop` branch using the updated release version.
  ```bash
  git checkout -b release/2.0.4 develop
  ```
  3. Make changes to the release branch.
  ```bash
  git add .
  git commit -m "Updated release version numbers."
  ```
  4. Merge the release branch into the `main` and `develop` branches.
  ```bash
  git checkout main
  git merge release/2.0.4
  git tag -a 2.0.4 -m "Tagged for new version release."
  git push origin --tags
  git push origin main
  git checkout develop
  git merge release/2.0.4
  git branch -d release/2.0.4
  git push origin develop
  ```

## License

This project is developed by Pacific Northwest National Laboratory (PNNL) and is operated by Battelle for the United States Department of Energy under Contract DE-AC05-76RL01830.

### Copyright Notice

```
**************************************************************************************************************************
This computer software was prepared by Battelle Memorial Institute, hereinafter the Contractor, under Contract No.
DE-AC05-76RL01830 with the Department of Energy (DOE). All rights in the computer software are reserved by
DOE on behalf of the United States Government and the Contractor as provided in the Contract. You are authorized
to use this computer software for Governmental purposes but it is not to be released or distributed to the public.

This material was prepared as an account of work sponsored by an agency of the United States Government. Neither
the United States Government nor the United States Department of Energy, nor the Contractor, nor any of their
employees, nor any jurisdiction or organization that has cooperated in the development of these materials, makes
any warranty, express or implied, or assumes any legal liability or responsibility for the accuracy, completeness,
or usefulness of any information, apparatus, product, software, or process disclosed, or represents that its use
would not infringe privately owned rights.

                                     PACIFIC NORTHWEST NATIONAL LABORATORY
                                                  operated by
                                                   BATTELLE
                                                    for the
                                       UNITED STATES DEPARTMENT OF ENERGY
                                        under Contract DE-AC05-76RL01830
**************************************************************************************************************************
```

### Usage Rights

- **Governmental Use**: Authorized for use by government agencies and contractors
- **Internal Development**: Permitted for PNNL internal projects and research
- **Educational Use**: Allowed for academic and research purposes within authorized institutions
- **Commercial Use**: Requires explicit permission and licensing agreements

### Restrictions

- **Public Distribution**: Not authorized for public release or distribution
- **Third-party Sharing**: Requires prior approval from PNNL and DOE
- **Modification**: Changes must be documented and approved through proper channels
- **Export Control**: Subject to U.S. export control regulations

### Contact Information

For licensing inquiries, permissions, or questions about usage rights:

- **Technical Contact**: [Amelia Bleeker](mailto:amelia.bleeker@pnnl.gov)
- **Legal/Licensing**: PNNL Technology Transfer Office
- **Repository**: [https://tanuki.pnnl.gov/amelia.bleeker/skeleton](https://tanuki.pnnl.gov/amelia.bleeker/skeleton)

### Third-party Dependencies

This project includes various open-source dependencies with their own licenses. See individual package.json files and node_modules directories for complete license information. Key dependencies include:

- **Next.js**: MIT License
- **NestJS**: MIT License
- **Prisma**: Apache 2.0 License
- **Apollo GraphQL**: MIT License
- **PostgreSQL**: PostgreSQL License
- **Docker**: Apache 2.0 License

All third-party dependencies are used in compliance with their respective licenses and terms of use.

---

<p align="center">
  <strong>Developed by Pacific Northwest National Laboratory</strong><br>
  <em>Operated by Battelle for the U.S. Department of Energy</em>
</p>
