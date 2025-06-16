const chalk = require('chalk');
const path = require('path');
const { listWorktrees, isGitRepo } = require('./git-utils');

async function list() {
  if (!isGitRepo()) {
    throw new Error('Not in a git repository');
  }

  const worktrees = listWorktrees();
  const currentPath = process.cwd();

  if (worktrees.length === 0) {
    console.log(chalk.yellow('No worktrees found'));
    return;
  }

  console.log(chalk.blue('Git Worktrees:\n'));

  worktrees.forEach((wt, index) => {
    const isMain = index === 0;
    const isCurrent = path.resolve(wt.path) === path.resolve(currentPath);
    
    let status = '';
    if (isMain) status += chalk.gray(' [main]');
    if (isCurrent) status += chalk.green(' [current]');
    
    console.log(`${chalk.cyan(wt.path)}${status}`);
    
    if (wt.branch) {
      console.log(`  Branch: ${chalk.yellow(wt.branch)}`);
    } else if (wt.detached) {
      console.log(`  HEAD: ${chalk.yellow(wt.head)} ${chalk.gray('(detached)')}`);
    }
    
    console.log('');
  });
}

module.exports = { list };