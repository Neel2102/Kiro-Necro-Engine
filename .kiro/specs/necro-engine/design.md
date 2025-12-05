# Design Document

## Overview

The Kiro Necro-Engine is a modular, AI-driven platform for automated codebase modernization. The system follows a Skeleton Crew architecture with a shared BoneCore foundation providing reusable modules for scanning, planning, transformation, and reporting. Two distinct applications (Revive-Web and Revive-CLI) consume BoneCore modules to deliver web-based and command-line interfaces.

The design emphasizes:
- **Modularity**: Clear separation between core logic (BoneCore) and presentation layers (apps)
- **Extensibility**: Plugin-based transformation system supporting multiple languages
- **Integration**: Deep integration with Kiro specs, hooks, steering, and MCP tools
- **Practicality**: Focus on high-value transformations that demonstrate immediate utility

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Applications Layer                    │
├──────────────────────────┬──────────────────────────────┤
│      Revive-Web          │       Revive-CLI             │
│   (Next.js + React)      │    (Node.js CLI)             │
└──────────────┬───────────┴──────────────┬───────────────┘
               │                          │
               └──────────┬───────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    BoneCore Layer                        │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│ Scanner  │ Planner  │Transform │ Reporter │Integration │
│          │          │   er     │          │     s      │
└──────────┴──────────┴──────────┴──────────┴────────────┘
               │                          │
┌──────────────▼──────────────────────────▼──────────────┐
│              External Integrations                      │
├─────────────────────┬───────────────────────────────────┤
│   GitHub MCP        │   Filesystem MCP                  │
└─────────────────────┴───────────────────────────────────┘
               │                          │
┌──────────────▼──────────────────────────▼──────────────┐
│                  Kiro Features                          │
├──────────┬──────────┬──────────┬────────────────────────┤
│  Specs   │  Hooks   │ Steering │   MCP Tools            │
└──────────┴──────────┴──────────┴────────────────────────┘
```

### Module Responsibilities

**BoneCore Modules:**

1. **Scanner**: Analyzes repositories to detect issues
   - Dependency analysis (npm, pip, etc.)
   - Deprecated API detection
   - Structural health checks
   - Produces Corruption Reports

2. **Planner**: Generates modernization roadmaps
   - Prioritizes issues by severity and confidence
   - Creates actionable upgrade plans
   - Assigns confidence scores
   - Produces Modernization Plans

3. **Transformer**: Applies code modifications
   - JavaScript/TypeScript transformations
   - Python transformations
   - README generation
   - Metadata population

4. **Reporter**: Generates documentation and reports
   - Roadmap.md generation
   - PR description formatting
   - Visual report rendering

5. **Integrations**: External service clients
   - GitHub API wrapper
   - Filesystem operations
   - Git operations
   - Diff generation

6. **Common**: Shared utilities
   - Type definitions
   - Configuration loading
   - Logging
   - Error handling

**Application Modules:**

1. **Revive-Web**: Web interface
   - Uses: Scanner, Planner, Reporter
   - Next.js server actions for backend logic
   - React components for UI
   - Thematic necromancy styling

2. **Revive-CLI**: Command-line interface
   - Uses: Scanner, Planner, Transformer, Reporter
   - Commander.js for CLI framework
   - Progress indicators and formatted output
   - Direct filesystem access

## Components and Interfaces

### BoneCore Module Interfaces

#### Scanner Module

```typescript
// scanner/index.ts
export interface ScanOptions {
  repoPath: string;
  includeTests?: boolean;
  skipDependencies?: boolean;
}

export interface CorruptionReport {
  repoPath: string;
  timestamp: string;
  summary: {
    totalIssues: number;
    criticalIssues: number;
    warnings: number;
  };
  dependencies: DependencyIssue[];
  deprecatedAPIs: DeprecatedAPIUsage[];
  rottedComponents: RottedComponent[];
}

export interface DependencyIssue {
  name: string;
  currentVersion: string;
  latestVersion: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  manifest: string; // e.g., 'package.json'
}

export interface DeprecatedAPIUsage {
  file: string;
  line: number;
  api: string;
  replacement: string | null;
  language: 'javascript' | 'typescript' | 'python';
}

