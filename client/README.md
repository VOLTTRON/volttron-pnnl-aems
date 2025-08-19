# Client Frontend Application

<p align="center">
  <strong>Next.js 14 frontend application for the Skeleton App</strong>
</p>

<p align="center">
  <a href="https://nextjs.org/" target="_blank">
    <img src="https://img.shields.io/badge/Next.js-14-000000?logo=next.js" alt="Next.js Version" />
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
  - [Core Technologies](#core-technologies)
  - [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
  - [Layout and Navigation](#layout-and-navigation)
  - [Context Providers](#context-providers)
  - [UI Components](#ui-components)
  - [Map Integration](#map-integration)
  - [Chart Integration](#chart-integration)
- [GraphQL Integration](#graphql-integration)
  - [Code Generation](#code-generation)
  - [Query Examples](#query-examples)
- [Routing System](#routing-system)
  - [Route Configuration](#route-configuration-srcapproutests)
  - [Dynamic Routing](#dynamic-routing)
  - [Route Protection](#route-protection)
- [Styling and Theming](#styling-and-theming)
  - [SCSS Modules](#scss-modules)
  - [Theme System](#theme-system)
  - [Color Palettes](#color-palettes)
- [Development Workflow](#development-workflow)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Development Scripts](#development-scripts)
  - [Environment Configuration](#environment-configuration)
- [Testing](#testing)
  - [Test Structure](#test-structure)
  - [Testing Utilities](#testing-utilities)
  - [Test Configuration](#test-configuration-jestconfigts)
- [Performance Optimization](#performance-optimization)
  - [Next.js Optimizations](#nextjs-optimizations)
  - [GraphQL Optimizations](#graphql-optimizations)
  - [Bundle Optimization](#bundle-optimization)
- [Production Deployment](#production-deployment)
  - [Docker Build](#docker-build)
  - [Build Configuration](#build-configuration)
  - [Environment Variables](#environment-variables)
- [Security Considerations](#security-considerations)
  - [Content Security Policy](#content-security-policy)
  - [Authentication Integration](#authentication-integration)
  - [CORS Configuration](#cors-configuration)
- [Accessibility](#accessibility)
  - [Blueprint.js Accessibility](#blueprintjs-accessibility)
  - [Custom Accessibility Features](#custom-accessibility-features)
- [Integration with Other Modules](#integration-with-other-modules)
  - [Common Module Integration](#common-module-integration)
  - [Prisma Integration](#prisma-integration)
  - [Server API Integration](#server-api-integration)
  - [Development Tips](#development-tips)
- [Scripts Reference](#scripts-reference)
- [Dependencies](#dependencies)
  - [Runtime Dependencies](#runtime-dependencies)
  - [Development Dependencies](#development-dependencies)
- [Contributing](#contributing)
  - [Code Style Guidelines](#code-style-guidelines)

---

## Overview

The Client module is a modern React-based frontend application built with Next.js 14, providing a responsive and interactive user interface for the Skeleton App. It features a comprehensive component library, real-time GraphQL integration, and a flexible theming system designed for enterprise applications.

## Architecture

### Core Technologies

- **Framework**: Next.js 14 with App Router and React Server Components
- **Language**: TypeScript 5.7.3 with strict type checking
- **UI Library**: Blueprint.js 5.10.3 for consistent enterprise UI components
- **Styling**: SCSS modules with CSS-in-JS support
- **State Management**: React Context API with custom providers
- **GraphQL**: Apollo Client 3.10.8 with real-time subscriptions
- **Maps**: MapLibre GL with React Map GL integration
- **Charts**: Apache ECharts for data visualization
- **Testing**: Jest with React Testing Library

### Key Features

- **🎨 Modern UI**: Blueprint.js component library with custom theming
- **🔄 Real-time Updates**: GraphQL subscriptions for live data
- **🗺️ Interactive Maps**: MapLibre GL integration with geospatial features
- **📊 Data Visualization**: ECharts integration for charts and graphs
- **🌙 Dark/Light Mode**: Dynamic theme switching with user preferences
- **🔐 Authentication**: Integrated auth flows with role-based access
- **📱 Responsive Design**: Mobile-first responsive layouts
- **🚀 Performance**: Code splitting, lazy loading, and optimization
- **♿ Accessibility**: WCAG compliant with Blueprint.js accessibility features
- **🧪 Testing**: Comprehensive test coverage with Jest and RTL

## Project Structure

```
client/
├── public/                          # Static assets
│   ├── images/                      # Image assets
│   │   ├── PNNL_Centered_Logo_Color_RGB.png
│   │   └── PNNL_Stacked_Logo_Color_RGB.png
│   ├── next.svg                     # Next.js logo
│   └── vercel.svg                   # Vercel logo
├── src/
│   ├── app/                         # Next.js App Router structure
│   │   ├── layout.tsx               # Root layout with providers
│   │   ├── page.tsx                 # Root page with routing logic
│   │   ├── routes.ts                # Application route definitions
│   │   ├── types.ts                 # Route and component type definitions
│   │   ├── global.module.scss       # Global SCSS styles
│   │   ├── template.tsx             # Page template wrapper
│   │   ├── loading.tsx              # Global loading component
│   │   ├── error.tsx                # Global error boundary
│   │   ├── not-found.tsx            # 404 page component
│   │   ├── dialog.tsx               # Global dialog container
│   │   │
│   │   ├── about/                   # About page
│   │   │   ├── page.tsx
│   │   │   └── page.module.scss
│   │   │
│   │   ├── auth/                    # Authentication pages for Passport
│   │   │   ├── login/               # Login page
│   │   │   ├── logout/              # Logout page
│   │   │   ├── denied/              # Access denied page
│   │   │   └── [provider]/          # Dynamic provider routes
│   │   │       └── login/
│   │   │
│   │   ├── demo/                    # Demo/example pages
│   │   │   ├── page.tsx             # Main demo page
│   │   │   ├── layout.tsx           # Demo layout
│   │   │   ├── chart.tsx            # Chart examples
│   │   │   ├── map.tsx              # Map integration
│   │   │   ├── palette.tsx          # Color palette demo
│   │   │   ├── locations.tsx        # Nominatim integration
│   │   │   ├── books.ts             # Demo data
│   │   │   └── [isbn]/              # Dynamic book routes
│   │   │       └── [index]/         # Dynamic chapter routes
│   │   │
│   │   ├── users/                   # User management (admin)
│   │   │   ├── page.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── page.module.scss
│   │   │
│   │   ├── feedback/                # Feedback management (admin)
│   │   │   ├── page.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── page.module.scss
│   │   │
│   │   ├── banners/                 # Banner management (admin)
│   │   │   ├── page.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── page.module.scss
│   │   │
│   │   ├── logs/                    # System logs (admin)
│   │   │   ├── page.tsx
│   │   │   └── page.module.scss
│   │   │
│   │   ├── api/                     # API route handlers
│   │   │   └── README.md
│   │   │
│   │   └── components/              # React components
│   │       ├── common/              # Shared UI components
│   │       │   ├── banner.tsx       # System banner component
│   │       │   ├── echarts.tsx      # ECharts wrapper
│   │       │   ├── file.tsx         # File upload/display
│   │       │   ├── loading.tsx      # Loading indicators
│   │       │   ├── navbar.tsx       # Navigation bar
│   │       │   ├── navigation.tsx   # Side navigation
│   │       │   ├── notice.tsx       # Notice/alert component
│   │       │   ├── notification.tsx # Toast notifications
│   │       │   ├── paging.tsx       # Pagination component
│   │       │   ├── palette.tsx      # Color palette utilities
│   │       │   ├── preferences.tsx  # User preferences dialog
│   │       │   ├── search.tsx       # Search input component
│   │       │   ├── table.tsx        # Data table component
│   │       │   ├── texticon.tsx     # Text with icon component
│   │       │   └── theme.tsx        # Theme provider
│   │       │
│   │       ├── feedback/            # Feedback-specific components
│   │       │   ├── feedback.tsx
│   │       │   ├── feedback.module.scss
│   │       │   └── index.tsx
│   │       │
│   │       └── providers/           # React Context providers
│   │           ├── current.tsx      # Current user context
│   │           ├── graphql.tsx      # Apollo GraphQL provider
│   │           ├── loading.tsx      # Loading state management
│   │           ├── logging.tsx      # Client-side logging
│   │           ├── notification.tsx # Notification system
│   │           ├── preferences.tsx  # User preferences
│   │           ├── routing.tsx      # Route management
│   │           └── index.tsx        # Provider exports
│   │
│   ├── graphql-codegen/             # Generated GraphQL types
│   │   ├── fragment-masking.ts      # Fragment masking utilities
│   │   ├── gql.ts                   # GraphQL tag function
│   │   ├── graphql.ts               # Generated types
│   │   └── index.ts                 # Codegen exports
│   │
│   ├── queries/                     # GraphQL query definitions
│   │   ├── banner.graphql           # Banner queries
│   │   ├── current.graphql          # Current user queries
│   │   ├── feedback.graphql         # Feedback queries
│   │   ├── file.graphql             # File queries
│   │   ├── geography.graphql        # Geography queries
│   │   ├── log.graphql              # Log queries
│   │   └── user.graphql             # User queries
│   │
│   ├── utils/                       # Utility functions
│   │   ├── client.tsx               # Client-side utilities
│   │   ├── client.test.ts           # Client utility tests
│   │   ├── palette.ts               # Color palette utilities
│   │   ├── palette.test.ts          # Palette utility tests
│   │   ├── palettes.json            # Color palette definitions
│   │   └── palettes.schema.json     # Palette JSON schema
│   │
│   ├── index.ts                     # Main exports
│   └── instrumentation.ts           # Next.js instrumentation
│
├── .env                             # Environment configuration
├── .dockerignore                    # Docker ignore patterns
├── .eslintignore                    # ESLint ignore patterns
├── .eslintrc.json                   # ESLint configuration
├── .gitignore                       # Git ignore patterns
├── .yarnrc.yml                      # Yarn configuration
├── codegen.ts                       # GraphQL Code Generator config
├── Dockerfile                       # Docker container definition
├── jest.config.ts                   # Jest testing configuration
├── next.config.js                   # Next.js configuration
├── package.json                     # Dependencies and scripts
├── schema.graphql                   # GraphQL schema definition
├── tsconfig.json                    # TypeScript configuration
├── yarn.lock                        # Yarn dependency lock
└── README.md                        # This file
```

## Core Components

### Layout and Navigation

#### Root Layout (`src/app/layout.tsx`)
The root layout provides the application shell with nested context providers:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LoggingProvider>
          <BlueprintProvider>
            <GraphqlProvider>
              <RouteProvider>
                <NotificationProvider>
                  <LoadingProvider>
                    <PreferencesProvider>
                      <CurrentProvider>
                        <Theme>
                          {children}
                          <Notice />
                          <Banner />
                          <Notification />
                          <GlobalLoading />
                        </Theme>
                      </CurrentProvider>
                    </PreferencesProvider>
                  </LoadingProvider>
                </NotificationProvider>
              </RouteProvider>
            </GraphqlProvider>
          </BlueprintProvider>
        </LoggingProvider>
      </body>
    </html>
  );
}
```

#### Navigation System
- **Navbar**: Top navigation with breadcrumbs and user menu
- **Navigation**: Side navigation with role-based route filtering
- **Routes**: Hierarchical route definitions with dynamic routing support

### Context Providers

#### GraphQL Provider (`src/app/components/providers/graphql.tsx`)
Configures Apollo Client with HTTP and WebSocket links for real-time subscriptions:

```tsx
const client = new ApolloClient({
  link: splitLink, // HTTP for queries/mutations, WS for subscriptions
  cache: new InMemoryCache(),
});
```

#### Current User Provider (`src/app/components/providers/current.tsx`)
Manages authentication state and user information:

```tsx
const { current, updateCurrent } = useContext(CurrentContext);
```

#### Theme Provider (`src/app/components/common/theme.tsx`)
Handles dark/light mode switching and theme persistence:

```tsx
const { mode } = compilePreferences(preferences, current?.preferences);
```

### UI Components

#### Table Component (`src/app/components/common/table.tsx`)
Reusable data table with sorting, filtering, and actions:

```tsx
<Table
  rowKey="id"
  rows={data}
  columns={[
    { field: "name", label: "Name", type: "string" },
    { field: "email", label: "Email", type: "string" },
  ]}
  actions={{
    values: [{ id: "edit", icon: IconNames.EDIT }],
    onClick: (id, row) => handleAction(id, row)
  }}
/>
```

#### Search Component (`src/app/components/common/search.tsx`)
Advanced search with term highlighting:

```tsx
const filteredResults = filter(items, searchTerm, ['name', 'email']);
```

#### File Component (`src/app/components/common/file.tsx`)
File upload and display with drag-and-drop support.

### Map Integration

#### MapLibre GL Integration (`src/app/demo/map.tsx`)
Interactive maps with geospatial data visualization:

```tsx
import { Map, Source, Layer } from 'react-map-gl/maplibre';

<Map
  mapStyle={darkMode ? DARK_STYLE : LIGHT_STYLE}
  onLoad={handleMapLoad}
>
  <Source type="geojson" data={geojsonData}>
    <Layer {...layerStyle} />
  </Source>
</Map>
```

### Chart Integration

#### ECharts Wrapper (`src/app/components/common/echarts.tsx`)
Responsive chart component with theme integration:

```tsx
<ECharts
  option={chartOption}
  theme={darkMode ? 'dark' : 'light'}
  style={{ height: '400px' }}
/>
```

## GraphQL Integration

### Code Generation

The client uses GraphQL Code Generator to create type-safe GraphQL operations:

```typescript
// codegen.ts
const config: CodegenConfig = {
  schema: "./schema.graphql",
  documents: ["src/**/*.{ts,tsx,graphql}"],
  generates: {
    "./src/graphql-codegen/": {
      preset: "client",
      config: {
        strictScalars: true,
        scalars: {
          DateTime: "string",
          Json: "any",
          // Custom scalar mappings
        },
      },
    },
  },
};
```

### Query Examples

#### User Queries (`src/queries/user.graphql`)
```graphql
query ReadCurrent {
  readCurrent {
    id
    email
    name
    role
    image
    preferences
  }
}

subscription ReadCurrentSubscription {
  readCurrent {
    id
    email
    name
    role
    updatedAt
  }
}
```

#### Usage in Components
```tsx
import { useQuery, useSubscription } from '@apollo/client';
import { graphql } from '@/graphql-codegen';

const READ_CURRENT = graphql(`
  query ReadCurrent {
    readCurrent {
      id
      name
      email
    }
  }
`);

function UserProfile() {
  const { data, loading, error } = useQuery(READ_CURRENT);
  
  if (loading) return <Loading />;
  if (error) return <Error message={error.message} />;
  
  return <div>{data?.readCurrent?.name}</div>;
}
```

## Routing System

### Route Configuration (`src/app/routes.ts`)

The application uses a hierarchical routing system with role-based access control:

```typescript
const routes: (StaticRoute | DynamicRoute)[] = [
  {
    id: "home",
    parentId: undefined,
    path: `/`,
    name: "Home",
    icon: IconNames.HOME,
    display: false,
  },
  {
    id: "demo",
    parentId: "home",
    path: `demo`,
    name: "Demo",
    icon: IconNames.LAB_TEST,
    scope: "user", // Role-based access
    display: true,
  },
  {
    id: "admin",
    parentId: "home",
    path: "",
    name: "Admin",
    icon: IconNames.SHIELD,
    scope: "admin",
    display: "admin",
  },
];
```

### Dynamic Routing

Support for dynamic routes with parameters:

```typescript
{
  id: "book",
  parentId: "demo",
  path: Dynamic, // Resolves to [isbn]
  name: "...",
  dynamic: true,
}
```

### Route Protection

Routes are automatically filtered based on user roles:

```tsx
const visibleRoutes = routes.filter(route => 
  hasAccess(currentUser, route.scope)
);
```

## Styling and Theming

### SCSS Modules

Each component uses SCSS modules for scoped styling:

```scss
// page.module.scss
.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  .section {
    padding: 1rem;
    border-radius: 4px;
  }
}
```

### Theme System

Dynamic theme switching with Blueprint.js integration:

```tsx
// Theme switching
const toggleTheme = () => {
  const newMode = mode === Mode.Dark ? Mode.Light : Mode.Dark;
  updatePreferences({ mode: newMode });
};
```

### Color Palettes

Configurable color palettes for data visualization:

```typescript
// src/utils/palette.ts
export const getPalette = (name: string, count: number) => {
  return generateColors(palettes[name], count);
};
```

## Development Workflow

### Prerequisites

- Node.js 22.x
- Yarn 4.x
- Running server instance (for GraphQL schema)

### Setup

1. **Install dependencies**
   ```bash
   cd client
   yarn install
   ```

2. **Generate GraphQL types**
   ```bash
   yarn compile:graphql
   ```

3. **Start development server**
   ```bash
   yarn start
   # or
   yarn dev
   ```

4. **Access the application**
   - Development: http://localhost:3000
   - Production: https://localhost (with Docker)

### Development Scripts

```bash
# Development server with hot reload
yarn dev
yarn start

# Production build and start
yarn build
yarn start:prod

# Code quality
yarn lint          # ESLint with auto-fix
yarn check         # TypeScript type checking
yarn check:watch   # Watch mode type checking

# Testing
yarn test          # Run tests
yarn test:watch    # Watch mode
yarn test:cov      # With coverage

# GraphQL code generation
yarn compile:graphql
```

### Environment Configuration

#### Development (`.env`)
```bash
# Public variables (available in browser)
NEXT_PUBLIC_TITLE=Skeleton
NEXT_PUBLIC_GRAPHQL_API=/graphql
NEXT_PUBLIC_GRAPHQL_WS=/graphql

# Development rewrites
REWRITE_AUTHJS_URL=http://localhost:3001/authjs
REWRITE_GRAPHQL_URL=http://localhost:3001/graphql
REWRITE_API_URL=http://localhost:3001/api
```

#### Production
Environment variables are injected via Docker containers and environment files.

## Testing

### Test Structure

The client uses Jest with React Testing Library for comprehensive testing:

```typescript
// Component testing example
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import UserProfile from './UserProfile';

const mocks = [
  {
    request: { query: READ_CURRENT },
    result: { data: { readCurrent: { id: '1', name: 'Test User' } } }
  }
];

test('renders user profile', async () => {
  render(
    <MockedProvider mocks={mocks}>
      <UserProfile />
    </MockedProvider>
  );
  
  expect(await screen.findByText('Test User')).toBeInTheDocument();
});
```

### Testing Utilities

#### Client Utilities (`src/utils/client.test.ts`)
```typescript
import { filter, getTerm, renderTerm } from './client';

describe('filter utility', () => {
  test('filters items by search term', () => {
    const items = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' }
    ];
    
    const result = filter(items, 'john', ['name', 'email']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('John Doe');
  });
});
```

### Test Configuration (`jest.config.ts`)

```typescript
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@local/(.*)$': '<rootDir>/../$1/src'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/graphql-codegen/**'
  ]
};
```

## Performance Optimization

### Next.js Optimizations

#### Code Splitting
```typescript
// Automatic code splitting with dynamic imports
const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Loading />,
  ssr: false
});
```

#### Image Optimization
```tsx
import Image from 'next/image';

<Image
  src="/images/logo.png"
  alt="Logo"
  width={300}
  height={100}
  priority
/>
```

### GraphQL Optimizations

#### Query Optimization
```typescript
// Use fragments for reusable field sets
const USER_FRAGMENT = graphql(`
  fragment UserInfo on User {
    id
    name
    email
  }
`);

// Efficient pagination
const { data, fetchMore } = useQuery(PAGINATED_USERS, {
  variables: { first: 10 }
});
```

#### Caching Strategy
```typescript
// Apollo Client cache configuration
const cache = new InMemoryCache({
  typePolicies: {
    User: {
      fields: {
        comments: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          }
        }
      }
    }
  }
});
```

### Bundle Optimization

#### Webpack Configuration (`next.config.js`)
```javascript
const nextConfig = {
  experimental: {
    parallelServerCompiles: true,
    webpackBuildWorker: true,
  },
  compiler: {
    styledComponents: true,
  }
};
```

## Production Deployment

### Docker Build

The client is containerized for production deployment:

```dockerfile
# Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### Build Configuration

#### Standalone Output
```javascript
// next.config.js
const nextConfig = {
  output: process.env.BUILD_OUTPUT === "standalone" ? "standalone" : undefined,
};
```

#### Static Export
```bash
# For static hosting
BUILD_OUTPUT=export yarn build
```

### Environment Variables

Production environment variables are managed through Docker Compose:

```yaml
# docker-compose.yml
services:
  client:
    environment:
      - NEXT_PUBLIC_TITLE=${TITLE}
      - NEXT_PUBLIC_GRAPHQL_API=/graphql
      - DATABASE_URL=${DATABASE_URL}
```

## Security Considerations

### Content Security Policy

Next.js headers configuration for security:

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval';"
          }
        ]
      }
    ];
  }
};
```

### Authentication Integration

The client integrates with the server's authentication system:

```tsx
// Protected route example
function ProtectedPage() {
  const { current } = useContext(CurrentContext);
  
  if (!current) {
    redirect('/auth/login');
  }
  
  return <AdminPanel />;
}
```

### CORS Configuration

Development CORS headers for API integration:

```javascript
// next.config.js development headers
async headers() {
  return ["/authjs/:path", "/graphql/:path", "/api/:path"].map(source => ({
    source,
    headers: [
      { key: "Access-Control-Allow-Credentials", value: "true" },
      { key: "Access-Control-Allow-Origin", value: "*" },
    ]
  }));
}
```

## Accessibility

### Blueprint.js Accessibility

The application leverages Blueprint.js's built-in accessibility features:

- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Focus Management**: Proper focus handling in modals and navigation
- **Color Contrast**: WCAG AA compliant color schemes

### Custom Accessibility Features

```tsx
// Accessible table implementation
<Table
  role="table"
  aria-label="User data table"
  columns={columns.map(col => ({
    ...col,
    'aria-sort': sortColumn === col.field ? sortDirection : 'none'
  }))}
/>
```

## Integration with Other Modules

### Common Module Integration

```typescript
// Using shared constants and utilities
import { Role, HttpStatus, deepFreeze } from '@local/common';

const userRole = Role.parse(current?.role);
const isAdmin = Role.granted(userRole?.name, 'admin');
```

### Prisma Integration

```typescript
// Type-safe database types
import { User, Feedback } from '@local/prisma';

interface UserProfileProps {
  user: User;
  feedbacks: Feedback[];
}
```

### Server API Integration

The client communicates with the server through:

- **GraphQL API**: Primary data interface with real-time subscriptions
- **REST API**: File uploads and authentication endpoints
- **WebSocket**: Real-time notifications and live updates

### Development Tips

#### Hot Reload Issues
- Restart the development server
- Clear browser cache
- Check for TypeScript errors

#### GraphQL Debugging
- Use Apollo Client DevTools
- Enable GraphQL Playground in development
- Check network requests in browser DevTools

#### Styling Issues
- Verify SCSS module imports
- Check Blueprint.js theme configuration
- Inspect CSS variables in DevTools

## Scripts Reference

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "yarn compile && next build",
    "start": "next dev",
    "start:dev": "next dev",
    "start:prod": "next start",
    "lint": "next lint",
    "check": "tsc --noEmit",
    "check:watch": "tsc --noEmit --incremental --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "compile": "yarn compile:graphql",
    "compile:graphql": "graphql-codegen -v"
  }
}
```

## Dependencies

### Runtime Dependencies

- **@apollo/client**: GraphQL client with caching and subscriptions
- **@blueprintjs/core**: Enterprise UI component library
- **@local/common**: Shared utilities and constants
- **@local/prisma**: Database types and client
- **next**: React framework with SSR and routing
- **react**: UI library for building components
- **maplibre-gl**: Open-source map rendering
- **echarts**: Data visualization library
- **sass**: CSS preprocessor for styling

### Development Dependencies

- **@graphql-codegen/cli**: GraphQL code generation
- **typescript**: Type-safe JavaScript development
- **jest**: Testing framework
- **@testing-library/react**: React component testing utilities
- **eslint**: Code linting and formatting

## Contributing

When contributing to the client module:

1. **Follow React Best Practices**: Use hooks, functional components, and proper state management
2. **Maintain Type Safety**: Ensure all components are properly typed
3. **Test Components**: Include tests for new components and features
4. **Follow Styling Conventions**: Use SCSS modules and Blueprint.js patterns
5. **Update GraphQL Types**: Regenerate types after schema changes
6. **Consider Accessibility**: Ensure new components are accessible
7. **Performance**: Consider bundle size and rendering performance

### Code Style Guidelines

- Use functional components with hooks
- Implement proper error boundaries
- Follow Blueprint.js design patterns
- Use TypeScript strict mode
- Maintain consistent file naming conventions
- Add JSDoc comments for complex components

---

<p align="center">
  <strong>Modern React frontend for the Skeleton App</strong><br>
  <em>Built with Next.js, TypeScript, and Blueprint.js</em>
</p>
