# Common Shared Library

<p align="center">
  <strong>Shared utilities, constants, and types for the Skeleton App</strong>
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/" target="_blank">
    <img src="https://img.shields.io/badge/TypeScript-5.7.3-3178C6?logo=typescript" alt="TypeScript Version" />
  </a>
  <a href="https://lodash.com/" target="_blank">
    <img src="https://img.shields.io/badge/Lodash-4.17.21-3492FF?logo=lodash" alt="Lodash Version" />
  </a>
  <a href="https://jestjs.io/" target="_blank">
    <img src="https://img.shields.io/badge/Jest-29.7.0-C21325?logo=jest" alt="Jest Version" />
  </a>
  <a href="https://nodejs.org/dist/latest-v22.x/" target="_blank">
    <img src="https://img.shields.io/badge/node-22.x-green.svg?logo=node.js" alt="Node.js Version" />
  </a>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Core Components](#core-components)
  - [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Constants System](#constants-system)
  - [Base Constant Class](#base-constant-class)
  - [Available Constants](#available-constants)
- [Utility Functions](#utility-functions)
  - [General Utilities](#general-utilities)
  - [Mathematical Utilities](#mathematical-utilities)
  - [Tree Data Structure Utilities](#tree-data-structure-utilities)
  - [TypeScript Type Utilities](#typescript-type-utilities)
- [Development Workflow](#development-workflow)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Adding New Constants](#adding-new-constants)
  - [Adding New Utilities](#adding-new-utilities)
- [Testing](#testing)
  - [Test Structure](#test-structure)
  - [Test Patterns](#test-patterns)
- [Integration with Other Modules](#integration-with-other-modules)
  - [Prisma Integration](#prisma-integration)
  - [Client Integration](#client-integration)
  - [Server Integration](#server-integration)
- [Performance Considerations](#performance-considerations)
  - [Optimization Strategies](#optimization-strategies)
  - [Best Practices](#best-practices)
- [Production Considerations](#production-considerations)
  - [Build Configuration](#build-configuration)
  - [Environment Variables](#environment-variables)
  - [Bundle Optimization](#bundle-optimization)
- [Scripts Reference](#scripts-reference)
- [Dependencies](#dependencies)
  - [Runtime Dependencies](#runtime-dependencies)
  - [Development Dependencies](#development-dependencies)
- [Contributing](#contributing)
  - [Code Style](#code-style)

---

## Overview

The Common module serves as the shared foundation for the Skeleton App, providing reusable utilities, constants, and type definitions used across both client and server applications. It ensures consistency, reduces code duplication, and maintains a single source of truth for shared functionality.

## Architecture

### Core Components

- **Constants**: Type-safe enumeration system for application-wide constants
- **Utilities**: Helper functions for common operations and data manipulation
- **Types**: Shared TypeScript type definitions and interfaces
- **Base Classes**: Abstract classes for consistent constant management
- **Integration**: Seamless integration with Prisma database layer

### Key Features

- **Type Safety**: Full TypeScript support with strict type checking
- **Immutability**: Deep-frozen constants to prevent accidental mutations
- **Extensibility**: Abstract base classes for creating new constant types
- **Testing**: Comprehensive test coverage for all utilities and constants
- **Performance**: Optimized utility functions with minimal overhead
- **Consistency**: Standardized patterns across the entire application

## Project Structure

```
common/
├── src/
│   ├── index.ts                 # Main exports and public API
│   ├── constants/               # Application constants and enums
│   │   ├── index.ts            # Constants type definitions
│   │   ├── base.ts             # Abstract base class for constants
│   │   ├── role.ts             # User role definitions
│   │   ├── httpStatus.ts       # HTTP status code constants
│   │   ├── log.ts              # Logging level constants
│   │   ├── feedbackStatus.ts   # Feedback status enumeration
│   │   ├── frequency.ts        # Frequency/interval constants
│   │   ├── normalization.ts    # Data normalization constants
│   │   └── *.test.ts           # Unit tests for constants
│   └── utils/                  # Utility functions and helpers
│       ├── index.ts            # Utility exports
│       ├── util.ts             # General utility functions
│       ├── math.ts             # Mathematical operations
│       ├── tree.ts             # Tree data structure utilities
│       ├── types.ts            # TypeScript type utilities
│       └── *.test.ts           # Unit tests for utilities
├── package.json                # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── tsconfig.build.json        # Build-specific TypeScript config
├── eslint.config.mjs          # ESLint configuration
└── README.md                  # This file
```

## Constants System

### Base Constant Class

The common module provides a robust constant management system built on an abstract `Base` class that ensures type safety and consistency:

```typescript
import { Base } from "@local/common";

// All constants extend the Base class
abstract class Base<T extends IConstant> implements IBase<T> {
  // Type-safe parsing and matching
  parse(value: string | number | IConstant): T | undefined;
  parseStrict(value: string | number | IConstant): T;

  // Iteration and access
  get values(): T[];
  get constants(): Record<string, T>;
  get length(): number;
}
```

### Available Constants

#### Role Management

```typescript
import { Role } from "@local/common";

// Access role constants
const adminRole = Role.Admin; // { name: 'admin', label: 'Admin', grants: ['user'] }
const userRole = Role.User; // { name: 'user', label: 'User', grants: [] }
const superRole = Role.Super; // { name: 'super', label: 'Super', grants: [] }

// Role hierarchy checking
Role.granted("admin", "user"); // true - admin role grants user permissions
Role.granted("user", "admin"); // false - user role doesn't grant admin permissions

// Parse roles from various formats
Role.parse("admin"); // Returns admin role object
Role.parse(0); // Returns first role by index
Role.parseStrict("invalid"); // Throws error for invalid role
```

#### HTTP Status Codes

```typescript
import { HttpStatus } from "@local/common";

// Standard HTTP status constants
HttpStatus.OK; // { name: 'ok', label: 'OK', code: 200 }
HttpStatus.NotFound; // { name: 'notFound', label: 'Not Found', code: 404 }
HttpStatus.InternalServerError; // { name: 'internalServerError', label: 'Internal Server Error', code: 500 }

// Parse by code or name
HttpStatus.parse(200); // Returns OK status
HttpStatus.parse("notFound"); // Returns 404 status
```

#### Logging Levels

```typescript
import { Log } from "@local/common";

// Logging level constants
Log.Error; // { name: 'error', label: 'Error', level: 0 }
Log.Warn; // { name: 'warn', label: 'Warning', level: 1 }
Log.Info; // { name: 'info', label: 'Information', level: 2 }
Log.Debug; // { name: 'debug', label: 'Debug', level: 3 }
```

#### Feedback Status

```typescript
import { FeedbackStatus } from "@local/common";

// Feedback workflow states
FeedbackStatus.Todo; // { name: 'todo', label: 'To Do' }
FeedbackStatus.InProgress; // { name: 'inProgress', label: 'In Progress' }
FeedbackStatus.Done; // { name: 'done', label: 'Done' }
```

#### Frequency Types

```typescript
import { Frequency } from "@local/common";

// Time interval constants
Frequency.Daily; // { name: 'daily', label: 'Daily', interval: 86400 }
Frequency.Weekly; // { name: 'weekly', label: 'Weekly', interval: 604800 }
Frequency.Monthly; // { name: 'monthly', label: 'Monthly', interval: 2592000 }
```

#### Text Normalization Methods

```typescript
import { Normalization } from "@local/common";

// Unicode normalization forms
Normalization.NFD; // { name: 'NFD', label: 'NFD' } - Canonical Decomposition
Normalization.NFC; // { name: 'NFC', label: 'NFC' } - Canonical Composition
Normalization.NFKD; // { name: 'NFKD', label: 'NFKD' } - Compatibility Decomposition
Normalization.NFKC; // { name: 'NFKC', label: 'NFKC' } - Compatibility Composition

// Case normalization
Normalization.Lowercase; // { name: 'LOWERCASE', label: 'Lowercase' }
Normalization.Uppercase; // { name: 'UPPERCASE', label: 'Uppercase' }

// Content filtering
Normalization.Letters; // { name: 'LETTERS', label: 'Letters' } - Keep only letters
Normalization.Numbers; // { name: 'NUMBERS', label: 'Numbers' } - Keep only numbers

// Whitespace handling
Normalization.Trim; // { name: 'TRIM', label: 'Trim' } - Remove leading/trailing spaces
Normalization.Compact; // { name: 'COMPACT', label: 'Compact' } - Collapse multiple spaces
Normalization.Concatenate; // { name: 'CONCATENATE', label: 'Concatenate' } - Remove all spaces

// Check compatibility between normalizations
Normalization.allowed("LOWERCASE", "UPPERCASE"); // false - mutually exclusive
Normalization.allowed("LETTERS", "TRIM"); // true - compatible

// Create processing functions
const processor = Normalization.process("NFC", "LOWERCASE", "TRIM");
const result = processor("  Héllo Wörld  "); // 'héllo wörld'

// Chain multiple normalizations
const multiProcessor = Normalization.process("LETTERS", "NUMBERS", "COMPACT");
const cleaned = multiProcessor("Hello123!@# World456"); // 'Hello123 World456'
```

## Utility Functions

### General Utilities

```typescript
import {
  typeofNonNullable,
  typeofEnum,
  deepFreeze,
  getDifference,
  parseBoolean,
  templateFormat,
  printEnvironment,
  delay,
  toOrdinal,
  chainable,
} from "@local/common";

// Type guards
typeofNonNullable(value); // Type guard for non-null/undefined values
typeofEnum(MyEnum)(value); // Type guard for enum values

// Object utilities
deepFreeze(object); // Recursively freeze object properties
getDifference(oldObj, newObj); // Get deep differences between objects

// String/parsing utilities
parseBoolean("true"); // true
parseBoolean("false"); // false
templateFormat("Hello {name}!", { name: "World" }); // 'Hello World!'

// Number utilities
toOrdinal(1); // '1st'
toOrdinal(22); // '22nd'
toOrdinal(103); // '103rd'

// Async utilities
await delay(1000); // Wait 1 second

// Environment utilities
printEnvironment(); // Log environment variables (masks sensitive data)

// Functional programming
chainable(value)
  .next((x) => x * 2)
  .next((x) => x + 1)
  .end(); // Chainable operations
```

### Mathematical Utilities

```typescript
import { lerp, clamp, invlerp, range } from "@local/common";

// Linear interpolation - blend between two values
lerp(3, 10, 0.5); // 6.5 - halfway between 3 and 10
lerp(0, 100, 0.25); // 25 - 25% of the way from 0 to 100

// Clamp - constrain a value within bounds
clamp(15, 0, 10); // 10 - clamps 15 to maximum of 10
clamp(-5, 0, 10); // 0 - clamps -5 to minimum of 0
clamp(5, 0, 10); // 5 - value already within bounds

// Inverse linear interpolation - get normalized position
invlerp(3, 10, 8); // ~0.714 - 8 is ~71% between 3 and 10
invlerp(0, 100, 25); // 0.25 - 25 is 25% between 0 and 100

// Range mapping - map value from one range to another
range(0, 5, 0, 100, 2.5); // 50 - maps 2.5 from [0,5] to [0,100]
range(0, 1, 3, 10, 0.714); // ~8 - maps 0.714 from [0,1] to [3,10]
range(10, 20, 0, 1, 15); // 0.5 - maps 15 from [10,20] to [0,1]

// Common use cases:
// Animation easing
const progress = invlerp(startTime, endTime, currentTime);
const currentValue = lerp(startValue, endValue, progress);

// Color blending
const blendedColor = {
  r: lerp(color1.r, color2.r, factor),
  g: lerp(color1.g, color2.g, factor),
  b: lerp(color1.b, color2.b, factor),
};

// Data visualization scaling
const screenX = range(dataMin, dataMax, 0, canvasWidth, dataValue);
const screenY = range(dataMin, dataMax, canvasHeight, 0, dataValue); // Inverted Y
```

### Tree Data Structure Utilities

```typescript
import { buildTree, Tree, Node } from "@local/common";

// Build tree from flat array with id/parentId relationships
const items = [
  { id: 1, parentId: undefined, name: "Root" },
  { id: 2, parentId: 1, name: "Child 1" },
  { id: 3, parentId: 1, name: "Child 2" },
  { id: 4, parentId: 2, name: "Grandchild 1" },
  { id: 5, parentId: 2, name: "Grandchild 2" },
];

// Default configuration (expects 'id' and 'parentId' properties)
const tree = buildTree(items);

// Custom configuration for different property names
const customItems = [
  { stringId: "1", stringParentId: undefined, name: "Root" },
  { stringId: "2", stringParentId: "1", name: "Child 1" },
];
const customTree = buildTree(customItems, {
  id: "stringId",
  parentId: "stringParentId",
});

// Tree navigation and queries
const rootNode = tree.root; // Get root node
const childNodes = rootNode.children; // Get direct children
const foundNode = tree.findNode(2); // Find node by ID

// Node relationship checking
const node = tree.findNode(4); // Grandchild node
const isRoot = node?.isRoot(); // false
const isLeaf = node?.isLeaf(); // true (no children)
const isBranch = node?.isBranch(); // false (has no children)

// Ancestry and descendant relationships
const ancestors = node?.getAncestors(); // [node, parent, grandparent, ...]
const descendants = rootNode.getDescendants(); // [root, all children recursively]

const parentNode = tree.findNode(2);
const isAncestor = node?.isAncestor(parentNode); // true - parent is ancestor
const isDescendant = parentNode?.isDescendant(node); // true - node is descendant

// Tree iteration - traverse all nodes depth-first
for (const node of tree) {
  console.log(node.data?.name); // Prints all node names
}

// Convert to array for processing
const allNodes = [...tree]; // Array of all nodes
const nodeData = allNodes.map((n) => n.data); // Extract data from all nodes

// Practical examples:

// Build organizational hierarchy
const employees = [
  { id: 1, parentId: undefined, name: "CEO", department: "Executive" },
  { id: 2, parentId: 1, name: "CTO", department: "Technology" },
  { id: 3, parentId: 1, name: "CFO", department: "Finance" },
  { id: 4, parentId: 2, name: "Dev Manager", department: "Technology" },
  { id: 5, parentId: 4, name: "Senior Dev", department: "Technology" },
];

const orgChart = buildTree(employees);

// Find all reports under CTO
const cto = orgChart.findNode(2);
const allReports = cto?.getDescendants().slice(1); // Exclude CTO themselves

// Check if someone reports to CTO (directly or indirectly)
const developer = orgChart.findNode(5);
const reportsToCtO = developer?.isAncestor(cto); // true

// Build file system tree
const files = [
  { id: 1, parentId: undefined, name: "/", type: "directory" },
  { id: 2, parentId: 1, name: "home", type: "directory" },
  { id: 3, parentId: 1, name: "etc", type: "directory" },
  { id: 4, parentId: 2, name: "user", type: "directory" },
  { id: 5, parentId: 4, name: "documents", type: "directory" },
  { id: 6, parentId: 5, name: "file.txt", type: "file" },
];

const fileSystem = buildTree(files);

// Get full path to a file
const file = fileSystem.findNode(6);
const pathParts = file
  ?.getAncestors()
  .reverse()
  .map((n) => n.data?.name);
const fullPath = pathParts?.join("/"); // '/home/user/documents/file.txt'

// Category/taxonomy trees
const categories = [
  { id: 1, parentId: undefined, name: "Electronics" },
  { id: 2, parentId: 1, name: "Computers" },
  { id: 3, parentId: 1, name: "Mobile Devices" },
  { id: 4, parentId: 2, name: "Laptops" },
  { id: 5, parentId: 2, name: "Desktops" },
];

const categoryTree = buildTree(categories);

// Find all subcategories under Electronics
const electronics = categoryTree.findNode(1);
const allSubcategories = electronics?.getDescendants().slice(1);
```

### TypeScript Type Utilities

```typescript
import { DeepPartial, DeepTyped } from "@local/common";

// Advanced TypeScript utility types
type PartialUser = DeepPartial<User>; // Make all properties optional recursively
type TypedUser = DeepTyped<User, string>; // Replace all property types recursively
```

## Development Workflow

### Prerequisites

- Node.js 22.x
- Yarn 4.x
- TypeScript 5.7.3

### Setup

1. **Install dependencies**

   ```bash
   cd common
   yarn install
   ```

2. **Build the module**

   ```bash
   yarn build
   ```

3. **Run tests**

   ```bash
   yarn test
   yarn test:cov    # With coverage
   yarn test:watch  # Watch mode
   ```

4. **Code quality**
   ```bash
   yarn lint        # ESLint with auto-fix
   yarn check       # TypeScript type checking
   ```

### Adding New Constants

1. **Create constant definition file**

   ```typescript
   // src/constants/myConstant.ts
   import { IBase, IConstant } from ".";
   import Base from "./base";

   interface IMyConstant extends IConstant {
     name: string;
     label: string;
     value: number;
   }

   class MyConstant extends Base<IMyConstant> implements IBase<IMyConstant> {
     constructor() {
       super([
         { name: "first", label: "First Option", value: 1 },
         { name: "second", label: "Second Option", value: 2 },
       ]);
     }

     // Static references
     First = this.parseStrict("first");
     Second = this.parseStrict("second");
   }

   const myConstant = new MyConstant();
   export default myConstant;
   ```

2. **Add tests**

   ```typescript
   // src/constants/myConstant.test.ts
   import MyConstant from "./myConstant";

   describe("MyConstant", () => {
     test("should parse constants correctly", () => {
       expect(MyConstant.parse("first")).toBeDefined();
       expect(MyConstant.First.value).toBe(1);
     });
   });
   ```

3. **Export from index**
   ```typescript
   // src/index.ts
   export { default as MyConstant } from "./constants/myConstant";
   ```

### Adding New Utilities

1. **Create utility function**

   ```typescript
   // src/utils/myUtil.ts
   export const myUtilityFunction = (input: string): string => {
     // Implementation
     return input.toUpperCase();
   };
   ```

2. **Add tests**

   ```typescript
   // src/utils/myUtil.test.ts
   import { myUtilityFunction } from "./myUtil";

   describe("myUtilityFunction", () => {
     test("should convert to uppercase", () => {
       expect(myUtilityFunction("hello")).toBe("HELLO");
     });
   });
   ```

3. **Export from utils index**
   ```typescript
   // src/utils/index.ts
   export * from "./myUtil";
   ```

## Testing

### Test Structure

The common module maintains comprehensive test coverage for all functionality:

```bash
# Run all tests
yarn test

# Run tests with coverage reporting
yarn test:cov

# Run tests in watch mode for development
yarn test:watch
```

### Test Patterns

#### Constant Testing

```typescript
import MyConstant from "./myConstant";

describe("MyConstant", () => {
  test("should have correct values", () => {
    expect(MyConstant.values).toHaveLength(2);
    expect(MyConstant.First.name).toBe("first");
  });

  test("should parse correctly", () => {
    expect(MyConstant.parse("first")).toBe(MyConstant.First);
    expect(MyConstant.parse(0)).toBe(MyConstant.First);
  });

  test("should throw on invalid parse strict", () => {
    expect(() => MyConstant.parseStrict("invalid")).toThrow();
  });
});
```

#### Utility Testing

```typescript
import { myUtilityFunction } from "./myUtil";

describe("myUtilityFunction", () => {
  test("should handle normal cases", () => {
    expect(myUtilityFunction("test")).toBe("TEST");
  });

  test("should handle edge cases", () => {
    expect(myUtilityFunction("")).toBe("");
    expect(myUtilityFunction("123")).toBe("123");
  });
});
```

## Integration with Other Modules

### Prisma Integration

The common module seamlessly integrates with the Prisma database layer:

```typescript
// Re-exports Prisma types and client
export * from "@local/prisma";

// Use in other modules
import { PrismaClient, User } from "@local/common";
```

### Client Integration

```typescript
// client/src/components/UserRole.tsx
import { Role } from '@local/common'

const UserRoleComponent = ({ userRole }: { userRole: string }) => {
  const role = Role.parse(userRole)
  return <span>{role?.label || 'Unknown'}</span>
}
```

### Server Integration

```typescript
// server/src/services/user.service.ts
import { Role, HttpStatus } from "@local/common";

export class UserService {
  validateRole(userRole: string) {
    const role = Role.parse(userRole);
    if (!role) {
      throw new HttpException("Invalid role", HttpStatus.BadRequest.code);
    }
    return role;
  }
}
```

## Performance Considerations

### Optimization Strategies

- **Immutable Constants**: All constants are deep-frozen to prevent mutations
- **Lazy Loading**: Constants are instantiated only when accessed
- **Efficient Parsing**: Optimized lookup algorithms for constant parsing
- **Memory Management**: Minimal memory footprint with shared references

### Best Practices

```typescript
// Good: Use static references for known constants
const adminRole = Role.Admin;

// Good: Parse when the value is dynamic
const userRole = Role.parse(dynamicRoleString);

// Avoid: Repeated parsing of known values
// const adminRole = Role.parse('admin') // Less efficient
```

## Production Considerations

### Build Configuration

```json
{
  "scripts": {
    "build": "tsc --project tsconfig.build.json",
    "build:watch": "tsc --project tsconfig.build.json --watch"
  }
}
```

### Environment Variables

The common module respects environment-specific configurations:

```bash
# Development
NODE_ENV=development

# Production
NODE_ENV=production
```

### Bundle Optimization

- **Tree Shaking**: Only imported utilities are included in bundles
- **Type Stripping**: TypeScript types are removed in production builds
- **Minification**: Built code is optimized for production deployment

## Scripts Reference

```json
{
  "scripts": {
    "build": "tsc --project tsconfig.build.json",
    "lint": "eslint \"src/**/*.ts\" --fix",
    "check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage"
  }
}
```

## Dependencies

### Runtime Dependencies

- **@local/prisma**: Database layer integration
- **@prisma/client**: Prisma database client
- **lodash**: Utility library for data manipulation
- **regex**: Advanced regular expression utilities

### Development Dependencies

- **TypeScript**: Type-safe JavaScript development
- **Jest**: Testing framework with coverage reporting
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting

## Contributing

When contributing to the common module:

1. **Maintain Type Safety**: All new code must be fully typed
2. **Add Tests**: Include comprehensive tests for new functionality
3. **Follow Patterns**: Use established patterns for constants and utilities
4. **Update Documentation**: Keep this README current with changes
5. **Consider Impact**: Changes affect both client and server modules

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration rules
- Maintain consistent naming conventions
- Add JSDoc comments for public APIs
- Ensure 100% test coverage for new code

---

<p align="center">
  <strong>Shared foundation for the Skeleton App</strong><br>
  <em>Built with TypeScript, tested with Jest</em>
</p>
