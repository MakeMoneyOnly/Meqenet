# Multi-stage Dockerfile for Authentication Service
# Optimized for production with security best practices

# -----------------------------------------------------------------------------
# Builder Stage
# -----------------------------------------------------------------------------
# NOTE: We switch from **alpine** to **slim (debian)** here to avoid the sporadic
# I/O errors seen when installing heavy build-time dependencies (g++, python3)
# on musl based images under Docker-for-Windows. Debian based images have
# pre-built binaries for most native Node modules (e.g. argon2) which removes
# the need to compile them from source and therefore removes the g++ dependency
# entirely. This keeps the image small while making the build far more reliable
# on Windows/WSL hosts.

FROM node:18-slim AS builder

# Set working directory
WORKDIR /app

# Install minimal dependencies required for node-gyp (only if a module really
# needs compilation). We deliberately omit **g++** here because Debian based
# images ship with many pre-compiled binaries for common native modules. If a
# compilation is still required, adding build-essential back can be evaluated
# later.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make \
    && ln -sf python3 /usr/bin/python \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy pnpm and project configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy service-specific configuration
COPY backend/services/auth-service/nest-cli.json ./nest-cli.json

# Install all dependencies using pnpm
RUN corepack enable && corepack prepare pnpm@10.12.3 --activate
RUN pnpm install --frozen-lockfile

# Copy the entire monorepo source code
COPY . .

# Build the specific service using Nx
RUN pnpm exec nx build auth-service

# Ensure proto directory exists (create empty one if not present)
RUN mkdir -p /app/proto


# 2. Production Stage
FROM node:18-slim

WORKDIR /app

# Copy build artifacts from the builder stage (Webpack builds to global dist)
COPY --from=builder /app/dist ./dist

# Copy proto files for gRPC communication
COPY --from=builder /app/proto ./proto

# Copy node_modules and package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Install wget for health checks and create a non-root user for security
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    # Create non-root group and user (matching IDs for consistency across stages)
    && groupadd -g 1001 nodejs \
    && useradd -m -u 1001 -g nodejs appuser

# Ensure correct permissions for the app user
RUN chown -R appuser:nodejs /app

# Switch to the non-root user
USER appuser

EXPOSE 3001

# Health check (using a simple HTTP request to the health endpoint)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/healthz || exit 1

# Start the application
CMD ["node", "dist/main.js"] 