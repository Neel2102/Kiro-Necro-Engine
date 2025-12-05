# Necro-Engine

AI-driven modernization platform that revives outdated GitHub repositories.

## Project Structure

This is a monorepo containing:

### BoneCore (Shared Foundation)
- `bonecore/common` - Shared types, utilities, configuration, logging
- `bonecore/scanner` - Repository analysis and issue detection
- `bonecore/planner` - Modernization plan generation
- `bonecore/transformer` - Code transformations and modifications
- `bonecore/reporter` - Report and documentation generation
- `bonecore/integrations` - External service integrations (GitHub, filesystem, git)

### Applications
- `apps/revive-cli` - Command-line interface
- `apps/revive-web` - Web-based interface (Next.js)

## Getting Started

### Installation

```bash
npm install
```

### Development

Run CLI:
```bash
npm run dev:cli
```

Run Web:
```bash
npm run dev:web
```

### Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Technology Stack

- **TypeScript 5.x** - Type-safe development
- **Node.js 20.x** - Runtime environment
- **Vitest** - Unit testing framework
- **fast-check** - Property-based testing
- **Next.js 14** - Web application framework
- **Commander.js** - CLI framework

## Architecture

The Necro-Engine follows a Skeleton Crew architecture with clear separation between:
- Shared core logic (BoneCore modules)
- Application-specific code (Revive-CLI and Revive-Web)

Both applications consume BoneCore modules to provide different interfaces to the same modernization capabilities.
