# Implementation Plan

- [x] 1. Set up project structure and tooling

  - Create monorepo directory structure with bonecore/ and apps/ directories
  - Initialize TypeScript configuration for BoneCore modules
  - Set up Vitest testing framework with fast-check for property-based testing
  - Configure package.json with workspace dependencies
  - _Requirements: 14.1, 14.2_

- [x] 2. Implement BoneCore common utilities

  - [x] 2.1 Create type definitions for core data models

    - Define CorruptionReport, ModernizationPlan, TransformResult interfaces
    - Define ModernizationSpec, HookContext, and configuration types
    - Create enums for Severity, Language, TaskType
    - _Requirements: 1.5, 2.5, 3.5_

  - [x] 2.2 Implement configuration loader

    - Create YAML parser for modernization-spec.yaml
    - Implement spec validation logic
    - Add hot-reload capability for spec changes
    - _Requirements: 8.1, 8.5_

  - [x] 2.3 Create logging and error handling utilities
    - Implement structured logger with levels (error, warn, info, debug)
    - Create error classes for different error categories
    - Add error formatting with actionable guidance
    - _Requirements: 6.5, 11.5_

- [x] 3. Implement integrations module

  - [x] 3.1 Create MCP client wrappers

    - Implement GitHub MCP client for repository operations
    - Implement filesystem MCP client for file operations
    - Add retry logic with exponential backoff
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 3.2 Write property test for MCP error handling

    - **Property 17: MCP error handling**
    - **Validates: Requirements 11.5**

  - [x] 3.3 Implement git operations wrapper
    - Create branch creation functionality
    - Implement diff generation
    - Add commit and staging operations
    - _Requirements: 4.1, 4.2_

- [x] 4. Implement Scanner module

  - [x] 4.1 Create dependency scanner

    - Implement package.json parser and version checker
    - Implement requirements.txt parser and version checker
    - Add support for other manifest formats (Gemfile, Cargo.toml)
    - _Requirements: 1.2_

  - [x] 4.2 Write property test for complete dependency detection

    - **Property 1: Complete dependency detection**
    - **Validates: Requirements 1.2**

  - [x] 4.3 Create deprecated API detector

    - Implement JavaScript/TypeScript pattern matching for React deprecated APIs
    - Implement Python pattern matching for legacy async and deprecated imports
    - Create extensible pattern registry
    - _Requirements: 1.3, 12.1, 12.2, 12.3_

  - [x] 4.4 Write property test for multi-language API detection

    - **Property 2: Multi-language API detection**
    - **Validates: Requirements 1.3**

  - [x] 4.5 Create structural analyzer

    - Implement missing documentation detector
    - Implement failing test detector
    - Implement obsolete config detector
    - _Requirements: 1.4_

  - [x] 4.6 Write property test for structural issue detection

    - **Property 3: Structural issue detection**
    - **Validates: Requirements 1.4**

  - [x] 4.7 Implement main scanner orchestrator

    - Combine all scanners into unified scan operation
    - Generate CorruptionReport with severity classifications
    - Add parallel file scanning for performance
    - _Requirements: 1.1, 1.5_

  - [x] 4.8 Write property test for report completeness
    - **Property 4: Report completeness**
    - **Validates: Requirements 1.5**

- [x] 5. Implement Planner module

  - [x] 5.1 Create task generator

    - Implement dependency upgrade task generation from CorruptionReport
    - Implement API replacement task generation
    - Implement refactoring task generation
    - Implement documentation task generation
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 5.2 Write property test for dependency task generation

    - **Property 5: Dependency task generation**
    - **Validates: Requirements 2.1**

  - [x] 5.3 Write property test for API replacement mapping

    - **Property 6: API replacement mapping**
    - **Validates: Requirements 2.2**

  - [x] 5.4 Implement confidence scoring algorithm

    - Create scoring logic based on issue severity and complexity
    - Ensure all scores are between 0 and 100
    - Add configurable scoring weights
    - _Requirements: 2.5_

  - [x] 5.5 Write property test for confidence score bounds

    - **Property 7: Confidence score bounds**
    - **Validates: Requirements 2.5**

  - [x] 5.6 Implement spec-driven planning

    - Load dependency upgrade rules from modernization spec
    - Apply spec rules to task generation
    - Support spec rule overrides
    - _Requirements: 8.2_

  - [x] 5.7 Write property test for spec-driven planning
    - **Property 8: Spec-driven planning**
    - **Validates: Requirements 8.2**

