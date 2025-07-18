# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

simple-worktree is a Node.js CLI tool that simplifies Git worktree management by automatically syncing local development files (like `.env` files, certificates, etc.) between worktrees via symbolic links or one-time copies.

## Architecture

### Core Components

- **CLI Entry Point**: `bin/simple-worktree` - Commander.js based CLI with command aliases
- **Main Library**: `lib/` directory containing modular functionality:
  - `create-worktree.js` - Creates new worktrees with file syncing
  - `delete-worktree.js` - Safely removes worktrees  
  - `sync-files.js` - Handles symbolic linking and file copying based on patterns
  - `config.js` - TOML configuration management
  - `git-utils.js` - Git operations wrapper
  - `init-hooks.js` - Sets up Git hooks for automatic syncing
  - `shell-functions.js` - Shell integration for directory navigation
  - `list-worktrees.js`, `cd-worktree.js`, `home.js` - Utility commands

### Key Design Patterns

1. **Pattern-based file management**: Uses gitignore-style patterns for flexible file matching
2. **Two sync modes**: 
   - Symbolic links (`filesToSync`) for shared files
   - One-time copies (`filesToCopy`) for independent files
3. **TOML configuration**: Human-readable config in `swtconfig.toml`
4. **Git hooks integration**: Optional automatic syncing via post-checkout hook

## Development Commands

### Installation & Setup

```bash
# Install dependencies
npm install

# Local development (symlink to global)
npm link

# Install from local directory
./install-local.sh
```

### Testing

Currently no automated tests are configured. Manual testing workflow:

```bash
# Create test worktree
swt create test-feature

# Verify file syncing
ls -la ../test-feature/.env  # Should be symlink if configured

# Delete test worktree
swt delete test-feature
```

### Publishing

```bash
# Version bump and publish to npm
npm version patch/minor/major
npm publish
```

## Configuration

The tool uses `swtconfig.toml` for configuration. Key fields:
- `defaultWorktreeDir` - Where to create worktrees (default: "../")
- `filesToSync` - Array of patterns for files to symlink
- `filesToCopy` - Array of patterns for files to copy once
- `addToGitignore` - Auto-add synced files to .gitignore (default: true)

## Common Development Tasks

### Adding New Commands

1. Create new module in `lib/` (e.g., `lib/new-command.js`)
2. Export from `lib/index.js`
3. Add command handler in `bin/simple-worktree` using Commander.js pattern
4. Follow existing error handling patterns with chalk for colored output

### Modifying File Sync Logic

File syncing logic is in `lib/sync-files.js`. Key functions:
- `syncPattern()` - Creates symbolic links
- `copyPattern()` - Copies files once
- `updateGitignore()` - Updates .gitignore with synced paths

Pattern matching uses the minimatch library with gitignore-style syntax.

### Working with Git Operations

Git operations are wrapped in `lib/git-utils.js`. Always use these utilities rather than direct `execSync` calls for consistency and error handling.

## Important Notes

- Always preserve backwards compatibility with existing `swtconfig.toml` files
- File patterns should follow gitignore syntax exactly
- Symbolic links must point to absolute paths for reliability
- Windows compatibility requires special handling for symlinks
- The tool should only sync files NOT tracked by Git (Git handles tracked files automatically)