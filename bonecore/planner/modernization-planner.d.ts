import { ScanResult, Issue, Severity } from '../common/types';
export interface ModernizationRule {
    id: string;
    type: 'dependency' | 'code' | 'documentation' | 'security' | 'performance';
    description: string;
    pattern?: string | RegExp;
    replacement?: string;
    condition?: (issue: Issue) => boolean;
    priority: Severity;
    files?: string[];
    action: string;
}
export interface ModernizationPlan {
    repository: string;
    timestamp: string;
    rulesApplied: string[];
    tasks: Array<{
        id: string;
        type: string;
        description: string;
        priority: Severity;
        files: string[];
        action: string;
        metadata?: Record<string, any>;
    }>;
}
export declare class ModernizationPlanner {
    private rulesPath;
    private rules;
    private appliedRules;
    constructor(rulesPath: string);
    private ensureRulesDirExists;
    private loadRules;
    private validateRules;
    saveRules(): void;
    addRule(rule: ModernizationRule): void;
    removeRule(ruleId: string): boolean;
    private getDefaultRules;
    generatePlan(scanResults: ScanResult): ModernizationPlan;
    applyTransformations(plan: ModernizationPlan): Promise<{
        success: boolean;
        message: string;
    }>;
    private simulateTransformation;
    getAppliedRules(): string[];
    resetAppliedRules(): void;
}
//# sourceMappingURL=modernization-planner.d.ts.map