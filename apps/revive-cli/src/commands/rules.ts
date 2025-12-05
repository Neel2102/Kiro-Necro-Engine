import { Command } from 'commander';
import ora from 'ora';
import { PlannerService } from '@necro/planner';

export const rulesCommand = new Command('rules')
  .description('Manage modernization rules')
  .option('-l, --list', 'List all rules')
  .option('-a, --add <path>', 'Add rules from a file')
  .option('-r, --remove <ruleId>', 'Remove a rule by ID')
  .option('-e, --export <path>', 'Export rules to a file')
  .option('-i, --import <path>', 'Import rules from a file')
  .action(async (options) => {
    const spinner = ora('Processing rules...').start();
    const planner = new PlannerService();
    
    try {
      if (options.list) {
        spinner.text = 'Loading rules...';
        const rules = await planner.listRules();
        spinner.succeed('Available Rules:');
        console.log(rules.map(r => `- ${r}`).join('\n'));
      } 
      else if (options.add) {
        spinner.text = 'Adding rule...';
        const ok = await planner.addRule(options.add);
        if (ok) {
          spinner.succeed('Rule added successfully!');
        } else {
          spinner.fail('Failed to add rule. Ensure the file is valid YAML/JSON.');
          process.exit(1);
        }
      } 
      else if (options.remove) {
        spinner.text = 'Removing rule...';
        const removed = await planner.removeRule(options.remove);
        if (removed) {
          spinner.succeed(`Rule "${options.remove}" removed successfully!`);
        } else {
          spinner.fail(`Rule "${options.remove}" not found`);
          process.exit(1);
        }
      }
      else if (options.export) {
        spinner.text = 'Exporting rules...';
        await planner.exportRules(options.export);
        spinner.succeed(`Rules exported to ${options.export}`);
      } 
      else if (options.import) {
        spinner.text = 'Importing rules...';
        await planner.importRules(options.import);
        spinner.succeed('Rules imported successfully!');
      }
      else {
        spinner.stop();
        rulesCommand.help();
      }
    } catch (error) {
      spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });
