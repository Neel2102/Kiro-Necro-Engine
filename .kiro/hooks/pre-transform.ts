// Pre-transform hook - runs before applying transformations
import { HookContext, ModernizationPlan } from '@necro/common';

export default async function preTransformHook(ctx: HookContext): Promise<Record<string, unknown> | void> {
  const { data, repoPath } = ctx;
  const plan = data.plan as ModernizationPlan | undefined;
  
  if (!plan) {
    console.log('[Pre-Transform Hook] No plan available');
    return data;
  }
  
  console.log(`[Pre-Transform Hook] Preparing to apply ${plan.tasks.length} tasks`);
  
  // Load modernization spec to check for disabled transforms
  try {
    const path = await import('node:path');
    const YAML = await import('yaml');
    const fs = await import('node:fs/promises');
    
    const specPath = path.join(repoPath, '.kiro', 'specs', 'modernization-spec.yaml');
    const specContent = await fs.readFile(specPath, 'utf-8');
    const spec = YAML.parse(specContent);
    
    // Filter out tasks for disabled rules
    const enabledRules = spec.rules?.filter((r: any) => r.enabled !== false) || [];
    const enabledRuleNames = new Set(enabledRules.map((r: any) => r.name));
    
    const filteredTasks = plan.tasks.filter(task => {
      // Map task types to rule names
      const ruleName = task.type === 'refactor' ? 'convert-class-to-function' :
                      task.type === 'documentation' ? 'update-readme' :
                      task.type;
      return enabledRuleNames.has(ruleName);
    });
    
    console.log(`[Pre-Transform Hook] Filtered to ${filteredTasks.length} enabled tasks`);
    
    return {
      ...data,
      plan: {
        ...plan,
        tasks: filteredTasks
      }
    };
  } catch {
    // No spec file, continue with original plan
    return data;
  }
}
