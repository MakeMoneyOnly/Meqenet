# ---- Base Stage ----
# Sets up a base image with pnpm installed, used by other stages.
FROM node:18-slim AS base
# Install OpenSSL for Prisma and tini for proper process management.
RUN apt-get update && apt-get install -y openssl tini && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.12.3 --activate

# ---- Dependencies Stage ----
# Copies only package manifests and installs ALL dependencies (incl. dev)
# This layer is cached and only re-runs if package manifests change.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Use a Docker cache mount to make pnpm's store persistent.
# This makes builds much faster and more resilient to network issues.
# Prune the store before installing to remove any corrupted packages from previous runs.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm store prune && pnpm install --frozen-lockfile

# ---- Build Stage ----
# Copies source code and builds the specific application.
FROM deps AS builder
# Copy the rest of the monorepo source (respecting .dockerignore)
COPY . .
# Use Nx to build the application, creating production-ready artifacts
RUN pnpm exec nx build auth-service
# Use pnpm's deploy command to create a pruned production-ready deployment folder.
# This is more efficient and reliable than running 'pnpm install --prod' in the final stage.
RUN pnpm deploy --filter=@meqenet/auth-service ./deploy

# ---- Production Stage ----
# Creates the final, small, and secure production image.
FROM base AS production
WORKDIR /app
# Copy the pruned production-ready files from the builder stage's deploy folder
COPY --from=builder /app/deploy .
# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
# Expose the port the app runs on
EXPOSE 3001
# Use Tini as the entrypoint to properly handle signals
ENTRYPOINT ["/usr/bin/tini", "--"]
# Command to run the application
CMD ["node", "dist/main.js"] 