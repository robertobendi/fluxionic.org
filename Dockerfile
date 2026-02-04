# Stage 1 - API Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json drizzle.config.ts ./
COPY version.json ./
COPY src ./src
RUN npm run build

# Stage 2 - Admin Builder
FROM node:20-alpine AS admin-builder
WORKDIR /app
COPY admin/package*.json ./
RUN npm ci
COPY admin/ ./
RUN npm run build

# Stage 3 - Production
FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Required for update system: database backups (pg_dump/psql) and git operations
RUN apk add --no-cache postgresql-client git

WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=admin-builder --chown=nodejs:nodejs /app/dist ./admin/dist
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs drizzle.config.ts ./
COPY --chown=nodejs:nodejs version.json ./

# Create uploads directory with correct ownership BEFORE switching users
# Named volumes will inherit this ownership when first mounted
RUN mkdir -p /app/uploads && chown nodejs:nodejs /app/uploads

USER nodejs
EXPOSE 3000
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"
CMD ["node", "dist/index.js"]
