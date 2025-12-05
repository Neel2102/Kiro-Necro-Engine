import fs from 'fs-extra';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { Issue, Severity } from '@necro/common';

// Common deprecated patterns for JavaScript/TypeScript
const JS_DEPRECATIONS = [
  // React
  {
    pattern: 'componentWillMount',
    message: 'componentWillMount is deprecated since React 16.9.0',
    fix: 'Use componentDidMount or the constructor instead',
    severity: 'high' as Severity,
    since: '16.9.0'
  },
  {
    pattern: 'componentWillReceiveProps',
    message: 'componentWillReceiveProps is deprecated since React 16.9.0',
    fix: 'Use static getDerivedStateFromProps or componentDidUpdate instead',
    severity: 'high' as Severity,
    since: '16.9.0'
  },
  {
    pattern: 'componentWillUpdate',
    message: 'componentWillUpdate is deprecated since React 16.9.0',
    fix: 'Use componentDidUpdate or getSnapshotBeforeUpdate instead',
    severity: 'high' as Severity,
    since: '16.9.0'
  },
  // Node.js
  {
    pattern: 'new Buffer',
    message: 'The Buffer() constructor is deprecated',
    fix: 'Use Buffer.from(), Buffer.alloc(), or Buffer.allocUnsafe() instead',
    severity: 'high' as Severity,
    since: 'Node.js 10.0.0'
  },
  {
    pattern: 'fs.exists',
    message: 'fs.exists() is deprecated',
    fix: 'Use fs.stat() or fs.access() instead',
    severity: 'medium' as Severity,
    since: 'Node.js 1.0.0'
  },
  // CommonJS
  {
    pattern: 'require.extensions',
    message: 'require.extensions is deprecated',
    fix: 'Use a loader hook API instead',
    severity: 'high' as Severity,
    since: 'Node.js 0.10.0'
  }
];

// Common deprecated patterns for Python
const PYTHON_DEPRECATIONS = [
  {
    pattern: 'asyncore',
    message: 'asyncore is deprecated since Python 3.6',
    fix: 'Use asyncio instead',
    severity: Severity.Medium,
    since: 'Python 3.6'
  },
  {
    pattern: 'asynchat',
    message: 'asynchat is deprecated since Python 3.6',
    fix: 'Use asyncio instead',
    severity: Severity.Medium,
    since: 'Python 3.6'
  },
  {
    pattern: 'collections.Mapping',
    message: 'collections.Mapping is deprecated since Python 3.3',
    fix: 'Use collections.abc.Mapping instead',
    severity: Severity.Low,
    since: 'Python 3.3'
  }
];

export async function detectDeprecatedAPIs(repoPath: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  
  try {
    // Get all JavaScript/TypeScript files
    const jsFiles = await findFilesByExtension(repoPath, ['.js', '.jsx', '.ts', '.tsx']);
    
    // Get all Python files
    const pyFiles = await findFilesByExtension(repoPath, ['.py']);
    
    // Analyze JavaScript/TypeScript files
    for (const file of jsFiles) {
      const fileIssues = await analyzeJavaScriptFile(file);
      issues.push(...fileIssues);
    }
    
    // Analyze Python files
    for (const file of pyFiles) {
      const fileIssues = await analyzePythonFile(file);
      issues.push(...fileIssues);
    }
    
  } catch (error) {
    console.error('Error detecting deprecated APIs:', error);
    issues.push(createErrorIssue('deprecation-analysis-error', error));
  }
  
  return issues;
}

async function analyzeJavaScriptFile(filePath: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  
  try {
    const code = await fs.readFile(filePath, 'utf-8');
    
    // Parse the code into an AST
    const ast = parse(code, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        'classProperties',
        'decorators-legacy',
        'dynamicImport',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'nullishCoalescingOperator',
        'objectRestSpread',
        'optionalChaining'
      ]
    });
    
    // Check for deprecated patterns
    for (const deprecation of JS_DEPRECATIONS) {
      if (code.includes(deprecation.pattern)) {
        // More precise matching using AST
        let found = false;
        
        traverse(ast, {
          Identifier(path: any) {
            if (path.node.name === deprecation.pattern) {
              found = true;
              
              // Get the line number
              const { line, column } = path.node.loc?.start || { line: 1, column: 1 };
              
              issues.push({
                id: `deprecated-${deprecation.pattern}-${filePath}:${line}:${column}`,
                type: 'api',
                severity: deprecation.severity,
                title: `Deprecated API usage: ${deprecation.pattern}`,
                description: `${deprecation.message} (since ${deprecation.since})`,
                location: `${filePath}:${line}:${column}`,
                affectedFiles: [filePath],
                recommendations: [
                  deprecation.fix,
                  `Check the official documentation for migration guides`
                ],
                metadata: {
                  pattern: deprecation.pattern,
                  since: deprecation.since,
                  file: filePath,
                  line,
                  column
                }
              });
            }
          }
        });
        
        // Fallback to simple string matching if AST traversal didn't find it
        if (!found && code.includes(deprecation.pattern)) {
          issues.push({
            id: `deprecated-${deprecation.pattern}-${filePath}`,
            type: 'api',
            severity: deprecation.severity,
            title: `Deprecated API usage: ${deprecation.pattern}`,
            description: `${deprecation.message} (since ${deprecation.since})`,
            location: filePath,
            affectedFiles: [filePath],
            recommendations: [
              deprecation.fix,
              `Check the official documentation for migration guides`
            ],
            metadata: {
              pattern: deprecation.pattern,
              since: deprecation.since,
              file: filePath
            }
          });
        }
      }
    }
    
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
    issues.push(createErrorIssue('javascript-analysis-error', error, filePath));
  }
  
  return issues;
}

async function analyzePythonFile(filePath: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Simple pattern matching for Python files
    // In a real implementation, you'd want to use a Python AST parser
    for (const deprecation of PYTHON_DEPRECATIONS) {
      if (content.includes(deprecation.pattern)) {
        // Find line numbers where the pattern appears
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.includes(deprecation.pattern)) {
            issues.push({
              id: `deprecated-${deprecation.pattern}-${filePath}:${index + 1}`,
              type: 'api',
              severity: deprecation.severity,
              title: `Deprecated API usage: ${deprecation.pattern}`,
              description: `${deprecation.message} (since ${deprecation.since})`,
              location: `${filePath}:${index + 1}`,
              affectedFiles: [filePath],
              recommendations: [
                deprecation.fix,
                `Check the official Python documentation for migration guides`
              ],
              metadata: {
                pattern: deprecation.pattern,
                since: deprecation.since,
                file: filePath,
                line: index + 1
              }
            });
          }
        });
      }
    }
    
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
    issues.push(createErrorIssue('python-analysis-error', error, filePath));
  }
  
  return issues;
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

function createErrorIssue(id: string, error: any, file?: string): Issue {
  return {
    id: `error-${id}`,
    type: 'api',
    severity: Severity.High,
    title: `Deprecation analysis error: ${id}`,
    description: `Error during deprecation analysis: ${error.message}`,
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
  JS_DEPRECATIONS,
  PYTHON_DEPRECATIONS,
  findFilesByExtension,
  createErrorIssue
};
