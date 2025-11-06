# Prisma Database Layer

<p align="center">
  <strong>Database schema, migrations, and ORM layer for the Skeleton App</strong>
</p>

<p align="center">
  <a href="https://www.prisma.io/docs" target="_blank">
    <img src="https://img.shields.io/badge/Prisma-6.9.0-2D3748?logo=prisma" alt="Prisma Version" />
  </a>
  <a href="https://www.postgresql.org/" target="_blank">
    <img src="https://img.shields.io/badge/PostgreSQL-16+-336791?logo=postgresql" alt="PostgreSQL Version" />
  </a>
  <a href="https://postgis.net/" target="_blank">
    <img src="https://img.shields.io/badge/PostGIS-3+-4169E1?logo=postgresql" alt="PostGIS Version" />
  </a>
  <a href="https://nodejs.org/dist/latest-v22.x/" target="_blank">
    <img src="https://img.shields.io/badge/node-22.x-green.svg?logo=node.js" alt="Node.js Version" />
  </a>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Database Stack](#database-stack)
  - [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
  - [Core Models](#core-models)
  - [Database Extensions](#database-extensions)
- [Development Workflow](#development-workflow)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Migration Management](#migration-management)
  - [Schema Development](#schema-development)
  - [Query Patterns](#query-patterns)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
- [Performance Optimization](#performance-optimization)
  - [Connection Pooling](#connection-pooling)
  - [Query Optimization](#query-optimization)
  - [Monitoring](#monitoring)
- [Production Considerations](#production-considerations)
  - [Environment Configuration](#environment-configuration)
  - [Migration Deployment](#migration-deployment)
  - [Backup Strategy](#backup-strategy)
- [Integration with GraphQL](#integration-with-graphql)
- [Scripts Reference](#scripts-reference)
- [Official Documentation](#official-documentation)
- [Contributing](#contributing)

---

## Overview

This module contains the database layer for the Skeleton App, built with [Prisma](https://www.prisma.io/) as the ORM and query builder. It provides type-safe database access, automated migrations, and seamless integration with PostgreSQL and PostGIS for geospatial data.

## Architecture

### Database Stack

- **Database**: PostgreSQL 16+ with PostGIS 3+ extension
- **ORM**: Prisma 6.9.0 with TypeScript support
- **Schema Management**: Prisma Migrate for version-controlled migrations
- **Type Generation**: Automatic TypeScript type generation from schema
- **Query Builder**: Type-safe Prisma Client with IntelliSense support
- **Geospatial**: PostGIS integration for location-based features

### Key Features

- **Type Safety**: Full TypeScript integration with auto-generated types
- **Migration System**: Version-controlled database schema changes
- **Relation Management**: Declarative relationship definitions
- **Query Optimization**: Efficient query generation and connection pooling
- **Geospatial Support**: PostGIS integration for geographic data
- **Multi-Environment**: Support for development, testing, and production
- **Seeding**: Database initialization with sample data

## Project Structure

```
prisma/
├── prisma/
│   ├── schema.prisma          # Main schema definition
│   ├── migrations/            # Database migration files
│   │   └── [timestamp]_[name]/
│   │       └── migration.sql
│   └── models/               # Modular schema definitions
│       ├── user.prisma       # User and authentication models
│       ├── account.prisma    # OAuth account models
│       ├── session.prisma    # Session management
│       ├── comment.prisma    # Comment system
│       ├── feedback.prisma   # Feedback and file management
│       ├── banner.prisma     # System banners
│       ├── geography.prisma  # Geospatial data models
│       ├── log.prisma        # Application logging
│       └── *.prisma         # Additional domain models
├── src/
│   ├── index.ts             # Prisma client exports
│   └── pothos.ts            # GraphQL schema integration
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## Database Schema

### Core Models

#### User Management

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  emailVerified DateTime?
  role          String?   // Comma-separated roles
  password      String?   // For local authentication
  preferences   Json?     // User preferences object
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  accounts      Account[]
  sessions      Session[]
  comments      Comment[]
  feedbacks     Feedback[] @relation("UserFeedback")
  assignedFeedbacks Feedback[] @relation("assignee")
  files         File[]
  banners       Banner[]
}
```

#### Authentication & Sessions

```prisma
model Account {
  id                 String   @default(cuid())
  type               String   // oauth, credentials
  provider           String   // google, github, local
  providerAccountId  String
  refresh_token      String?
  access_token       String?
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?
  session_state      String?
  userId             String
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([provider, providerAccountId])
}

model Session {
  id        String   @id @default(cuid())
  expiresAt DateTime
  data      Json     // Session data (Auth.js or Express)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### Content & Feedback

```prisma
model Comment {
  id        String   @id @default(cuid())
  message   String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Feedback {
  id         String         @id @default(cuid())
  message    String
  status     FeedbackStatus @default(Todo)
  userId     String
  user       User           @relation("UserFeedback", fields: [userId], references: [id])
  assigneeId String?
  assignee   User?          @relation("assignee", fields: [assigneeId], references: [id])
  files      File[]
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt
}

enum FeedbackStatus {
  Todo
  InProgress
  Done
}
```

#### Geospatial Data

```prisma
model Geography {
  id        String   @id @default(cuid())
  name      String
  type      String   // country, state, city, etc.
  group     String   // grouping identifier
  geojson   Json     // GeoJSON geometry data
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Database Extensions

The schema utilizes PostgreSQL extensions for enhanced functionality:

```sql
-- PostGIS for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Development Workflow

### Prerequisites

- Node.js 22.x
- PostgreSQL 16+ with PostGIS 3+
- Yarn 4.x

### Setup

1. **Install dependencies**

   ```bash
   cd prisma
   yarn install
   ```

2. **Configure database connection**

   ```bash
   # Set DATABASE_URL in your environment
   export DATABASE_URL="postgresql://develop:password@localhost:5432/skeleton?schema=public"
   ```

3. **Generate Prisma Client**
   ```bash
   yarn generate
   ```

### Migration Management

#### Create New Migration

```bash
# After modifying schema.prisma
yarn migrate:create --name descriptive_migration_name
```

#### Apply Migrations

```bash
# Deploy pending migrations
yarn migrate:deploy

# Reset database (development only)
yarn migrate:reset
```

#### Migration Best Practices

- **Descriptive Names**: Use clear, descriptive migration names
- **Incremental Changes**: Make small, focused schema changes
- **Data Migration**: Include data transformation scripts when needed
- **Rollback Strategy**: Consider rollback implications for production

#### Geospatial Index Optimization

When working with geospatial fields (GeoJSON data stored as `Json` type), you should manually modify the generated migration files to use PostGIS spatial indexes for optimal performance:

**Before (Prisma-generated migration):**

```sql
-- This is what Prisma generates by default
CREATE INDEX "Geography_geojson_idx" ON "Geography"("geojson");
```

**After (PostGIS-optimized migration):**

```sql
-- Manually modify the migration to use PostGIS spatial indexing
CREATE INDEX "Geography_geojson_gist_idx" ON "Geography" USING GIST ((geojson::geometry));

-- Alternative: Create a GIN index for JSON queries
CREATE INDEX "Geography_geojson_gin_idx" ON "Geography" USING GIN (geojson);
```

**Migration Modification Workflow:**

1. Generate migration with `yarn migrate:create --name add_geography_model`
2. Edit the generated migration file in `prisma/migrations/[timestamp]_add_geography_model/migration.sql`
3. Replace standard indexes with PostGIS spatial indexes
4. Apply the migration with `yarn migrate:deploy`

**PostGIS Index Types:**

- **GIST Index**: Best for geometric operations (ST_Contains, ST_Intersects, ST_DWithin)
- **GIN Index**: Best for JSON property queries and full-text search
- **SPGIST Index**: Best for non-overlapping geometric data

**Example Migration File:**

```sql
-- CreateTable
CREATE TABLE "Geography" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "geojson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Geography_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (manually optimized for PostGIS)
CREATE INDEX "Geography_geojson_gist_idx" ON "Geography" USING GIST ((geojson::geometry));
CREATE INDEX "Geography_name_idx" ON "Geography"("name");
CREATE INDEX "Geography_type_idx" ON "Geography"("type");
```

> **Note**: Always test geospatial queries after applying custom indexes to ensure optimal performance. Use `EXPLAIN ANALYZE` to verify that PostGIS indexes are being utilized correctly.

### Schema Development

#### Adding New Models

1. **Create model file** in `prisma/models/`

   ```prisma
   // prisma/models/example.prisma
   model Example {
     id        String   @id @default(cuid())
     name      String
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

2. **Update main schema** to include the model
3. **Generate migration**
   ```bash
   yarn migrate:create --name add_example_model
   ```

#### Relationship Patterns

```prisma
// One-to-Many
model User {
  id       String    @id @default(cuid())
  comments Comment[]
}

model Comment {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id])
}

// Many-to-Many
model User {
  id      String    @id @default(cuid())
  banners Banner[]
}

model Banner {
  id    String @id @default(cuid())
  users User[]
}

// Self-Relation
model User {
  id       String @id @default(cuid())
  managerId String?
  manager  User?   @relation("UserManager", fields: [managerId], references: [id])
  reports  User[]  @relation("UserManager")
}
```

### Query Patterns

#### Basic Operations

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
    role: "user",
  },
});

// Read with relations
const userWithComments = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    comments: {
      orderBy: { createdAt: "desc" },
      take: 10,
    },
  },
});

// Update
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: { name: "Jane Doe" },
});

// Delete
await prisma.user.delete({
  where: { id: userId },
});
```

#### Advanced Queries

```typescript
// Pagination
const users = await prisma.user.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: "desc" },
});

// Filtering and searching
const filteredUsers = await prisma.user.findMany({
  where: {
    AND: [{ email: { contains: searchTerm } }, { role: { in: ["user", "admin"] } }, { createdAt: { gte: startDate } }],
  },
});

// Aggregations
const userStats = await prisma.user.aggregate({
  _count: { id: true },
  _min: { createdAt: true },
  _max: { createdAt: true },
});

// Transactions
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.comment.create({
    data: { message: "Welcome!", userId: user.id },
  });
});
```

#### Geospatial Queries

```typescript
// PostGIS integration for geographic queries
const nearbyGeographies = await prisma.$queryRaw`
  SELECT id, name, type, 
         ST_Distance(geojson::geometry, ST_GeomFromGeoJSON(${searchArea})) as distance
  FROM "Geography"
  WHERE ST_DWithin(geojson::geometry, ST_GeomFromGeoJSON(${searchArea}), ${radius})
  ORDER BY distance
  LIMIT ${limit}
`;
```

### Testing

#### Unit Tests

```typescript
import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

// Mock Prisma for testing
const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

test("should create user", async () => {
  const userData = { email: "test@example.com", name: "Test User" };
  prismaMock.user.create.mockResolvedValue({ id: "1", ...userData });

  const result = await userService.createUser(userData);
  expect(result.email).toBe(userData.email);
});
```

#### Integration Tests

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

beforeEach(async () => {
  // Clean database
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

## Performance Optimization

### Connection Pooling

```typescript
// Configure connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `${DATABASE_URL}?connection_limit=5&pool_timeout=20`,
    },
  },
});
```

### Query Optimization

```typescript
// Use select to limit fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
  },
});

// Batch operations
const users = await prisma.user.createMany({
  data: userDataArray,
  skipDuplicates: true,
});

// Use indexes for frequent queries
// Add to schema.prisma:
// @@index([email])
// @@index([createdAt])
```

### Monitoring

```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Query metrics
prisma.$on("query", (e) => {
  console.log("Query: " + e.query);
  console.log("Duration: " + e.duration + "ms");
});
```

## Production Considerations

### Environment Configuration

```bash
# Production database URL
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&connection_limit=10"

# Connection pooling
PRISMA_CLIENT_ENGINE_TYPE="binary"
```

### Migration Deployment

```bash
# Production migration deployment
yarn migrate:deploy

# Verify migration status
yarn migrate:status
```

### Backup Strategy

```bash
# Database backup
pg_dump $DATABASE_URL > backup.sql

# Restore from backup
psql $DATABASE_URL < backup.sql
```

## Integration with GraphQL

The Prisma layer integrates seamlessly with the GraphQL API through [Pothos](https://pothos-graphql.dev/):

```typescript
// src/pothos.ts
import { PrismaClient } from "@prisma/client";
import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";

const prisma = new PrismaClient();

const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
  },
});