export interface RottedComponent {
  type: 'missing-docs' | 'failing-tests' | 'obsolete-config';
  path: string;
  description: string;
}

export async function scanRepository(options: ScanOptions): Promise<CorruptionReport>;
```

#### Planner Module

```typescript
// planner/index.ts
export interface PlanOptions {
  corruptionReport: CorruptionReport;
  specPath?: string; // Path to modernization-spec.yaml
}

export interface ModernizationPlan {
  repoPath: string;
  timestamp: string;
  tasks: ModernizationTask[];
  estimatedEffort: string;
}

export interface ModernizationTask {
  id: string;
  type: 'dependency-upgrade' | 'api-replacement' | 'refactor' | 'documentation';
  title: string;
  description: string;
  confidence: number; // 0-100
  priority: 'critical' | 'high' | 'medium' | 'low';
  affectedFiles: string[];
  details: Record<string, any>;
}

export async function generatePlan(options: PlanOptions): Promise<ModernizationPlan>;
```

#### Transformer Module

```typescript
// transformer/index.ts
export interface TransformOptions {
  repoPath: string;
  plan: ModernizationPlan;
  dryRun?: boolean;
  selectedTasks?: string[]; // Task IDs to apply
}

export interface TransformResult {
  success: boolean;
  appliedTasks: string[];
  modifiedFiles: string[];
  errors: TransformError[];
}

export interface TransformError {
  taskId: string;
  file: string;
  message: string;
}

export async function applyTransformations(options: TransformOptions): Promise<TransformResult>;
```

#### Reporter Module

```typescript
// reporter/index.ts
export interface ReportOptions {
  corruptionReport?: CorruptionReport;
  modernizationPlan?: ModernizationPlan;
  transformResult?: TransformResult;
  format: 'markdown' | 'html' | 'json';
}

export interface GeneratedReport {
  roadmap: string; // Markdown content
  prDescription: string; // Formatted PR text
  readme?: string; // Generated README if applicable
}

export async function generateReport(options: ReportOptions): Promise<GeneratedReport>;
```

#### Integrations Module

```typescript
// integrations/index.ts
export interface GitHubClient {
  cloneRepository(url: string, destination: string): Promise<void>;
  createBranch(repoPath: string, branchName: string): Promise<void>;
  createPullRequest(options: PROptions): Promise<string>; // Returns PR URL
}

export interface FilesystemClient {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  listFiles(directory: string, pattern?: string): Promise<string[]>;
}

export interface DiffGenerator {
  generateDiff(repoPath: string): Promise<FileDiff[]>;
}

export interface FileDiff {
  path: string;
  additions: number;
  deletions: number;
  diff: string; // Unified diff format
}
```

### Application Interfaces

#### Revive-Web

```typescript
// apps/revive-web/lib/actions.ts
export async function scanRepositoryAction(repoUrl: string): Promise<CorruptionReport>;
export async function generatePlanAction(report: CorruptionReport): Promise<ModernizationPlan>;
export async function generateReportAction(plan: ModernizationPlan): Promise<GeneratedReport>;
```

#### Revive-CLI

```typescript
// apps/revive-cli/commands/scan.ts
export async function scanCommand(repoPath: string, options: CLIOptions): Promise<void>;

// apps/revive-cli/commands/plan.ts
export async function planCommand(repoPath: string, options: CLIOptions): Promise<void>;

// apps/revive-cli/commands/apply.ts
export async function applyCommand(repoPath: string, options: CLIOptions): Promise<void>;

// apps/revive-cli/commands/pr.ts
export async function prCommand(repoPath: string, options: CLIOptions): Promise<void>;
```

## Data Models

### Core Data Structures

```typescript
// bonecore/common/types.ts

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type Language = 'javascript' | 'typescript' | 'python';

export type TaskType = 
  | 'dependency-upgrade' 
  | 'api-replacement' 
  | 'refactor' 
  | 'documentation';

export type ComponentType = 
  | 'missing-docs' 
  | 'failing-tests' 
  | 'obsolete-config';

export interface ModernizationSpec {
  version: string;
  name: string;
  description: string;
  rules: {
    dependencies?: DependencyRules;
    transforms?: TransformRules;
    docs?: DocumentationRules;
  };
}

