# Changelog

## [1.2.5] - 2025-06-24

### Fixed
- Consolidated directory cleanup logic to avoid redundant checks
- Ensure worktree directories are fully removed even when git worktree remove leaves empty folders
- Improved cleanup flow with clearer messaging

## [1.2.4] - 2025-06-24

### Fixed
- Fixed prompts not showing when deleting worktree from inside
- Improved deletion reliability with file marker approach instead of output parsing
- All stdout/stderr output now flows through naturally without interference

## [1.2.3] - 2025-06-24

### Fixed
- Enhanced worktree deletion to ensure directories are fully removed
- Added fallback cleanup mechanism if git worktree remove fails
- Added directory verification after deletion attempts
- Improved error handling and debug output for deletion issues

### Documentation
- Added beginner-friendly explanation of git worktrees in README
- Emphasized how simple-worktree improves upon git's cumbersome commands
- Added comprehensive documentation for filesToCopy parameter with examples
- Clarified when to use filesToSync vs filesToCopy with practical use cases

## [1.2.2] - 2025-06-18

### Fixed
- Fixed "Directory not empty" error when deleting a worktree from inside itself
- Shell function now properly changes to main repository after deletion

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
