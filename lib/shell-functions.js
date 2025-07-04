const fs = require('fs');
const os = require('os');
const path = require('path');
const chalk = require('chalk');

const SHELL_FUNCTIONS = `
# simple-worktree shell functions
swt() {
    case "$1" in
        c|create)
            output=$(command swt "$@" 2>&1)
            echo "$output"
            location=$(echo "$output" | grep -o "Location: .*" | sed 's/Location: //')
            if [ -n "$location" ] && [ -d "$location" ]; then
                cd "$location"
            fi
            ;;
        d|delete)
            # Save current directory before running command
            current_dir=$(pwd)
            # Run the command normally
            command swt "$@"
            
            # Check if marker file exists at fixed location
            if [ -f "/tmp/.swt_delete_info" ]; then
                # Read the marker data
                marker_data=$(cat "/tmp/.swt_delete_info" 2>/dev/null || echo "{}")
                # Clean up marker file immediately
                rm -f "/tmp/.swt_delete_info" 2>/dev/null || true
                
                # Parse JSON to get paths
                main_repo=$(echo "$marker_data" | grep -o '"mainRepo":"[^"]*"' | cut -d'"' -f4)
                worktree_path=$(echo "$marker_data" | grep -o '"worktreePath":"[^"]*"' | cut -d'"' -f4)
                
                # Change to main repo first
                if [ -n "$main_repo" ] && [ -d "$main_repo" ]; then
                    cd "$main_repo"
                    # Now delete the worktree directory if it still exists
                    if [ -n "$worktree_path" ] && [ -d "$worktree_path" ]; then
                        rm -rf "$worktree_path" 2>/dev/null || true
                    fi
                fi
            fi
            ;;
        cd)
            shift  # Remove 'cd' from arguments
            location=$(command swt cd "$@" 2>&1)
            if [ $? -eq 0 ] && [ -n "$location" ] && [ -d "$location" ]; then
                cd "$location"
                echo "Changed to worktree: $location"
            else
                echo "$location" >&2
            fi
            ;;
        h|home)
            location=$(command swt home 2>&1)
            if [ $? -eq 0 ] && [ -n "$location" ] && [ -d "$location" ]; then
                cd "$location"
                echo "Changed to main repository: $location"
            else
                echo "$location" >&2
            fi
            ;;
        *)
            command swt "$@"
            ;;
    esac
}
`;

async function installShellFunctions() {
  const shell = process.env.SHELL || '';
  const home = os.homedir();
  
  let configFile;
  if (shell.includes('zsh')) {
    configFile = path.join(home, '.zshrc');
  } else if (shell.includes('bash')) {
    configFile = path.join(home, '.bashrc');
  } else {
    throw new Error(`Unsupported shell: ${shell}. Please manually add the shell functions.`);
  }

  // Check if config file exists
  let existingContent = '';
  if (fs.existsSync(configFile)) {
    existingContent = fs.readFileSync(configFile, 'utf8');
  }

  // Remove old shell functions if they exist
  if (existingContent.includes('# simple-worktree shell functions')) {
    console.log(chalk.blue('Updating existing shell functions...'));
    
    // Find the start and end of our shell functions
    const startMarker = '# simple-worktree shell functions';
    const endMarker = '}';
    
    const startIndex = existingContent.indexOf(startMarker);
    if (startIndex !== -1) {
      // Find the closing brace of the swt function
      let braceCount = 0;
      let inFunction = false;
      let endIndex = -1;
      
      for (let i = startIndex; i < existingContent.length; i++) {
        if (existingContent.substring(i, i + 5) === 'swt()') {
          inFunction = true;
        }
        if (inFunction) {
          if (existingContent[i] === '{') braceCount++;
          if (existingContent[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
      }
      
      if (endIndex !== -1) {
        // Remove old functions
        const before = existingContent.substring(0, startIndex).trimEnd();
        const after = existingContent.substring(endIndex).trimStart();
        existingContent = before + '\n' + after;
        fs.writeFileSync(configFile, existingContent);
      }
    }
  }

  // Append new functions
  fs.appendFileSync(configFile, '\n' + SHELL_FUNCTIONS);
  
  const wasUpdate = existingContent.includes('# simple-worktree shell functions');
  console.log(chalk.green(`✔ Shell functions ${wasUpdate ? 'updated' : 'installed'} in ${configFile}`));
  console.log(chalk.yellow('\nTo activate, run:'));
  console.log(chalk.cyan(`  source ${configFile}`));
  console.log(chalk.gray('\nOr open a new terminal window'));
}

module.exports = { installShellFunctions, SHELL_FUNCTIONS };