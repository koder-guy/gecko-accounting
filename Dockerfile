FROM node:20-alpine AS base

# Install standard Alpine dependencies and OpenSSL 3.x
RUN apk add --no-cache libc6-compat openssl

FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client for native and linux-musl-openssl-3.0.x
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM base AS runner
WORKDIR /app

# Ensure runtime has openssl installed
RUN apk add --no-cache openssl

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

RUN chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

