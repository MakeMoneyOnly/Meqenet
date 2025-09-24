# Base image
FROM node:16-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image
FROM node:16-alpine

# Set NODE_ENV to production
ENV NODE_ENV production

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma schema and migrations
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy build files
COPY --from=builder /app/dist ./dist

# Copy configuration files
COPY --from=builder /app/.env.example ./.env.example

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main"]
