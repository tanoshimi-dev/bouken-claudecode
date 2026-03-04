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
COPY . .
RUN pnpm --filter api db:generate && pnpm --filter api build

# ---------------------------------------------------------------------------
# Stage 3: Migration runner (one-shot container)
# ---------------------------------------------------------------------------
FROM deps AS migrate
COPY --from=build /app/backend/api/prisma backend/api/prisma
CMD ["pnpm", "--filter", "api", "exec", "prisma", "migrate", "deploy"]

# ---------------------------------------------------------------------------
# Stage 4: Production runner
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production

# Copy workspace package.json files and install production deps only
COPY --from=build /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=build /app/backend/api/package.json backend/api/
COPY --from=build /app/packages/shared-types/package.json packages/shared-types/
COPY --from=build /app/packages/zod-schemas/package.json packages/zod-schemas/
COPY --from=build /app/packages/api-client/package.json packages/api-client/
COPY --from=build /app/frontend/user/web/package.json frontend/user/web/
COPY --from=build /app/frontend/user/mobile/package.json frontend/user/mobile/
RUN pnpm install --frozen-lockfile --prod

# Generated Prisma client (query engine + generated types)
COPY --from=build /app/node_modules/.prisma node_modules/.prisma

# Workspace package sources (resolved at runtime via --experimental-strip-types)
COPY --from=build /app/packages/shared-types/src packages/shared-types/src
COPY --from=build /app/packages/zod-schemas/src packages/zod-schemas/src

# API build output
COPY --from=build /app/backend/api/dist backend/api/dist

# Prisma schema & migrations (needed if running migrate from this image)
COPY --from=build /app/backend/api/prisma backend/api/prisma

EXPOSE 4000
CMD ["node", "--experimental-strip-types", "backend/api/dist/index.js"]
