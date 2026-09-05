# Dockerfile for Web application (Next.js)
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY src ./src
COPY tsconfig.json .
COPY next.config.js .
COPY tailwind.config.ts .
COPY .env.example ./
COPY public ./public

# Build the application
RUN pnpm run build

# Production image
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose port and run
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server.js"]