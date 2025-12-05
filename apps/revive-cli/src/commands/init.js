// apps/revive-cli/src/commands/init.ts
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
async function fileExists(path) {
    try {
        await fs.access(path);
        return true;
    }
    catch {
        return false;
    }
}
export const initCommand = new Command('init')
    .description('Initialize a new project with default configuration')
    .option('-f, --force', 'Overwrite existing configuration', false)
    .action(async (options) => {
    const spinner = ora('Initializing project...').start();
    try {
        const configDir = path.join(process.cwd(), '.kiro');
        const rulesPath = path.join(configDir, 'modernization-rules.yaml');
        // Create .kiro directory if it doesn't exist
        await fs.mkdir(configDir, { recursive: true });
        // Check if rules file already exists
        if (await fileExists(rulesPath) && !options.force) {
            spinner.fail('Configuration already exists. Use --force to overwrite.');
            return;
        }
        // Copy default rules
        const defaultRules = path.join(__dirname, '../../examples/modernization-rules.yaml');
        await fs.copyFile(defaultRules, rulesPath);
        spinner.succeed('Project initialized successfully!');
        console.log(chalk.green(`\nDefault configuration created in: ${configDir}`));
    }
    catch (error) {
        spinner.fail(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
});
//# sourceMappingURL=init.js.map