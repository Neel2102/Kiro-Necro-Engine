"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = preTransformHook;
async function preTransformHook(ctx) {
    const { data, repoPath } = ctx;
    const plan = data.plan;
    if (!plan) {
        console.log('[Pre-Transform Hook] No plan available');
        return data;
    }
    console.log(`[Pre-Transform Hook] Preparing to apply ${plan.tasks.length} tasks`);
    // Load modernization spec to check for disabled transforms
    try {
        const path = await Promise.resolve().then(() => __importStar(require('node:path')));
        const YAML = await Promise.resolve().then(() => __importStar(require('yaml')));
        const fs = await Promise.resolve().then(() => __importStar(require('node:fs/promises')));
        const specPath = path.join(repoPath, '.kiro', 'specs', 'modernization-spec.yaml');
        const specContent = await fs.readFile(specPath, 'utf-8');
        const spec = YAML.parse(specContent);
        // Filter out tasks for disabled rules
        const enabledRules = spec.rules?.filter((r) => r.enabled !== false) || [];
        const enabledRuleNames = new Set(enabledRules.map((r) => r.name));
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
    }
    catch {
        // No spec file, continue with original plan
        return data;
    }
}
