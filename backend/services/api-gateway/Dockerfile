# Simple production image for API Gateway
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm -g install pnpm && pnpm install --frozen-lockfile
COPY tsconfig*.json ./
COPY src ./src
RUN pnpm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package.json pnpm-lock.yaml* ./
RUN npm -g install pnpm && pnpm install --prod --frozen-lockfile
EXPOSE 3000
CMD ["node", "dist/main.js"]
