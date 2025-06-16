#!/bin/bash
# Shell integration for simple-worktree
# Source this file in your .bashrc/.zshrc to enable automatic directory changing

# Export environment variable to indicate shell integration is active
export SWT_SHELL_INTEGRATION=1

# Function that creates worktree and changes into it
swt-create() {
    # Run the actual create command and capture output
    local output=$(swt create "$@" 2>&1)
    local exit_code=$?
    
    # Print the output
    echo "$output"
    
    # If successful, extract the worktree path and cd to it
    if [ $exit_code -eq 0 ]; then
        # Extract the path from the output (looking for "Created worktree at: <path>")
        local worktree_path=$(echo "$output" | grep -o "Created worktree at: .*" | sed 's/Created worktree at: //')
        if [ -n "$worktree_path" ] && [ -d "$worktree_path" ]; then
            cd "$worktree_path"
        fi
    fi
    
    return $exit_code
}

# Function that deletes worktree and changes directory
swt-delete() {
    # Get the main repo path before deletion
    local main_repo=$(git worktree list | head -n1 | awk '{print $1}')
    
    # Run the actual delete command
    swt delete "$@"
    
    # If successful, cd to main repo
    if [ $? -eq 0 ]; then
        cd "$main_repo"
    fi
}

# Function that changes to a worktree directory by name
swt-cd() {
    if [ -z "$1" ]; then
        echo "Usage: swt-cd <worktree-name>" >&2
        return 1
    fi
    
    # Get the worktree path
    local worktree_path=$(swt cd "$1" 2>/dev/null)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ] && [ -n "$worktree_path" ] && [ -d "$worktree_path" ]; then
        cd "$worktree_path"
    else
        # Show the error output
        swt cd "$1"
        return 1
    fi
}

# Wrapper function for swt that intercepts certain commands
swt() {
    # Check if shell integration functions should be used
    case "$1" in
        "c"|"create")
            shift  # Remove the command
            swt-create "$@"
            ;;
        "d"|"delete")
            shift  # Remove the command
            swt-delete "$@"
            ;;
        "cd")
            shift  # Remove the command
            swt-cd "$@"
            ;;
        *)
            # For all other commands, use the original swt
            command swt "$@"
            ;;
    esac
}

# Aliases for convenience
alias swtc='swt-create'
alias swtd='swt-delete'
alias swtcd='swt-cd'