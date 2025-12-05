import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { Issue, ScanResult, ScanSummary, ScanMetadata } from '@necro/common';
import { analyzeDependencies } from './dependency-analyzer';
import { detectDeprecatedAPIs } from './deprecation-analyzer';
import { checkDocumentation } from './documentation-analyzer';

const TEMP_DIR = path.join(process.cwd(), '.temp');

export class RepositoryScanner {
  private repoUrl: string;
  private repoName: string;
  private repoPath: string;
  private tempDir: string;
  private issues: Issue[] = [];

  constructor(
    repoUrl: string, 
    tempDir: string = TEMP_DIR,
  ) {
    this.repoUrl = repoUrl;
    this.repoName = this.extractRepoName(repoUrl);
    this.tempDir = tempDir;
    this.repoPath = path.join(this.tempDir, this.repoName);
  }

  public async scan(): Promise<ScanResult> {
    try {
      // Create temp directory if it doesn't exist
      await fs.ensureDir(this.tempDir);
      
      // Clone or update repository
      await this.cloneOrUpdateRepo();
      
      // Run all analysis in parallel
      const [deps, deprecations, docs] = await Promise.all([
        analyzeDependencies(this.repoPath),
        detectDeprecatedAPIs(this.repoPath),
        checkDocumentation(this.repoPath)
      ]);

      // Combine all issues
      this.issues = [...deps, ...deprecations, ...docs];

      // Generate summary
      const summary = this.generateSummary();
      
      // Generate modernization plan
      const baseMetadata = this.collectMetadata();

      const scanResult: ScanResult = {
        repository: this.repoUrl,
        timestamp: new Date().toISOString(),
        summary,
        issues: this.issues,
        metadata: {
          filesScanned: baseMetadata.filesScanned,
          languages: baseMetadata.languages,
          scanDuration: baseMetadata.scanDuration,
        },
      };

      return scanResult;
    } catch (error) {
      console.error('Error during repository scan:', error);
      throw error;
    } finally {
      // Clean up temp directory if needed
      // await fs.remove(this.repoPath);
    }
  }

  private extractRepoName(url: string): string {
    // Handle both https and git@github.com formats
    const match = url.match(/([^/]+?)(\.git)?$/);
    if (!match) throw new Error('Invalid repository URL');
    return match[1].replace(/\.git$/, '');
  }
  
  private collectMetadata(): ScanMetadata {
    // Collect metadata about the scan
    const files = this.walkDirectory(this.repoPath);
    const extensions = new Set<string>();
    
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase().substring(1);
      if (ext) extensions.add(ext);
    });
    
    return {
      filesScanned: files.length,
      languages: Array.from(extensions),
      scanDuration: 0, // Will be set by the caller
      timestamp: new Date().toISOString()
    };
  }
  
  private walkDirectory(dir: string, fileList: string[] = []): string[] {
    try {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other common directories
          if (['node_modules', '.git', '.next', 'dist', 'build'].includes(file)) {
            return;
          }
          this.walkDirectory(filePath, fileList);
        } else {
          fileList.push(filePath);
        }
      });
      
      return fileList;
    } catch (error) {
      console.error(`Error walking directory ${dir}:`, error);
      return fileList;
    }
  }

  private async cloneOrUpdateRepo(): Promise<void> {
    if (await fs.pathExists(path.join(this.repoPath, '.git'))) {
      // Repository exists, pull updates
      execSync('git pull', { cwd: this.repoPath, stdio: 'ignore' });
    } else {
      // Clone repository
      // Quote the repo path so Windows paths with spaces (e.g. "Kiro Necro-Engine") work correctly
      execSync(`git clone --depth 1 "${this.repoUrl}" "${this.repoPath}"`, { stdio: 'ignore' });
    }
  }

  private generateSummary(): ScanSummary {
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    for (const issue of this.issues) {
      const sev = issue.severity as any;
      if (sev in severityCounts) {
        // @ts-ignore - we guard above
        severityCounts[sev] += 1;
      }
    }

    return {
      totalIssues: this.issues.length,
      critical: severityCounts.critical,
      high: severityCounts.high,
      medium: severityCounts.medium,
      low: severityCounts.low,
      info: severityCounts.info,
    };
  }
}
