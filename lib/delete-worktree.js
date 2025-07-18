const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
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
    // If we're in the worktree being deleted, create marker file
    if (inTargetWorktree) {
      const markerFile = '/tmp/.swt_delete_info';
      try {
        const markerContent = JSON.stringify({
          mainRepo: mainRepo,
          worktreePath: worktreePath
        });
        fs.writeFileSync(markerFile, markerContent);
      } catch (markerError) {
        // If we can't write the marker, continue anyway
        console.log(chalk.yellow(`Warning: Could not create marker file: ${markerError.message}`));
      }
    }

    // Remove the worktree directory directly for speed
    console.log(chalk.blue('Removing worktree directory...'));
    
    try {
      // If we're NOT in the worktree being deleted, remove it directly
      if (!inTargetWorktree) {
        execSync(`rm -rf "${worktreePath}"`, { stdio: 'pipe' });
        console.log(chalk.green('✔ Worktree directory removed'));
      } else {
        // If we ARE in the worktree, we can't delete it while we're in it
        // The shell function will handle the cleanup after we exit
        console.log(chalk.yellow('Directory will be removed after exiting (handled by shell)'));
      }
      
      // Clean up git's internal references
      console.log(chalk.blue('Cleaning up git worktree references...'));
      const pruneOptions = inTargetWorktree ? { cwd: mainRepo, stdio: 'pipe' } : { stdio: 'pipe' };
      execSync(`git worktree prune`, pruneOptions);
      console.log(chalk.green('✔ Git worktree references cleaned up'));
      
    } catch (error) {
      console.log(chalk.yellow(`Warning during cleanup: ${error.message}`));
      // Try to prune anyway in case only the rm failed
      try {
        const pruneOptions = inTargetWorktree ? { cwd: mainRepo, stdio: 'pipe' } : { stdio: 'pipe' };
        execSync(`git worktree prune`, pruneOptions);
        console.log(chalk.green('✔ Git worktree references cleaned up'));
      } catch (pruneError) {
        console.log(chalk.yellow('Could not clean up git references'));
      }
    }

    // Note: Directory cleanup will be handled by shell function if needed
    console.log(chalk.green('✔ Worktree deletion command completed'));
    
    // Show appropriate message based on where we are
    if (inTargetWorktree) {
      console.log(chalk.cyan(`\nThe shell will change you to: ${mainRepo}`));
    } else {
      console.log(chalk.cyan(`\nDeleted worktree: ${worktreePath}`));
    }
  } catch (error) {
    throw new Error(`Failed to delete worktree: ${error.message}`);
  }
}

module.exports = { deleteWorktree };