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
    // If we're in the worktree being deleted, create marker file BEFORE changing directory
    if (inTargetWorktree) {
      // Create a marker file for the shell function to detect
      const markerFile = path.join(currentDir, '.swt_deleted_from_inside');
      try {
        fs.writeFileSync(markerFile, mainRepo);
        // Verify the marker was created
        if (!fs.existsSync(markerFile)) {
          console.log(chalk.yellow('Warning: Marker file was not created successfully'));
        }
      } catch (markerError) {
        // If we can't write the marker, continue anyway
        console.log(chalk.yellow(`Warning: Could not create marker file: ${markerError.message}`));
      }
      
      // Now change to main repo
      process.chdir(mainRepo);
    }

    // Remove the worktree
    console.log(chalk.blue('Removing worktree...'));
    
    try {
      const result = execSync(`git worktree remove "${worktreePath}" --force`, { 
        encoding: 'utf8',
        stdio: 'pipe' 
      });
      if (result) {
        console.log(chalk.gray(`Git output: ${result.trim()}`));
      }
    } catch (gitError) {
      // If git worktree remove fails, try to clean up manually
      console.log(chalk.yellow('Git worktree remove failed, attempting manual cleanup...'));
      console.log(chalk.gray(`Git error: ${gitError.message}`));
      
      // First, try to remove the worktree entry from git
      try {
        execSync(`git worktree prune`, { stdio: 'pipe' });
      } catch (pruneError) {
        // Ignore prune errors
      }
    }

    // Always verify the worktree directory was actually removed (handles both success and failure cases)
    if (fs.existsSync(worktreePath)) {
      console.log(chalk.yellow('Directory still exists after git command, removing manually...'));
      try {
        fs.rmSync(worktreePath, { recursive: true, force: true });
        console.log(chalk.green('✔ Directory removed manually'));
      } catch (rmError) {
        console.log(chalk.red(`Failed to remove directory: ${rmError.message}`));
        throw new Error('Worktree directory still exists after all removal attempts');
      }
    }

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