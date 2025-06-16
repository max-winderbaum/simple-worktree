const { execSync } = require('child_process');
const path = require('path');
const chalk = require('chalk');
const prompts = require('prompts');
const { isWorktree, getMainRepoPath, isGitRepo, listWorktrees } = require('./git-utils');

async function deleteWorktree(name, options = {}) {
  // If no name provided, delete current worktree
  if (!name || typeof name === 'object') {
    // If name is actually options (when called without name)
    if (typeof name === 'object') {
      options = name;
    }
    
    // Check if we're in a worktree
    if (!isWorktree()) {
      throw new Error('Current directory is not a git worktree. This command should only be run from within a worktree.');
    }

    const currentDir = process.cwd();
    const mainRepo = getMainRepoPath();
    await deleteWorktreeByPath(currentDir, mainRepo, options);
  } else {
    // Delete by name - must be in a git repo
    if (!isGitRepo()) {
      throw new Error('Not in a git repository');
    }
    
    // Find the worktree by name
    const worktrees = listWorktrees();
    const worktree = worktrees.find((wt, index) => {
      const dirName = wt.path.split('/').pop();
      const branchName = wt.branch ? wt.branch.replace('refs/heads/', '') : '';
      return dirName === name || branchName === name;
    });
    
    if (!worktree) {
      throw new Error(`Worktree '${name}' not found`);
    }
    
    // Check if it's the main repository (first in list)
    if (worktrees[0].path === worktree.path) {
      throw new Error('Cannot delete the main repository');
    }
    
    const mainRepo = worktrees[0].path; // First entry is always main
    await deleteWorktreeByPath(worktree.path, mainRepo, options);
  }
}

async function deleteWorktreeByPath(worktreePath, mainRepo, options = {}) {
  const currentDir = process.cwd();
  const inTargetWorktree = path.resolve(currentDir) === path.resolve(worktreePath);

  console.log(chalk.blue('Worktree information:'));
  console.log(`  Target: ${chalk.cyan(worktreePath)}`);
  console.log(`  Main repo: ${chalk.cyan(mainRepo)}`);
  
  // Confirm deletion unless --force flag is used
  if (!options.force) {
    console.log(''); // Add blank line for better formatting
    const response = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to delete worktree '${path.basename(worktreePath)}'?`,
      initial: false
    });

    if (!response.confirm) {
      console.log(chalk.yellow('Deletion cancelled'));
      return;
    }
  }

  try {
    // If we're in the worktree being deleted, change to main repo first
    if (inTargetWorktree) {
      process.chdir(mainRepo);
    }

    // Remove the worktree
    console.log(chalk.blue('Removing worktree...'));
    execSync(`git worktree remove "${worktreePath}" --force`, { stdio: 'pipe' });

    console.log(chalk.green('✔ Worktree deleted successfully'));
    
    // Show appropriate message based on where we are
    if (inTargetWorktree) {
      console.log(chalk.cyan(`\nMain repository: ${mainRepo}`));
    } else {
      console.log(chalk.cyan(`\nDeleted: ${worktreePath}`));
    }
  } catch (error) {
    throw new Error(`Failed to delete worktree: ${error.message}`);
  }
}

module.exports = { deleteWorktree };