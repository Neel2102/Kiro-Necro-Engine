# Requirements Document

## Introduction

The Kiro Necro-Engine is an AI-driven modernization platform that revives outdated GitHub repositories by scanning their code, generating structured upgrade plans, applying automated transformations, and producing polished pull requests. The system demonstrates deep integration with Kiro's capabilities including specs, hooks, steering, and MCP tools. The platform consists of a shared BoneCore foundation and two distinct applications (Revive-Web and Revive-CLI) that leverage the core modules, satisfying the Skeleton Crew architecture requirement.

## Glossary

- **BoneCore**: The shared foundational module library containing scanner, planner, transformer, reporter, integrations, and common utilities
- **Necro-Engine**: The complete system including BoneCore and both applications
- **Revive-Web**: The web-based user interface application for repository modernization
- **Revive-CLI**: The command-line interface application for repository modernization
- **Corruption Report**: A structured analysis document identifying outdated dependencies, deprecated APIs, and rotted components
- **Modernization Plan**: A structured roadmap detailing upgrade steps, transformations, and confidence scores
- **Repository Scanner**: The BoneCore module responsible for analyzing repository health and detecting issues
- **Transformation Engine**: The BoneCore module that applies automated code modifications
- **PR Generator**: The BoneCore module that creates branches, diffs, and pull request content
- **Deprecated API**: An API or function marked for removal or replaced by newer alternatives
- **Rotted Component**: A code component with missing documentation, failing tests, or obsolete configuration

## Requirements

### Requirement 1

**User Story:** As a developer, I want to scan a GitHub repository for modernization opportunities, so that I can identify what needs updating before investing time in manual analysis.

#### Acceptance Criteria

1. WHEN a user provides a valid GitHub repository URL, THE Repository Scanner SHALL clone the repository and analyze its contents
2. WHEN the Repository Scanner analyzes a repository, THE Repository Scanner SHALL detect all outdated dependencies in package.json, requirements.txt, and other dependency manifests
3. WHEN the Repository Scanner analyzes code files, THE Repository Scanner SHALL identify deprecated API usage patterns across JavaScript, TypeScript, and Python files
4. WHEN the Repository Scanner examines repository structure, THE Repository Scanner SHALL flag rotted components including missing documentation, failing test files, and obsolete configuration files
5. WHEN the Repository Scanner completes analysis, THE Repository Scanner SHALL produce a Corruption Report containing all identified issues with severity classifications

### Requirement 2

**User Story:** As a developer, I want the system to generate a structured modernization plan, so that I can understand the scope and sequence of required updates.

#### Acceptance Criteria

1. WHEN a Corruption Report is available, THE Modernization Planner SHALL generate a dependency bump plan listing all packages requiring updates
2. WHEN deprecated APIs are detected, THE Modernization Planner SHALL identify replacement APIs and create substitution mappings
3. WHEN structural issues are found, THE Modernization Planner SHALL suggest directory refactoring steps
4. WHEN documentation gaps are identified, THE Modernization Planner SHALL create documentation regeneration tasks
5. WHEN the Modernization Planner generates recommendations, THE Modernization Planner SHALL assign confidence scores between 0 and 100 to each proposed change

### Requirement 3

**User Story:** As a developer, I want the system to automatically apply code transformations, so that I can modernize my codebase without manual refactoring.

#### Acceptance Criteria

1. WHEN a JavaScript class component is detected, THE Transformation Engine SHALL convert it to a functional component with hooks
2. WHEN legacy Python async patterns are found, THE Transformation Engine SHALL replace them with modern async/await syntax
3. WHEN a README file is missing or incomplete, THE Transformation Engine SHALL generate a comprehensive README from scan results and repository metadata
4. WHEN repository metadata is incomplete, THE Transformation Engine SHALL populate missing fields including license, badges, and usage commands
5. WHEN transformations are applied, THE Transformation Engine SHALL preserve the original file structure and maintain git history compatibility

### Requirement 4

**User Story:** As a developer, I want the system to generate a pull request with all changes, so that I can review and merge the modernization updates efficiently.

#### Acceptance Criteria

