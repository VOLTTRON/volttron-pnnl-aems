# Server Backend Application

<p align="center">
  <strong>NestJS backend application for the Skeleton App</strong>
</p>

<p align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://img.shields.io/badge/NestJS-11.0.1-E0234E?logo=nestjs" alt="NestJS Version" />
  </a>
  <a href="https://www.apollographql.com/docs/apollo-server/" target="_blank">
    <img src="https://img.shields.io/badge/Apollo_Server-4.11.3-311C87?logo=apollo-graphql" alt="Apollo Server Version" />
  </a>
  <a href="https://pothos-graphql.dev/" target="_blank">
    <img src="https://img.shields.io/badge/Pothos-4.3.0-FF6B6B?logo=graphql" alt="Pothos Version" />
  </a>
  <a href="https://www.typescriptlang.org/" target="_blank">
    <img src="https://img.shields.io/badge/TypeScript-5.7.3-3178C6?logo=typescript" alt="TypeScript Version" />
  </a>
  <a href="https://redis.io/" target="_blank">
    <img src="https://img.shields.io/badge/Redis-5.6.0-DC382D?logo=redis" alt="Redis Version" />
  </a>
  <a href="https://nodejs.org/dist/latest-v22.x/" target="_blank">
    <img src="https://img.shields.io/badge/node-22.x-green.svg?logo=node.js" alt="Node.js Version" />
  </a>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Core Technologies](#core-technologies)
  - [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Core Architecture](#core-architecture)
  - [Application Bootstrap](#application-bootstrap-srcmaints)
  - [Application Module](#application-module-srcappmodulets)
- [Configuration System](#configuration-system)
  - [Configuration Service](#configuration-service-srcappconfigts)
  - [Environment Variables](#environment-variables)
- [Authentication System](#authentication-system)
  - [Multi-Provider Architecture](#multi-provider-architecture)
  - [Role-Based Access Control](#role-based-access-control)
- [GraphQL API](#graphql-api)
  - [Pothos Schema Builder](#pothos-schema-builder)
  - [Real-time Subscriptions](#real-time-subscriptions)
- [Logging System](#logging-system)
  - [Application Logger Service](#application-logger-service-srcloggingloggingservicets)
  - [HTTP Request Logging](#http-request-logging)
  - [Database Logging](#database-logging)
- [Background Services](#background-services)
  - [Database Seeding Service](#database-seeding-service-srcservicesseedseedservicets)
  - [Log Management Service](#log-management-service-srcservicesloglogservicets)
- [Utility Functions](#utility-functions)
  - [Streaming JSON Reader](#streaming-json-reader-srcutilsjsonts)
- [File Management](#file-management)
  - [File Controller](#file-controller-srcapifilecontrollerts)
- [External Application Routing](#external-application-routing)
  - [External Route Middleware](#external-route-middleware-srcextextmiddlewarets)
  - [External Application Configuration](#external-application-configuration)
- [Development Workflow](#development-workflow)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Development Scripts](#development-scripts)
  - [Environment Configuration](#environment-configuration)
- [Testing](#testing)
  - [Test Structure](#test-structure)
  - [Integration Testing](#integration-testing)
  - [Test Configuration](#test-configuration-jestconfigjs)
- [Performance Optimization](#performance-optimization)
  - [Database Optimization](#database-optimization)
  - [GraphQL Optimization](#graphql-optimization)
  - [Caching Strategy](#caching-strategy)
- [Security](#security)
  - [Authentication Security](#authentication-security)
  - [Rate Limiting](#rate-limiting)
  - [Input Validation](#input-validation)
- [Production Deployment](#production-deployment)
  - [Docker Configuration](#docker-configuration)
  - [Environment Configuration](#environment-configuration-1)
  - [Health Checks](#health-checks)
  - [Monitoring and Logging](#monitoring-and-logging)
- [Integration with Other Modules](#integration-with-other-modules)
  - [Common Module Integration](#common-module-integration)
  - [Prisma Integration](#prisma-integration)
  - [Client Integration](#client-integration)
  - [Development Tips](#development-tips)
- [Scripts Reference](#scripts-reference)
- [Dependencies](#dependencies)
  - [Runtime Dependencies](#runtime-dependencies)
  - [Development Dependencies](#development-dependencies)
- [Contributing](#contributing)
  - [Code Style Guidelines](#code-style-guidelines)

---

## Overview

The Server module is a robust NestJS-based backend application that provides a comprehensive API layer for the Skeleton App. Built with modern TypeScript patterns, it features a GraphQL-first API architecture, flexible authentication systems, real-time subscriptions, and enterprise-grade security and logging capabilities.

## Architecture

### Core Technologies

- **Framework**: NestJS 11.0.1 with Express.js and modular architecture
- **Language**: TypeScript 5.7.3 with strict type checking and decorators
- **GraphQL**: Apollo Server 4.11.3 with Pothos schema builder
- **Database**: Prisma ORM with PostgreSQL and PostGIS integration
- **Authentication**: Multi-provider auth (Auth.js, Passport, Keycloak, Bearer tokens)
- **Caching**: Redis 5.6.0 for sessions and GraphQL subscriptions
- **Real-time**: WebSocket subscriptions with Redis pub/sub
- **Security**: JWT tokens, role-based access control, rate limiting
- **Logging**: Structured logging with multiple transports

### Key Features

- **🚀 GraphQL API**: Type-safe API with Pothos schema builders and real-time subscriptions
- **🔐 Multi-Auth**: Support for Auth.js, Passport, Keycloak SSO, and bearer tokens
- **⚡ Real-time**: WebSocket subscriptions with Redis pub/sub for live updates
- **🛡️ Security**: JWT authentication, role-based access, rate limiting, CORS protection
- **📊 Logging**: Comprehensive logging system with database and console transports
- **🔄 Services**: Background services for data seeding, log pruning, and maintenance
- **🌐 External Routes**: Configurable proxy routing for external applications
- **📁 File Management**: Secure file upload and storage with validation
- **🧪 Testing**: Comprehensive test coverage with Jest and supertest
- **🐳 Container Ready**: Docker support with multi-stage builds

## Project Structure

```
server/
├── src/
│   ├── main.ts                      # Application bootstrap and configuration
│   ├── app.module.ts                # Root application module
│   ├── app.config.ts                # Configuration service and types
│   ├── schema.ts                    # GraphQL schema generation script
│   ├── redis.ts                     # Redis standalone service
│   │
│   ├── api/                         # REST API endpoints
│   │   ├── api.module.ts            # API module configuration
│   │   └── file.controller.ts       # File upload/download controller
│   │
│   ├── auth/                        # Authentication system
│   │   ├── auth.module.ts           # Main auth module
│   │   ├── auth.service.ts          # Core auth service
│   │   ├── auth.controller.ts       # Auth endpoints
│   │   ├── framework.module.ts      # Auth framework selection
│   │   ├── provider.module.ts       # Auth provider configuration
│   │   ├── roles.decorator.ts       # Role-based access decorator
│   │   ├── roles.guard.ts           # Role authorization guard
│   │   ├── user.decorator.ts        # User context decorator
│   │   ├── README.md               # Auth integration guide
│   │   │
│   │   ├── authjs/                  # Auth.js integration
│   │   │   ├── authjs.module.ts
│   │   │   ├── authjs.config.ts
│   │   │   ├── authjs.controller.ts
│   │   │   └── authjs.middleware.ts
│   │   │
│   │   ├── bearer/                  # Bearer token authentication
│   │   │   ├── bearer.module.ts
│   │   │   ├── bearer.service.ts
│   │   │   └── bearer.controller.ts
│   │   │
│   │   ├── keycloak/               # Keycloak SSO integration
│   │   │   ├── keycloak.module.ts
│   │   │   ├── keycloak.service.ts
│   │   │   └── keycloak.controller.ts
│   │   │
│   │   ├── local/                  # Local username/password auth
│   │   │   ├── local.module.ts
│   │   │   ├── local.service.ts
│   │   │   └── local.controller.ts
│   │   │
│   │   ├── passport/               # Passport.js integration
│   │   │   ├── passport.module.ts
│   │   │   ├── passport.middleware.ts
│   │   │   └── session.service.ts
│   │   │
│   │   └── super/                  # Super user authentication
│   │       ├── super.module.ts
│   │       ├── super.service.ts
│   │       └── super.controller.ts
│   │
│   ├── ext/                        # External application routing
│   │   └── ext.middleware.ts       # External route middleware
│   │
│   ├── graphql/                    # GraphQL API implementation
│   │   ├── index.ts                # GraphQL exports and types
│   │   ├── builder.service.ts      # Pothos schema builder service
│   │   ├── pothos.decorator.ts     # Pothos decorators
│   │   ├── pothos.driver.ts        # Custom Apollo driver
│   │   ├── pothos.module.ts        # GraphQL module configuration
│   │   ├── schema.module.ts        # Schema module registration
│   │   │
│   │   ├── account/                # Account GraphQL resolvers
│   │   │   ├── object.service.ts   # Account object type
│   │   │   ├── query.service.ts    # Account queries
│   │   │   └── mutate.service.ts   # Account mutations
│   │   │
│   │   ├── banner/                 # Banner GraphQL resolvers
│   │   │   ├── object.service.ts
│   │   │   ├── query.service.ts
│   │   │   └── mutate.service.ts
│   │   │
│   │   ├── comment/                # Comment GraphQL resolvers
│   │   │   ├── object.service.ts
│   │   │   ├── query.service.ts
│   │   │   └── mutate.service.ts
│   │   │
│   │   ├── current/                # Current user GraphQL resolvers
│   │   │   ├── query.service.ts
│   │   │   └── mutate.service.ts
│   │   │
│   │   ├── feedback/               # Feedback GraphQL resolvers
│   │   │   ├── object.service.ts
│   │   │   ├── query.service.ts
│   │   │   └── mutate.service.ts
│   │   │
│   │   ├── file/                   # File GraphQL resolvers
│   │   │   ├── object.service.ts
│   │   │   ├── query.service.ts
│   │   │   └── mutate.service.ts
│   │   │
│   │   ├── geography/              # Geography GraphQL resolvers
│   │   │   ├── object.service.ts
│   │   │   └── query.service.ts
│   │   │
│   │   ├── log/                    # Log GraphQL resolvers
│   │   │   ├── object.service.ts
│   │   │   ├── query.service.ts
│   │   │   └── mutate.service.ts
│   │   │
│   │   └── user/                   # User GraphQL resolvers
│   │       ├── object.service.ts
│   │       ├── query.service.ts
│   │       └── mutate.service.ts
│   │
│   ├── logging/                    # Logging system
│   │   ├── index.ts                # Logging exports
│   │   ├── logging.module.ts       # Logging module
│   │   ├── logger.service.ts       # Logger service
│   │   ├── logging.service.ts      # Application logger service
│   │   └── logging.interceptor.ts  # Request logging interceptor
│   │
│   ├── prisma/                     # Prisma integration
│   │   ├── index.ts                # Prisma exports
│   │   ├── prisma.module.ts        # Prisma module
│   │   └── prisma.service.ts       # Prisma service wrapper
│   │
│   ├── services/                   # Background services
│   │   ├── index.ts                # Services exports
│   │   ├── services.module.ts      # Services module
│   │   │
│   │   ├── log/                    # Log management service
│   │   │   └── log.service.ts
│   │   │
│   │   └── seed/                   # Database seeding service
│   │       ├── index.ts
│   │       └── seed.service.ts
│   │
│   ├── subscription/               # GraphQL subscriptions
│   │   ├── subscription.module.ts  # Subscription module
│   │   └── subscription.service.ts # Subscription service
│   │
│   └── utils/                      # Utility functions
│       ├── file.ts                 # File handling utilities
│       ├── file.test.ts            # File utility tests
│       └── json.ts                 # Streaming JSON reader utility
│
├── .env                            # Environment configuration
├── .env.test                       # Test environment configuration
├── .dockerignore                   # Docker ignore patterns
├── .gitignore                      # Git ignore patterns
├── .prettierrc                     # Prettier configuration
├── .yarnrc.yml                     # Yarn configuration
├── Dockerfile                      # Docker container definition
├── eslint.config.mjs               # ESLint configuration
├── nest-cli.json                   # NestJS CLI configuration
├── package.json                    # Dependencies and scripts
├── schema.graphql                  # Generated GraphQL schema
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.build.json             # Build-specific TypeScript config
├── yarn.lock                       # Yarn dependency lock
└── README.md                       # This file
```

## Core Architecture

### Application Bootstrap (`src/main.ts`)

The main application bootstrap configures the NestJS application with comprehensive middleware, security, and monitoring:

```typescript
async function MainBootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Security and middleware
  app.set("trust proxy", true);
  app.use(json());
  app.use(urlencoded({ extended: true }));

  // Logging configuration
  app.useLogger(app.get(AppLoggerService));

  // CORS for development
  if (configService.nodeEnv !== "production") {
    app.enableCors({
      origin: "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      credentials: true,
    });
  }

  // WebSocket adapter for subscriptions
  const wsAdapter = new WsAdapter(app);
  app.useWebSocketAdapter(wsAdapter);

  // Swagger API documentation
  const documentBuilder = new DocumentBuilder().setTitle("API").setVersion("1.0").build();
  SwaggerModule.setup("swagger", app, documentFactory);

  await app.listen(configService.port);
}
```

### Application Module (`src/app.module.ts`)

The root module orchestrates all application components with dependency injection and middleware configuration:

```typescript
@Module({
  imports: [
    ApiModule, // REST API endpoints
    AuthModule, // Authentication system
    ConfigModule.forRoot({
      // Environment configuration
      isGlobal: true,
      expandVariables: true,
      load: [AppConfigToken],
      envFilePath: [".env", ".env.local"],
    }),
    FrameworkModule.register(), // Auth framework selection
    LoggingModule, // Logging system
    PrismaModule, // Database integration
    ProviderModule.register({ path: "api" }), // Auth providers
    PothosGraphQLModule.forRoot(), // GraphQL API
    RouterModule.register([
      // API routing
      { path: "api", module: ApiModule },
    ]),
    ServicesModule, // Background services
    ThrottlerModule.forRoot([
      // Rate limiting
      { name: "short", ttl: 1000, limit: 3 },
      { name: "medium", ttl: 10000, limit: 20 },
      { name: "long", ttl: 60000, limit: 100 },
    ]),
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // External application routing
    consumer.apply(ExtRewriteMiddleware).forRoutes({ path: "ext/*path", method: RequestMethod.ALL });
  }
}
```

## Configuration System

### Configuration Service (`src/app.config.ts`)

The configuration service provides type-safe access to environment variables with validation and defaults:

```typescript
export class AppConfigService {
  static Key = AppConfigService.name;

  // Core application settings
  nodeEnv: string;
  port: number;
  project: { name: string };

  // Logging configuration
  log: {
    transports: string[];
    console: { level: string };
    database: { level: string };
    http: { level: string };
    prisma: { level: string };
  };

  // Session management
  session: {
    maxAge: number;
    store: string;
    secret: string;
  };

  // GraphQL configuration
  graphql: {
    editor: boolean;
    pubsub: string;
  };

  // Redis configuration
  redis: {
    host: string;
    port: number;
    username?: string;
    password?: string;
    db?: number;
  };

  // Authentication configuration
  auth: {
    framework: string;
    providers: string[];
  };

  // JWT configuration
  jwt: {
    secret: string;
    expiresIn: number;
  };

  // Keycloak SSO configuration
  keycloak: {
    authUrl: string;
    tokenUrl: string;
    callbackUrl: string;
    userinfoUrl: string;
    certsUrl: string;
    logoutUrl: string;
    scope: string;
    clientId: string;
    clientSecret: string;
    wellKnownUrl: string;
    passRoles: boolean;
    defaultRole: string;
  };

  // Database configuration
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    schema: string;
    username: string;
    password: string;
  };

  // External application routing
  ext: Record<string, ExtConfig>;

  // Background services
  service: {
    log: { prune: boolean };
    seed: {
      dataPath: string;
      batchSize: number;
      geojsonContribution: string;
    };
  };
}
```

### Environment Variables

The server supports comprehensive environment-based configuration:

```bash
# Core Application
NODE_ENV=development
PORT=3001
PROJECT_NAME=Skeleton

# Database
DATABASE_URL=postgresql://develop:password@localhost:5432/skeleton
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=skeleton
DATABASE_USERNAME=develop
DATABASE_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=password

# Authentication
AUTH_FRAMEWORK=authjs
AUTH_PROVIDERS=local,keycloak
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=86400

# Session Management
SESSION_SECRET=your-session-secret
SESSION_MAX_AGE=86400000
SESSION_STORE=redis

# Keycloak SSO
KEYCLOAK_AUTH_URL=https://localhost/auth/sso/realms/default/protocol/openid-connect/auth
KEYCLOAK_TOKEN_URL=https://localhost/auth/sso/realms/default/protocol/openid-connect/token
KEYCLOAK_CLIENT_ID=app
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_DEFAULT_ROLE=user

# GraphQL
GRAPHQL_EDITOR=true
GRAPHQL_PUBSUB=database

# Logging
LOG_TRANSPORTS=console,database
LOG_CONSOLE_LEVEL=debug
LOG_DATABASE_LEVEL=info
LOG_HTTP_LEVEL=log
LOG_PRISMA_LEVEL=info

# File Management
FILE_UPLOAD_PATH=/uploads

# Services
SERVICE_LOG_PRUNE=true
SERVICE_SEED_DATA_PATH=../docker/seed
SERVICE_SEED_BATCH_SIZE=100

# External Applications
EXT_WIKI_PATH=/ext/wiki
EXT_WIKI_ROLE=user
EXT_WIKI_AUTHORIZED=http://wiki:80
EXT_WIKI_UNAUTHORIZED=https://localhost/auth/login
```

## Authentication System

### Multi-Provider Architecture

The server supports multiple authentication providers through a flexible framework system:

#### Auth.js Integration (`src/auth/authjs/`)

Primary authentication provider with OAuth and local auth support:

```typescript
// Auth.js configuration
export const authConfig = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        // Local authentication logic
        return await validateUser(credentials);
      },
    }),
    // OAuth providers (Google, GitHub, etc.)
  ],
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.role = user.role;
      return token;
    },
    session: async ({ session, token }) => {
      session.user.role = token.role;
      return session;
    },
  },
};
```

#### Keycloak SSO Integration (`src/auth/keycloak/`)

Enterprise SSO with OIDC/SAML support:

```typescript
@Injectable()
export class KeycloakService {
  async authenticate(code: string): Promise<User> {
    const tokenResponse = await this.exchangeCodeForToken(code);
    const userInfo = await this.getUserInfo(tokenResponse.access_token);
    return await this.createOrUpdateUser(userInfo);
  }

  async validateToken(token: string): Promise<User | null> {
    const userInfo = await this.getUserInfo(token);
    return await this.findUserByKeycloakId(userInfo.sub);
  }
}
```

#### Bearer Token Authentication (`src/auth/bearer/`)

API authentication with JWT tokens:

```typescript
@Injectable()
export class BearerService {
  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify(token);
      return await this.userService.findById(payload.sub);
    } catch {
      return null;
    }
  }
}
```

#### Local Authentication (`src/auth/local/`)

Username/password authentication with bcrypt hashing:

```typescript
@Injectable()
export class LocalService {
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async register(userData: CreateUserInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    return await this.userService.create({
      ...userData,
      password: hashedPassword,
    });
  }
}
```

### Role-Based Access Control

#### Roles Decorator (`src/auth/roles.decorator.ts`)

```typescript
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Usage in controllers/resolvers
@Roles('admin', 'moderator')
@Query(() => [User])
async adminUsers() {
  return this.userService.findAll();
}
```

#### Roles Guard (`src/auth/roles.guard.ts`)

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>("roles", context.getHandler());
    if (!requiredRoles) return true;

    const user = this.getUser(context);
    return this.hasRequiredRole(user, requiredRoles);
  }

  private hasRequiredRole(user: User, requiredRoles: string[]): boolean {
    const userRoles = user.role?.split(",") || [];
    return requiredRoles.some((role) => userRoles.includes(role) || Role.granted(userRoles[0], role));
  }
}
```

## GraphQL API

### Pothos Schema Builder

The server uses Pothos for type-safe GraphQL schema construction:

#### Builder Service (`src/graphql/builder.service.ts`)

```typescript
@Injectable()
export class BuilderService {
  private builder = new SchemaBuilder<{
    PrismaTypes: PrismaTypes;
    Context: Context;
    Scalars: {
      DateTime: { Input: string; Output: string };
      Json: { Input: any; Output: any };
    };
  }>({
    plugins: [PrismaPlugin, RelayPlugin, ScopeAuthPlugin, SmartSubscriptionsPlugin, ComplexityPlugin],
    prisma: { client: prisma },
    authScopes: (context) => ({
      user: !!context.user,
      admin: context.user?.role?.includes("admin"),
    }),
  });

  toSchema(): GraphQLSchema {
    return this.builder.toSchema();
  }
}
```

#### Object Types Example (`src/graphql/user/object.service.ts`)

```typescript
@Injectable()
export class UserObjectService {
  constructor(private builder: BuilderService) {}

  @PothosObject("User")
  userObject() {
    this.builder.prismaObject("User", {
      fields: (t) => ({
        id: t.exposeID("id"),
        email: t.exposeString("email"),
        name: t.exposeString("name", { nullable: true }),
        role: t.exposeString("role", { nullable: true }),
        image: t.exposeString("image", { nullable: true }),
        createdAt: t.expose("createdAt", { type: "DateTime" }),
        updatedAt: t.expose("updatedAt", { type: "DateTime" }),

        // Relations
        comments: t.relation("comments", {
          authScopes: { user: true },
          args: {
            first: t.arg.int(),
            after: t.arg.string(),
          },
        }),

        // Computed fields
        displayName: t.string({
          resolve: (user) => user.name || user.email,
        }),
      }),
    });
  }
}
```

#### Query Resolvers Example (`src/graphql/user/query.service.ts`)

```typescript
@Injectable()
export class UserQueryService {
  constructor(
    private builder: BuilderService,
    private prisma: PrismaService,
  ) {}

  @PothosQuery()
  userQueries() {
    // Read single user
    this.builder.queryField("readUser", (t) =>
      t.prismaField({
        type: "User",
        nullable: true,
        authScopes: { user: true },
        args: {
          where: t.arg({ type: UserUniqueFilter, required: true }),
        },
        resolve: async (query, root, args) => {
          return this.prisma.user.findUnique({
            ...query,
            where: args.where,
          });
        },
      }),
    );

    // Paginated user list
    this.builder.queryField("pageUser", (t) =>
      t.prismaConnection({
        type: "User",
        cursor: "id",
        authScopes: { admin: true },
        args: {
          filter: t.arg({ type: UserFilter }),
        },
        resolve: async (query, root, args) => {
          return this.prisma.user.findMany({
            ...query,
            where: args.filter,
            orderBy: { createdAt: "desc" },
          });
        },
      }),
    );
  }
}
```

#### Mutation Resolvers Example (`src/graphql/user/mutate.service.ts`)

```typescript
@Injectable()
export class UserMutateService {
  constructor(
    private builder: BuilderService,
    private prisma: PrismaService,
  ) {}

  @PothosMutation()
  userMutations() {
    // Create user
    this.builder.mutationField("createUser", (t) =>
      t.prismaField({
        type: "User",
        authScopes: { admin: true },
        args: {
          create: t.arg({ type: UserCreateInput, required: true }),
        },
        resolve: async (query, root, args) => {
          return this.prisma.user.create({
            ...query,
            data: args.create,
          });
        },
      }),
    );

    // Update user
    this.builder.mutationField("updateUser", (t) =>
      t.prismaField({
        type: "User",
        authScopes: { admin: true },
        args: {
          where: t.arg({ type: UserUniqueFilter, required: true }),
          update: t.arg({ type: UserUpdateInput, required: true }),
        },
        resolve: async (query, root, args) => {
          return this.prisma.user.update({
            ...query,
            where: args.where,
            data: args.update,
          });
        },
      }),
    );
  }
}
```

### Real-time Subscriptions

#### Subscription Service (`src/subscription/subscription.service.ts`)

```typescript
@Injectable()
export class SubscriptionService {
  private pubSub: RedisPubSub;

  constructor(@Inject(AppConfigService.Key) configService: AppConfigService) {
    this.pubSub = new RedisPubSub({
      connection: {
        host: configService.redis.host,
        port: configService.redis.port,
        password: configService.redis.password,
      },
    });
  }

  async publish(trigger: string, payload: any): Promise<void> {
    await this.pubSub.publish(trigger, payload);
  }

  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    return this.pubSub.asyncIterator(triggers);
  }
}
```

#### Subscription Resolvers

```typescript
// In query service
this.builder.subscriptionField("readCurrentSubscription", (t) =>
  t.field({
    type: "User",
    nullable: true,
    authScopes: { user: true },
    subscribe: (root, args, context) => {
      return this.subscriptionService.asyncIterator(`user.${context.user.id}`);
    },
    resolve: (payload) => payload,
  }),
);

// Publishing updates
await this.subscriptionService.publish(`user.${userId}`, updatedUser);
```

## Logging System

### Application Logger Service (`src/logging/logging.service.ts`)

Multi-transport logging system with configurable levels:

```typescript
@Injectable()
export class AppLoggerService implements LoggerService {
  private loggers: LoggerService[] = [];

  constructor(@Inject(AppConfigService.Key) configService: AppConfigService) {
    // Console logger
    if (configService.log.console.level) {
      this.loggers.push(
        new ConsoleLogger({
          logLevels: getLogLevels(configService.log.console.level),
          prefix: "Server",
          timestamp: true,
        }),
      );
    }

    // Database logger (if configured)
    if (configService.log.database.level) {
      this.loggers.push(new DatabaseLogger(configService));
    }
  }

  registerLogger(logger: LoggerService) {
    if (!this.loggers.includes(logger)) {
      this.loggers.push(logger);
    }
  }

  log(message: any, ...optionalParams: any[]): void {
    this.loggers.forEach((logger) => logger.log(message, ...optionalParams));
  }

  error(message: any, ...optionalParams: any[]): void {
    this.loggers.forEach((logger) => logger.error(message, ...optionalParams));
  }

  warn(message: any, ...optionalParams: any[]): void {
    this.loggers.forEach((logger) => logger.warn(message, ...optionalParams));
  }

  debug(message: any, ...optionalParams: any[]): void {
    this.loggers.forEach((logger) => logger.debug?.(message, ...optionalParams));
  }
}
```

### HTTP Request Logging

Automatic HTTP request logging with configurable levels:

```typescript
// In main.ts
if (configService.log.http.level) {
  const httpLogger = new Logger("HttpRequest");
  const level = getLogLevel(configService.log.http.level) ?? "log";

  app.use(function (req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on("finish", () => {
      httpLogger[level](
        `${req.method} ${req.originalUrl} ${res.statusCode} ${res.statusMessage} - ${res.get("Content-Length") || 0}b sent in ${Date.now() - start}ms`,
      );
    });
    next();
  });
}
```

### Database Logging

Structured logging to database with GraphQL integration:

```typescript
// Log entries are stored in the database and accessible via GraphQL
const logs = await this.prisma.log.findMany({
  where: {
    type: "error",
    createdAt: { gte: startDate },
  },
  orderBy: { createdAt: "desc" },
});
```

## Background Services

### Database Seeding Service (`src/services/seed/seed.service.ts`)

Automated database seeding with support for JSON data files, large file streaming, and advanced GeoJSON processing:

```typescript
@Injectable()
export class SeedService extends BaseService {
  private logger = new Logger(SeedService.name);
  private readonly normalizer = NormalizationType.process(
    NormalizationType.NFD,
    NormalizationType.Lowercase,
    NormalizationType.Concatenate,
    NormalizationType.Letters,
    NormalizationType.Numbers,
  );

  @Timeout(1000)
  async execute(): Promise<void> {
    await super.execute();
  }

  async task() {
    const seeders = await this.prismaService.prisma.seed.findMany({
      select: { filename: true, timestamp: true },
    });

    const files = await readdir(resolve(process.cwd(), this.path), {
      withFileTypes: true,
    });

    for (const file of files) {
      if (/\.json/i.test(extname(file.name))) {
        const metadata = await stat(resolve(process.cwd(), this.path, file.name));
        const seed = seeders.find((v) => v.filename === file.name) ?? {
          filename: file.name,
          timestamp: new Date(0),
        };

        if (metadata.mtime > seed.timestamp) {
          await this.processSeederFile(file);
        }
      }
    }
  }

  private async processSeederFile(file: Dirent) {
    const seeder = JSON.parse(await readFile(resolve(file.parentPath, file.name), "utf-8")) as
      | Seeder
      | FileSeeder
      | GeographySeeder;

    // Process file-based seeders with streaming JSON reader
    if (this.isFileSeeder(seeder)) {
      await this.processFileSeeder(seeder);
    } else {
      await this.processStandardSeeder(seeder);
    }
  }

  private async processFileSeeder(seeder: FileSeeder | GeographySeeder) {
    const geography = this.isGeographySeeder(seeder) ? seeder.geography : undefined;

    for (const { filename } of seeder.data) {
      const reader = new StreamingJsonReader(resolve(file.parentPath, filename));
      
      // Stream records from large JSON files using JSONPath
      for await (let record of reader.read<Record<string, any>>(seeder.jsonpath)) {
        // Process geography data with field mapping and normalization
        if (geography && this.isGeoJSONFeature(record)) {
          record = this.processGeographyRecord(record, geography);
        }

        // Execute database operation based on seeder type
        await this.executeSeederOperation(seeder, record);
      }
    }
  }
}
```

#### Key Features

- **🚀 Streaming Processing**: Memory-efficient processing of large JSON files using `StreamingJsonReader`
- **📍 JSONPath Support**: Extract specific data from complex JSON structures using JSONPath queries
- **🗺️ Advanced Geography Processing**: Specialized handling for GeoJSON data with field mapping and ID normalization
- **⚡ Performance Optimized**: Process massive datasets without loading entire files into memory
- **🔄 Backward Compatible**: Supports existing standard seeder format alongside new capabilities

#### Seeder File Formats

**Standard Seeder Format:**

Traditional format for small to medium datasets loaded directly into memory:

```json
{
  "type": "upsert",
  "table": "user",
  "id": "id",
  "data": [
    {
      "id": "admin",
      "email": "admin@example.com",
      "name": "Administrator",
      "role": "admin",
      "password": "$2b$12$hashedpassword"
    }
  ]
}
```

**File Seeder Format:**

For processing large external JSON files with streaming and JSONPath queries:

```json
{
  "type": "create",
  "table": "location",
  "id": "id",
  "jsonpath": "$.locations[]",
  "data": [
    { "filename": "large-locations.json" },
    { "filename": "additional-locations.json" }
  ]
}
```

**Geography Seeder Format:**

Specialized format for processing GeoJSON files with field mapping and automatic ID generation:

```json
{
  "table": "geography",
  "type": "create",
  "id": "id",
  "geography": {
    "mapping": {
      "id": "shapeID",
      "name": "shapeName",
      "group": "shapeGroup", 
      "type": "shapeType"
    },
    "defaults": {
      "type": "boundary",
      "group": "administrative"
    }
  },
  "jsonpath": "$.features[]",
  "data": [
    { "filename": "countries.geojson" },
    { "filename": "states.geojson" },
    { "filename": "cities.geojson" }
  ]
}
```

#### JSONPath Support

The seeder service supports JSONPath queries for extracting specific data from complex JSON structures:

- **`$.features[]`**: Extract all features from a GeoJSON FeatureCollection
- **`$.data[]`**: Extract all items from a data array
- **`$.locations[]`**: Extract all location objects
- **`$.users[].profile`**: Extract profile objects from user records

#### Geography Processing Features

**Field Mapping:**
Maps GeoJSON properties to database fields using configurable mapping:

```typescript
// Maps GeoJSON properties to database fields
const mapping = {
  id: "ISO_A2",        // Use ISO_A2 property as ID
  name: "NAME",        // Use NAME property as name
  type: "TYPE",        // Use TYPE property as type
  group: "CONTINENT"   // Use CONTINENT property as group
};
```

**Automatic ID Generation:**
When no ID is found in the mapped field, generates normalized IDs:

```typescript
// Generates: "country-europe-france"
const id = `${normalizer(type)}-${normalizer(group)}-${normalizer(name)}`;
```

**Default Values:**
Provides fallback values for missing fields:

```json
{
  "defaults": {
    "type": "country",
    "group": "world"
  }
}
```

#### Performance Benefits

**Memory Efficiency:**
- Streams large files without loading entire contents into memory
- Processes files of any size with constant memory usage
- Suitable for multi-gigabyte GeoJSON files

**Processing Speed:**
- Incremental processing reduces startup time
- Parallel processing of multiple files
- Efficient JSONPath parsing with minimal overhead

**Scalability:**
- Handles datasets with millions of records
- Configurable batch processing
- Automatic error recovery and logging

### Log Management Service (`src/services/log/log.service.ts`)

Automated log pruning and maintenance:

```typescript
@Injectable()
export class LogService extends BaseService {
  @Timeout(60000) // Run after 1 minute
  execute(): Promise<void> {
    return super.execute();
  }

  async task() {
    if (this.configService.service.log.prune) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep 30 days

      const deleted = await this.prismaService.prisma.log.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          type: { not: "error" }, // Keep error logs longer
        },
      });

      this.logger.log(`Pruned ${deleted.count} old log entries`);
    }
  }
}
```

## Utility Functions

### Streaming JSON Reader (`src/utils/json.ts`)

Memory-efficient JSON processing utility for handling large files with JSONPath queries:

```typescript
export class StreamingJsonReader {
  constructor(private path: string) {}

  async *read<T = any>(path: string, _type?: T): AsyncGenerator<T> {
    // Stream JSON file and yield matching nodes
    const query = tokenize(path);
    const parser = new JsonStreamParser();
    
    for await (const chunk of this.stream) {
      const matches = parser.parse(chunk, query);
      for (const match of matches) {
        yield match;
      }
    }
  }
}
```

#### Key Features

- **🚀 Memory Efficient**: Streams large JSON files without loading entire contents into memory
- **📍 JSONPath Support**: Extract specific data using JSONPath expressions
- **⚡ High Performance**: Processes files of any size with constant memory usage
- **🔒 File Safety**: Monitors file changes during processing to prevent corruption
- **🎯 Type Safe**: Generic type support for returned values

#### Usage Examples

**Basic JSON Array Processing:**

```typescript
const reader = new StreamingJsonReader('large-data.json');

// Extract all items from an array
for await (const item of reader.read<DataItem>('$.data[]')) {
  await processItem(item);
}
```

**GeoJSON Feature Processing:**

```typescript
const reader = new StreamingJsonReader('countries.geojson');

// Extract all features from a GeoJSON FeatureCollection
for await (const feature of reader.read<GeoJSON.Feature>('$.features[]')) {
  const properties = feature.properties;
  const geometry = feature.geometry;
  await processGeography(properties, geometry);
}
```

**Nested Object Extraction:**

```typescript
const reader = new StreamingJsonReader('users.json');

// Extract nested profile objects
for await (const profile of reader.read<UserProfile>('$.users[].profile')) {
  await updateUserProfile(profile);
}
```

#### JSONPath Expressions

The StreamingJsonReader supports a subset of JSONPath expressions optimized for streaming:

| Expression | Description | Example |
|------------|-------------|---------|
| `$` | Root element | `$` |
| `.field` | Object field access | `$.users` |
| `[]` | Array wildcard | `$.data[]` |
| `[n]` | Array index | `$.data[0]` |
| Combined | Nested access | `$.users[].profile` |

#### Performance Characteristics

**Memory Usage:**
- Constant memory footprint regardless of file size
- Suitable for processing multi-gigabyte JSON files
- No intermediate object creation for non-matching data

**Processing Speed:**
- Incremental parsing with minimal buffering
- Efficient JSONPath matching algorithm
- Optimized for sequential access patterns

**Error Handling:**
- File change detection during processing
- Graceful handling of malformed JSON
- Detailed error messages with context

#### Implementation Details

**JSONPath Tokenization:**

```typescript
export function tokenize(path: string): JsonPathToken[] {
  return path
    .replace(/\s/g, "")
    .split(/\./)
    .reduce((tokens, segment) => {
      const [_, value, bracket, selector] = /^(\$|[a-z0-9_-]+)(\[)?([^\]]+)?(\])?$/i.exec(segment) || [];
      return [...tokens, ...(bracket ? [value, "[]", selector] : [value])];
    }, [] as string[])
    .filter(Boolean)
    .map(tokenFactory);
}
```

**Stream Parser Architecture:**

```typescript
class JsonStreamParser {
  private stack: JsonPathStack;
  private type: "unknown" | "object" | "field" | "string" | "number" | "boolean" | "null";
  
  parse(chunk: string | null, query: JsonPathToken[]): any[] {
    // Incremental parsing with path matching
    const matches: any[] = [];
    
    for (const char of chunk ?? [""]) {
      const matched = this.matchesPath(query);
      this.handleCharacter(query, char);
      const matching = this.matchesPath(query);
      
      if (matched && !matching) {
        // Found complete match
        matches.push(JSON.parse(this.target));
        this.target = "";
      }
    }
    
    return matches;
  }
}
```

## File Management

### File Controller (`src/api/file.controller.ts`)

Secure file upload and download with validation:

```typescript
@Controller("file")
export class FileController {
  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @User() user: User) {
    // Validate file type and size
    this.validateFile(file);

    // Store file metadata in database
    const fileRecord = await this.prisma.file.create({
      data: {
        objectKey: file.filename,
        mimeType: file.mimetype,
        contentLength: file.size,
        userId: user.id,
      },
    });

    return fileRecord;
  }

  @Get(":id")
  async downloadFile(@Param("id") id: string, @Res() res: Response, @User() user: User) {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: { user: true },
    });

    // Check permissions
    if (!this.canAccessFile(file, user)) {
      throw new ForbiddenException();
    }

    // Stream file
    const filePath = resolve(this.configService.file.uploadPath, file.objectKey);
    res.sendFile(filePath);
  }

  private validateFile(file: Express.Multer.File) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

    if (file.size > maxSize) {
      throw new BadRequestException("File too large");
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException("Invalid file type");
    }
  }
}
```

## External Application Routing

### External Route Middleware (`src/ext/ext.middleware.ts`)

Configurable proxy routing for external applications with role-based access:

```typescript
@Injectable()
export class ExtRewriteMiddleware implements NestMiddleware {
  constructor(@Inject(AppConfigService.Key) private configService: AppConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const path = req.path as `/ext/${string}`;
    const config = this.findExtConfig(path);

    if (!config) {
      return res.status(404).send("External application not found");
    }

    // Check user authorization
    if (config.role && !this.hasRequiredRole(req.user, config.role)) {
      if (config.unauthorized) {
        return res.redirect(config.unauthorized);
      }
      return res.status(403).send("Access denied");
    }

    // Proxy to authorized URL
    if (config.authorized) {
      const proxy = httpProxy(config.authorized, {
        proxyReqPathResolver: (req) => {
          return req.originalUrl.replace(/^\/ext\/[^/]+/, "");
        },
      });

      return proxy(req, res, next);
    }

    next();
  }

  private findExtConfig(path: string): ExtConfig | undefined {
    return Object.values(this.configService.ext).find((config) => config.path === path);
  }

  private hasRequiredRole(user: any, requiredRole: string): boolean {
    if (!user) return false;
    const userRoles = user.role?.split(",") || [];
    return userRoles.includes(requiredRole) || Role.granted(userRoles[0], requiredRole);
  }
}
```

### External Application Configuration

Configure external applications via environment variables:

```bash
# Wiki application example
EXT_WIKI_PATH=/ext/wiki
EXT_WIKI_ROLE=user
EXT_WIKI_AUTHORIZED=http://wiki:80
EXT_WIKI_UNAUTHORIZED=https://localhost/auth/login

# Admin panel example
EXT_ADMIN_PATH=/ext/admin
EXT_ADMIN_ROLE=admin
EXT_ADMIN_AUTHORIZED=http://admin-panel:3000
EXT_ADMIN_UNAUTHORIZED=https://localhost/auth/denied
```

## Development Workflow

### Prerequisites

- Node.js 22.x
- Yarn 4.x
- PostgreSQL 16+ with PostGIS 3+
- Redis 5.6+
- Running Prisma database

### Setup

1. **Install dependencies**

   ```bash
   cd server
   yarn install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Generate Prisma client**

   ```bash
   cd ../prisma
   yarn generate
   ```

4. **Run database migrations**

   ```bash
   cd ../prisma
   yarn migrate:deploy
   ```

5. **Generate GraphQL schema**

   ```bash
   cd ../server
   yarn compile:schema
   ```

6. **Start development server**

   ```bash
   yarn start
   # or
   yarn start:dev
   ```

7. **Access the application**
   - Server: http://localhost:3001
   - GraphQL Playground: http://localhost:3001/graphql
   - Swagger API: http://localhost:3001/swagger

### Development Scripts

```bash
# Development
yarn start              # Start with watch mode
yarn start:dev          # Start development server
yarn start:debug        # Start with debugging
yarn start:redis        # Start Redis service only

# Production
yarn build              # Build application
yarn start:prod         # Start production server

# Code quality
yarn lint               # ESLint with auto-fix
yarn check              # TypeScript type checking
yarn check:watch        # Watch mode type checking

# Testing
yarn test               # Run tests
yarn test:watch         # Watch mode
yarn test:cov           # With coverage
yarn test:debug         # Debug mode

# Schema generation
yarn compile            # Generate GraphQL schema
yarn compile:schema     # Generate schema only
```

### Environment Configuration

#### Development (`.env`)

```bash
NODE_ENV=development
PORT=3001
PROJECT_NAME=Skeleton

# Database
DATABASE_URL=postgresql://develop:password@localhost:5432/skeleton

# Redis (optional for development when using database subscriptions)
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
AUTH_FRAMEWORK=authjs
AUTH_PROVIDERS=local,keycloak
JWT_SECRET=development-secret
SESSION_SECRET=development-session-secret

# GraphQL (use 'database' for development to avoid Redis dependency)
GRAPHQL_EDITOR=true
GRAPHQL_PUBSUB=database

# Logging
LOG_CONSOLE_LEVEL=debug
LOG_DATABASE_LEVEL=info
LOG_HTTP_LEVEL=log

# Services
SERVICE_SEED_DATA_PATH=../docker/seed
```

#### Testing (`.env.test`)

```bash
NODE_ENV=test
DATABASE_URL=postgresql://develop:password@localhost:5432/skeleton_test
REDIS_HOST=localhost
LOG_CONSOLE_LEVEL=error
```

## Testing

### Test Structure

The server uses Jest with comprehensive testing patterns:

```typescript
// Unit test example
describe("UserService", () => {
  let service: UserService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: mockDeep<PrismaClient>() }],
    }).compile();

    service = module.get(UserService);
    prisma = module.get(PrismaService);
  });

  it("should create user", async () => {
    const userData = { email: "test@example.com", name: "Test User" };
    prisma.user.create.mockResolvedValue({ id: "1", ...userData });

    const result = await service.create(userData);
    expect(result.email).toBe(userData.email);
  });
});
```

### Integration Testing

```typescript
// GraphQL integration test
describe("UserResolver (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("should query users", () => {
    return request(app.getHttpServer())
      .post("/graphql")
      .send({
        query: `
          query {
            pageUser(first: 10) {
              edges {
                node {
                  id
                  email
                  name
                }
              }
            }
          }
        `,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.pageUser).toBeDefined();
      });
  });
});
```

### Test Configuration (`jest.config.js`)

```javascript
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  moduleNameMapper: {
    "@/(.*)": "<rootDir>/$1",
  },
  testRegex: ".*\\.(?:spec|test)\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  coverageReporters: ["json", "text", "lcov", "clover", "cobertura"],
  testEnvironment: "node",
};
```

## Performance Optimization

### Database Optimization

#### Connection Pooling

```typescript
// Prisma connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `${DATABASE_URL}?connection_limit=10&pool_timeout=20`,
    },
  },
});
```

#### Query Optimization

```typescript
// Efficient queries with select and include
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    _count: {
      select: { comments: true },
    },
  },
  where: {
    role: { contains: "admin" },
  },
  orderBy: { createdAt: "desc" },
  take: 20,
});
```

### GraphQL Optimization

#### Query Complexity Analysis

```typescript
// In GraphQL module configuration
plugins: [
  ComplexityPlugin.create({
    maximumComplexity: 1000,
    fieldComplexity: 1,
    scalarComplexity: 1,
    objectComplexity: 2,
    listFactor: 10,
  }),
],
```

#### DataLoader Pattern

```typescript
// Batch loading to prevent N+1 queries
@Injectable()
export class UserLoader {
  private loader = new DataLoader<string, User>(async (ids: string[]) => {
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
    });
    return ids.map((id) => users.find((user) => user.id === id));
  });

  load(id: string): Promise<User> {
    return this.loader.load(id);
  }
}
```

### Caching Strategy

#### Redis Caching

```typescript
@Injectable()
export class CacheService {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

## Security

### Authentication Security

#### JWT Configuration

```typescript
// Secure JWT configuration
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwt.secret,
      algorithms: ["HS256"],
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
```

#### Password Security

```typescript
// Strong password hashing with bcrypt
import * as bcrypt from "@node-rs/bcrypt";

@Injectable()
export class PasswordService {
  private readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.verify(password, hash);
  }

  validateStrength(password: string): boolean {
    // Use zxcvbn for password strength validation
    const result = zxcvbn(password);
    return result.score >= 3;
  }
}
```

### Rate Limiting

```typescript
// Configurable rate limiting
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 1000,    // 1 second
    limit: 3,     // 3 requests
  },
  {
    name: 'medium',
    ttl: 10000,   // 10 seconds
    limit: 20,    // 20 requests
  },
  {
    name: 'long',
    ttl: 60000,   // 1 minute
    limit: 100,   // 100 requests
  },
]),

// Usage in controllers
@Throttle({ short: { limit: 1, ttl: 1000 } })
@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

### Input Validation

```typescript
// DTO validation with class-validator
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Length(2, 50)
  name: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  password: string;

  @IsOptional()
  @IsIn(["user", "admin", "moderator"])
  role?: string;
}
```

## Production Deployment

### Docker Configuration

#### Multi-stage Dockerfile

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY ../common/package.json ../common/
COPY ../prisma/package.json ../prisma/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .
COPY ../common ../common
COPY ../prisma ../prisma

# Build application
RUN yarn build

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app

# Install production dependencies only
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3001
CMD ["node", "dist/main"]
```

#### Docker Compose Integration

```yaml
# docker-compose.yml
services:
  server:
    build:
      context: .
      dockerfile: server/Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_HOST=redis
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      - database
      - redis
    volumes:
      - uploads:/app/uploads
    restart: unless-stopped
```

### Environment Configuration

#### Production Environment Variables

```bash
# Core
NODE_ENV=production
PORT=3001
INSTANCE_TYPE=

# Security
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# Database
DATABASE_URL=${DATABASE_URL}

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=${REDIS_PASSWORD}

# Logging
LOG_TRANSPORTS=console,database
LOG_CONSOLE_LEVEL=info
LOG_DATABASE_LEVEL=warn

# Services
SERVICE_LOG_PRUNE=true
SERVICE_SEED_DATA_PATH=/app/seed

# Instance Type Configuration
# Controls which background services run in this container
# INSTANCE_TYPE=""              # No background services
# INSTANCE_TYPE=*               # All services
# INSTANCE_TYPE=seed,log        # Specific services
# INSTANCE_TYPE=^seed           # Seed only then shutdown
# INSTANCE_TYPE=*,!log          # All except log service
```

### Health Checks

```typescript
// Health check endpoint
@Controller("health")
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: Redis,
  ) {}

  @Get()
  async check() {
    const checks = await Promise.allSettled([this.checkDatabase(), this.checkRedis()]);

    const status = checks.every((check) => check.status === "fulfilled") ? "healthy" : "unhealthy";

    return {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database: checks[0].status,
        redis: checks[1].status,
      },
    };
  }

  private async checkDatabase() {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  private async checkRedis() {
    await this.redis.ping();
  }
}
```

### Monitoring and Logging

#### Structured Logging

```typescript
// Production logging configuration
const logger = new Logger("Application");

// Log with context
logger.log("User created", {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
  requestId: req.id,
});

// Error logging with stack traces
logger.error("Database connection failed", {
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString(),
});
```

#### Performance Monitoring

```typescript
// Request timing middleware
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const handler = context.getHandler().name;

        if (duration > 1000) {
          Logger.warn(`Slow operation: ${handler} took ${duration}ms`);
        }
      }),
    );
  }
}
```

## Integration with Other Modules

### Common Module Integration

```typescript
// Using shared constants and utilities
import { Role, HttpStatus, parseBoolean } from "@local/common";

@Injectable()
export class UserService {
  validateRole(roleString: string) {
    const role = Role.parse(roleString);
    if (!role) {
      throw new HttpException("Invalid role", HttpStatus.BadRequest.code);
    }
    return role;
  }

  checkPermission(user: User, requiredRole: string): boolean {
    const userRole = Role.parse(user.role);
    return Role.granted(userRole?.name, requiredRole);
  }
}
```

### Prisma Integration

```typescript
// Direct Prisma client usage
import { PrismaClient, User, Prisma } from "@local/prisma";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaClient) {}

  async findUsers(args: Prisma.UserFindManyArgs): Promise<User[]> {
    return this.prisma.user.findMany(args);
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
```

### Client Integration

The server provides APIs consumed by the client:

- **GraphQL API**: Primary data interface with type-safe operations
- **REST API**: File uploads and authentication endpoints
- **WebSocket**: Real-time subscriptions and notifications

### Development Tips

#### Hot Reload Issues

- Restart the development server
- Clear node_modules and reinstall
- Check for TypeScript compilation errors

#### Authentication Debugging

- Enable debug logging: `LOG_CONSOLE_LEVEL=debug`
- Check JWT token validity
- Verify user roles and permissions

#### Performance Issues

- Enable Prisma query logging: `LOG_PRISMA_LEVEL=info`
- Monitor Redis memory usage
- Check database query performance

## Scripts Reference

```json
{
  "scripts": {
    "build": "yarn compile && nest build",
    "start": "nest start --watch",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "start:redis": "nest start --entryFile redis",
    "lint": "eslint \"src/**/*.ts\" --fix",
    "check": "tsc --noEmit",
    "check:watch": "tsc --noEmit --incremental --watch",
    "test": "jest --runInBand --forceExit --detectOpenHandles",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage --runInBand --forceExit --detectOpenHandles",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "compile": "yarn compile:schema",
    "compile:schema": "nest start --entryFile schema"
  }
}
```

## Dependencies

### Runtime Dependencies

- **@nestjs/core**: NestJS framework core
- **@nestjs/graphql**: GraphQL integration
- **@apollo/server**: GraphQL server implementation
- **@pothos/core**: Type-safe GraphQL schema builder
- **@local/common**: Shared utilities and constants
- **@local/prisma**: Database layer and types
- **@nestjs/passport**: Authentication framework
- **@nestjs/jwt**: JWT token handling
- **ioredis**: Redis client for caching and pub/sub
- **@node-rs/bcrypt**: Password hashing
- **express-session**: Session management
- **graphql-redis-subscriptions**: Real-time subscriptions

### Development Dependencies

- **@nestjs/cli**: NestJS command line interface
- **@nestjs/testing**: Testing utilities
- **typescript**: Type-safe JavaScript development
- **jest**: Testing framework
- **supertest**: HTTP testing
- **eslint**: Code linting and formatting
- **prettier**: Code formatting

## Contributing

When contributing to the server module:

1. **Follow NestJS Patterns**: Use decorators, dependency injection, and modular architecture
2. **Maintain Type Safety**: Ensure all code is properly typed with TypeScript
3. **Add Tests**: Include unit and integration tests for new features
4. **Update GraphQL Schema**: Regenerate schema after resolver changes
5. **Consider Security**: Implement proper authentication and authorization
6. **Document APIs**: Update GraphQL documentation and Swagger specs
7. **Performance**: Consider database query efficiency and caching

### Code Style Guidelines

- Use NestJS decorators and patterns
- Implement proper error handling
- Follow GraphQL best practices
- Use dependency injection consistently
- Maintain consistent file naming conventions
- Add JSDoc comments for complex services

---

<p align="center">
  <strong>Enterprise-grade NestJS backend for the Skeleton App</strong><br>
  <em>Built with TypeScript, GraphQL, and modern security practices</em>
</p>
