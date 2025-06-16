const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function isGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function getGitRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function isWorktree() {
  try {
    const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf8' }).trim();
    return gitDir.includes('.git/worktrees/');
  } catch {
    return false;
  }
}

function getMainRepoPath() {
  try {
    // Get list of all worktrees, the first one is always the main repo
    const output = execSync('git worktree list', { encoding: 'utf8' });
    const lines = output.trim().split('\n');
    if (lines.length > 0) {
      // First worktree in the list is the main repo
      const mainRepoLine = lines[0];
      const mainRepoPath = mainRepoLine.split(/\s+/)[0];
      return mainRepoPath;
    }
  } catch {
    return null;
  }
}

function listWorktrees() {
  try {
    const output = execSync('git worktree list --porcelain', { encoding: 'utf8' });
    const worktrees = [];
    let current = {};

    output.trim().split('\n').forEach(line => {
      if (line.startsWith('worktree ')) {
        if (current.path) {
          worktrees.push(current);
        }
        current = { path: line.substring(9) };
      } else if (line.startsWith('HEAD ')) {
        current.head = line.substring(5);
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring(7);
      } else if (line === 'bare') {
        current.bare = true;
      } else if (line === 'detached') {
        current.detached = true;
      }
    });

    if (current.path) {
      worktrees.push(current);
    }

    return worktrees;
  } catch {
    return [];
  }
}

module.exports = {
  isGitRepo,
  getGitRoot,
  isWorktree,
  getMainRepoPath,
  listWorktrees
};