# ============================================================
# Trading Journal — Dockerfile
# For: Google Cloud e2-micro (or any Linux server)
# Build: docker build -t trading-journal .
# ============================================================

# ---------- Stage 1: Dependencies ----------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# ---------- Stage 2: Build ----------
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ---------- Stage 3: Production Runner ----------
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone Next.js build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema + migrations for runtime migrate
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/src/generated ./src/generated

# Data directory for SQLite persistence (mount as volume)
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

# On start: run DB migrations, then start the server
CMD ["sh", "-c", "DATABASE_URL=file:/app/data/journal.db npx prisma migrate deploy --schema=/app/prisma/schema.prisma 2>/dev/null || true && DATABASE_URL=file:/app/data/journal.db node server.js"]
