# Changelog

## [1.0.0] - 2024-01-16

### Added
- Initial release of simple-worktree
- `create` command for creating worktrees with automatic file syncing
- `delete` command for removing worktrees and returning to main repo
- `init` command for installing git hooks
- `list` command for displaying all worktrees
- `config` command to manage configuration (`swt config --init`, `swt config --show`)
- Configuration file support (`swtconfig.toml`) using TOML format with:
  - `defaultWorktreeDir` setting to customize where worktrees are created
  - `addToGitignore` setting to control automatic .gitignore updates
  - `filesToSync` array for specifying files to sync (gitignore-style syntax with inline comments)
- Automatic .gitignore management: synced symlinks are automatically added to prevent accidental commits
- Pattern matching following `.gitignore` conventions
- Git post-checkout hook for automatic syncing
- Short alias `swt` for all commands
- Single-letter aliases for common commands:
  - `swt c` for create
  - `swt d` for delete
  - `swt l` for list
  - `swt i` for init
- Shell integration functions for automatic directory changing:
  - `swt-create` / `swtc` - Creates worktree and changes into it
  - `swt-delete` / `swtd` - Deletes worktree and changes to main repository
  - `swt-cd` / `swtcd` - Changes to any worktree by name