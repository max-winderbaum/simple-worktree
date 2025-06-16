#!/bin/bash

# Install simple-worktree locally for the current project

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing simple-worktree locally..."

# Install dependencies
cd "$SCRIPT_DIR"
npm install

# Create local link
npm link

echo "✅ simple-worktree installed successfully!"
echo ""
echo "You can now use the following commands:"
echo "  simple-worktree --help"
echo "  swt --help"
echo ""
echo "Or use the Makefile commands:"
echo "  make wt-init     # Initialize hooks"
echo "  make wt-create name=<branch>"
echo "  make wt-delete"
echo "  make wt-list"