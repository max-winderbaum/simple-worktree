# simple-worktree

> Simple git worktree management with automatic syncing of local development files

## What are Git Worktrees?

If you're new to Git worktrees, think of them as a way to have multiple branches checked out at the same time in different folders. Instead of constantly switching branches in your main repository (which can be disruptive), worktrees let you work on different features simultaneously.

For example:
- Your main repository is in `/projects/my-app` (on the `main` branch)
- You can create a worktree in `/projects/my-app-feature-x` (on the `feature-x` branch)
- Another worktree in `/projects/my-app-bugfix` (on the `bugfix` branch)

All these folders share the same Git history, but you can work in them independently without switching branches!

## What Does simple-worktree Do?

Git's built-in worktree commands (`git worktree add`, `git worktree remove`, etc.) can be cumbersome and not very ergonomic to use. Plus, Git worktrees have one major limitation: they only share files that are tracked by Git. Your local development files (like `.env` files, certificates, or IDE settings) don't automatically appear in new worktrees.

`simple-worktree` solves these problems by:
1. **Simplifying worktree management** - Instead of `git worktree add ../my-app-feature feature-branch`, just use `swt c feature-branch`
2. **Automatically linking your local files** (the ones Git ignores) to all worktrees
3. **Optionally copying files once** when creating a worktree (for files that need to be independent)
4. **Providing shortcuts** like `swt cd` to navigate between worktrees and `swt d` to delete the current worktree

This means you get a much more user-friendly interface for worktrees, plus your `.env` files, development certificates, and other local configs are automatically available in all your worktrees without manual copying or accidental commits to Git.

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

## Quick Command Reference

```bash
swt c <name>    # Create worktree
swt d           # Delete current worktree
swt cd <name>   # Navigate to worktree (requires shell functions)
swt h           # Navigate to main repository (requires shell functions)
swt l           # List worktrees
swt i           # Initialize hooks
swt config      # Show/manage configuration
```

## Commands

### `create <name>` (alias: `c`)
Creates a new git worktree with automatic file syncing.

```bash
simple-worktree create my-feature
swt create feature-xyz
swt c feature-xyz  # Short alias

# Options:
# -p, --path <path>    Custom worktree location (default: ../name)
# -b, --branch <name>  Different branch name (default: same as worktree name)

# Examples:
swt c feature-xyz
swt c hotfix -b hotfix/urgent-fix
swt c test -p /tmp/test-worktree
```

### `delete [name]` (alias: `d`)
Deletes a worktree. If no name is provided, deletes the current worktree.

```bash
# Delete current worktree (run from within the worktree)
simple-worktree delete
swt delete
swt d  # Short alias

# Delete a specific worktree by name (run from anywhere)
swt delete feature-branch
swt d feature-branch

# Options:
# -f, --force    Skip confirmation prompt

# Examples:
swt d                    # Delete current worktree
swt d feature-branch     # Delete named worktree
swt d --force           # Skip confirmation
```


### `init` (alias: `i`)
Initializes git hooks for automatic file syncing and optionally installs shell functions.

```bash
simple-worktree init
swt init
swt i  # Short alias

# Only install shell functions (if hooks already installed)
swt init --shell
```

This command:
1. Installs a post-checkout hook that automatically syncs files when creating new worktrees
2. Offers to install shell functions that make `swt c`, `swt d`, and `swt cd` automatically change directories

With shell functions installed:
- `swt c feature` - Creates worktree AND changes into it
- `swt d` - Deletes worktree AND returns to main repo
- `swt cd feature` - Changes to any worktree by name
- `swt h` - Changes to main repository from anywhere

### `list` / `ls` (alias: `l`)
Lists all git worktrees in the repository.

```bash
simple-worktree list
swt list
swt ls
swt l  # Short alias
```

### `cd <name>`
Navigate to a worktree by name (requires shell functions).

```bash
# Without shell functions: prints the path
swt cd feature-branch

# With shell functions: changes directory
swt cd feature-branch
```

The command matches worktrees by:
- Directory name
- Branch name

### `home` (alias: `h`)
Navigate to the main repository (requires shell functions).

