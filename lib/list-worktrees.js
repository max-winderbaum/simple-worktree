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

  // Find the longest name for padding
  const maxNameLength = Math.max(...worktrees.map(wt => path.basename(wt.path).length));
  
  worktrees.forEach((wt, index) => {
    const isMain = index === 0;
    const isCurrent = path.resolve(wt.path) === path.resolve(currentPath);
    const name = path.basename(wt.path);
    
    let prefix = '  ';
    if (isCurrent) prefix = chalk.green('→ ');
    
    let nameColor = chalk.cyan;
    if (isMain) nameColor = chalk.hex('#FFA500');
    
    let suffix = '';
    if (isMain) suffix = chalk.gray(' (main)');
    
    // Pad the name to align the colons
    const paddedName = name.padEnd(maxNameLength + 2);
    
    console.log(`${prefix}${nameColor(paddedName)}: ${wt.path}${suffix}`);
  });
}

module.exports = { list };