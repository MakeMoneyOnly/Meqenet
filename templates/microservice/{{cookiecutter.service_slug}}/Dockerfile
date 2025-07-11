# Multi-stage Dockerfile for {{cookiecutter.service_name}}
# Optimized for production with security best practices

# Build stage
FROM node:{{cookiecutter.node_version}}-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies needed for building
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json yarn.lock ./
{% if cookiecutter.needs_database == "y" -%}
COPY prisma/ ./prisma/
{% endif -%}

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy source code
COPY . .

{% if cookiecutter.needs_database == "y" -%}
# Generate Prisma client
RUN yarn prisma generate
{% endif -%}

# Build the application
RUN yarn build

# Production stage
FROM node:{{cookiecutter.node_version}}-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true && \
    yarn cache clean && \
    rm -rf /tmp/* /var/tmp/* /root/.cache /root/.npm

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
{% if cookiecutter.needs_database == "y" -%}
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
{% endif -%}

# Copy package.json for metadata
COPY --chown=nestjs:nodejs package.json ./

# Security: Remove package manager
RUN rm -rf /usr/local/bin/yarn /usr/local/bin/npm

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE {{cookiecutter.service_port}}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node dist/health-check.js || exit 1

# Start the application
CMD ["node", "dist/main.js"] 