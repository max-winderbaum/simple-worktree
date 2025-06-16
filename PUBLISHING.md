# Publishing simple-worktree to npm

This guide explains how to publish the simple-worktree package to npm.

## Pre-publication Checklist

1. **Test the package locally**:
   ```bash
   npm install
   npm link
   
   # Test commands
   simple-worktree --version
   simple-worktree --help
   ```

2. **Update package version** in `package.json` if needed

3. **Update CHANGELOG.md** with release notes

4. **Review and update**:
   - README.md for accuracy
   - Repository URLs in package.json
   - Author information

## Publishing Steps

1. **Login to npm** (if not already logged in):
   ```bash
   npm login
   ```

2. **Publish the package**:
   ```bash
   npm publish
   ```

3. **Verify publication**:
   ```bash
   npm info simple-worktree
   ```

## Post-publication

1. **Create a git tag** for the release:
   ```bash
   git tag -a simple-worktree-v1.0.0 -m "Release simple-worktree v1.0.0"
   git push origin simple-worktree-v1.0.0
   ```

2. **Test installation** from npm:
   ```bash
   npm install -g simple-worktree
   simple-worktree --version
   ```

## Updating the Package

1. Make changes to the code
2. Update version in `package.json` (follow semver)
3. Update CHANGELOG.md
4. Publish with `npm publish`

## Using as a Local Package

If you don't want to publish to npm, you can use it locally:

```bash
# From the simple-worktree directory
npm install
npm link

# Now you can use it anywhere on your system
simple-worktree create my-feature
```