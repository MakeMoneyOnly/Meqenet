# ---- Base Stage ----
# Sets up a base image with pnpm installed, used by other stages.
FROM node:22-bookworm-slim AS base
# Install tini for process management and build tools for native modules.
RUN set -eux; \
    for i in 1 2 3; do \
      apt-get update && \
      DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        ca-certificates tini python3 build-essential \
      && break || (echo "apt-get attempt $i failed" && sleep 5); \
    done; \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN npm install -g pnpm@10.14.0

# ---- Dependencies Stage ----
# Copies only package manifests and installs ALL dependencies (incl. dev)
# This layer is cached and only re-runs if package manifests change.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Use a Docker cache mount to make pnpm's store persistent.
# This makes builds much faster and more resilient to network issues.
# Enhanced retry logic for network resilience in fintech environments.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    --mount=type=cache,id=prisma,target=/tmp/prisma-engines \
    set -e && \
    echo "Configuring pnpm for maximum network resilience..." && \
    pnpm config set fetch-retries 10 && \
    pnpm config set fetch-retry-maxtimeout 300000 && \
    pnpm config set fetch-timeout 300000 && \
    pnpm config set network-concurrency 3 && \
    echo "Configuring Prisma for reliable engine downloads..." && \
    export PRISMA_ENGINES_MIRROR=https://binaries.prismadb.com && \
    export PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x && \
    echo "Pruning store and starting installation with retries..." && \
    pnpm store prune && \
    for i in 1 2 3; do \
        echo "Installation attempt $i..." && \
        pnpm install && break || \
        (echo "Attempt $i failed, cleaning and retrying..." && \
         pnpm store prune && \
         rm -rf node_modules && \
         sleep 15); \
    done

# ---- Build Stage ----
# Copies source code and builds the specific application.
FROM deps AS builder
# Copy the rest of the monorepo source (respecting .dockerignore)
COPY . .
# Ensure node_modules are properly linked and build the application
RUN echo "Ensuring dependencies are available..." && \
    ls -la node_modules/.bin/ | head -10 && \
    echo "Building api-gateway with nx (excluding frontend)..." && \
    ./node_modules/.bin/nx build api-gateway --exclude=frontend
# Use pnpm's deploy command to create a pruned production-ready deployment folder.
# This is more efficient and reliable than running 'pnpm install --prod' in the final stage.
RUN pnpm deploy --filter=@meqenet/api-gateway ./deploy --legacy

# ---- Production Stage ----
# Creates the final, small, and secure production image.
FROM base AS production
WORKDIR /app
# Copy the pruned production-ready files from the builder stage's deploy folder
COPY --from=builder /app/deploy .
# Create a non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser
# Expose the port the app runs on
EXPOSE 3000
# Use Tini as the entrypoint to properly handle signals
ENTRYPOINT ["/usr/bin/tini", "--"]
# Command to run the application
CMD ["node", "dist/main.js"]
