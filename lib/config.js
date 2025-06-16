const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const TOML = require('@iarna/toml');

const CONFIG_FILENAME = 'swtconfig.toml';
const DEFAULT_CONFIG = {
  defaultWorktreeDir: '../',
  addToGitignore: true,
  filesToSync: []
};

/**
 * Get the configuration file path
 * Searches in order: current directory, home directory
 */
function getConfigPath() {
  // Check current directory
  const localConfig = path.join(process.cwd(), CONFIG_FILENAME);
  if (fs.existsSync(localConfig)) {
    return localConfig;
  }

  // Check home directory
  const homeConfig = path.join(os.homedir(), `.${CONFIG_FILENAME}`);
  if (fs.existsSync(homeConfig)) {
    return homeConfig;
  }

  return null;
}

/**
 * Load configuration from file
 */
function loadConfig() {
  const configPath = getConfigPath();
  
  if (!configPath) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const userConfig = TOML.parse(configContent);
    
    // Merge with defaults
    return { ...DEFAULT_CONFIG, ...userConfig };
  } catch (error) {
    console.warn(chalk.yellow(`Warning: Error reading ${CONFIG_FILENAME}: ${error.message}`));
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save configuration to file
 */
function saveConfig(config, configPath) {
  try {
    const content = TOML.stringify(config);
    fs.writeFileSync(configPath, content);
    return true;
  } catch (error) {
    console.error(chalk.red(`Error saving config: ${error.message}`));
    return false;
  }
}

/**
 * Initialize config file in current directory
 */
function initConfig() {
  const localConfig = path.join(process.cwd(), CONFIG_FILENAME);
  
  if (fs.existsSync(localConfig)) {
    console.log(chalk.yellow(`Config file already exists: ${localConfig}`));
    return false;
  }

  // Create TOML content with comments
  const tomlContent = `# simple-worktree configuration
# See https://github.com/textio/simple-worktree for all options

# Where to create worktrees by default
# Can be relative path (e.g., "../", "../../worktrees/")
# or absolute path (e.g., "/home/user/worktrees/")
defaultWorktreeDir = "../"

# Whether to automatically add synced files to .gitignore
addToGitignore = true

# Files to sync across worktrees (gitignore syntax)
# Only list files that are NOT committed to git
filesToSync = [
  # "# Local environment files",
  # ".env",
  # ".env.local",
  # "",
  # "# IDE settings",
  # ".vscode/settings.json", 
  # ".idea/workspace.xml"
]
`;

  try {
    fs.writeFileSync(localConfig, tomlContent);
    console.log(chalk.green(`✅ Created ${CONFIG_FILENAME}`));
    console.log(`\nDefault configuration:`);
    console.log(chalk.gray(tomlContent));
    return true;
  } catch (error) {
    console.error(chalk.red(`Error creating config: ${error.message}`));
    return false;
  }
}

/**
 * Resolve the worktree directory path
 */
function resolveWorktreeDir(config, name, customPath) {
  if (customPath) {
    return customPath;
  }

  const defaultDir = config.defaultWorktreeDir || '../';
  
  // If default dir is relative, resolve it from current directory
  if (!path.isAbsolute(defaultDir)) {
    const gitRoot = require('./git-utils').getGitRoot();
    return path.join(gitRoot, defaultDir, name);
  }

  return path.join(defaultDir, name);
}

/**
 * Parse filesToSync array into patterns
 * Handles both string arrays and mixed arrays with comments
 */
function parseFilesToSync(filesToSync) {
  if (!Array.isArray(filesToSync)) {
    return [];
  }

  const patterns = [];
  
  for (const item of filesToSync) {
    if (typeof item !== 'string') continue;
    
    const trimmed = item.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    patterns.push(trimmed);
  }
  
  return patterns;
}

module.exports = {
  loadConfig,
  saveConfig,
  initConfig,
  getConfigPath,
  resolveWorktreeDir,
  parseFilesToSync,
  CONFIG_FILENAME
};