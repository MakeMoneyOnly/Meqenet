# Dockerfile for Next.js frontend in a pnpm monorepo

# --- Base Stage ---
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# --- Dependencies Stage ---
FROM base AS deps
COPY ../../../package.json ../../../pnpm-lock.yaml ./ 
COPY ../../../.npmrc ./
RUN pnpm install --frozen-lockfile

# --- Build Stage ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . . 
RUN pnpm build

# --- Runner Stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["pnpm", "start"]