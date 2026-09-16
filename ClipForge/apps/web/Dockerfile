# ClipForge Web Application Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY apps/web/package.json ./
COPY apps/web/pnpm-lock.yaml ./
COPY package.json ./
COPY pnpm-workspace.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/web/ ./apps/web/
COPY packages/ ./packages/

# Build the application
RUN pnpm --filter @clipforge/web build

# Stage 2: Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/pnpm-lock.yaml ./apps/web/pnpm-lock.yaml
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

RUN npm install -g pnpm
RUN pnpm install --prod --frozen-lockfile

# Copy built files
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.js ./apps/web/next.config.js
COPY --from=builder /app/apps/web/tsconfig.json ./apps/web/tsconfig.json
COPY --from=builder /app/apps/web/tailwind.config.ts ./apps/web/tailwind.config.ts
COPY --from=builder /app/apps/web/postcss.config.js ./apps/web/postcss.config.js

# Copy packages (needed for runtime)
COPY --from=builder /app/packages/core ./packages/core
COPY --from=builder /app/packages/shared ./packages/shared

# Create data directory
RUN mkdir -p /app/data/downloads /app/data/uploads /app/data/logs

# Install system dependencies for video processing
RUN apk add --no-cache \
    ffmpeg \
    yt-dlp \
    curl \
    && rm -rf /var/cache/apk/*

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["pnpm", "--filter", "@clipforge/web", "start"]
