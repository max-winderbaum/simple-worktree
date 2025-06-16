#!/bin/bash
# Shell integration for simple-worktree
# Source this file in your .bashrc/.zshrc to enable swt-delete function

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

# Alias for convenience
alias swtd='swt-delete'