1. WHEN transformations are complete, THE PR Generator SHALL create a new git branch with a descriptive name
2. WHEN changes are staged, THE PR Generator SHALL generate file diffs for all modified files
3. WHEN documentation is needed, THE PR Generator SHALL create a Roadmap.md file describing all applied changes
4. WHEN a README is regenerated, THE PR Generator SHALL include the updated README in the pull request
5. WHEN the pull request is prepared, THE PR Generator SHALL generate formatted PR text describing the modernization changes performed

### Requirement 5

**User Story:** As a developer, I want to use a web interface to modernize repositories, so that I can access the Necro-Engine without installing command-line tools.

#### Acceptance Criteria

1. WHEN a user accesses Revive-Web, THE Revive-Web SHALL display a repository URL input field and a submission button
2. WHEN a user submits a repository URL, THE Revive-Web SHALL invoke the Repository Scanner and display scan progress
3. WHEN scan results are available, THE Revive-Web SHALL render the Corruption Report with visual indicators for issue severity
4. WHEN a user requests a modernization plan, THE Revive-Web SHALL display the generated roadmap with confidence scores
5. WHEN transformations are complete, THE Revive-Web SHALL present file diffs in a readable format with syntax highlighting

### Requirement 6

**User Story:** As a developer, I want to use a command-line interface to modernize repositories, so that I can integrate the Necro-Engine into my existing development workflow.

#### Acceptance Criteria

1. WHEN a user executes the scan command with a repository path, THE Revive-CLI SHALL analyze the repository and output the Corruption Report to the terminal
2. WHEN a user executes the plan command with a repository path, THE Revive-CLI SHALL generate and display the Modernization Plan
3. WHEN a user executes the pr command with a repository path, THE Revive-CLI SHALL apply transformations and create a pull request branch
4. WHEN the Revive-CLI processes commands, THE Revive-CLI SHALL display progress indicators and status messages
5. WHEN errors occur during CLI operations, THE Revive-CLI SHALL output clear error messages with actionable guidance

### Requirement 7

**User Story:** As a system architect, I want BoneCore to provide reusable modules, so that both Revive-Web and Revive-CLI can share core functionality without code duplication.

#### Acceptance Criteria

1. WHEN either application requires scanning functionality, THE BoneCore SHALL provide a scanner module with a consistent API
2. WHEN either application requires planning functionality, THE BoneCore SHALL provide a planner module with a consistent API
3. WHEN either application requires transformation functionality, THE BoneCore SHALL provide a transformer module with a consistent API
4. WHEN either application requires reporting functionality, THE BoneCore SHALL provide a reporter module with a consistent API
5. WHEN either application requires external integrations, THE BoneCore SHALL provide an integrations module supporting GitHub MCP and filesystem operations

### Requirement 8

**User Story:** As a developer, I want the system to integrate with Kiro specs, so that modernization rules can be configured and customized declaratively.

#### Acceptance Criteria

1. WHEN the Necro-Engine initializes, THE Necro-Engine SHALL load modernization rules from .kiro/specs/modernization-spec.yaml
2. WHEN dependency upgrade rules are defined in the spec, THE Modernization Planner SHALL apply those rules during plan generation
3. WHEN language-specific transformation rules are defined in the spec, THE Transformation Engine SHALL apply those rules during code modification
4. WHEN documentation rules are defined in the spec, THE Reporter SHALL follow those rules during README generation
5. WHEN the spec file is updated, THE Necro-Engine SHALL reload configuration without requiring application restart

### Requirement 9

**User Story:** As a developer, I want the system to use Kiro hooks, so that I can extend and customize the modernization workflow at key execution points.

#### Acceptance Criteria

1. WHEN the Repository Scanner begins analysis, THE Necro-Engine SHALL execute the pre-scan hook with repository context
2. WHEN the Repository Scanner completes analysis, THE Necro-Engine SHALL execute the post-scan hook with scan results
3. WHEN the Transformation Engine begins applying changes, THE Necro-Engine SHALL execute the pre-transform hook with the modernization plan
4. WHEN the Reporter generates output, THE Necro-Engine SHALL execute the post-report hook with report content
5. WHEN any hook returns modified data, THE Necro-Engine SHALL use the modified data in subsequent processing steps

