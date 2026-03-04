FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

# ---------------------------------------------------------------------------
# Stage 1: Install all dependencies
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/api/package.json backend/api/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/zod-schemas/package.json packages/zod-schemas/
COPY packages/api-client/package.json packages/api-client/
COPY frontend/user/web/package.json frontend/user/web/
COPY frontend/user/mobile/package.json frontend/user/mobile/
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2: Build
# ---------------------------------------------------------------------------
FROM deps AS build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY . .
RUN pnpm --filter @learn-ai/shared-types build && \
    pnpm --filter @learn-ai/api-client build && \
    pnpm --filter web build

# ---------------------------------------------------------------------------
# Stage 3: Production runner
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Next.js standalone output mirrors the monorepo directory structure
COPY --from=build /app/frontend/user/web/.next/standalone ./
COPY --from=build /app/frontend/user/web/.next/static ./frontend/user/web/.next/static

EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
CMD ["node", "frontend/user/web/server.js"]