export interface DependencyRules {
  npm?: {
    strategy: 'latest-compatible' | 'latest-major-safe';
    ignore?: string[];
  };
  pip?: {
    strategy: 'latest-compatible' | 'latest-major-safe';
    ignore?: string[];
  };
}

export interface TransformRules {
  javascript?: {
    convertClassComponents?: boolean;
    updateReactAPIs?: boolean;
  };
  python?: {
    fixLegacyAsync?: boolean;
    replaceDeprecatedModules?: boolean;
  };
}

export interface DocumentationRules {
  regenerateReadme?: boolean;
  generateRoadmap?: boolean;
}

export interface HookContext {
  repoPath?: string;
  scanResult?: CorruptionReport;
  plan?: ModernizationPlan;
  report?: GeneratedReport;
}

export interface HookResult {
  continue: boolean;
  [key: string]: any;
}
```

### Configuration Models

```typescript
// Configuration loaded from .kiro/specs/modernization-spec.yaml
export interface NecroEngineConfig {
  spec: ModernizationSpec;
  hooks: {
    preScan?: string;
    postScan?: string;
    preTransform?: string;
    postReport?: string;
  };
  steering: {
    architecture?: string;
    codingStyle?: string;
  };
}
```

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Scanner Properties

**Property 1: Complete dependency detection**
*For any* repository with dependency manifests (package.json, requirements.txt), the Scanner should detect all outdated dependencies listed in those manifests.
**Validates: Requirements 1.2**

**Property 2: Multi-language API detection**
*For any* code file in JavaScript, TypeScript, or Python containing known deprecated API patterns, the Scanner should identify and report those patterns.
**Validates: Requirements 1.3**

**Property 3: Structural issue detection**
*For any* repository with missing documentation, failing tests, or obsolete configs, the Scanner should flag these as rotted components.
**Validates: Requirements 1.4**

**Property 4: Report completeness**
*For any* scan operation, the produced CorruptionReport should contain all required fields (timestamp, summary, dependencies, deprecatedAPIs, rottedComponents) with valid data types.
**Validates: Requirements 1.5**

### Planner Properties

**Property 5: Dependency task generation**
*For any* CorruptionReport containing dependency issues, the ModernizationPlan should include corresponding dependency upgrade tasks.
**Validates: Requirements 2.1**

**Property 6: API replacement mapping**
*For any* deprecated API detected in the CorruptionReport, the ModernizationPlan should include a task with replacement API information.
**Validates: Requirements 2.2**

**Property 7: Confidence score bounds**
*For any* ModernizationPlan, all task confidence scores should be integers between 0 and 100 inclusive.
**Validates: Requirements 2.5**

**Property 8: Spec-driven planning**
*For any* modernization spec with dependency upgrade rules, the generated plan should apply those rules to dependency tasks.
**Validates: Requirements 8.2**

### Transformer Properties

**Property 9: Class to functional component transformation**
*For any* JavaScript file containing a React class component, the Transformer should produce a valid functional component with equivalent hooks.
**Validates: Requirements 3.1, 12.4**

**Property 10: Python async modernization**
*For any* Python file with legacy async patterns, the Transformer should produce code using modern async/await syntax.
**Validates: Requirements 3.2, 12.5**

**Property 11: README generation completeness**
*For any* repository missing a README, the Transformer should generate a README containing at minimum: title, description, installation instructions, and usage examples.
**Validates: Requirements 3.3**

**Property 12: File structure preservation**
*For any* transformation operation, the set of file paths before transformation should equal the set of file paths after transformation (no files added or removed, only modified).
**Validates: Requirements 3.5**

**Property 13: Spec-driven transformations**
*For any* modernization spec with language-specific transformation rules enabled, the Transformer should apply those transformations when processing files of that language.
**Validates: Requirements 8.3**

### Reporter Properties

**Property 14: Diff completeness**
*For any* TransformResult with N modified files, the generated report should contain exactly N file diffs.
**Validates: Requirements 4.2**

**Property 15: Roadmap generation**
*For any* PR generation operation, a Roadmap.md file should be created with non-empty content describing applied changes.
**Validates: Requirements 4.3**

**Property 16: PR description formatting**
*For any* PR generation operation, the PR description should be non-empty and contain information about the modernization changes.
**Validates: Requirements 4.5**

### Integration Properties

**Property 17: MCP error handling**
*For any* MCP operation that fails, the system should catch the error and return a result containing a meaningful error message.
**Validates: Requirements 11.5**

**Property 18: GitHub MCP usage for cloning**
*For any* repository clone operation, the system should invoke GitHub MCP tools rather than direct git commands.
**Validates: Requirements 11.1**

**Property 19: Filesystem MCP usage for file operations**
*For any* file read or write operation, the system should invoke filesystem MCP tools rather than direct Node.js fs calls.
**Validates: Requirements 11.2, 11.4**

### Hook Properties

**Property 20: Pre-scan hook execution**
*For any* scan operation where a pre-scan hook is configured, the hook should be executed with repository context before scanning begins.
**Validates: Requirements 9.1**

**Property 21: Post-scan hook execution**
*For any* scan operation where a post-scan hook is configured, the hook should be executed with scan results after scanning completes.
**Validates: Requirements 9.2**

**Property 22: Hook data modification**
*For any* hook that returns modified data, the modified data should be used in subsequent processing steps rather than the original data.
**Validates: Requirements 9.5**

### Application Properties

**Property 23: CLI scan output validity**
*For any* valid repository path provided to the CLI scan command, the terminal output should contain a valid CorruptionReport in the specified format.
**Validates: Requirements 6.1**

**Property 24: CLI error messaging**
*For any* error condition during CLI operations, the terminal output should contain an error message with actionable guidance.
**Validates: Requirements 6.5**

**Property 25: Web UI diff highlighting**
*For any* file diff displayed in Revive-Web, additions should be highlighted in green and deletions in red.
**Validates: Requirements 13.3**

## Error Handling

### Error Categories

1. **Input Validation Errors**
   - Invalid repository URLs
   - Inaccessible file paths
   - Malformed configuration files

2. **External Service Errors**
   - GitHub API failures
   - Network timeouts
   - Authentication issues

3. **Processing Errors**
   - Parsing failures
   - Transformation errors
   - Unsupported file types

4. **System Errors**
   - Insufficient permissions
   - Disk space issues
   - Memory constraints

### Error Handling Strategy

**Graceful Degradation:**
- Scanner: If one file fails to parse, continue scanning other files and report the error
- Planner: If confidence cannot be calculated for a task, assign a default low confidence (25)
- Transformer: If one transformation fails, continue with other transformations and report failures

**Error Reporting:**
- All errors should include:
  - Error type/category
  - Contextual information (file path, line number, etc.)
  - Actionable guidance for resolution
  - Stack trace (in debug mode only)

**Retry Logic:**
- Network operations: 3 retries with exponential backoff
- File operations: 2 retries with 100ms delay
- No retries for validation errors

**Logging:**
- Error level: All errors and failures
- Warn level: Degraded functionality, skipped operations
- Info level: Major operation milestones
- Debug level: Detailed execution flow

## Testing Strategy

### Unit Testing

We will use **Vitest** as our testing framework for TypeScript/JavaScript code. Unit tests will cover:

**Scanner Module:**
- Dependency detection for each manifest type (package.json, requirements.txt)
- Deprecated API pattern matching for each language
- Rotted component identification logic
- Report generation and formatting

**Planner Module:**
- Task generation from corruption reports
- Confidence score calculation
- Priority assignment logic
- Spec rule application

**Transformer Module:**
- Individual transformation functions (class→functional, async patterns)
- README template generation
- Metadata population logic
- File writing and preservation

**Reporter Module:**
- Roadmap markdown generation
- PR description formatting
- Diff formatting and syntax highlighting

**Integrations Module:**
- MCP client wrapper functions
- Error handling and retry logic
- Response parsing and validation

### Property-Based Testing

We will use **fast-check** for property-based testing in TypeScript. Each property-based test will:
- Run a minimum of 100 iterations
- Use smart generators that produce realistic test data
- Be tagged with a comment referencing the design document property

**Property Test Implementation Requirements:**
- Each correctness property MUST be implemented by a SINGLE property-based test
- Each test MUST be tagged using this format: `// Feature: necro-engine, Property {number}: {property_text}`
- Tests MUST use fast-check's `fc.assert` with `fc.property`
- Generators MUST produce valid, realistic data within the domain constraints