### Requirement 10

**User Story:** As a developer, I want the system to follow Kiro steering guidelines, so that generated code and documentation maintain consistent quality and style.

#### Acceptance Criteria

1. WHEN BoneCore modules are developed, THE Necro-Engine SHALL enforce architectural separation as defined in .kiro/steering/architecture.md
2. WHEN code transformations are applied, THE Transformation Engine SHALL follow coding style rules defined in .kiro/steering/coding-style.md
3. WHEN the Transformation Engine generates new code, THE Transformation Engine SHALL use modern idiomatic patterns specified in steering documents
4. WHEN documentation is generated, THE Reporter SHALL apply formatting and structure guidelines from steering documents
5. WHEN steering documents are updated, THE Necro-Engine SHALL apply new guidelines to subsequent operations

### Requirement 11

**User Story:** As a developer, I want the system to use MCP integrations, so that it can interact with GitHub and the filesystem reliably.

#### Acceptance Criteria

1. WHEN the Repository Scanner needs to clone a repository, THE Necro-Engine SHALL use GitHub MCP tools to access repository data
2. WHEN the Repository Scanner reads local files, THE Necro-Engine SHALL use filesystem MCP tools for file operations
3. WHEN the PR Generator creates a branch, THE Necro-Engine SHALL use GitHub MCP tools to perform git operations
4. WHEN the Transformation Engine writes modified files, THE Necro-Engine SHALL use filesystem MCP tools to persist changes
5. WHEN MCP operations fail, THE Necro-Engine SHALL handle errors gracefully and provide meaningful error messages

### Requirement 12

**User Story:** As a developer, I want the system to support multiple programming languages, so that I can modernize diverse codebases.

#### Acceptance Criteria

1. WHEN JavaScript files are analyzed, THE Repository Scanner SHALL detect outdated React patterns and deprecated Node.js APIs
2. WHEN TypeScript files are analyzed, THE Repository Scanner SHALL identify type definition issues and deprecated TypeScript features
3. WHEN Python files are analyzed, THE Repository Scanner SHALL detect legacy async patterns and deprecated module imports
4. WHEN the Transformation Engine processes JavaScript files, THE Transformation Engine SHALL apply React component modernization transformations
5. WHEN the Transformation Engine processes Python files, THE Transformation Engine SHALL apply async/await pattern transformations

### Requirement 13

**User Story:** As a developer, I want the system to provide visual feedback during operations, so that I can understand progress and identify issues quickly.

#### Acceptance Criteria

1. WHEN Revive-Web displays scan results, THE Revive-Web SHALL render tombstone cards for deprecated modules with visual severity indicators
2. WHEN Revive-Web shows the modernization plan, THE Revive-Web SHALL display confidence scores with color-coded visual representations
3. WHEN Revive-Web presents file diffs, THE Revive-Web SHALL highlight additions in green and deletions in red
4. WHEN the Revive-CLI processes operations, THE Revive-CLI SHALL display progress bars or spinners for long-running tasks
5. WHEN operations complete successfully, THE Revive-CLI SHALL display success messages with thematic necromancy styling

### Requirement 14

**User Story:** As a system architect, I want the Skeleton Crew architecture to be enforced, so that the system demonstrates proper separation between shared core and application-specific code.

#### Acceptance Criteria

1. WHEN the project structure is examined, THE Necro-Engine SHALL contain a bonecore directory with scanner, planner, transformer, reporter, integrations, and common subdirectories
2. WHEN the project structure is examined, THE Necro-Engine SHALL contain an apps directory with revive-web and revive-cli subdirectories
3. WHEN Revive-Web is built, THE Revive-Web SHALL import only scanner, planner, and reporter modules from BoneCore
4. WHEN Revive-CLI is built, THE Revive-CLI SHALL import scanner, planner, transformer, and reporter modules from BoneCore
5. WHEN the skeleton-spec.yaml is validated, THE Necro-Engine SHALL conform to all structural requirements defined in the specification
