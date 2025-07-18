const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { listWorktrees, getMainRepoPath } = require('./git-utils');

async function deleteAll(options = {}) {
  const worktrees = listWorktrees();
  
  if (worktrees.length === 0) {
    console.log(chalk.yellow('No worktrees found.'));
    return;
  }

  const mainRepoPath = getMainRepoPath();
  if (!mainRepoPath) {
    throw new Error('Could not determine main repository path');
  }

  const nonMainWorktrees = worktrees.filter(wt => wt.path !== mainRepoPath);
  
  if (nonMainWorktrees.length === 0) {
    console.log(chalk.yellow('No worktrees to delete (only the main repository exists).'));
    return;
  }

  console.log(chalk.blue(`Found ${nonMainWorktrees.length} worktree(s) to delete (excluding main repository):`));
  nonMainWorktrees.forEach(wt => {
    const name = path.basename(wt.path);
    const branch = wt.branch || '(detached)';
    console.log(chalk.gray(`  - ${name} (${branch}) at ${wt.path}`));
  });

  if (!options.force) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question(chalk.yellow('\nDelete all worktrees? (y/N) '), resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y') {
      console.log(chalk.gray('Deletion cancelled.'));
      return;
    }
  }

  let successCount = 0;
  let failCount = 0;

  // First, remove all worktree directories directly
  for (const worktree of nonMainWorktrees) {
    const name = path.basename(worktree.path);
    console.log(chalk.blue(`\nDeleting ${name}...`));

    try {
      // Use rm -rf for fast deletion
      execSync(`rm -rf "${worktree.path}"`, {
        stdio: 'pipe'
      });

      console.log(chalk.green(`✓ Removed directory ${name}`));
      successCount++;
    } catch (error) {
      console.error(chalk.red(`✗ Failed to delete ${name}: ${error.message}`));
      failCount++;
    }
  }

  // Now run a single git worktree prune to clean up git's internal state
  if (successCount > 0) {
    console.log(chalk.blue(`\nCleaning up git worktree references...`));
    try {
      execSync('git worktree prune', {
        cwd: mainRepoPath,
        stdio: 'pipe'
      });
      console.log(chalk.green('✓ Git worktree references cleaned up'));
    } catch (error) {
      console.error(chalk.yellow(`Warning: Failed to prune worktrees: ${error.message}`));
    }
  }

  console.log(chalk.blue(`\nDeletion complete:`));
  console.log(chalk.green(`  Successfully deleted: ${successCount}`));
  if (failCount > 0) {
    console.log(chalk.red(`  Failed: ${failCount}`));
  }
}

module.exports = { deleteAll };