- [x] 6. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Transformer module

  - [x] 7.1 Create JavaScript transformer

    - Implement React class component to functional component converter
    - Parse class components using AST (babel/parser)
    - Generate functional components with hooks
    - Preserve component logic and lifecycle methods
    - _Requirements: 3.1, 12.4_

  - [x] 7.2 Write property test for class to functional transformation

    - **Property 9: Class to functional component transformation**
    - **Validates: Requirements 3.1, 12.4**

  - [x] 7.3 Create Python transformer

    - Implement legacy async pattern detector
    - Convert old async patterns to async/await syntax
    - Handle edge cases (nested callbacks, error handling)
    - _Requirements: 3.2, 12.5_

  - [x] 7.4 Write property test for Python async modernization

    - **Property 10: Python async modernization**
    - **Validates: Requirements 3.2, 12.5**

  - [x] 7.5 Create README generator

    - Implement template-based README generation
    - Extract repository metadata (name, description, dependencies)
    - Generate installation, usage, and contribution sections
    - _Requirements: 3.3_

  - [x] 7.6 Write property test for README generation completeness

    - **Property 11: README generation completeness**
    - **Validates: Requirements 3.3**

  - [x] 7.7 Implement metadata populator

    - Add missing license information
    - Generate badges (build status, version, license)
    - Add usage commands based on detected package manager
    - _Requirements: 3.4_

  - [x] 7.8 Create transformation orchestrator

    - Apply selected transformations from ModernizationPlan
    - Preserve file structure and paths
    - Handle transformation errors gracefully
    - Track modified files for reporting
    - _Requirements: 3.5_

  - [x] 7.9 Write property test for file structure preservation

    - **Property 12: File structure preservation**
    - **Validates: Requirements 3.5**

  - [x] 7.10 Implement spec-driven transformations

    - Load transformation rules from modernization spec
    - Apply language-specific rules conditionally
    - Support enabling/disabling specific transformations
    - _Requirements: 8.3_

  - [x] 7.11 Write property test for spec-driven transformations
    - **Property 13: Spec-driven transformations**
    - **Validates: Requirements 8.3**

- [x] 8. Implement Reporter module

  - [x] 8.1 Create Roadmap.md generator

    - Generate markdown document describing all applied changes
    - Group changes by category (dependencies, APIs, structure)
    - Include before/after examples for key transformations
    - _Requirements: 4.3_

  - [x] 8.2 Write property test for roadmap generation

    - **Property 15: Roadmap generation**
    - **Validates: Requirements 4.3**

  - [x] 8.3 Create PR description formatter

    - Generate formatted PR text with change summary
    - Include thematic necromancy language
    - List all modified files and change types
    - _Requirements: 4.5_

  - [x] 8.4 Write property test for PR description formatting

    - **Property 16: PR description formatting**
    - **Validates: Requirements 4.5**

  - [x] 8.5 Implement diff generator

    - Generate file diffs for all modified files
    - Format diffs in unified diff format
    - Count additions and deletions
    - _Requirements: 4.2_

  - [x] 8.6 Write property test for diff completeness

    - **Property 14: Diff completeness**
    - **Validates: Requirements 4.2**

  - [x] 8.7 Create PR generator orchestrator
    - Create git branch with descriptive name
    - Stage all modified files
    - Generate Roadmap.md and include in PR
    - Combine all reporting components
    - _Requirements: 4.1, 4.4_

- [x] 9. Implement hook execution system

  - [x] 9.1 Create hook loader and executor

    - Load hook files from .kiro/hooks/ directory
    - Execute hooks at appropriate lifecycle points
    - Pass correct context to each hook type
    - Handle hook errors gracefully
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 9.2 Write property test for pre-scan hook execution

    - **Property 20: Pre-scan hook execution**
    - **Validates: Requirements 9.1**

  - [x] 9.3 Write property test for post-scan hook execution

    - **Property 21: Post-scan hook execution**
    - **Validates: Requirements 9.2**

  - [x] 9.4 Implement hook data flow

    - Accept modified data from hooks
    - Pass modified data to subsequent processing steps
    - Validate hook return values
    - _Requirements: 9.5_

  - [x] 9.5 Write property test for hook data modification
    - **Property 22: Hook data modification**
    - **Validates: Requirements 9.5**

- [x] 10. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Revive-CLI application

  - [x] 11.1 Set up CLI framework

    - Initialize Commander.js with command structure
    - Add global options (verbose, output format)
    - Implement colored output with chalk
    - Add progress indicators with ora
    - _Requirements: 6.4, 13.4_

  - [x] 11.2 Implement scan command

    - Accept repository path argument
    - Call BoneCore scanner module
    - Format and display CorruptionReport to terminal
    - Handle errors with clear messages
    - _Requirements: 6.1_

  - [x] 11.3 Write property test for CLI scan output validity

    - **Property 23: CLI scan output validity**
    - **Validates: Requirements 6.1**

  - [x] 11.4 Implement plan command

    - Accept repository path argument
    - Call BoneCore scanner and planner modules
    - Display ModernizationPlan with confidence scores
    - Show task priorities and affected files
    - _Requirements: 6.2_

  - [x] 11.5 Implement apply command

    - Accept repository path and optional task selection
    - Call BoneCore transformer module
    - Display transformation progress
    - Show summary of applied changes
    - _Requirements: 6.3_

  - [x] 11.6 Implement pr command

    - Accept repository path argument
    - Execute full workflow (scan → plan → transform → report)
    - Create git branch and generate PR
    - Display PR URL and summary
    - _Requirements: 6.3_

  - [x] 11.7 Write property test for CLI error messaging

    - **Property 24: CLI error messaging**
    - **Validates: Requirements 6.5**

  - [x] 11.8 Add thematic styling to CLI output
    - Add necromancy-themed success messages
    - Use spectral color scheme (green accents)
    - Add ASCII art for major operations
    - _Requirements: 13.5_

