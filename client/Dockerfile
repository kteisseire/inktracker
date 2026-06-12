# ---- Build stage ----
# Builds the React/Vite static bundle. The client imports @lorcana/shared,
# which Vite resolves from source (packages/shared/src), so we copy the whole repo.
FROM node:20-slim AS build
WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY client/package.json ./client/package.json

# Install the whole workspace (root install resolves @lorcana/shared symlink)
RUN npm install

# Copy sources
COPY packages/shared ./packages/shared
COPY client ./client

# Build-time env (Vite inlines VITE_* at build). Passed via --build-arg.
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_DISCORD_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_DISCORD_CLIENT_ID=$VITE_DISCORD_CLIENT_ID

RUN npm run build --workspace=client

# ---- Runtime stage: static files served by nginx ----
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY client/nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
