import path from 'path';
import fs from 'fs/promises';
import yaml from 'js-yaml';
import { ModernizationPlan, CorruptionReport } from '@necro/common';
import { planModernization } from './planner';

export class PlannerService {
  private rulesPath: string;

  constructor(rulesPath?: string) {
    this.rulesPath = rulesPath || path.join(process.cwd(), '.kiro', 'modernization-rules.yaml');
  }

  async generatePlan(scanResults: CorruptionReport) {
    try {
      const plan = planModernization(scanResults);
      // Save the generated plan
      await this.savePlan(plan, path.join(process.cwd(), '.kiro', 'modernization-plan.json'));
      return plan;
    } catch (error) {
      throw new Error(`Failed to generate plan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async applyPlan(_plan: ModernizationPlan, _targetDir: string) {
    throw new Error('applyPlan is not implemented in PlannerService yet.');
  }

  async generateAndApplyPlan(scanResults: CorruptionReport, targetDir: string) {
    const plan = await this.generatePlan(scanResults);
    const result = await this.applyPlan(plan, targetDir);
    return { plan, result };
  }

  async listRules(): Promise<string[]> {
    try {
      const content = await fs.readFile(this.rulesPath, 'utf-8');
      const parsed = yaml.load(content) as unknown;
      if (!parsed || typeof parsed !== 'object') return [];
      const obj = parsed as Record<string, unknown>;
      return Object.keys(obj);
    } catch {
      // If file is missing or invalid, treat as no rules
      return [];
    }
  }

  async addRule(rulePath: string): Promise<boolean> {
    try {
      const raw = await fs.readFile(rulePath, 'utf-8');
      const parsed = yaml.load(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') return false;

      const ruleObj = parsed as Record<string, unknown>;
      const explicitId = typeof (ruleObj as any).id === 'string' ? (ruleObj as any).id as string : undefined;

      // Load existing rules (top-level YAML object)
      let existing: Record<string, unknown> = {};
      try {
        const current = await fs.readFile(this.rulesPath, 'utf-8');
        const currentParsed = yaml.load(current) as unknown;
        if (currentParsed && typeof currentParsed === 'object') {
          existing = currentParsed as Record<string, unknown>;
        }
      } catch {
        existing = {};
      }

      const id = explicitId ?? `rule-${Date.now()}`;
      existing[id] = ruleObj;

      const updated = yaml.dump(existing, { noRefs: true });
      await fs.mkdir(path.dirname(this.rulesPath), { recursive: true });
      await fs.writeFile(this.rulesPath, updated, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  async removeRule(_ruleId: string): Promise<boolean> {
    try {
      const content = await fs.readFile(this.rulesPath, 'utf-8');
      const parsed = yaml.load(content) as unknown;
      if (!parsed || typeof parsed !== 'object') return false;
      const obj = parsed as Record<string, unknown>;
      if (!Object.prototype.hasOwnProperty.call(obj, _ruleId)) {
        return false;
      }
      delete obj[_ruleId];
      const updated = yaml.dump(obj, { noRefs: true });
      await fs.mkdir(path.dirname(this.rulesPath), { recursive: true });
      await fs.writeFile(this.rulesPath, updated, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  async exportRules(outputPath: string) {
    try {
      const rules = await fs.readFile(this.rulesPath, 'utf-8');
      await fs.writeFile(outputPath, rules);
      return true;
    } catch (error) {
      throw new Error(`Failed to export rules: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async importRules(inputPath: string) {
    try {
      const rules = await fs.readFile(inputPath, 'utf-8');
      await fs.mkdir(path.dirname(this.rulesPath), { recursive: true });
      await fs.writeFile(this.rulesPath, rules);
      return true;
    } catch (error) {
      throw new Error(`Failed to import rules: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async savePlan(plan: any, outputPath: string) {
    try {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(plan, null, 2));
    } catch (error) {
      console.warn(`Warning: Could not save plan to ${outputPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default PlannerService;