**Example Property Test Structure:**
```typescript
// Feature: necro-engine, Property 7: Confidence score bounds
test('all task confidence scores are between 0 and 100', () => {
  fc.assert(
    fc.property(
      corruptionReportGenerator(),
      async (report) => {
        const plan = await generatePlan({ corruptionReport: report });
        return plan.tasks.every(task => 
          task.confidence >= 0 && task.confidence <= 100
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

**Test Data Generators:**
We will create custom generators for:
- Repository structures with various file types
- Corruption reports with different issue combinations
- Modernization plans with varying task types
- Code snippets with deprecated patterns
- Configuration files with different rule combinations

### Integration Testing

Integration tests will verify:
- End-to-end workflows (scan → plan → transform → report)
- MCP tool integration with real GitHub API (using test repositories)
- Hook execution and data flow
- Spec and steering document loading and application
- Both applications (Web and CLI) using BoneCore modules

### Test Organization

```
bonecore/
  scanner/
    __tests__/
      scanner.test.ts
      scanner.properties.test.ts
  planner/
    __tests__/
      planner.test.ts
      planner.properties.test.ts
  transformer/
    __tests__/
      transformer.test.ts
      transformer.properties.test.ts
  reporter/
    __tests__/
      reporter.test.ts
      reporter.properties.test.ts
  integrations/
    __tests__/
      integrations.test.ts
      integrations.properties.test.ts
  __tests__/
    integration/
      end-to-end.test.ts
      hooks.test.ts
      specs.test.ts

