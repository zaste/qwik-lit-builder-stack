#!/bin/bash
# Runs once when the codespace is first created

set -e

echo "🚀 Setting up Qwik + LIT + Builder.io development environment..."

# Create necessary directories
mkdir -p .vscode tmp logs .cache

# Install global tools
echo "📦 Installing global development tools..."
npm install -g @builder.io/cli wrangler@latest vercel@latest

# Setup pnpm
echo "📦 Setting up pnpm..."
corepack enable
corepack prepare pnpm@latest --activate

# Install dependencies
echo "📦 Installing project dependencies..."
pnpm install

# Setup database
echo "🗄️ Setting up local PostgreSQL..."
sudo -u postgres psql <<EOF
CREATE DATABASE app_dev;
CREATE DATABASE app_test;
CREATE USER devuser WITH ENCRYPTED PASSWORD 'devpass';
GRANT ALL PRIVILEGES ON DATABASE app_dev TO devuser;
GRANT ALL PRIVILEGES ON DATABASE app_test TO devuser;
EOF

# Initialize Prisma (if using)
if [ -f "prisma/schema.prisma" ]; then
  echo "🗄️ Running Prisma migrations..."
  pnpm prisma generate
  pnpm prisma migrate dev --name init
fi

# Setup MinIO (local S3)
echo "☁️ Setting up MinIO..."
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# Create MinIO bucket
sleep 5
docker exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec minio mc mb local/uploads

# Setup Redis
echo "📦 Setting up Redis..."
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:alpine

# Generate development certificates
echo "🔐 Generating development certificates..."
mkdir -p .certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout .certs/localhost.key \
  -out .certs/localhost.crt \
  -subj "/C=US/ST=State/L=City/O=Dev/CN=localhost"

# Setup git hooks
echo "🪝 Setting up git hooks..."
pnpm husky install

# Create .env.local from template
if [ -f ".env.example" ] && [ ! -f ".env.local" ]; then
  echo "📋 Creating .env.local from template..."
  cp .env.example .env.local
  
  # Update with Codespaces URLs
  sed -i "s|SITE_URL=.*|SITE_URL=https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}|g" .env.local
  sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://devuser:devpass@localhost:5432/app_dev|g" .env.local
  sed -i "s|REDIS_URL=.*|REDIS_URL=redis://localhost:6379|g" .env.local
  sed -i "s|S3_ENDPOINT=.*|S3_ENDPOINT=http://localhost:9000|g" .env.local
fi

# Build the project
echo "🏗️ Building project..."
pnpm build

# Generate TypeScript types
echo "📝 Generating TypeScript types..."
pnpm type-check

echo "✅ Codespace setup complete!"