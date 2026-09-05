# Real-Time Multimodal Voice & Document Copilot

> A production-grade AI workspace platform for text and voice interactions with document context.

## Overview

Real-Time Multimodal Voice & Document Copilot is a large-scale, production-style general-purpose AI workspace. Users can create workspaces, upload and manage documents, interact with an AI copilot through text and real-time voice, ask questions about their documents, receive streaming responses with citations, and eventually provide images and other multimodal inputs.

This project is engineered as if it could evolve into a real production application, prioritizing maintainability, clear architecture, strong typing, testability, security, observability, and developer experience.

## Product Vision

**Core Experience:**

```
User → Workspace → Documents / Visual Information → Text or Voice Question → AI Copilot → Retrieval / Reasoning → Streaming Response → Citations → Document Source Navigation → Optional Voice Response
```

The application should feel like a serious productivity product with a subtle futuristic AI identity.

**Design Direction:**
- Professional productivity UI
- Dark-first interface
- Clean typography
- Subtle purple/cyan AI accents
- Minimal unnecessary animation
- Excellent accessibility
- Clear system states
- Responsive design
- Strong information hierarchy

## Technology Choices

### Frontend: Next.js 14 (App Router)
- **Why**: Industry-standard React framework with excellent TypeScript support, server components, and built-in optimization. The App Router provides a clear file-system-based routing pattern.

### Backend: Hono
- **Why**: Lightweight, fast, TypeScript-first web framework. Ideal for API servers with excellent performance and a minimal footprint. Designed for edge deployment if needed.

### Language: TypeScript
- **Why**: End-to-end type safety across the entire stack. Prevents entire classes of bugs at compile time and improves developer experience.

### Package Manager: pnpm
- **Why**: Fast, disk-efficient package manager with excellent workspace support. Uses a content-addressable store to save disk space. Strict dependency resolution prevents phantom dependencies.

### Build Orchestration: Turborepo (via pnpm workspaces)
- **Why**: pnpm workspaces provide the foundation for monorepo management with fast, parallel builds and dependency caching.

### Database: PostgreSQL with Drizzle ORM
- **Why**: PostgreSQL is the most advanced open-source relational database. Drizzle ORM provides type-safe queries with excellent performance and zero overhead.

### Caching/Queue: Redis
- **Why**: In-memory data structure store for caching, session management, and job queuing. Essential for real-time features and background processing.

### Testing: Vitest
- **Why**: Native Vite-based test runner with excellent TypeScript support and fast execution speed. Compatible with Jest APIs.

### Linting/Formatting: ESLint + Prettier
- **Why**: Industry-standard code quality tools with TypeScript support and Prettier integration for consistent formatting.

### Styling: Tailwind CSS
- **Why**: Utility-first CSS framework that enables rapid UI development with consistent design tokens and theming support.

### Docker: Docker Compose
- **Why**: Container-based development environment for consistent local development and easy deployment.

### CI: GitHub Actions
- **Why**: Native GitHub integration, easy to configure, and supports all required validation checks.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Landing  │  │ Workspace│  │ Document │  │  Copilot │   │
│  │  Page    │  │ Dashboard│  │ Library  │  │ Workspace│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST / SSE / WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Hono)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │Workspace │  │Document  │  │Conversation│  │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ Application Services
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION SERVICES                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Document │  │ Conversation│ │  AI      │  │  RAG     │   │
│  │ Processing│  │ Management│  │Orchestrat│  │ Retrieval│   │
│  │Pipeline  │  │           │  │  or      │  │ Engine   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ Data & Infrastructure
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               DATA & INFRASTRUCTURE                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │PostgreSQL│  │   Redis  │  │   S3     │  │ Vector   │   │
│  │          │  │          │  │ Object   │  │  Search  │   │
│  │          │  │          │  │ Storage  │  │ Engine   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Layer Descriptions

1. **Frontend (Next.js)**
   - User interface for all application screens
   - Server components for SEO and performance
   - Client components for interactivity
   - Real-time updates via Server-Sent Events and WebSockets

2. **Backend API (Hono)**
   - RESTful API endpoints
   - Request validation with Zod
   - Authentication/authorization layer (future)
   - SSE streaming for AI responses

3. **Application Services**
   - Document processing pipeline
   - Conversation management
   - AI orchestration layer
   - RAG retrieval engine

4. **Data & Infrastructure**
   - PostgreSQL for relational data
   - Redis for caching and queuing
   - S3 for document storage
   - Vector search for semantic retrieval

## Repository Structure

```
realtime-multimodal-copilot/
├── apps/                    # Applications
│   ├── web/                # Next.js web application
│   └── api/                # Hono API server
├── packages/                # Shared packages
│   ├── types/              # Shared TypeScript types
│   └── config/             # Shared configuration (ESLint, Prettier, TypeScript, Tailwind)
├── services/               # Future background services
├── docs/                   # Documentation
│   ├── architecture/       # Architecture documentation
│   ├── adr/                # Architecture Decision Records
│   └── development/        # Development guides
├── scripts/                # Build and deployment scripts
├── tests/                  # Shared test utilities
├── .github/                # GitHub Actions CI/CD
├── docker-compose.yml      # Docker Compose for production
├── docker-compose.dev.yml  # Docker Compose for development
├── Makefile                # Developer workflow commands
├── pnpm-workspace.yaml     # pnpm workspace configuration
└── package.json            # Root package.json
```

## Development Setup

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 11.25.0
- **Docker** >= 24.0 (for local database and Redis)
- **Git** >= 2.40

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd realtime-multimodal-copilot

# Install dependencies
pnpm install

# Start development environment (with Docker)
make docker:up

# Or start just the apps
pnpm dev

# Run tests
pnpm test

# Run lint
pnpm lint

# Build all packages
pnpm build
```

### Available Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start development servers |
| `make build` | Build all packages |
| `make test` | Run all tests |
| `make lint` | Run ESLint |
| `make format` | Format code |
| `make typecheck` | Run TypeScript type checking |
| `make docker:up` | Start Docker containers |
| `make docker:down` | Stop Docker containers |
| `make docker:logs` | View Docker logs |
| `make help` | Show all available commands |

## Status

### Implemented (This Milestone)

- ✅ Monorepo structure with pnpm workspaces
- ✅ Shared TypeScript types package (`@copilot/types`)
- ✅ Shared configuration package (`@copilot/config`)
- ✅ Web application foundation (Next.js App Router)
- ✅ API server foundation (Hono)
- ✅ Docker Compose for local development
- ✅ GitHub Actions CI pipeline
- ✅ ESLint, Prettier, and TypeScript configurations
- ✅ Tailwind CSS design system
- ✅ Environment variable management
- ✅ Makefile for developer workflow
- ✅ Foundational documentation

### Planned (Next Milestones)

- Database migrations and seeding
- Authentication and authorization
- Document upload and processing pipeline
- AI copilot integration
- RAG retrieval engine
- Real-time streaming responses
- Voice interaction (speech-to-text, text-to-speech)
- Evaluation and observability

### Future (Not Yet Planned)

- Background job processing
- Edge deployment
- Advanced multimodal inputs
- Agent workflows
- Production monitoring and alerting

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [Development Documentation](./docs/development/README.md) for detailed guidelines.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**This is a portfolio project. All functionality is implemented as a demonstration of engineering practices. Production features (authentication, payment, etc.) are not implemented.**