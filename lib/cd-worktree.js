const { execSync } = require('child_process');
const chalk = require('chalk');
const { isGitRepo } = require('./git-utils');

function cdWorktree(name) {
  // Validate we're in a git repo
  if (!isGitRepo()) {
    throw new Error('Not in a git repository');
  }

  // Get all worktrees
  const worktreesOutput = execSync('git worktree list --porcelain', { encoding: 'utf8' });
  const worktrees = parseWorktrees(worktreesOutput);

  // Find the worktree by name
  const worktree = worktrees.find(wt => {
    // Match by exact directory name or branch name
    const dirName = wt.path.split('/').pop();
    return dirName === name || wt.branch === name;
  });

  if (!worktree) {
    // Show available worktrees
    console.error(chalk.red(`Worktree '${name}' not found`));
    console.error(chalk.yellow('\nAvailable worktrees:'));
    worktrees.forEach(wt => {
      const dirName = wt.path.split('/').pop();
      console.error(`  ${chalk.cyan(dirName)} ${chalk.gray(`(${wt.branch})`)}`);
    });
    process.exit(1);
  }

  // Output just the path on stdout for shell function to capture
  console.log(worktree.path);
}

function parseWorktrees(output) {
  const worktrees = [];
  const lines = output.trim().split('\n');
  let current = {};

  for (const line of lines) {
    if (line.startsWith('worktree ')) {
      if (current.path) {
        worktrees.push(current);
      }
      current = { path: line.substring(9) };
    } else if (line.startsWith('branch ')) {
      current.branch = line.substring(7).replace('refs/heads/', '');
    } else if (line === '') {
      if (current.path) {
        worktrees.push(current);
        current = {};
      }
    }
  }

  if (current.path) {
    worktrees.push(current);
  }

  return worktrees;
}

module.exports = { cdWorktree };