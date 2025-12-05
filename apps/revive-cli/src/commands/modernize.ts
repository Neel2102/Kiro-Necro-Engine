import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { PlannerService } from '@necro/planner';
import { scanRepository } from '@necro/scanner';
import fs from 'fs/promises';
import path from 'path';

interface ModernizeOptions {
  apply?: boolean;
  rules?: string;
  output?: string;
  verbose?: boolean;
}

export const formatPlan = (plan: any): string => {
  const output: string[] = [
    chalk.blue.bold('\nModernization Plan'),
    chalk.gray('='.repeat(40)),
    `${chalk.bold('Repository:')} ${plan.repository}`,
    `${chalk.bold('Generated:')} ${new Date(plan.timestamp).toLocaleString()}`,
    `\n${chalk.bold('Tasks:')}`
  ];

  plan.tasks.forEach((task: any, index: number) => {
    output.push(
      `\n${index + 1}. ${chalk.bold(task.description)}`,
      `   ${chalk.gray('Type:')} ${task.type}`,
      `   ${chalk.gray('Priority:')} ${task.priority}`,
      `   ${chalk.gray('Action:')} ${task.action}`
    );
    
    if (task.files && task.files.length > 0) {
      output.push(
        `   ${chalk.gray('Files:')}`,
        ...task.files.map((f: string) => `     - ${f}`)
      );
    }
  });

  return output.join('\n');
};

export const runModernize = async (
  repoPath: string,
  options: ModernizeOptions
): Promise<
  | { success: true; plan: any; result: any }
  | { success: true; plan: any; scanResult: any }
  | { success: false; error: string }
> => {
  const spinner = ora('Initializing modernization...').start();
  
  try {
    // Initialize services
    const planner = new PlannerService(options.rules);
    
    // Run scan
    spinner.text = 'Scanning repository...';
    const scanResult = await scanRepository(repoPath);
    
    if (options.verbose) {
      console.log(chalk.blue('\nScan Results:'));
      console.log(JSON.stringify(scanResult, null, 2));
    }

    // Generate plan
    spinner.text = 'Generating modernization plan...';
    const plan = await planner.generatePlan(scanResult);
    
    // Save plan to file if output path is provided
    if (options.output) {
      await fs.mkdir(path.dirname(options.output), { recursive: true });
      await fs.writeFile(options.output, JSON.stringify(plan, null, 2));
      console.log(chalk.green(`\n✓ Plan saved to: ${options.output}`));
    }

    if (options.apply) {
      // Apply transformations
      spinner.text = 'Applying transformations...';
      const result = await planner.applyPlan(plan, repoPath);
      spinner.succeed('Modernization completed successfully!');
      return {
        success: true,
        plan,
        result
      };
    } else {
      spinner.succeed('Modernization plan generated successfully!');
      console.log(formatPlan(plan));
      console.log(chalk.yellow('\nRun with --apply to apply the changes'));
      return {
        success: true,
        plan,
        scanResult
      };
    }
  } catch (error) {
    spinner.fail(`Modernization failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

export const modernizeCommand = new Command('modernize')
  .description('Generate and optionally apply a modernization plan')
  .argument('<repo-path>', 'Path to the repository')
  .option('-a, --apply', 'Apply the modernization plan', false)
  .option('-r, --rules <path>', 'Path to custom rules file')
  .option('-o, --output <path>', 'Save the generated plan to a file')
  .option('-v, --verbose', 'Enable verbose output', false)
  .action(async (repoPath, options) => {
    const result = await runModernize(repoPath, options);
    if (!result.success) {
      console.error(chalk.red(`✗ Error: ${result.error}`));
      process.exit(1);
    }
  });
