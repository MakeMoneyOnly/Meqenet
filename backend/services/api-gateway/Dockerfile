# Stage 1: Builder
FROM node:18-slim AS builder

# Set working directory
WORKDIR /app

# Copy pnpm and project configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy service-specific configuration
COPY backend/services/api-gateway/nest-cli.json ./nest-cli.json

# Install all dependencies using pnpm
RUN corepack enable && corepack prepare pnpm@10.12.3 --activate
RUN pnpm install --frozen-lockfile

# Copy the entire monorepo source code
COPY . .

# Build the specific service
RUN pnpm exec nest build api-gateway


# Stage 2: Runner
FROM node:18-slim

WORKDIR /app

# Copy build artifacts from the builder stage (API Gateway builds to its local dist directory)
COPY --from=builder /app/backend/services/api-gateway/dist ./dist

# Copy node_modules and package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main.js"]
