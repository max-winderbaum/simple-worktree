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
            main_repo=$(git worktree list | head -n1 | awk '{print $1}')
            output=$(command swt "$@" 2>&1)
            echo "$output"
            if echo "$output" | grep -q "deleted successfully" && [ -d "$main_repo" ]; then
                cd "$main_repo"
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

  // Check if functions are already installed
  if (fs.existsSync(configFile)) {
    const content = fs.readFileSync(configFile, 'utf8');
    if (content.includes('# simple-worktree shell functions')) {
      console.log(chalk.yellow('Shell functions already installed'));
      return;
    }
  }

  // Append functions to shell config
  fs.appendFileSync(configFile, '\n' + SHELL_FUNCTIONS);
  
  console.log(chalk.green(`✔ Shell functions installed to ${configFile}`));
  console.log(chalk.yellow('\nTo activate, run:'));
  console.log(chalk.cyan(`  source ${configFile}`));
  console.log(chalk.gray('\nOr open a new terminal window'));
}

module.exports = { installShellFunctions, SHELL_FUNCTIONS };