import fs from 'fs-extra';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { Issue, Severity } from '@necro/common';

// Documentation requirements
const DOCUMENTATION_REQUIREMENTS = {
  minFunctionLength: 5, // Lines
  minClassLength: 10,   // Lines
  requiredFileDocs: ['README.md', 'CONTRIBUTING.md', 'LICENSE'],
  minDocCoverage: 0.7   // 70% of functions/classes should have docs
};

export async function checkDocumentation(repoPath: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  
  try {
    // Check for required documentation files
    for (const docFile of DOCUMENTATION_REQUIREMENTS.requiredFileDocs) {
      const docPath = path.join(repoPath, docFile);
      if (!await fs.pathExists(docPath)) {
        issues.push(createMissingDocIssue(docFile, repoPath));
      }
    }

    // Get all JavaScript/TypeScript files
    const jsFiles = await findFilesByExtension(repoPath, ['.js', '.jsx', '.ts', '.tsx']);
    
    // Analyze each file for documentation
    for (const file of jsFiles) {
      const fileIssues = await analyzeFileDocumentation(file);
      issues.push(...fileIssues);
    }
    
    // Check for package.json documentation
    await checkPackageJsonDocumentation(repoPath, issues);
    
  } catch (error) {
    console.error('Error checking documentation:', error);
    issues.push(createErrorIssue('documentation-check-error', error));
  }
  
  return issues;
}

async function analyzeFileDocumentation(filePath: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'classProperties', 'decorators-legacy']
    });
    
    // Track documented and undocumented items
    const stats = {
      functions: { total: 0, documented: 0 },
      classes: { total: 0, documented: 0 },
      methods: { total: 0, documented: 0 }
    };
    
    // Analyze functions and classes
    traverse(ast, {
      FunctionDeclaration(path: any) {
        stats.functions.total++;
        if (hasJSDoc(path.node)) {
          stats.functions.documented++;
        } else if (isLargeFunction(path.node)) {
          issues.push(createMissingDocIssue('function', filePath, {
            name: path.node.id?.name || 'anonymous',
            line: path.node.loc?.start.line || 0,
            type: 'function'
          }));
        }
      },
      
      ClassDeclaration(path: any) {
        stats.classes.total++;
        if (hasJSDoc(path.node)) {
          stats.classes.documented++;
        } else if (isLargeClass(path.node)) {
          issues.push(createMissingDocIssue('class', filePath, {
            name: path.node.id?.name || 'anonymous',
            line: path.node.loc?.start.line || 0,
            type: 'class'
          }));
        }
        
        // Check class methods
        path.traverse({
          ClassMethod(path: any) {
            if (path.node.kind === 'constructor') return;
            
            stats.methods.total++;
            if (hasJSDoc(path.node)) {
              stats.methods.documented++;
            } else if (isLargeFunction(path.node)) {
              issues.push(createMissingDocIssue('method', filePath, {
                name: t.isIdentifier(path.node.key) ? path.node.key.name : 'anonymous',
                line: path.node.loc?.start.line || 0,
                type: 'method',
                className: t.isIdentifier(path.parentPath.node.id) ? path.parentPath.node.id.name : 'anonymous'
              }));
            }
          }
        });
      }
    });
    
    // Check documentation coverage
    const totalItems = stats.functions.total + stats.classes.total + stats.methods.total;
    const totalDocumented = stats.functions.documented + stats.classes.documented + stats.methods.documented;
    const coverage = totalItems > 0 ? totalDocumented / totalItems : 1;
    
    if (coverage < DOCUMENTATION_REQUIREMENTS.minDocCoverage) {
      issues.push({
        id: `low-doc-coverage-${filePath}`,
        type: 'documentation',
        severity: Severity.Medium,
        title: 'Low documentation coverage',
        description: `Only ${Math.round(coverage * 100)}% of functions/classes are documented (minimum ${Math.round(DOCUMENTATION_REQUIREMENTS.minDocCoverage * 100)}% required)`,
        affectedFiles: [filePath],
        recommendations: [
          'Add JSDoc comments to all exported functions and classes',
          'Document function parameters and return values',
          'Add usage examples for complex functions'
        ],
        metadata: {
          coverage,
          functions: stats.functions,
          classes: stats.classes,
          methods: stats.methods
        }
      });
    }
    
  } catch (error) {
    // Log a concise warning instead of a full stack trace to avoid noisy output
    const message = (error as Error)?.message ?? String(error);
    console.warn(`Documentation analyzer warning in ${filePath}: ${message}`);
    issues.push(createErrorIssue('file-documentation-error', error, filePath));
  }
  
  return issues;
}