apps/
  revive-web/
    __tests__/
      actions.test.ts
      components.test.ts
  revive-cli/
    __tests__/
      commands.test.ts
      cli.properties.test.ts
```

## Implementation Notes

### Technology Stack

**BoneCore:**
- TypeScript 5.x
- Node.js 20.x
- fast-check for property testing
- Vitest for unit testing
- yaml for spec parsing

**Revive-Web:**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Server Actions for backend logic

**Revive-CLI:**
- Commander.js for CLI framework
- chalk for colored output
- ora for spinners
- cli-progress for progress bars

**Integrations:**
- MCP SDK for GitHub and filesystem operations
- simple-git for git operations
- diff for diff generation

### Development Workflow

1. **Phase 1: BoneCore Foundation**
   - Set up monorepo structure
   - Implement common types and utilities
   - Create integration layer with MCP

2. **Phase 2: Core Modules**
   - Implement Scanner with dependency and API detection
   - Implement Planner with task generation
   - Implement Transformer with JS and Python transformations
   - Implement Reporter with markdown generation

3. **Phase 3: Applications**
   - Build Revive-CLI with all commands
   - Build Revive-Web with UI and server actions

4. **Phase 4: Kiro Integration**
   - Create modernization-spec.yaml and skeleton-spec.yaml
   - Implement hook execution system
   - Create steering documents
   - Wire up MCP tools

5. **Phase 5: Testing & Polish**
   - Write property-based tests for all properties
   - Write unit tests for edge cases
   - Add thematic styling and visual polish
   - Create demo repository and record video

### Performance Considerations

- **Lazy Loading**: Load transformation rules only when needed
- **Caching**: Cache parsed specs and steering documents
- **Streaming**: Stream large file operations rather than loading into memory
- **Parallelization**: Scan multiple files concurrently using worker threads
- **Incremental Processing**: Process repositories in chunks for large codebases

### Security Considerations

- **Input Validation**: Sanitize all repository URLs and file paths
- **Sandboxing**: Run transformations in isolated contexts
- **Rate Limiting**: Respect GitHub API rate limits
- **Credential Management**: Use environment variables for API tokens
- **Code Injection Prevention**: Validate all generated code before writing

### Extensibility Points

- **Language Plugins**: Add new language support by implementing scanner and transformer interfaces
- **Transformation Rules**: Add new transformation patterns via spec configuration
- **Hook System**: Extend workflow at pre/post execution points
- **Custom Reporters**: Add new output formats (PDF, HTML, etc.)
- **MCP Integrations**: Add support for additional MCP servers (GitLab, Bitbucket, etc.)
