#!/bin/bash
# Runs when VS Code attaches to the container

set -e

# Show welcome message
cat << 'EOF'

🎉 Welcome to Qwik + LIT + Builder.io Codespace!

Quick commands:
  pnpm dev          - Start development server
  pnpm build        - Build for production
  pnpm test         - Run tests
  pnpm storybook    - Start Storybook
  
Services running:
  - PostgreSQL on port 5432
  - Redis on port 6379
  - MinIO (S3) on port 9000
  
Happy coding! 🚀

EOF

# Open terminals for common tasks
code --new-window --wait=false
code --goto src/routes/index.tsx

echo "💡 Tip: Run 'pnpm dev' to start the development server"