async function checkPackageJsonDocumentation(repoPath: string, issues: Issue[]): Promise<void> {
  const packageJsonPath = path.join(repoPath, 'package.json');
  
  if (!await fs.pathExists(packageJsonPath)) {
    return;
  }
  
  try {
    const pkg = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    const missingFields: string[] = [];
    
    // Check for required fields
    if (!pkg.description) missingFields.push('description');
    if (!pkg.keywords?.length) missingFields.push('keywords');
    if (!pkg.repository?.url) missingFields.push('repository.url');
    if (!pkg.bugs?.url) missingFields.push('bugs.url');
    if (!pkg.homepage) missingFields.push('homepage');
    
    if (missingFields.length > 0) {
      issues.push({
        id: 'missing-package-json-fields',
        type: 'documentation',
        severity: Severity.Medium,
        title: 'Missing package.json documentation fields',
        description: `The following recommended fields are missing from package.json: ${missingFields.join(', ')}`,
        affectedFiles: [packageJsonPath],
        recommendations: [
          'Add a clear description of your package',
          'Include relevant keywords for discoverability',
          'Add repository and issue tracker URLs',
          'Add a homepage URL if applicable'
        ],
        metadata: {
          missingFields
        }
      });
    }
    
  } catch (error) {
    console.error('Error checking package.json documentation:', error);
    issues.push(createErrorIssue('package-json-docs-error', error, packageJsonPath));
  }
}

function hasJSDoc(node: any): boolean {
  return !!(
    node.leadingComments?.some((comment: any) => 
      comment.type === 'CommentBlock' && 
      comment.value.trim().startsWith('*')
    ) ||
    node.leadingComments?.some((comment: any) => 
      comment.type === 'CommentLine' && 
      comment.value.trim().startsWith('*')
    )
  );
}

function isLargeFunction(node: any): boolean {
  if (!node.loc) return false;
  const lines = node.loc.end.line - node.loc.start.line;
  return lines >= DOCUMENTATION_REQUIREMENTS.minFunctionLength;
}

function isLargeClass(node: any): boolean {
  if (!node.loc) return false;
  const lines = node.loc.end.line - node.loc.start.line;
  return lines >= DOCUMENTATION_REQUIREMENTS.minClassLength;
}

async function findFilesByExtension(dir: string, extensions: string[]): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip node_modules and other common directories
      if (entry.isDirectory()) {
        if (['node_modules', '.git', '.next', 'dist', 'build'].includes(entry.name)) {
          continue;
        }
        const nestedFiles = await findFilesByExtension(fullPath, extensions);
        files.push(...nestedFiles);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error finding files in ${dir}:`, error);
  }
  
  return files;
}

function createMissingDocIssue(
  type: string, 
  filePath: string, 
  metadata: Record<string, any> = {}
): Issue {
  const title = `Missing ${type} documentation`;
  const name = metadata.name || 'unknown';
  const line = metadata.line || 0;
  
  return {
    id: `missing-doc-${type}-${filePath}:${line}`,
    type: 'documentation',
    severity: Severity.Low,
    title,
    description: `The ${type} '${name}' is missing documentation`,
    location: line > 0 ? `${filePath}:${line}` : filePath,
    affectedFiles: [filePath],
    recommendations: [
      `Add a JSDoc comment above the ${type} declaration`,
      'Document all parameters and return values',
      'Include usage examples if the function is complex'
    ],
    metadata: {
      type,
      ...metadata
    }
  };
}

function createErrorIssue(id: string, error: any, file?: string): Issue {
  return {
    id: `error-${id}`,
    type: 'documentation',
    severity: Severity.High,
    title: `Documentation analysis error: ${id}`,
    description: `Error during documentation analysis: ${error.message}`,
    affectedFiles: file ? [file] : [],
    recommendations: [
      'Check file permissions',
      'Verify the file is not corrupted',
      'Check for syntax errors in the file'
    ],
    metadata: {
      error: error.message,
      stack: error.stack
    }
  };
}

// Export for testing
export const __test__ = {
  DOCUMENTATION_REQUIREMENTS,
  hasJSDoc,
  isLargeFunction,
  isLargeClass,
  createMissingDocIssue,
  createErrorIssue
};
