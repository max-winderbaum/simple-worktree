# Changelog

## [1.2.1] - 2025-06-16

### Fixed
- Clarified .gitignore skip message to explicitly state "Not adding to .gitignore" instead of just "already ignored by git"
- Makes it clearer that the action being skipped is adding to the .gitignore file

## [1.2.0] - 2025-06-16

### Added
- New `filesToCopy` configuration option for copying files once instead of symlinking
- Files specified in `filesToCopy` are copied to new worktrees on creation
- Useful for template files that need to be modified per-worktree (e.g., .env.example)
- Supports same gitignore-style patterns as `filesToSync`
- Copied files are also added to .gitignore if `addToGitignore` is enabled

### Changed
- Updated example configuration to include `filesToCopy` examples

## [1.1.1] - 2025-06-16

### Fixed
- Fixed directory pattern matching in .gitignore detection
- Directories with trailing slashes (like `ai_plans/`) now correctly match patterns like `**/ai_plans`

## [1.1.0] - 2025-06-16

### Added
- Smart .gitignore detection: Now uses `git check-ignore` to detect if files are already ignored before adding them to .gitignore
- Prevents redundant .gitignore entries when patterns like `**/CLAUDE.md` already cover specific files like `apps/web/CLAUDE.md`

### Fixed
- Fixed issue where already-ignored files would be unnecessarily added to .gitignore

## [1.0.0] - 2024-01-16

### Added
- Initial release of simple-worktree
- `create` command for creating worktrees with automatic file syncing
- `delete` command for removing worktrees and returning to main repo
- `init` command for installing git hooks
- `list` command for displaying all worktrees
- `cd` command for navigating to worktrees by name
- `home` command for navigating to the main repository
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
  - `swt h` for home
- Optional shell function installation via `swt init` for automatic directory changing
