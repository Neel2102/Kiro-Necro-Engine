export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export interface Issue {
    id: string;
    type: 'dependency' | 'api' | 'documentation' | 'security' | 'performance' | 'style';
    severity: Severity;
    title: string;
    description: string;
    currentVersion?: string;
    targetVersion?: string;
    confidence?: number;
    location?: string;
    affectedFiles: string[];
    recommendations: string[];
    details?: Record<string, any> | string;
    metadata?: Record<string, any>;
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
export interface DependencyInfo {
    name: string;
    currentVersion: string;
    latestVersion: string;
    isOutdated: boolean;
    isVulnerable: boolean;
    severity?: Severity;
    description?: string;
    homepage?: string;
    repository?: string;
    license?: string;
    deprecated?: boolean;
    deprecationReason?: string;
}
export interface RepositoryAnalysisOptions {
    deepScan?: boolean;
    includeDevDependencies?: boolean;
    includePeerDependencies?: boolean;
    includeOptionalDependencies?: boolean;
    maxDepth?: number;
    filePatterns?: string[];
    excludePatterns?: string[];
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
    license?: string;
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
    type: 'file' | 'dir' | 'symlink' | 'submodule';
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
    state: 'open' | 'closed' | 'all';
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
export interface GitHubSearchResult<T> {
    totalCount: number;
    incompleteResults: boolean;
    items: T[];
}
//# sourceMappingURL=types.d.ts.map