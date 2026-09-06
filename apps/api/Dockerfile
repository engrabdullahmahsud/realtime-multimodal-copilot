# Dockerfile for API server - pnpm workspace aware
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@11.25.0

# Copy workspace files needed for dependency resolution
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy workspace package manifests
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/

# Install all dependencies
RUN pnpm install --frozen-lockfile --filter @copilot/api...

# Copy API source code
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/

# Build the API
WORKDIR /app/apps/api
RUN pnpm run build

# Production image
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@11.25.0

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy workspace package manifests
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --filter @copilot/api...

# Copy built files
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Copy built workspace packages
COPY --from=builder /app/packages ./packages

WORKDIR /app/apps/api

# Expose port and run
EXPOSE 3002
ENV NODE_ENV=production
ENV PORT=3002
CMD ["node", "dist/server.js"]
