# Architecture Steering

## Core Principles

### Separation of Concerns
Maintain strict separation between BoneCore (business logic) and apps (presentation layer).

- **BoneCore modules** contain pure, reusable logic
- **Apps** (revive-web, revive-cli) only handle UI/CLI concerns
- No business logic should leak into presentation layers

### Module Design
All BoneCore modules must be:
- **Pure and composable** - no hidden side effects
- **Async-first** - use async/await for all I/O operations
- **Testable** - easy to unit test in isolation
- **Documented** - clear JSDoc comments on public APIs

### Data Flow
```
Scanner → Planner → Transformer → Reporter
   ↓         ↓          ↓            ↓
 Hooks   Hooks      Hooks        Hooks
```

Each stage:
1. Receives structured input
2. Performs its specific transformation
3. Returns structured output
4. Can be intercepted by hooks

### State Management
- Avoid implicit global state
- Pass context explicitly through function parameters
- Use immutable data structures where possible
- Prefer functional patterns over class-based OOP

### Error Handling
- Always catch and handle errors gracefully
- Log errors with context (module name, operation, input)
- Return structured error objects, not thrown exceptions
- Provide fallback behavior when operations fail

### Integration Points
- **GitHub API**: Use GitHubMcpClient from integrations
- **File System**: Use filesystem utilities from integrations
- **Git Operations**: Use GitClient from integrations
- Never directly import external APIs in core modules

## Module Responsibilities

### Scanner
- Analyzes repository structure
- Detects outdated dependencies
- Identifies deprecated APIs
- Finds missing documentation
- Returns CorruptionReport

### Planner
- Reads modernization specs
- Generates ModernizationPlan from CorruptionReport
- Applies confidence scoring
- Prioritizes tasks by severity

### Transformer
- Applies code transformations
- Respects spec enable/disable flags
- Supports multiple languages
- Returns TransformResult with modified files

### Reporter
- Generates roadmap documents
- Creates PR descriptions
- Formats diffs for display
- Returns ReportBundle

### Integrations
- Provides external service clients
- Handles API authentication
- Manages rate limiting
- Abstracts implementation details

## Extensibility

### Adding New Transforms
1. Add rule to `.kiro/specs/modernization-spec.yaml`
2. Implement transform function in transformer module
3. Add language detection if needed
4. Write tests

### Adding New Hooks
1. Create hook file in `.kiro/hooks/`
2. Export default async function
3. Accept HookContext parameter
4. Return modified context or void

### Adding New Apps
1. Create new directory under `/apps/`
2. Import BoneCore modules
3. Implement app-specific UI/CLI
4. Update skeleton-spec.yaml

## Anti-Patterns to Avoid

❌ **Don't** tightly couple modules
❌ **Don't** use mutation-heavy classes
❌ **Don't** nest callbacks deeply
❌ **Don't** mix business logic with presentation
❌ **Don't** hardcode configuration values
❌ **Don't** ignore error cases

✅ **Do** use functional composition
✅ **Do** prefer async/await
✅ **Do** validate inputs
✅ **Do** return structured data
✅ **Do** write self-documenting code
✅ **Do** handle edge cases gracefully
