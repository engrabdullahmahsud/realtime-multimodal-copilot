# Project Milestones and Roadmap

## Completed Milestone: Foundation

This milestone established the foundational development environment. All deliverables are documented in the README and ADRs.

### What Was Built

- Monorepo structure with pnpm workspaces
- Shared TypeScript types and configuration packages
- Web application (Next.js) with basic UI components
- API server (Hono) with health check endpoint
- Docker Compose for local development
- GitHub Actions CI pipeline
- ESLint, Prettier, TypeScript, and Tailwind configurations
- Environment variable management
- Makefile for developer workflow
- Foundational documentation

## Completed Milestone: AI Integration

**Objective**: Provider-agnostic conversation/message management and API endpoints.

### What Was Built

- Provider-agnostic AI architecture (HTTP/fetch-based, no SDK dependency)
- Conversation CRUD (list/create/get/update/delete) with Zod validation
- Message CRUD (list/create) with Zod validation
- AI response endpoint (`POST /ai/response`) — simulated, provider-agnostic
- Frontend UI: Home, Workspaces, Documents, Conversations pages
- Database schema (conversations, messages tables) via Drizzle ORM
- All API keys server-side only; no real secrets

## Current Milestone: Database Migrations & Seeding

**Objective**: Production-ready database schema, migrations, and development seeding.

### What Was Built

- Drizzle ORM schema with 8 tables and 5 enums (users, workspaces, workspace_members, documents, document_chunks, workspace_invitations, conversations, messages)
- Foreign keys with `ON DELETE CASCADE` on child tables
- Indexes on all foreign keys and frequently queried fields
- Unique indexes for uniqueness constraints
- `defaultRandom()` UUID primary keys
- `defaultNow()` timestamps on all tables
- Proper nullable/required field definitions
- Drizzle migration SQL generated via `drizzle-kit generate:pg`
- Migration output at `drizzle/0000_aromatic_meteorite.sql`
- Migration journal at `drizzle/meta/_journal.json`
- Database seed script (`scripts/seed.ts`) with:
  - Production safety gate (refuses to run in prod without `--confirm-production`)
  - Idempotent operations (skip if data already exists)
  - Creates: default user, workspace, membership, sample conversation with messages, sample document
- `.env.example` with DATABASE_URL template and commented-out AI provider keys
- Database scripts added to root `package.json` (`db:generate`, `db:migrate`, `db:studio`, `db:seed`)
- Fixed: Zod schema forward reference ordering (conversationSettings, aiModelPreferences, documentMetadata, chunkMetadata)
- Fixed: API index.ts (health route, variable shadowing, Hono methods, drizzle-orm/postgres.js import)
- Fixed: docker-compose.yml duplicate `NEXT_PUBLIC_API_URL`
- Fixed: Moon/Sun icon components (JSX syntax errors)
- Fixed: `.gitignore` coverage (added `.npm/`)
- TypeScript compilation passes for `packages/types` and `apps/api`

### What Remains Blocked

- `drizzle-kit push:pg` / `drizzle-kit migrate:pg` — requires live PostgreSQL connection
- Seed script execution — requires live PostgreSQL connection
- `pnpm install` — extremely slow network (registry timeouts); workspace symlinks not fully established in this environment

## Following Milestone: Document Management

**Objective**: Upload, process, and chunk documents for RAG.

1. Document upload API with presigned URLs
2. Document processing pipeline (extract, chunk, embed)
3. File storage integration (S3-compatible)
4. Document chunking for RAG

## Future Milestones

- Voice interaction (speech-to-text, text-to-speech)
- Real-time collaboration features
- Background job processing
- Evaluation and observability
- Production deployment pipeline
- Advanced multimodal inputs
- Agent workflows

## Documentation Status

| Document | Status | Path |
|----------|--------|------|
| README | ✅ Complete | `/README.md` |
| Architecture | ✅ Complete | `/docs/architecture.md` |
| Development Guide | ✅ Complete | `/docs/development/README.md` |
| ADR-001 (Monorepo) | ✅ Complete | `/docs/adr/001-monorepo-selection.md` |
| CI Pipeline | ✅ Complete | `/.github/workflows/ci.yml` |
| Docker Compose | ✅ Complete | `/docker-compose.yml` |
| Database Migrations | ✅ Complete | `/drizzle/0000_aromatic_meteorite.sql` |
| Seed Script | ✅ Complete | `/scripts/seed.ts` |
| Environment Template | ✅ Complete | `/.env.example` |

All documentation clearly distinguishes implemented from planned functionality.
