# Multi-stage Dockerfile for Authentication Service
# Optimized for production with security best practices

# 1. Builder Stage
FROM node:18.19.0-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependency definition files
COPY ../../../pnpm-lock.yaml ./
COPY ../../../pnpm-workspace.yaml ./
COPY package.json ./

# Install dependencies using pnpm. This will create node_modules in the container.
# It only fetches dependencies listed for this specific service.
RUN pnpm install --prod=false --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the application
RUN pnpm build


# 2. Production Stage
FROM node:18.19.0-alpine AS production
WORKDIR /app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Copy the dependency definitions and install *only* production dependencies
COPY ../../../pnpm-lock.yaml ./
COPY ../../../pnpm-workspace.yaml ./
COPY package.json ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Copy the built application artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Switch to the non-root user
USER appuser

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node dist/health-check.js || exit 1

# Start the application
CMD ["node", "dist/main"] 