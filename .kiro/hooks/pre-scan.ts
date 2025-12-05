// Pre-scan hook - runs before repository scanning
import { HookContext } from '@necro/common';

export default async function preScanHook(ctx: HookContext): Promise<Record<string, unknown> | void> {
  const { repoPath, data } = ctx;
  
  console.log(`[Pre-Scan Hook] Starting scan for: ${repoPath}`);
  
  // Check if repository is accessible
  try {
    const fs = await import('node:fs/promises');
    await fs.access(repoPath);
  } catch (error) {
    console.error(`[Pre-Scan Hook] Repository not accessible: ${repoPath}`);
    return { continue: false, error: 'Repository not accessible' };
  }
  
  // Load steering constraints if available
  try {
    const path = await import('node:path');
    const YAML = await import('yaml');
    const fs = await import('node:fs/promises');
    
    const constraintsPath = path.join(repoPath, '.kiro', 'steering', 'constraints.yaml');
    const constraintsContent = await fs.readFile(constraintsPath, 'utf-8');
    const constraints = YAML.parse(constraintsContent);
    
    console.log(`[Pre-Scan Hook] Loaded ${constraints.constraints?.length || 0} steering constraints`);
    
    return {
      ...data,
      constraints: constraints.constraints,
      continue: true
    };
  } catch {
    // No constraints file, continue anyway
    return { ...data, continue: true };
  }
}
