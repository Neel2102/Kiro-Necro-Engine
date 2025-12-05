export interface ScanResult {
  repository: string;
  timestamp: string;
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  issues: Issue[];
}

export interface Issue {
  id: string;
  type: 'dependency' | 'api' | 'documentation' | 'security' | 'performance' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  confidence?: number;
  affectedFiles: string[];
  recommendations: string[];
  // Optional fields that might not be present for all issue types
  currentVersion?: string;
  targetVersion?: string;
  location?: string;
}
