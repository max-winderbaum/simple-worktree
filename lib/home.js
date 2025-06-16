const chalk = require('chalk');
const { isGitRepo, getMainRepoPath } = require('./git-utils');

function home() {
  // Validate we're in a git repo
  if (!isGitRepo()) {
    throw new Error('Not in a git repository');
  }

  const mainRepo = getMainRepoPath();
  
  // Output just the path for shell function to capture
  console.log(mainRepo);
}

module.exports = { home };