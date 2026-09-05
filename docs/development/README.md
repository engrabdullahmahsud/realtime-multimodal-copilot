# Development Setup Guide

## Prerequisites

Before setting up the development environment, ensure you have the following installed:

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **pnpm** >= 11.25.0 ([Install](https://pnpm.io/installation))
- **Docker** >= 24.0 ([Install](https://www.docker.com/get-started/))
- **Git** >= 2.40 ([Install](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git))

Verify your installation:

```bash
node --version    # Should be >= 20.0.0
pnpm --version    # Should be >= 11.25.0
docker --version  # Should be >= 24.0
git --version     # Should be >= 2.40
```

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd realtime-multimodal-copilot
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs dependencies for all packages in the monorepo. pnpm workspaces ensure that shared dependencies are hoisted and not duplicated.

### 3. Set Up Environment Variables

Copy the example environment files and fill in the required values:

```bash
# API environment
cp apps/api/.env.example apps/api/.env

# Web environment
cp apps/web/.env.example apps/web/.env
```

Edit the `.env` files with your actual values. **Never commit real secrets.**

### 4. Start Development Environment

Option A: Using Docker (recommended for full environment)

```bash
# Start all Docker containers (PostgreSQL, Redis, API, Web)
make docker:up
```

Option B: Using individual commands

```bash
# Start the web application (frontend)
pnpm --filter=@copilot/web dev

# Start the API server (backend)
pnpm --filter=@copilot/api dev
```

Option C: Using Makefile (starts both)

```bash
make dev
```

### 5. Verify the Setup

Open your browser and navigate to:
- **Web Application**: http://localhost:3000
- **API Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### 6. Stop the Development Environment

```bash
# Stop all Docker containers
make docker:down
```

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all development servers |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Run ESLint on all packages |
| `pnpm format` | Format all code with Prettier |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm docker:up` | Start Docker containers |
| `pnpm docker:down` | Stop Docker containers |
| `make dev` | Start development servers (alias) |
| `make test` | Run all tests (alias) |
| `make help` | Show all available commands |

## Package Structure

### Applications

- **`apps/web/`**: Next.js web application
  - Source: `apps/web/src/`
  - Configuration: `apps/web/tsconfig.json`, `apps/web/next.config.js`
  - Start: `pnpm --filter=@copilot/web dev`

- **`apps/api/`**: Hono API server
  - Source: `apps/api/src/`
  - Configuration: `apps/api/tsconfig.json`
  - Start: `pnpm --filter=@copilot/api dev`

### Shared Packages

- **`packages/types/`**: Shared TypeScript type definitions
  - Exports: `workspace`, `document`, `conversation`, `ai`, `common`
  - Build: `pnpm --filter=@copilot/types build`

- **`packages/config/`**: Shared configuration files
  - Contains: ESLint, Prettier, TypeScript, Tailwind configs
  - Referenced via: `@copilot/config/tsconfig/*`, `@copilot/config/eslint/*`

## IDE Setup

### VS Code

Install the following extensions:

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **TypeScript and JavaScript Language Features** (built-in)
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
- **Docker** (`ms-azuretools.vscode-docker`)

Recommended workspace settings (`.vscode/settings.json`):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.tabSize": 2,
  "files.autoSave": "afterDelay",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Testing

Run tests for all packages:

```bash
pnpm test
```

Run tests for a specific package:

```bash
pnpm --filter=@copilot/web test
pnpm --filter=@copilot/api test
pnpm --filter=@copilot/types test
```

Watch mode:

```bash
pnpm --filter=@copilot/web test:watch
```

## Docker Development

### Start Development Environment

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### View Logs

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

### Stop Services

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

### Database Access

Connect to PostgreSQL:

```bash
docker exec -it copilot-db psql -U copilot -d copilot
```

Connect to Redis:

```bash
docker exec -it copilot-redis redis-cli
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes on ports 3000 and 3001
   lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
   lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
   ```

2. **Dependency conflicts**
   ```bash
   # Clean and reinstall
   rm -rf node_modules
   rm pnpm-lock.yaml
   pnpm install
   ```

3. **TypeScript errors**
   ```bash
   # Clean build artifacts and rebuild
   pnpm --recursive run build
   pnpm run typecheck
   ```

4. **Docker issues**
   ```bash
   # Reset Docker and restart
   docker compose down -v
   docker compose up -d
   ```

## Next Steps

After setting up the development environment, see the following documentation:

- [Architecture Overview](../architecture.md)
- [ADR-001: Monorepo Selection](../adr/001-monorepo-selection.md)
- [Project README](../README.md)