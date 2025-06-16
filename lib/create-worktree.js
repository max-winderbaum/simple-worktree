const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { getGitRoot, isGitRepo } = require('./git-utils');
const { syncFiles } = require('./sync-files');
const { loadConfig, resolveWorktreeDir } = require('./config');

async function createWorktree(name, options = {}) {
  // Validate we're in a git repo
  if (!isGitRepo()) {
    throw new Error('Not in a git repository');
  }

  const gitRoot = getGitRoot();
  const branch = options.branch || name;
  
  // Load config and resolve worktree path
  const config = loadConfig();
  const worktreePath = resolveWorktreeDir(config, name, options.path);

  // Check if worktree path already exists
  if (fs.existsSync(worktreePath)) {
    throw new Error(`Directory already exists: ${worktreePath}`);
  }

  console.log(chalk.blue('Creating worktree...'));
  console.log(`  Path: ${chalk.cyan(worktreePath)}`);
  console.log(`  Branch: ${chalk.cyan(branch)}`);

  try {
    // Check if branch exists
    const branchExists = checkBranchExists(branch);

    if (branchExists) {
      console.log(chalk.gray(`Using existing branch: ${branch}`));
      execSync(`git worktree add "${worktreePath}" "${branch}"`, { stdio: 'pipe' });
    } else {
      console.log(chalk.gray(`Creating new branch: ${branch}`));
      execSync(`git worktree add -b "${branch}" "${worktreePath}"`, { stdio: 'pipe' });
    }

    console.log(chalk.green('✔ Worktree created successfully'));

    // Sync files if configured
    if (config.filesToSync && config.filesToSync.length > 0) {
      console.log(chalk.blue('\nSyncing files from configuration...'));
      await syncFiles(gitRoot, worktreePath);
    }

    console.log(chalk.green('\n✅ Setup complete!'));
    console.log(`\nTo navigate to your new worktree:`);
    console.log(chalk.cyan(`  cd ${worktreePath}`));
  } catch (error) {
    // Clean up if worktree was partially created
    if (fs.existsSync(worktreePath)) {
      try {
        execSync(`git worktree remove "${worktreePath}" --force`, { stdio: 'pipe' });
      } catch {}
    }
    throw new Error(`Failed to create worktree: ${error.message}`);
  }
}

function checkBranchExists(branch) {
  try {
    execSync(`git show-ref --verify --quiet "refs/heads/${branch}"`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

module.exports = { createWorktree };