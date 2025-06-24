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

    // Remove the worktree from git
    console.log(chalk.blue('Removing worktree from git...'));
    
    try {
      // Use cwd option to run git command from main repo if we're inside the worktree
      const gitOptions = { 
        encoding: 'utf8',
        stdio: 'pipe'
      };
      
      if (inTargetWorktree) {
        gitOptions.cwd = mainRepo;
      }
      
      const result = execSync(`git worktree remove "${worktreePath}" --force`, gitOptions);
      if (result) {
        console.log(chalk.gray(`Git output: ${result.trim()}`));
      }
      console.log(chalk.green('✔ Worktree removed from git'));
    } catch (gitError) {
      // If git worktree remove fails, try to prune
      console.log(chalk.yellow('Git worktree remove failed, attempting to prune...'));
      console.log(chalk.gray(`Git error: ${gitError.message}`));
      
      try {
        const pruneOptions = inTargetWorktree ? { cwd: mainRepo, stdio: 'pipe' } : { stdio: 'pipe' };
        execSync(`git worktree prune`, pruneOptions);
        console.log(chalk.green('✔ Worktree pruned'));
      } catch (pruneError) {
        console.log(chalk.yellow('Prune also failed, but continuing...'));
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