# 1. Builder Stage
FROM node:18.19.0-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependency definition files from the root
COPY ../../../pnpm-lock.yaml ./
COPY ../../../pnpm-workspace.yaml ./
COPY package.json ./

# Install dependencies for this specific service
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

# Copy dependency definitions and install *only* production dependencies
COPY ../../../pnpm-lock.yaml ./
COPY ../../../pnpm-workspace.yaml ./
COPY package.json ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Copy the built application artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Switch to the non-root user
USER appuser

EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
