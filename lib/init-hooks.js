const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const prompts = require('prompts');
const { getGitRoot, isGitRepo } = require('./git-utils');
const { installShellFunctions } = require('./shell-functions');

const HOOK_NAME = 'post-checkout';
const HOOK_IDENTIFIER = '# simple-worktree-hook';

async function initHooks() {
  if (!isGitRepo()) {
    throw new Error('Not in a git repository');
  }

  const gitRoot = getGitRoot();
  const hooksDir = path.join(gitRoot, '.git', 'hooks');
  const hookPath = path.join(hooksDir, HOOK_NAME);

  // Ensure hooks directory exists
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  // Check if hook already exists
  let existingContent = '';
  if (fs.existsSync(hookPath)) {
    existingContent = fs.readFileSync(hookPath, 'utf8');
    
    // Check if our hook is already installed
    if (existingContent.includes(HOOK_IDENTIFIER)) {
      console.log(chalk.yellow('⚠ Simple-worktree hooks are already installed'));
      return;
    }
  }

  // Read hook template
  const hookTemplate = getHookTemplate();

  // If hook exists, append our content
  let finalContent;
  if (existingContent) {
    console.log(chalk.blue('Existing post-checkout hook found, appending simple-worktree hook...'));
    finalContent = existingContent + '\n\n' + hookTemplate;
  } else {
    finalContent = '#!/bin/bash\n\n' + hookTemplate;
  }

  // Write the hook
  fs.writeFileSync(hookPath, finalContent, { mode: 0o755 });

  console.log(chalk.green('✅ Git hooks installed successfully!'));
  console.log('\nThe post-checkout hook will automatically sync files when creating new worktrees.');
  console.log('\nTo configure file syncing, add patterns to the ' + chalk.cyan('filesToSync') + ' array in your ' + chalk.cyan('swtconfig.toml') + '.');
  
  // Ask about shell functions
  console.log('');
  const response = await prompts({
    type: 'confirm',
    name: 'installShell',
    message: 'Install shell functions for automatic directory changing?',
    initial: true
  });

  if (response.installShell) {
    try {
      await installShellFunctions();
    } catch (error) {
      console.error(chalk.red('Failed to install shell functions:'), error.message);
    }
  }
}

function getHookTemplate() {
  return `${HOOK_IDENTIFIER}
# Automatically sync files when checking out in a worktree

# Exit early if this is a file checkout
if [ "$3" = "0" ]; then
    exit 0
fi

# Check if simple-worktree is installed
if ! command -v simple-worktree &> /dev/null && ! command -v swt &> /dev/null; then
    exit 0
fi

# Get the current git directory and working tree
GIT_DIR=$(git rev-parse --git-dir)
WORK_TREE=$(git rev-parse --show-toplevel)

# Check if we're in a worktree
if [ -f "$GIT_DIR/commondir" ]; then
    # We're in a worktree - get the main repo path
    COMMON_DIR=$(cat "$GIT_DIR/commondir")
    MAIN_GIT_DIR=$(cd "$GIT_DIR" && cd "$COMMON_DIR" && pwd)
    MAIN_WORK_TREE=$(dirname "$MAIN_GIT_DIR")
    
    # Check if swtconfig.toml exists and has filesToSync
    if [ -f "$MAIN_WORK_TREE/swtconfig.toml" ] || [ -f "$HOME/.swtconfig.toml" ]; then
        echo "Syncing files from configuration..."
        
        # Use Node.js to run the sync
        node -e "
const { syncFiles } = require('simple-worktree/lib/sync-files');
syncFiles('$MAIN_WORK_TREE', '$WORK_TREE').catch(err => {
  console.error('Failed to sync files:', err.message);
});
" 2>/dev/null || true
    fi
fi`;
}

module.exports = { initHooks };