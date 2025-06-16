# simple-worktree

> Simplify git worktree management with automatic syncing of local development files

`simple-worktree` is a CLI tool that enhances git worktrees by automatically creating symbolic links to LOCAL files that are NOT in git (i.e., `.gitignored` files). Perfect for sharing environment configs, AI agent coordination files, and development secrets across your worktrees without committing them to the repository.

## Features

- 🚀 **Simple worktree creation and deletion**
- 🔗 **Automatic file syncing** via symbolic links
- 🤖 **AI agent coordination** - share task lists and context between worktrees
- 📋 **Pattern-based configuration** using `swtconfig.toml`
- 🪝 **Git hooks integration** for automatic syncing
- 🎯 **Gitignore-style pattern support** for flexible file matching

## Installation

```bash
npm install -g simple-worktree
```

Or use directly with npx:

```bash
npx simple-worktree create feature-branch
```

## Quick Start

1. **Create a configuration file**:
   ```bash
   simple-worktree config --init
   ```

2. **Edit `swtconfig.toml`** to add files you want to sync:
   ```toml
   defaultWorktreeDir = "../"
   addToGitignore = true
   
   filesToSync = [
     # Local environment files
     ".env.local",
     ".vscode/settings.json",
     "certs/"
   ]
   ```

3. **Create a new worktree**:
   ```bash
   simple-worktree create feature-branch
   # or use the short alias
   swt create feature-branch
   ```

4. **Initialize hooks** (optional, for automatic syncing):
   ```bash
   simple-worktree init
   ```

## Commands

### `create <name>`
Creates a new git worktree with automatic file syncing.

```bash
simple-worktree create my-feature

# Options:
# -p, --path <path>    Custom worktree location (default: ../name)
# -b, --branch <name>  Different branch name (default: same as worktree name)

# Examples:
swt create feature-xyz
swt create hotfix -b hotfix/urgent-fix
swt create test -p /tmp/test-worktree
```

### `delete`
Deletes the current worktree and removes it from git.

```bash
# Run from within a worktree
simple-worktree delete

# Options:
# -f, --force    Skip confirmation prompt

# Example:
swt delete --force
```

**Note**: After deletion, you'll need to manually `cd` to the main repository. See [Shell Integration](#shell-integration) for automatic directory changing.

### `init`
Initializes git hooks for automatic file syncing.

```bash
simple-worktree init
```

This installs a post-checkout hook that automatically syncs files when creating new worktrees.

### `list` / `ls`
Lists all git worktrees in the repository.

```bash
simple-worktree list
# or
swt ls
```

### `config`
Manage simple-worktree configuration.

```bash
# Show current configuration
simple-worktree config

# Create a config file in current directory
simple-worktree config --init
```

## Configuration (swtconfig.toml)

All configuration is managed through a single `swtconfig.toml` file:

```toml
# Where to create worktrees by default
defaultWorktreeDir = "../"

# Automatically add synced files to .gitignore
addToGitignore = true

# Files to sync (gitignore syntax)
# Only list files NOT in git
filesToSync = [
  ".env.local",
  ".vscode/settings.json", 
  "certs/"
]
```

### Configuration Options

- **`defaultWorktreeDir`** - Where to create worktrees by default
  - Relative path from repository root (e.g., `"../"`, `"../../worktrees/"`)
  - Absolute path (e.g., `"/home/user/worktrees/"`)
  - Default: `"../"` (parent directory)

- **`addToGitignore`** - Whether to automatically add synced symlinks to .gitignore
  - Default: `true`

- **`filesToSync`** - Array of patterns for files to sync across worktrees
  - Uses gitignore syntax
  - Only list files that are NOT committed to git
  - Git worktrees already share all committed files automatically!
  - Comments can be added with `#` on their own line in the array

### Pattern Syntax for filesToSync

The patterns use the same format as `.gitignore`:

- `**` - Matches any number of directories
- `*` - Matches any characters except `/`
- `?` - Matches any single character except `/`
- Paths ending with `/` match only directories
- Patterns starting with `/` match from repository root only
- Patterns without `/` can match at any directory level

