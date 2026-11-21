# House in Mozambique — production image (Next.js standalone).
# Built and run on the VPS by docker-compose.yml / deploy.sh. See DEPLOY_VPS.md.

# ─── Stage 1: dependencies ────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
# Scripts are skipped here: postinstall runs `prisma generate`, which needs the
# schema (copied in the next stage).
RUN npm ci --ignore-scripts

# ─── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public settings are baked into the browser code at build time, so they come
# in as build arguments (docker compose passes them from .env.production).
ARG NEXT_PUBLIC_BASE_URL=https://houseinmozambique.com
ARG NEXT_PUBLIC_GA_ID=
ARG NEXT_PUBLIC_WHATSAPP=
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    NEXT_PUBLIC_WHATSAPP=$NEXT_PUBLIC_WHATSAPP \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# prisma.config.ts requires DATABASE_URL to exist, but generating the client and
# building never connect — a placeholder is enough. The real one is only given
# to the running container (.env.production), never baked into the image.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm run build

# ─── Stage 3: runtime ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl wget
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma client + Postgres driver (driver-adapter mode, no binary engine).
# The standalone trace usually has these; copied explicitly to be certain.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg ./node_modules/pg
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-pool ./node_modules/pg-pool

# The data cache (ISR / unstable_cache) writes under .next/cache.
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
