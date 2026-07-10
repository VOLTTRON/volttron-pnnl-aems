# Client Frontend Application

<p align="center">
  <strong>Next.js 14 frontend application for the Skeleton App</strong>
</p>

<p align="center">
  <a href="https://nextjs.org/" target="_blank">
    <img src="https://img.shields.io/badge/Next.js-14.2.35-000000?logo=next.js" alt="Next.js Version" />
  </a>
  <a href="https://reactjs.org/" target="_blank">
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React Version" />
  </a>
  <a href="https://www.typescriptlang.org/" target="_blank">
    <img src="https://img.shields.io/badge/TypeScript-5.7.3-3178C6?logo=typescript" alt="TypeScript Version" />
  </a>
  <a href="https://www.apollographql.com/docs/react/" target="_blank">
    <img src="https://img.shields.io/badge/Apollo_Client-3.10.8-311C87?logo=apollo-graphql" alt="Apollo Client Version" />
  </a>
  <a href="https://blueprintjs.com/" target="_blank">
    <img src="https://img.shields.io/badge/Blueprint.js-5.10.3-137CBD?logo=blueprint" alt="Blueprint.js Version" />
  </a>
  <a href="https://nodejs.org/dist/latest-v22.x/" target="_blank">
    <img src="https://img.shields.io/badge/node-22.x-green.svg?logo=node.js" alt="Node.js Version" />
  </a>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [GraphQL Integration](#graphql-integration)
- [Routing System](#routing-system)
- [Styling and Theming](#styling-and-theming)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Security Considerations](#security-considerations)
- [Integration with Other Modules](#integration-with-other-modules)
- [Scripts Reference](#scripts-reference)
- [Dependencies](#dependencies)

---

## Overview

The Client module is a modern React-based frontend application built with Next.js 14, providing a responsive and interactive user interface for the Skeleton App. It features a comprehensive component library, real-time GraphQL integration, and a flexible theming system designed for enterprise applications.

## Architecture

### Core Technologies

- **Framework**: Next.js 14 with App Router and React Server Components
- **Language**: TypeScript 5.7.3 with strict type checking
- **UI Library**: Blueprint.js 5.10.3 for consistent enterprise UI components
- **Styling**: SCSS modules
- **State Management**: React Context API with custom providers
- **GraphQL**: Apollo Client 3.10.8 with real-time subscriptions via `graphql-ws`
- **Maps**: MapLibre GL with React Map GL and deck.gl integration
- **Charts**: Apache ECharts for data visualization
- **Testing**: Jest with React Testing Library

### Key Features

- Modern UI with Blueprint.js component library and custom theming
- GraphQL subscriptions for real-time live data
- Interactive maps with MapLibre GL and geospatial features
- ECharts integration for charts and graphs
- Dark/light mode with user preference persistence
- Role-based route protection and auth flows
- Responsive layouts

## Project Structure

```
client/
├── public/                          # Static assets
├── src/
│   ├── app/                         # Next.js App Router structure
│   │   ├── layout.tsx               # Root layout with providers
│   │   ├── page.tsx                 # Root page with routing logic
│   │   ├── routes.ts                # Application route definitions
│   │   ├── types.ts                 # Route and component type definitions
│   │   ├── template.tsx             # Page template wrapper (auth guard)
│   │   ├── dialog.tsx               # Global dialog container
│   │   │
│   │   ├── about/                   # About page
│   │   ├── auth/                    # Auth pages (login, logout, denied, [provider])
│   │   ├── backups/                 # Backup management
│   │   ├── banners/                 # Banner management (admin)
│   │   ├── demo/                    # Demo pages (map, chart, palette, [isbn])
│   │   ├── feedback/                # Feedback management (admin)
│   │   ├── logs/                    # Audit log viewer (admin)
│   │   ├── users/                   # User management (admin)
│   │   ├── api/                     # Next.js route handlers (see api/README.md)
│   │   │
│   │   └── components/              # React components
│   │       ├── common/              # Shared UI components
│   │       │   ├── banner.tsx       # System banner component
│   │       │   ├── echarts.tsx      # ECharts wrapper
│   │       │   ├── file.tsx         # File upload/display
│   │       │   ├── loading.tsx      # Loading indicators
│   │       │   ├── map.tsx          # MapLibre map component
│   │       │   ├── navbar.tsx       # Navigation bar
│   │       │   ├── navigation.tsx   # Side navigation
│   │       │   ├── notice.tsx       # Notice/alert component
│   │       │   ├── notification.tsx # Toast notifications
│   │       │   ├── paging.tsx       # Pagination component
│   │       │   ├── palette.tsx      # Color palette component
│   │       │   ├── preferences.tsx  # User preferences dialog
│   │       │   ├── search.tsx       # Search input component
│   │       │   ├── table.tsx        # Data table component
│   │       │   ├── texticon.tsx     # Text with icon component
│   │       │   └── theme.tsx        # Theme provider
│   │       ├── feedback/            # Feedback-specific components
│   │       └── providers/           # React Context providers
│   │           ├── current.tsx      # Current user context
│   │           ├── graphql.tsx      # Apollo GraphQL provider
│   │           ├── loading.tsx      # Loading state management
│   │           ├── logging.tsx      # Client-side logging
│   │           ├── notification.tsx # Notification system
│   │           ├── preferences.tsx  # User preferences
│   │           ├── routing.tsx      # Route management
│   │           └── screen-size.tsx  # Responsive breakpoints
│   │
│   ├── graphql-codegen/             # Generated GraphQL types (do not hand-edit)
│   │   ├── fragment-masking.ts
│   │   ├── gql.ts
│   │   ├── graphql.ts
│   │   └── index.ts
│   │
│   ├── queries/                     # GraphQL operation files
│   │   ├── backup.graphql
│   │   ├── banner.graphql
│   │   ├── current.graphql
│   │   ├── feedback.graphql
│   │   ├── file.graphql
│   │   ├── geography.graphql
│   │   ├── log.graphql
│   │   └── user.graphql
│   │
│   └── utils/                       # Client-side utilities
│       ├── client.tsx               # Apollo client setup + WebSocket
│       ├── palette.ts               # Color palette utilities
│       ├── palettes.json            # Color palette definitions
│       └── palettes.schema.json     # Palette JSON schema
│
├── codegen.ts                       # GraphQL Code Generator config
├── server.cjs                       # Custom HTTPS dev server
├── copy-certs.cjs                   # Copies TLS certs from proxy container
├── next.config.js                   # Next.js configuration
└── schema.graphql                   # Copy of server schema used by codegen (do not hand-edit)
```

## Core Components

### Layout and Navigation

The root layout (`src/app/layout.tsx`) wraps the app in a stack of context providers: `LoggingProvider → BlueprintProvider → GraphqlProvider → RouteProvider → NotificationProvider → LoadingProvider → PreferencesProvider → CurrentProvider → Theme`. `template.tsx` handles route-level auth gating.

The navigation system consists of a top `Navbar` with breadcrumbs and user menu, and a side `Navigation` that filters routes by the current user's role.

### Context Providers

- **GraphQL provider** — configures Apollo Client with split links: HTTP for queries/mutations, WebSocket for subscriptions.
- **Current user provider** — manages authenticated user state and the `useCurrentContext()` hook.
- **Theme provider** — handles dark/light mode switching and persists the preference.

### UI Components

All reusable UI components live in `src/app/components/common/`. Key components: `Table` (sorting, filtering, actions), `Search` (term highlighting), `File` (upload/display with drag-and-drop), `ECharts` (responsive chart wrapper with theme integration), and `MapLibreGL` map wrapper.

### Map Integration

The map component wraps MapLibre GL with React Map GL and deck.gl for geospatial data layers. Used in the demo and geography features.

### Chart Integration

`echarts.tsx` wraps Apache ECharts with automatic theme switching (light/dark).

## GraphQL Integration

### Code Generation

`codegen.ts` drives `graphql-codegen`:

- Reads `.graphql` operation files from `src/queries/`.
- Reads the schema from `schema.graphql` (a copy of the server schema).
- Writes typed hooks, types, and fragment-masking helpers into `src/graphql-codegen/`.

**Always use generated hooks** — never `gql` tagged templates inline. After server schema changes, run `yarn compile:schema` in the server workspace first, then `yarn compile:graphql` here.

### Query Files

Write operations in `src/queries/<aggregate>.graphql`, then run `yarn compile:graphql` to regenerate the typed hooks in `src/graphql-codegen/graphql.ts`.

## Routing System

### Route Configuration (`src/app/routes.ts`)

Routes are defined as a hierarchical list of `StaticRoute | DynamicRoute` objects. Each route has an `id`, `parentId`, `path`, `name`, `icon`, optional `scope` (role required), and `display` flag.

### Dynamic Routing

Dynamic route segments use the `Dynamic` marker in `routes.ts`, which maps to Next.js `[param]` folder conventions.

### Route Protection

`template.tsx` uses the current user's role and the route's `scope` field to gate access. Unauthenticated users are redirected to the login page; insufficient roles redirect to the denied page.

## Styling and Theming

### SCSS Modules

Each component or page uses a co-located `*.module.scss` for scoped styles. Global styles live in `src/app/global.module.scss`. Use `clsx` for conditional class application.

### Theme System

Dark/light mode is managed by the `PreferencesProvider` and applied via Blueprint.js's `Classes.DARK` class and CSS variables. Theme mode is persisted per user.

### Color Palettes

`src/utils/palette.ts` and `src/utils/palettes.json` manage named color palettes for data visualization. Palettes are validated against `palettes.schema.json`.

## Development Workflow

### Prerequisites

- Node.js 22.x
- Yarn 4.x
- Docker stack running (provides the server, database, and TLS certs)
- A real hostname configured in `.env` — `localhost` will not work for session cookies or OAuth

### Setup

1. Follow the root [README.md](../README.md) to bring up the Docker stack and configure `client/.env.local` with the correct `REWRITE_*_URL` and `DATABASE_HOST` values.
2. Run `yarn dev` from the `client/` directory to start the custom HTTPS dev server.
3. Access at `https://<HOSTNAME>:3000`.

### Development Scripts

- `yarn dev` / `yarn dev:https` — custom HTTPS dev server via `server.cjs` (uses mkcert certs auto-copied from the `skeleton-proxy` container). **Use this for normal development.**
- `yarn dev:http` — plain `next dev` on `0.0.0.0` without TLS. Only for debugging where HTTPS causes issues.
- `yarn build` — compile + `next build`.
- `yarn start:prod` — serve the production build.
- `yarn lint` — ESLint with auto-fix (uses `next lint`, legacy config).
- `yarn check` — TypeScript type check without emit.
- `yarn test` / `yarn test:cov` — Jest.
- `yarn compile` → `yarn compile:graphql` — regenerate typed Apollo hooks from `.graphql` files.

### Environment Configuration

Development variables go in `client/.env.local` (gitignored). Key variables:

- `REWRITE_AUTHJS_URL`, `REWRITE_GRAPHQL_URL`, `REWRITE_API_URL` — point at the Docker stack's hostname, not `localhost`.
- `DATABASE_HOST`, `REDIS_HOST` — for any server-side client-internal connections.

See the root README Development Setup section for the full setup procedure.

## Testing

Tests colocate as `*.test.ts` / `*.test.tsx` next to source. Jest runs in `jsdom` environment with React Testing Library. Blueprint.js components require the `BlueprintProvider` wrapper in tests.

Run `yarn test` or `yarn test:cov` from the `client/` directory.

## Production Deployment

The client is built and served by the `skeleton-client` Docker container. The `Dockerfile` at `client/Dockerfile` performs a multi-stage build (install → build → standalone runner). In production, `NEXT_PUBLIC_*` vars are set via the Docker Compose environment configuration in `docker/.env.client`.

## Security Considerations

- **Content Security Policy** — configured in `next.config.js` headers.
- **Authentication** — the app integrates with the NestJS auth stack via the `Auth.js` middleware mounted at `/authjs`. Route-level guards are in `template.tsx`.
- **CORS** — development rewrites proxy API requests through Next.js so no CORS headers are needed in local dev.

## Integration with Other Modules

- **`@local/common`** — shared constants (`Role`, `HttpStatus`) and utilities (tree, color, math). Import from `@local/common`, not deep paths.
- **`@local/prisma`** — Prisma model types for type-safe props. Use codegen types for anything crossing the wire.
- **Server API** — GraphQL for data; REST (`/api/*`) for file uploads and auth; WebSocket for subscriptions.

## Scripts Reference

| Script | What it does |
|---|---|
| `yarn dev` | Custom HTTPS dev server (`server.cjs`) — normal development |
| `yarn dev:http` | Plain `next dev` — no TLS |
| `yarn build` | Compile + `next build` |
| `yarn start:prod` | Serve the production build |
| `yarn lint` | ESLint with auto-fix |
| `yarn check` | TypeScript type check |
| `yarn test` | Jest |
| `yarn test:cov` | Jest with coverage |
| `yarn compile:graphql` | Regenerate typed Apollo hooks from `.graphql` files |
| `yarn copy-certs` | Copy TLS certs from the proxy container |

## Dependencies

### Runtime

- `next` — React framework with SSR and App Router
- `react` / `react-dom` — UI library
- `@apollo/client` — GraphQL client with caching and subscriptions
- `@blueprintjs/core` + `icons` + `select` + `table` + `datetime2` — enterprise UI components
- `@local/common` — shared utilities and constants
- `@local/prisma` — database types
- `maplibre-gl` + `react-map-gl` + `deck.gl` — map rendering
- `echarts` — data visualization
- `graphql-ws` — WebSocket transport for subscriptions
- `sass` — CSS preprocessor
- `pino` — structured logging

### Development

- `@graphql-codegen/cli` + plugins — typed hook generation
- `typescript` — type checking
- `jest` + `@testing-library/react` — testing
- `eslint` — linting

---

<p align="center">
  <strong>Modern React frontend for the Skeleton App</strong><br>
  <em>Built with Next.js, TypeScript, and Blueprint.js</em>
</p>
