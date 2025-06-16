const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { minimatch } = require('minimatch');
const { execSync } = require('child_process');
const { loadConfig, parseFilesToSync } = require('./config');

async function syncFiles(sourceRoot, targetRoot) {
  // Load config and get patterns
  const config = loadConfig();
  const patterns = parseFilesToSync(config.filesToSync || []);

  if (patterns.length === 0) {
    return;
  }

  console.log(chalk.gray(`Syncing ${patterns.length} pattern(s)...`));

  const syncedPaths = [];
  
  for (const pattern of patterns) {
    const paths = await syncPattern(sourceRoot, targetRoot, pattern);
    syncedPaths.push(...paths);
  }

  // Update .gitignore with synced paths if enabled in config
  if (syncedPaths.length > 0 && config.addToGitignore !== false) {
    await updateGitignore(targetRoot, syncedPaths);
  }
}

async function syncPattern(sourceRoot, targetRoot, pattern) {
  const syncedPaths = [];
  
  // Handle negation patterns (starting with !)
  if (pattern.startsWith('!')) {
    // For now, we'll skip negation patterns
    // Could implement later if needed
    return syncedPaths;
  }

  // Handle directory patterns (ending with /)
  if (pattern.endsWith('/')) {
    const dirPath = pattern.slice(0, -1);
    const sourcePath = path.join(sourceRoot, dirPath);
    const targetPath = path.join(targetRoot, dirPath);

    if (fs.existsSync(sourcePath) && fs.lstatSync(sourcePath).isDirectory()) {
      if (createSymlink(sourcePath, targetPath, 'directory')) {
        syncedPaths.push(dirPath + '/');
      }
    }
    return syncedPaths;
  }

  // Handle glob patterns
  const files = findMatchingFiles(sourceRoot, pattern);
  
  for (const file of files) {
    const sourcePath = path.join(sourceRoot, file);
    const targetPath = path.join(targetRoot, file);
    
    // Create parent directory if needed
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (createSymlink(sourcePath, targetPath, 'file')) {
      syncedPaths.push(file);
    }
  }
  
  return syncedPaths;
}

function findMatchingFiles(root, pattern) {
  const matches = [];
  
  // Convert gitignore-style patterns to minimatch patterns
  let globPattern = pattern;
  
  // If pattern doesn't start with /, it can match at any level
  if (!pattern.startsWith('/')) {
    globPattern = '**/' + pattern;
  } else {
    // Remove leading slash for minimatch
    globPattern = pattern.substring(1);
  }
  
  function walk(dir, relativePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      // Skip .git directory
      if (entry.name === '.git') continue;
      
      if (entry.isDirectory()) {
        // Check if directory matches pattern
        if (minimatch(relPath, globPattern) || minimatch(relPath + '/', globPattern)) {
          // Don't add directory itself, will be handled by directory pattern
          continue;
        }
        walk(fullPath, relPath);
      } else if (entry.isFile()) {
        if (minimatch(relPath, globPattern)) {
          matches.push(relPath);
        }
      }
    }
  }
  
  walk(root);
  return matches;
}

function createSymlink(source, target, type) {
  // Skip if target already exists
  if (fs.existsSync(target)) {
    return false;
  }

  try {
    fs.symlinkSync(source, target);
    const displayPath = path.relative(process.cwd(), target);
    console.log(chalk.green(`  ✓ Linked: ${displayPath}`));
    return true;
  } catch (error) {
    console.warn(chalk.yellow(`  ⚠ Failed to link ${target}: ${error.message}`));
    return false;
  }
}

function isIgnoredByGit(filePath, cwd) {
  try {
    // Use git check-ignore to see if the file would be ignored
    execSync(`git check-ignore "${filePath}"`, { 
      cwd: cwd,
      stdio: 'pipe' 
    });
    return true; // If command succeeds, file is ignored
  } catch {
    return false; // If command fails, file is not ignored
  }
}

async function updateGitignore(targetRoot, syncedPaths) {
  const gitignorePath = path.join(targetRoot, '.gitignore');
  
  // Read existing .gitignore content
  let existingContent = '';
  let existingPatterns = new Set();
  
  if (fs.existsSync(gitignorePath)) {
    try {
      existingContent = fs.readFileSync(gitignorePath, 'utf8');
      // Parse existing patterns (normalize by removing trailing slashes for comparison)
      existingContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          existingPatterns.add(trimmed.replace(/\/$/, ''));
        }
      });
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not read .gitignore: ${error.message}`));
      return;
    }
  }

  // Find new patterns to add
  const newPatterns = [];
  for (const syncedPath of syncedPaths) {
    // First check if git already ignores this file
    if (isIgnoredByGit(syncedPath, targetRoot)) {
      console.log(chalk.gray(`  • Skipping ${syncedPath} (already ignored by git)`));
      continue;
    }
    
    // Normalize for comparison (remove trailing slash)
    const normalizedPath = syncedPath.replace(/\/$/, '');
    
    // Check if pattern already exists in .gitignore
    if (!existingPatterns.has(normalizedPath)) {
      newPatterns.push(syncedPath);
    }
  }

  // Only update if there are new patterns to add
  if (newPatterns.length === 0) {
    return;
  }

  console.log(chalk.gray('\nUpdating .gitignore with synced paths...'));

  // Prepare new content
  let newContent = existingContent;
  
  // Ensure file ends with newline
  if (newContent && !newContent.endsWith('\n')) {
    newContent += '\n';
  }

  // Add section header if adding first patterns
  if (newContent) {
    newContent += '\n';
  }
  newContent += '# simple-worktree synced files\n';
  
  // Add new patterns
  for (const pattern of newPatterns) {
    newContent += pattern + '\n';
    console.log(chalk.green(`  ✓ Added to .gitignore: ${pattern}`));
  }

  // Write updated .gitignore
  try {
    fs.writeFileSync(gitignorePath, newContent);
  } catch (error) {
    console.warn(chalk.yellow(`Warning: Could not update .gitignore: ${error.message}`));
  }
}

module.exports = { syncFiles };