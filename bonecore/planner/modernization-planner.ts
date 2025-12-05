// bonecore/planner/modernization-planner.ts
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

import { ScanResult, Issue, Severity } from '../common/types';
import yaml from 'js-yaml';

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

export class ModernizationPlanner {
  private rules: Record<string, ModernizationRule>;
  private appliedRules: Set<string> = new Set();

  constructor(private rulesPath: string) {
    this.rules = {};
    this.loadRules();
  }

  private ensureRulesDirExists() {
    const dir = dirname(this.rulesPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private loadRules() {
    try {
      this.ensureRulesDirExists();
      
      if (!existsSync(this.rulesPath)) {
        this.rules = this.getDefaultRules();
        this.saveRules();
      } else {
        const rulesData = yaml.load(readFileSync(this.rulesPath, 'utf8'));
        this.rules = this.validateRules(rulesData) || this.getDefaultRules();
      }
    } catch (error) {
      console.error('Error loading rules:', error);
      this.rules = this.getDefaultRules();
    }
  }

  private validateRules(rules: unknown): Record<string, ModernizationRule> | null {
    // Basic validation - in a real app, you'd want more thorough validation
    if (!rules || typeof rules !== 'object') return null;

    const entries = Object.entries(rules as Record<string, unknown>);
    const validated: Record<string, ModernizationRule> = {};

    for (const [id, rule] of entries) {
      if (
        rule &&
        typeof rule === 'object' &&
        'id' in rule &&
        'type' in rule &&
        'description' in rule
      ) {
        validated[id] = rule as ModernizationRule;
      }
    }

    return Object.keys(validated).length > 0 ? validated : null;
  }

  saveRules() {
    try {
      this.ensureRulesDirExists();
      writeFileSync(this.rulesPath, yaml.dump(this.rules));
    } catch (error) {
      console.error('Error saving rules:', error);
      throw error;
    }
  }

  addRule(rule: ModernizationRule) {
    this.rules[rule.id] = rule;
    this.saveRules();
  }

  removeRule(ruleId: string) {
    if (this.rules[ruleId]) {
      delete this.rules[ruleId];
      this.saveRules();
      return true;
    }
    return false;
  }

  private getDefaultRules(): Record<string, ModernizationRule> {
    const defaultRules: ModernizationRule[] = [
      {
        id: 'update-dependencies',
        type: 'dependency',
        description: 'Update outdated dependencies to their latest versions',
        priority: 'high',
        action: 'Run "npm update" or "yarn upgrade"',
        files: ['package.json', 'package-lock.json', 'yarn.lock']
      },
      {
        id: 'fix-deprecated-apis',
        type: 'code',
        description: 'Update deprecated API usages',
        priority: 'high',
        action: 'Review and update deprecated API usages'
      },
      {
        id: 'add-documentation',
        type: 'documentation',
        description: 'Add missing documentation',
        priority: 'medium',
        action: 'Add JSDoc comments and update README'
      },
      {
        id: 'security-fixes',
        type: 'security',
        description: 'Apply security-related fixes',
        priority: 'critical',
        action: 'Review and apply security patches'
      }
    ];

    return defaultRules.reduce((acc, rule) => {
      acc[rule.id] = rule;
      return acc;
    }, {} as Record<string, ModernizationRule>);
  }

  generatePlan(scanResults: ScanResult): ModernizationPlan {
    const plan: ModernizationPlan = {
      repository: scanResults.repository,
      timestamp: new Date().toISOString(),
      rulesApplied: [],
      tasks: []
    };

    // Process each rule and generate tasks
    Object.values(this.rules).forEach(rule => {
      const relevantIssues = scanResults.issues.filter(issue => {
        // Match issues by type or custom condition if provided
        return issue.type === rule.type && 
              (!rule.condition || rule.condition(issue));
      });

      if (relevantIssues.length > 0) {
        const affectedFiles = [...new Set(
          relevantIssues.flatMap(issue => issue.affectedFiles)
        )];

        plan.tasks.push({
          id: rule.id,
          type: rule.type,
          description: rule.description,
          priority: rule.priority,
          files: rule.files || affectedFiles,
          action: rule.action,
          metadata: {
            issueCount: relevantIssues.length,
            issues: relevantIssues.map(issue => issue.id)
          }
        });

        plan.rulesApplied.push(rule.id);
        this.appliedRules.add(rule.id);
      }
    });

    return plan;
  }

  async applyTransformations(plan: ModernizationPlan): Promise<{ success: boolean; message: string }> {
    try {
      // Track transformation progress
      let successCount = 0;
      const totalTasks = plan.tasks.length;

      for (const task of plan.tasks) {
        try {
          console.log(`Applying transformation: ${task.description}`);
          
          // In a real implementation, this would perform actual file transformations
          // For now, we'll just simulate the operation
          await this.simulateTransformation(task);
          
          successCount++;
          console.log(`✓ Completed: ${task.description}`);
        } catch (error) {
          console.error(`✗ Failed to apply transformation for ${task.id}:`, error);
        }
      }

      return {
        success: successCount === totalTasks,
        message: `Applied ${successCount} of ${totalTasks} transformations`
      };
    } catch (error) {
      console.error('Error during transformations:', error);
      return {
        success: false,
        message: `Failed to apply transformations: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async simulateTransformation(task: ModernizationPlan['tasks'][0]): Promise<void> {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real implementation, this would:
    // 1. Parse the source files
    // 2. Apply the appropriate transformations
    // 3. Write the changes back to disk
    
    // For now, we'll just log what would happen
    console.log(`[Simulation] Would apply transformation: ${task.action}`);
    console.log(`[Simulation] Files affected: ${task.files.join(', ')}`);
  }

  getAppliedRules(): string[] {
    return Array.from(this.appliedRules);
  }

  resetAppliedRules(): void {
    this.appliedRules.clear();
  }
}