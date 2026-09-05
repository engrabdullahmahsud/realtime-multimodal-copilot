# Architecture Decision Record: Monorepo Selection

## Status
Accepted

## Date
2026-09-05

## Context

We need to establish the repository structure for the Real-Time Multimodal Voice & Document Copilot platform. The project will contain multiple applications (web frontend, API backend, future services) and shared packages (types, configuration, utilities).

We considered several approaches:
1. **Monorepo** with pnpm workspaces
2. **Multiple repositories** with separate package managers
3. **Nx monorepo** with advanced build system
4. **Turborepo** standalone

## Decision

We select a **monorepo with pnpm workspaces** as the repository strategy.

## Rationale

### Why Monorepo?

1. **Type Sharing**: Shared TypeScript types across frontend and backend eliminate type mismatches and duplication
2. **Atomic Changes**: Changes affecting multiple packages can be committed atomically
3. **Simplified Refactoring**: Cross-package refactoring is straightforward
4. **Faster Development**: No need to publish packages between iterations
5. **Consistent Configuration**: Shared ESLint, Prettier, and TypeScript configs ensure uniform code quality
6. **Better Dependency Management**: pnpm workspaces hoist shared dependencies, saving disk space and build time

### Why pnpm Workspaces?

1. **Performance**: pnpm is significantly faster than npm/yarn with content-addressable storage
2. **Strict Dependencies**: Prevents phantom dependencies and implicit access to undeclared packages
3. **Workspace Protocol**: Allows packages to reference each other via `workspace:*` protocol
4. **Lock File**: Single `pnpm-lock.yaml` ensures reproducible builds across all packages
5. **Catalog Feature**: Centralized dependency version management in `pnpm-workspace.yaml`
6. **Industry Adoption**: Widely used by major companies and open-source projects

### Why Not Alternatives?

- **Multiple Repositories**: Increases coordination overhead, slower development cycles, harder to share types
- **Nx**: More complex configuration, steeper learning curve, unnecessary for our current scale
- **Turborepo Standalone**: pnpm workspaces provide equivalent functionality with less complexity

## Consequences

### Positive

- Shared types eliminate runtime type mismatches
- Single `pnpm install` installs all dependencies for all packages
- Parallel builds across packages
- Consistent code quality across all packages
- Simplified CI/CD pipeline (single workspace)

### Negative (Trade-offs)

- Repository size may grow faster with all packages in one place
- Build dependencies can affect unrelated packages
- Requires discipline to maintain clean package boundaries
- CI may be slower if not properly configured

### Neutral

- Package names follow `@copilot/*` namespace convention
- All packages share the same Node.js version requirement (>=20)
- Shared configuration via `@copilot/config` package

## Future Considerations

- If the project scales significantly, consider splitting into multiple repositories or adopting a microservices architecture
- If build times become an issue, introduce Turborepo for advanced caching and task orchestration
- If package boundaries become unclear, enforce stricter package interfaces with `exports` field

## Related ADRs

- ADR-002: [Frontend Framework Selection](./adr-002-frontend-framework.md)
- ADR-003: [Database Strategy Selection](./adr-003-database-strategy.md)
- ADR-004: [Testing Strategy Selection](./adr-004-testing-strategy.md)