Example with comments:
```toml
filesToSync = [
  # Environment files
  ".env",
  ".env.local",
  
  # IDE settings
  ".vscode/settings.json",
  
  # Certificates directory
  "certs/"
]
```

### Configuration File Locations

Checked in order:
1. `./swtconfig.toml` (current directory)
2. `~/.swtconfig.toml` (home directory)

To create a config file:
```bash
swt config --init
```

## Use Cases

### 1. AI Agent Coordination
Keep AI agents in sync across worktrees with shared context:

```toml
filesToSync = [
  # AI coordination folders
  "ai_plans/",
  "ai_shared_task_list/",
  "ai_coordination/",
  
  # AI assistant config files
  "CLAUDE.md",
  ".cursorrules",
  ".github/copilot-instructions.md"
]
```

This ensures AI coding assistants maintain consistent context and can coordinate work across different feature branches.

### 2. Environment Variables
Keep local environment files (not in git) synchronized:

```toml
filesToSync = [
  ".env",
  ".env.local",
  ".env.*.local"
]
```

### 3. IDE Settings
Share personal IDE configurations across worktrees:

```toml
filesToSync = [
  # VS Code settings that aren't committed
  ".vscode/settings.json",
  ".vscode/launch.json",
  
  # IntelliJ personal settings
  ".idea/workspace.xml"
]
```

### 4. Local Development Certificates
Maintain local SSL certificates for HTTPS development:

```toml
filesToSync = [
  "localhost.pem",
  "localhost-key.pem",
  "certs/"
]
```

### 5. Personal Scripts & Tools
Keep personal automation scripts accessible:

```toml
filesToSync = [
  "scripts/personal/",
  ".local-scripts/",
  "bin/local/"
]
```

## How It Works

1. When you run `swt create`, it:
   - Creates a new git worktree (with all committed files)
   - Reads `filesToSync` patterns from `swtconfig.toml`
   - Creates symbolic links for matching **local** files (not in git)

2. With hooks installed (`swt init`), the syncing happens automatically whenever you:
   - Create a worktree with `git worktree add`
   - Switch branches in a worktree

3. Symbolic links point to the main repository's **local** files, ensuring:
   - Local development files stay consistent across worktrees
   - No need to copy `.env` files or certificates to each worktree
   - Changes to local configs immediately affect all worktrees
   - Synced symlinks are automatically added to `.gitignore` to prevent accidental commits

## Integration with Existing Tools

### Makefiles

Add these targets to your Makefile:

```makefile
# Create worktree
wt-create:
	@simple-worktree create $(name)

# Delete current worktree
wt-delete:
	@simple-worktree delete

# List worktrees
wt-list:
	@simple-worktree list
```

Usage: `make wt-create name=feature-branch`

### Package.json Scripts

```json
{
  "scripts": {
    "wt:create": "simple-worktree create",
    "wt:delete": "simple-worktree delete",
    "wt:list": "simple-worktree list"
  }
}
```

## Shell Integration

For automatic directory changing when creating or deleting worktrees, add this to your shell configuration:

### Bash (~/.bashrc)
```bash
source /path/to/simple-worktree/shell-integration.sh
```

### Zsh (~/.zshrc)
```bash
source /path/to/simple-worktree/shell-integration.sh
```

This provides:
- `swt-create` or `swtc` - Creates worktree AND changes into it
- `swt-delete` or `swtd` - Deletes worktree AND changes to main repository

Examples:
```bash
# Create and enter worktree:
swtc feature-branch
# or
swt-create feature-branch

# Delete and return to main:
swtd
# or
swt-delete
```

Without shell integration, you need to manually change directories:
```bash
swt create feature-branch
cd ../feature-branch

swt delete
cd ../rpm
```

## Troubleshooting

### "Not in a git repository" error
Make sure you're running commands from within a git repository.

### Symbolic links not working on Windows
Ensure you have appropriate permissions or run your terminal as administrator. Windows requires special permissions for creating symbolic links.

### Files not syncing
1. Check that `swtconfig.toml` exists and has valid syntax
2. Verify patterns match your intended files
3. Ensure the source files exist in the main repository
4. Remember: patterns work like `.gitignore` - without leading `/`, patterns can match at any level

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT