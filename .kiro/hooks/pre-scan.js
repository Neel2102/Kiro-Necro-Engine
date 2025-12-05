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
exports.default = preScanHook;
async function preScanHook(ctx) {
    const { repoPath, data } = ctx;
    console.log(`[Pre-Scan Hook] Starting scan for: ${repoPath}`);
    // Check if repository is accessible
    try {
        const fs = await Promise.resolve().then(() => __importStar(require('node:fs/promises')));
        await fs.access(repoPath);
    }
    catch (error) {
        console.error(`[Pre-Scan Hook] Repository not accessible: ${repoPath}`);
        return { continue: false, error: 'Repository not accessible' };
    }
    // Load steering constraints if available
    try {
        const path = await Promise.resolve().then(() => __importStar(require('node:path')));
        const YAML = await Promise.resolve().then(() => __importStar(require('yaml')));
        const fs = await Promise.resolve().then(() => __importStar(require('node:fs/promises')));
        const constraintsPath = path.join(repoPath, '.kiro', 'steering', 'constraints.yaml');
        const constraintsContent = await fs.readFile(constraintsPath, 'utf-8');
        const constraints = YAML.parse(constraintsContent);
        console.log(`[Pre-Scan Hook] Loaded ${constraints.constraints?.length || 0} steering constraints`);
        return {
            ...data,
            constraints: constraints.constraints,
            continue: true
        };
    }
    catch {
        // No constraints file, continue anyway
        return { ...data, continue: true };
    }
}
