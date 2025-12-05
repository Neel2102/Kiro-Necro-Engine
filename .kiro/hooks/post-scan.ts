// Post-scan hook - runs after repository scanning
import { HookContext, CorruptionReport } from '@necro/common';

export default async function postScanHook(ctx: HookContext): Promise<Record<string, unknown> | void> {
  const { data } = ctx;
  const scanResult = data.scanResult as CorruptionReport | undefined;
  
  if (!scanResult) {
    console.log('[Post-Scan Hook] No scan result available');
    return data;
  }
  
  console.log(`[Post-Scan Hook] Scan completed for: ${scanResult.repository}`);
  console.log(`[Post-Scan Hook] Found ${scanResult.issues.length} issues`);
  
  // Apply steering constraints to filter/prioritize issues
  const constraints = data.constraints as any[] | undefined;
  if (constraints && constraints.length > 0) {
    console.log(`[Post-Scan Hook] Applying ${constraints.length} steering constraints`);
    
    // Filter issues based on constraints
    const filteredIssues = scanResult.issues.filter(issue => {
      // Check if issue matches any constraint preferences
      for (const constraint of constraints) {
        if (constraint.type === 'prefer' && issue.title.toLowerCase().includes(constraint.description?.toLowerCase())) {
          // Boost priority for preferred patterns
          issue.severity = 'high' as any;
        }
      }
      return true;
    });
    
    return {
      ...data,
      scanResult: {
        ...scanResult,
        issues: filteredIssues
      }
    };
  }
  
  return data;
}
