// Shared domain types and enums for BoneCore

export enum Severity {
  Info = 'info',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum Language {
  JavaScript = 'javascript',
  TypeScript = 'typescript',
  Python = 'python',
  Unknown = 'unknown',
}

export enum TaskType {
  Dependency = 'dependency',
  ApiReplacement = 'api-replacement',
  Refactor = 'refactor',
  Documentation = 'documentation',
}

export interface Issue {
  id: string;
  type: 'dependency' | 'api' | 'documentation' | 'security' | 'performance' | 'style';
  severity: Severity;
  title: string;
  description?: string;
  currentVersion?: string;
  targetVersion?: string;
  confidence?: number;
  location?: string;
  affectedFiles?: string[];
  recommendations?: string[];
  language?: Language;
  filePath?: string;
  line?: number;
  details?: Record<string, unknown> | string;
  metadata?: Record<string, unknown>;
}

export interface ScanSummary {
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info?: number;
}

export interface ScanMetadata {
  filesScanned: number;
  languages: string[];
  /** ISO timestamp string for when the scan completed. */
  timestamp: string;
  scanDuration?: number;
}

export interface ScanResult {
  repository: string;
  timestamp: string;
  summary: ScanSummary;
  issues: Issue[];
  metadata: Omit<ScanMetadata, 'timestamp'>;
}

export interface CorruptionReport {
  repository: string;
  scannedAt: string;
  issues: Issue[];
  summary?: {
    total: number;
    bySeverity: Record<Severity, number>;
  };
}

export interface ModernizationTask {
  id: string;
  type: TaskType;
  title: string;
  description?: string;
  severity: Severity;
  confidence: number; // 0-100
  files?: string[];
  metadata?: Record<string, unknown>;
}

export interface ModernizationPlan {
  repository: string;
  generatedAt: string;
  tasks: ModernizationTask[];
}

export interface Repository {
  name: string;
  fullName: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  license?: string | null;
  createdAt: string;
  updatedAt: string;
  defaultBranch: string;
  private: boolean;
  archived: boolean;
  disabled: boolean;
}

export interface RepositoryContent {
  name: string;
  path: string;
  type: string;
  size: number;
  url: string;
  downloadUrl: string | null;
  gitUrl: string;
  sha: string;
}

export interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  url: string;
  htmlUrl: string;
  labels: string[];
  user: {
    login: string;
    id: number;
    avatarUrl: string;
    htmlUrl: string;
  };
  pullRequest?: {
    url: string;
    htmlUrl: string;
    diffUrl: string;
    patchUrl: string;
  };
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
  resource: string;
}

export interface TransformResult {
  repository: string;
  appliedAt: string;
  modifiedFiles: string[];
  warnings?: string[];
  errors?: string[];
}

export interface ModernizationSpecRule {
  name: string;
  description?: string;
  enabled?: boolean;
  languages?: Language[];
  options?: Record<string, unknown>;
}

export interface ModernizationSpec {
  version: string;
  rules: ModernizationSpecRule[];
  dependencies?: Record<string, unknown>;
}

export interface KiroModernizationConfig {
  dependencyUpgrades?: {
    npm?: string;
    pip?: string;
  };
  javascript?: {
    convertClassComponents?: boolean;
    updateReactApis?: boolean;
  };
  python?: {
    fixLegacyAsync?: boolean;
    replaceDeprecatedModules?: boolean;
  };
  documentation?: {
    regenerateReadme?: boolean;
    generateRoadmap?: boolean;
  };
}

export interface HookContext {
  repoPath: string;
  stage:
    | 'pre-scan'
    | 'post-scan'
    | 'pre-plan'
    | 'post-plan'
    | 'pre-transform'
    | 'post-transform'
    | 'pre-report'
    | 'post-report';
  data?: Record<string, unknown>;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface CommonConfig {
  specPath: string;
  logLevel: LogLevel;
}