```bash
# Without shell functions: prints the path
swt home
swt h

# With shell functions: changes directory
swt home
swt h
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

# Files to sync via symbolic links (gitignore syntax)
# Only list files NOT in git
filesToSync = [
  ".env.local",
  ".vscode/settings.json",
  "certs/"
]

# Files to copy once when creating a worktree
# Use this for files that need to be independent per worktree
filesToCopy = [
  "node_modules/.cache/",
  "build/cache.json"
]
```

### Configuration Options

- **`defaultWorktreeDir`** - Where to create worktrees by default
  - Relative path from repository root (e.g., `"../"`, `"../../worktrees/"`)
  - Absolute path (e.g., `"/home/user/worktrees/"`)
  - Default: `"../"` (parent directory)

- **`addToGitignore`** - Whether to automatically add synced symlinks to .gitignore
  - Default: `true`

- **`filesToSync`** - Array of patterns for files to sync across worktrees via symbolic links
  - Uses gitignore syntax
  - Only list files that are NOT committed to git
  - These files will be shared - changes in one worktree affect all worktrees
  - Git worktrees already share all committed files automatically!
  - Comments can be added with `#` on their own line in the array

- **`filesToCopy`** - Array of patterns for files to copy once when creating a worktree
  - Uses gitignore syntax
  - Only list files that are NOT committed to git
  - These files are copied, not linked - each worktree gets its own independent copy
  - Perfect for cache directories, build artifacts, or files that need to be different per worktree
  - The copy happens only once when the worktree is created

### Pattern Syntax

Both `filesToSync` and `filesToCopy` use the same pattern format as `.gitignore`:

- `**` - Matches any number of directories
- `*` - Matches any characters except `/`
- `?` - Matches any single character except `/`
- Paths ending with `/` match only directories
- Patterns starting with `/` match from repository root only
- Patterns without `/` can match at any directory level

### filesToSync vs filesToCopy: When to Use Each

#### Use `filesToSync` (Symbolic Links) When:
- Files should be **shared** across all worktrees
- Changes in one worktree should affect all others
- Examples: environment configs, certificates, shared credentials

```toml
filesToSync = [
  # Environment files - same across all worktrees
  ".env",
  ".env.local",

  # Shared certificates
  "certs/",

  # IDE settings you want consistent
  ".vscode/settings.json"
]
```

#### Use `filesToCopy` (One-time Copy) When:
- Files need to be **independent** per worktree
- Each worktree should have its own version
- Examples: build caches, temporary files, logs

```toml
filesToCopy = [
  # Build caches - independent per worktree
  "node_modules/.cache/",
  ".next/cache/",

  # Temporary build artifacts
  "dist/temp/",

  # Local database files
  "local.sqlite"
]
```

Example with comments:
```toml
filesToSync = [
  # Environment files - shared across all worktrees
  ".env",
  ".env.local",

  # IDE settings - keep consistent
  ".vscode/settings.json",

  # Certificates directory - shared
  "certs/"
]

filesToCopy = [
  # Cache directories - independent per worktree
  "node_modules/.cache/",
  ".parcel-cache/",

  # Build artifacts that might conflict
  "build/cache.json",

  # Local development databases
  "dev.db"
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
   - Reads `filesToSync` and `filesToCopy` patterns from `swtconfig.toml`
   - Creates symbolic links for files matching `filesToSync` patterns
   - Copies files matching `filesToCopy` patterns (one-time copy)

2. With hooks installed (`swt init`), the syncing happens automatically whenever you:
   - Create a worktree with `git worktree add`
   - Switch branches in a worktree

3. For **synchronized files** (`filesToSync`):
   - Symbolic links point to the main repository's **local** files
   - Changes to these files immediately affect all worktrees
   - Perfect for shared configs, certificates, and environment files
   - Synced symlinks are automatically added to `.gitignore`

4. For **copied files** (`filesToCopy`):
   - Files are copied once when the worktree is created
   - Each worktree gets its own independent copy
   - Changes don't affect other worktrees
   - Perfect for cache directories and build artifacts

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