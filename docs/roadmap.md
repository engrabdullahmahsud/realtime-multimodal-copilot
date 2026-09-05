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

## Completed Milestone: Database Migrations & Seeding

**Objective**: Production-ready database schema, migrations, and development seeding.

### What Was Built

- Drizzle ORM schema with 8 tables and 5 enums (users, workspaces, workspace_members, documents, document_chunks, workspace_invitations, conversations, messages)
- Foreign keys with `ON DELETE CASCADE` on child tables
- Indexes on all foreign keys and frequently queried fields
- Unique indexes for uniqueness constraints
- `defaultRandom()` UUID primary keys
- `defaultNow()` timestamps on all tables
- Drizzle migration SQL generated via `drizzle-kit generate:pg`
- Migration output at `drizzle/0000_aromatic_meteorite.sql`
- Database seed script (`scripts/seed.ts`) with production safety gate
- `.env.example` with DATABASE_URL template and commented-out AI provider keys
- Database scripts added to root `package.json` (`db:generate`, `db:migrate`, `db:studio`, `db:seed`)

## Current Milestone: Authentication & Authorization

**Objective**: Production-oriented authentication foundation with session-based auth, password hashing, middleware, and frontend auth flow.

### What Was Built

- **Database**: sessions table with token, userId, expiresAt; users table enhanced with avatarUrl, emailVerified
- **Migration**: `drizzle/0001_perfect_thunderbolts.sql` — sessions table + users columns
- **Password hashing**: Node.js built-in `crypto.scrypt` (zero external dependencies, timing-safe comparison)
- **Session management**: Database-backed sessions, 7-day expiration, auto-cleanup of expired sessions
- **Auth middleware**: `requireAuth` (cookie-based session validation), `requireWorkspaceRole` (role hierarchy enforcement)
- **Auth routes**: POST /auth/register, POST /auth/login, POST /auth/logout, GET /auth/me
- **Zod validation**: registerSchema (8+ chars, uppercase, lowercase, number), loginSchema
- **Frontend**: AuthProvider context, login page, register page, AuthGuard, UserMenu with logout
- **Root layout**: AuthProvider wrapping, header with navigation and user menu
- **Protected routes**: All API routes after auth routes require valid session
- **All existing pages**: Updated with AuthGuard protection

### Security Features

- Passwords never returned in API responses (explicit field selection)
- Passwords never stored in plaintext (scrypt hashing)
- Timing-safe password comparison (timingSafeEqual)
- Timing-safe user enumeration prevention (dummy hash on unknown email)
- Same error message for wrong email and wrong password
- HTTP-only cookies (not accessible via JavaScript)
- SameSite=Strict (CSRF protection)
- Secure flag in production mode
- Session tokens regenerated on each login (no session fixation)
- Session invalidated on logout (DB row deleted + cookie cleared)
- Orphaned session cleanup on validation failure

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
