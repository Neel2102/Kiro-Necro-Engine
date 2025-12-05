import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { Issue, Severity } from '@necro/common';

export async function analyzeDependencies(repoPath: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  
  try {
    // Check for Node.js projects
    const packageJsonPath = path.join(repoPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const nodeIssues = await analyzeNodeDependencies(packageJsonPath, repoPath);
      issues.push(...nodeIssues);
    }

    // Check for Python projects
    const requirementsPath = path.join(repoPath, 'requirements.txt');
    if (await fs.pathExists(requirementsPath)) {
      const pythonIssues = await analyzePythonDependencies(requirementsPath, repoPath);
      issues.push(...pythonIssues);
    }

    // Add support for other package managers here (e.g., pipenv, poetry, etc.)
    
  } catch (error) {
    console.error('Error analyzing dependencies:', error);
    issues.push(createErrorIssue('dependency-analysis-error', error));
  }

  return issues;
}

async function analyzeNodeDependencies(packageJsonPath: string, repoPath: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  
  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    const deps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {})
    };

    // Get outdated packages using npm outdated
    const outdatedPackages = await getOutdatedPackages(repoPath);
    
    for (const [name, version] of Object.entries(deps)) {
      const cleanVersion = String(version).replace(/^[^\d]/, '');
      const outdatedPkg = outdatedPackages.find(pkg => pkg.name === name);
      
      if (outdatedPkg) {
        issues.push(createDependencyIssue({
          name,
          currentVersion: cleanVersion,
          latestVersion: outdatedPkg.latest,
          isOutdated: true,
          isVulnerable: outdatedPkg.vulnerable,
          severity: outdatedPkg.vulnerable ? Severity.High : Severity.Medium,
          description: outdatedPkg.vulnerable 
            ? `Vulnerable dependency: ${name}@${cleanVersion}`
            : `Update available: ${name}@${cleanVersion} → ${outdatedPkg.latest}`,
          affectedFiles: [packageJsonPath],
          recommendations: [
            `Upgrade ${name} to version ${outdatedPkg.latest}`,
            'Run `npm audit fix` to fix vulnerabilities',
            'Update your lockfile after making changes'
          ]
        }));
      }
    }
  } catch (error) {
    console.error('Error analyzing Node.js dependencies:', error);
    issues.push(createErrorIssue('node-dependency-analysis-error', error, packageJsonPath));
  }
  
  return issues;
}

async function analyzePythonDependencies(requirementsPath: string, repoPath: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  
  try {
    const requirements = await fs.readFile(requirementsPath, 'utf-8');
    const deps = parseRequirements(requirements);
    
    // For Python, we'll use pip list --outdated
    const outdatedPackages = await getOutdatedPythonPackages(repoPath);
    
    for (const [name, version] of Object.entries(deps)) {
      const cleanVersion = version || 'unknown';
      const outdatedPkg = outdatedPackages.find(pkg => pkg.name.toLowerCase() === name.toLowerCase());
      
      if (outdatedPkg) {
        issues.push(createDependencyIssue({
          name,
          currentVersion: cleanVersion,
          latestVersion: outdatedPkg.latest,
          isOutdated: true,
          severity: Severity.Medium,
          description: `Update available: ${name} ${cleanVersion} → ${outdatedPkg.latest}`,
          affectedFiles: [requirementsPath],
          recommendations: [
            `Upgrade ${name} to version ${outdatedPkg.latest}`,
            'Update your requirements file after testing the new version',
            'Consider using a virtual environment for dependency management'
          ]
        }));
      }
    }
  } catch (error) {
    console.error('Error analyzing Python dependencies:', error);
    issues.push(createErrorIssue('python-dependency-analysis-error', error, requirementsPath));
  }
  
  return issues;
}

function parseRequirements(content: string): Record<string, string> {
  const deps: Record<string, string> = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    // Simple parsing - this can be enhanced for more complex requirements
    const match = line.match(/^([a-zA-Z0-9_-]+)([=<>!~]=?|!=|===?|~=)?\s*([^#\s]*)/);
    if (match) {
      const [, name, , version] = match;
      deps[name.toLowerCase()] = version || '*'; // Use * if no version specified
    }
  });
  
  return deps;
}

async function getOutdatedPackages(repoPath: string): Promise<Array<{
  name: string;
  current: string;
  wanted: string;
  latest: string;
  location: string;
  dependent: string;
  homepage: string;
  vulnerable: boolean;
}>> {
  try {
    // Run npm outdated --json to get outdated packages
    const result = execSync('npm outdated --json --long', { 
      cwd: repoPath,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    
    return Object.entries(JSON.parse(result)).map(([name, pkg]: [string, any]) => ({
      name,
      current: pkg.current,
      wanted: pkg.wanted,
      latest: pkg.latest,
      location: pkg.location,
      dependent: pkg.dependent,
      homepage: pkg.homepage,
      vulnerable: pkg.vulnerable || false
    }));
  } catch (error: any) {
    // If there are no outdated packages, npm exits with code 1
    if (error.status === 1 && error.stdout) {
      return [];
    }
    console.error('Error getting outdated packages:', error);
    return [];
  }
}

async function getOutdatedPythonPackages(repoPath: string): Promise<Array<{
  name: string;
  latest: string;
}>> {
  try {
    // Run pip list --outdated --format=json
    const result = execSync('pip list --outdated --format=json', { 
      cwd: repoPath,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    
    return JSON.parse(result).map((pkg: any) => ({
      name: pkg.name,
      latest: pkg.latest_version
    }));
  } catch (error) {
    console.error('Error getting outdated Python packages:', error);
    return [];
  }
}

interface DependencyInfo {
  name: string;
  currentVersion: string;
  latestVersion: string;
  isOutdated: boolean;
  isVulnerable?: boolean;
}

function createDependencyIssue(depInfo: DependencyInfo & { 
  affectedFiles: string[];
  recommendations: string[];
  description: string;
  severity?: Severity;
}): Issue {
  const {
    name,
    currentVersion,
    latestVersion,
    severity = Severity.Medium,
    description,
    affectedFiles,
    recommendations
  } = depInfo;
  
  return {
    id: `dep-${name}-${currentVersion}`,
    type: 'dependency',
    severity,
    title: `${name} (${currentVersion}) is outdated`,
    description,
    currentVersion,
    targetVersion: latestVersion,
    confidence: 0.9,
    affectedFiles,
    recommendations,
    metadata: {
      package: name,
      ...depInfo
    }
  };
}

function createErrorIssue(id: string, error: any, file?: string): Issue {
  return {
    id: `error-${id}`,
    type: 'dependency',
    severity: Severity.High,
    title: `Dependency analysis error: ${id}`,
    description: `Error during dependency analysis: ${error.message}`,
    affectedFiles: file ? [file] : [],
    recommendations: [
      'Check your network connection',
      'Verify package manager is installed and in PATH',
      'Check for syntax errors in package files'
    ],
    metadata: {
      error: error.message,
      stack: error.stack
    }
  };
}

// Export for testing
export const __test__ = {
  parseRequirements,
  getOutdatedPackages,
  getOutdatedPythonPackages,
  createDependencyIssue,
  createErrorIssue
};
