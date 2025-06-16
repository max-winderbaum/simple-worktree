const { execSync } = require('child_process');
const path = require('path');
const chalk = require('chalk');
const prompts = require('prompts');
const { isWorktree, getMainRepoPath } = require('./git-utils');

async function deleteWorktree(options = {}) {
  // Check if we're in a worktree
  if (!isWorktree()) {
    throw new Error('Current directory is not a git worktree. This command should only be run from within a worktree.');
  }

  const currentDir = process.cwd();
  const mainRepo = getMainRepoPath();

  console.log(chalk.blue('Worktree information:'));
  console.log(`  Current: ${chalk.cyan(currentDir)}`);
  console.log(`  Main repo: ${chalk.cyan(mainRepo)}`);

  // Confirm deletion unless --force flag is used
  if (!options.force) {
    const response = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to delete this worktree?',
      initial: false
    });

    if (!response.confirm) {
      console.log(chalk.yellow('Deletion cancelled'));
      return;
    }
  }

  try {
    // Change to main repo first
    process.chdir(mainRepo);

    // Remove the worktree
    console.log(chalk.blue('Removing worktree...'));
    execSync(`git worktree remove "${currentDir}" --force`, { stdio: 'pipe' });

    console.log(chalk.green('✔ Worktree deleted successfully'));
    console.log(chalk.yellow('\nNote: You need to manually change directory.'));
    console.log(`Run: ${chalk.cyan(`cd ${mainRepo}`)}`);
    console.log(chalk.gray(`\nTip: Use 'swt-delete' or 'swtd' for automatic directory change.`));
    console.log(chalk.gray(`See: https://github.com/max-winderbaum/simple-worktree#shell-integration`));
  } catch (error) {
    throw new Error(`Failed to delete worktree: ${error.message}`);
  }
}

module.exports = { deleteWorktree };