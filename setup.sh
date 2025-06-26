#!/bin/bash
# Quick setup script for the repository

echo "🚀 Setting up qwik-lit-builder-stack..."

# Make scripts executable
chmod +x .devcontainer/scripts/*.sh
chmod +x scripts/*.sh

echo "✅ Scripts are now executable!"
echo ""
echo "Next steps:"
echo "1. Click 'Code' → 'Codespaces' → 'Create codespace on main'"
echo "2. Wait for the environment to build"
echo "3. Run 'pnpm dev' to start developing!"
echo ""
echo "Or for local development:"
echo "1. Run 'pnpm install'"
echo "2. Run 'pnpm dev'"
