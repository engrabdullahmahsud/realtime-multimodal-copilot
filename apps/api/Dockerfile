# Dockerfile for API server
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY src ./src
COPY tsconfig.json .
COPY .env.example ./

# Build the application
RUN pnpm run build

# Production image
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Expose port and run
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]