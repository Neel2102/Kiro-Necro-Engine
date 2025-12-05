"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = postScanHook;
async function postScanHook(ctx) {
    const { data } = ctx;
    const scanResult = data.scanResult;
    if (!scanResult) {
        console.log('[Post-Scan Hook] No scan result available');
        return data;
    }
    console.log(`[Post-Scan Hook] Scan completed for: ${scanResult.repository}`);
    console.log(`[Post-Scan Hook] Found ${scanResult.issues.length} issues`);
    // Apply steering constraints to filter/prioritize issues
    const constraints = data.constraints;
    if (constraints && constraints.length > 0) {
        console.log(`[Post-Scan Hook] Applying ${constraints.length} steering constraints`);
        // Filter issues based on constraints
        const filteredIssues = scanResult.issues.filter(issue => {
            // Check if issue matches any constraint preferences
            for (const constraint of constraints) {
                if (constraint.type === 'prefer' && issue.title.toLowerCase().includes(constraint.description?.toLowerCase())) {
                    // Boost priority for preferred patterns
                    issue.severity = 'high';
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