- [ ] 12. Implement Revive-Web application

  - [ ] 12.1 Set up Next.js project structure

    - Initialize Next.js 14 with App Router
    - Configure Tailwind CSS with custom theme
    - Set up server actions for backend logic
    - Create layout with necromancy theming
    - _Requirements: 5.1_

  - [ ] 12.2 Create home page with repository input

    - Build URL input form component
    - Add "Raise the Dead" submission button
    - Implement form validation
    - Add thematic visual elements (wispy effects)
    - _Requirements: 5.1_

  - [ ] 12.3 Implement scan server action

    - Create server action to call BoneCore scanner
    - Handle repository cloning and analysis
    - Return CorruptionReport to client
    - Implement error handling
    - _Requirements: 5.2_

  - [ ] 12.4 Create scan results page

    - Display CorruptionReport with visual indicators
    - Render tombstone cards for deprecated modules
    - Show severity with color-coded badges
    - Add navigation to planning step
    - _Requirements: 5.3, 13.1_

  - [ ] 12.5 Write property test for tombstone card rendering

    - **Property (Web): Tombstone cards for deprecated modules**
    - **Validates: Requirements 13.1**

  - [ ] 12.6 Create modernization plan page

    - Display ModernizationPlan with task list
    - Show confidence scores with color-coded visual representations
    - Allow task selection for transformation
    - Add "Apply Changes" action button
    - _Requirements: 5.4, 13.2_

  - [ ] 12.7 Implement transform and report server actions

    - Create server action to apply transformations
    - Create server action to generate reports
    - Handle long-running operations with streaming
    - Return TransformResult and GeneratedReport
    - _Requirements: 5.5_

  - [ ] 12.8 Create diff viewer page

    - Display file diffs with syntax highlighting
    - Highlight additions in green and deletions in red
    - Show file tree navigation
    - Add download PR button
    - _Requirements: 5.5, 13.3_

  - [ ] 12.9 Write property test for diff highlighting
    - **Property 25: Web UI diff highlighting**
    - **Validates: Requirements 13.3**

- [ ] 13. Create Kiro integration files

  - [ ] 13.1 Create modernization-spec.yaml

    - Define dependency upgrade rules for npm and pip
    - Define JavaScript transformation rules (class components, React APIs)
    - Define Python transformation rules (async patterns, deprecated modules)
    - Define documentation rules (README, roadmap)
    - _Requirements: 8.1_

  - [ ] 13.2 Create skeleton-spec.yaml

    - Define required BoneCore modules
    - Define app-specific module requirements
    - Specify structural validation rules
    - _Requirements: 14.5_

  - [ ] 13.3 Create hook files

    - Implement pre-scan.js hook with logging
    - Implement post-scan.js hook with timestamp addition
    - Implement pre-transform.js hook with logging
    - Implement post-report.js hook with footer addition
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 13.4 Create steering documents
    - Write architecture.md with separation guidelines
    - Write coding-style.md with TypeScript best practices
    - Document functional patterns and async workflows
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 14. Add visual polish and theming

  - [ ] 14.1 Implement necromancy theme for Revive-Web

    - Add wisp-like green accents to UI
    - Create floating spectral status tags
    - Design tombstone card components
    - Add subtle animations and transitions
    - _Requirements: 13.1, 13.2_

  - [ ] 14.2 Polish CLI output formatting
    - Add colored output for different message types
    - Implement progress bars for long operations
    - Add success/error icons
    - Format tables for report display
    - _Requirements: 13.4, 13.5_

- [ ] 15. Create documentation and demo materials

  - [ ] 15.1 Write comprehensive README.md

    - Add project overview and value proposition
    - Document installation instructions for both apps
    - Provide usage examples for CLI commands
    - Include screenshots of Web UI
    - Document Kiro integration features
    - _Requirements: All_

  - [ ] 15.2 Create demo repository

    - Set up sample "dead" repository with known issues
    - Include outdated dependencies
    - Add deprecated API usage examples
    - Include missing documentation
    - _Requirements: All_

  - [ ] 15.3 Prepare demo script
    - Write step-by-step demo flow
    - Prepare talking points for each feature
    - Time demo to fit 3-minute limit
    - Practice transitions between CLI and Web
    - _Requirements: All_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