// Auto-generated GraphQL types from Prisma schema
builder.prismaObject("User", {
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email"),
    name: t.exposeString("name", { nullable: true }),
    comments: t.relation("comments"),
  }),
});
```

## Scripts Reference

```json
{
  "scripts": {
    "build": "yarn generate && tsc",
    "generate": "prisma generate",
    "migrate:create": "prisma migrate dev --create-only",
    "migrate:deploy": "prisma migrate deploy",
    "migrate:reset": "prisma migrate reset",
    "migrate:status": "prisma migrate status",
    "db:push": "prisma db push",
    "db:pull": "prisma db pull",
    "db:seed": "tsx prisma/seed.ts",
    "studio": "prisma studio",
    "lint": "eslint src --ext .ts",
    "check": "tsc --noEmit",
    "test": "jest",
    "test:cov": "jest --coverage"
  }
}
```

## Official Documentation

For comprehensive information about Prisma features and best practices, refer to the official documentation:

- **[Prisma Documentation](https://www.prisma.io/docs)** - Complete guide to Prisma
- **[Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)** - Schema syntax and options
- **[Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)** - Client methods and options
- **[Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)** - Migration system guide
- **[PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)** - PostgreSQL-specific features
- **[PostGIS Integration](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#working-with-geojson)** - Geospatial data handling

## Contributing

When contributing to the database layer:

1. **Schema Changes**: Always create migrations for schema modifications
2. **Testing**: Include tests for new models and queries
3. **Documentation**: Update this README for significant changes
4. **Performance**: Consider query performance implications
5. **Backwards Compatibility**: Ensure migrations are backwards compatible

---

<p align="center">
  <strong>Database layer for the Skeleton App</strong><br>
  <em>Built with Prisma, PostgreSQL, and PostGIS</em>
</p>
