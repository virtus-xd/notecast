# ── Stage 1: Bağımlılıkları yükle ──────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# pnpm'i etkinleştir
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile --filter @notcast/server... --ignore-scripts

# ── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
COPY package.json pnpm-workspace.yaml turbo.json ./

# Prisma client oluştur
RUN cd apps/server && npx prisma generate

# TypeScript derleme
RUN cd apps/server && pnpm build

# ── Stage 3: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

ENV NODE_ENV=production

# Non-root kullanıcı oluştur
RUN addgroup --system --gid 1001 notcast && \
    adduser --system --uid 1001 notcast

COPY --from=deps /app/package.json ./
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/pnpm-lock.yaml ./
COPY --from=deps /app/packages/shared/package.json ./packages/shared/
COPY --from=deps /app/apps/server/package.json ./apps/server/

# Yalnızca production bağımlılıkları yükle
RUN pnpm install --frozen-lockfile --filter @notcast/server --prod --ignore-scripts

COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/node_modules/.prisma ./apps/server/node_modules/.prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Prisma migration dosyaları (deploy için)
COPY apps/server/src/prisma ./apps/server/src/prisma

USER notcast

WORKDIR /app/apps/server

EXPOSE 3001

CMD ["node", "dist/app.js"]
