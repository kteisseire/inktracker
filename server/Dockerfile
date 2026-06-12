# ---- Build stage ----
FROM node:20-slim AS build
WORKDIR /app

# Prisma needs openssl
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install server deps (standalone — server does not import @lorcana/shared at runtime)
COPY server/package.json ./server/package.json
WORKDIR /app/server
RUN npm install

# Copy server source + prisma schema
COPY server/ ./
# tsconfig.base.json lives at repo root and is extended by server/tsconfig.json
COPY tsconfig.base.json /app/tsconfig.base.json

# Generate Prisma client + compile TypeScript
RUN npx prisma generate
RUN npm run build

# ---- Runtime stage ----
FROM node:20-slim AS runtime
WORKDIR /app/server
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Only production deps
COPY server/package.json ./package.json
RUN npm install --omit=dev

# Prisma client + schema + compiled output
COPY --from=build /app/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/server/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/server/prisma ./prisma
COPY --from=build /app/server/dist ./dist

EXPOSE 3001
# Apply pending migrations on startup, then launch
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
