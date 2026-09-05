# Architecture Documentation

## Overview

This document describes the high-level architecture of the Real-Time Multimodal Voice & Document Copilot platform.

## Architecture Decisions

### Monorepo Structure

**Decision**: Use a monorepo with pnpm workspaces.

**Rationale**:
- Single source of truth for shared code and types
- Simplified dependency management across packages
- Atomic commits across packages
- Faster builds through parallelization
- Better refactoring support

**Alternatives Considered**:
- Multiple repositories: Increases coordination overhead, slower development
- Nx: More complex, pnpm workspaces sufficient for current scale
- Turborepo standalone: pnpm workspaces provide equivalent functionality

### Frontend Framework

**Decision**: Next.js 14 with App Router.

**Rationale**:
- Industry standard for React applications
- Excellent TypeScript support
- Server components for performance and SEO
- Built-in data fetching and caching
- Large ecosystem and community

### Backend Framework

**Decision**: Hono.

**Rationale**:
- Lightweight and fast
- TypeScript-first design
- Excellent for API servers
- Edge deployment ready
- Minimal overhead

### Database Strategy

**Decision**: PostgreSQL with Drizzle ORM.

**Rationale**:
- Most advanced open-source relational database
- Drizzle ORM provides type-safe queries with zero overhead
- Excellent for relational data (users, workspaces, documents)
- JSONB support for flexible metadata
- Strong consistency guarantees

### Caching and Queuing

**Decision**: Redis.

**Rationale**:
- Industry standard for caching
- Built-in pub/sub for real-time features
- BullMQ for job queuing
- Low latency for session management

### Object Storage

**Decision**: AWS S3 (or compatible).

**Rationale**:
- Standard for file storage
- Presigned URLs for secure uploads
- Scalable to any size
- Lifecycle policies for cost management

### Vector Search

**Decision**: Dedicated vector database (planned for next milestone).

**Rationale**:
- Optimized for semantic search
- Efficient similarity queries
- Scale for document chunks

## Architectural Boundaries

### 1. Frontend-Backend Boundary

The frontend (Next.js) and backend (Hono) are separate applications that communicate via REST APIs and Server-Sent Events. This separation:
- Enables independent scaling
- Allows different deployment strategies
- Prevents frontend code from leaking into the server
- Maintains clear security boundaries

### 2. Client-Server Secret Boundary

- **Client**: Public API keys, feature flags, non-sensitive configuration
- **Server**: Database credentials, AI API keys, encryption secrets
- **Never**: Hard-code secrets in either client or server bundles

### 3. Application Service Boundaries

Each application service has a clear responsibility:
- **Document Service**: Document lifecycle and processing
- **Conversation Service**: Conversation and message management
- **AI Service**: LLM orchestration and prompt management
- **RAG Service**: Retrieval and context management

### 4. Data Layer Boundaries

- **PostgreSQL**: Relational data (users, workspaces, conversations)
- **Redis**: Caching, sessions, real-time state
- **S3**: Document files and uploaded content
- **Vector DB**: Document embeddings and semantic search

## Technology Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14 | Industry standard, server components |
| Backend | Hono | Lightweight, TypeScript-first |
| Language | TypeScript | End-to-end type safety |
| Database | PostgreSQL + Drizzle | Advanced relational, type-safe ORM |
| Cache/Queue | Redis | Industry standard for caching/queuing |
| Storage | AWS S3 | Standard for file storage |
| Testing | Vitest | Fast, native Vite integration |
| Linting | ESLint | Industry standard |
| Formatting | Prettier | Consistent code style |
| Styling | Tailwind CSS | Utility-first, consistent design |
| CI/CD | GitHub Actions | Native GitHub integration |
| Containerization | Docker Compose | Consistent local dev environment |
| Package Manager | pnpm | Fast, efficient workspace support |

## Future Architectural Evolution

### Planned Extensions

1. **Background Workers**: Dedicated services for document processing, AI tasks
2. **Edge Functions**: Deploy API to edge locations for lower latency
3. **Microservices**: Split monolithic API into domain-specific services
4. **Real-time Infrastructure**: WebSocket gateway for live collaboration
5. **Event Sourcing**: Audit trail for all system changes

### Non-Goals (Current Phase)

- Microservices architecture (premature optimization)
- Event-driven architecture (adds complexity without benefit)
- Multi-region deployment (unnecessary for initial scale)
- Advanced caching strategies (simple Redis caching sufficient)