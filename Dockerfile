# Build-Stage: Dependencies (inkl. better-sqlite3-Kompilierung) und App-Build
FROM node:22-alpine AS build
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# Runtime-Stage: kleines Image, nur Build-Output + Produktions-Dependencies
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/drizzle ./drizzle
COPY package.json ./
RUN mkdir -p data && chown -R node:node data
USER node
EXPOSE 3000
HEALTHCHECK --interval=60s --timeout=5s --retries=3 \
	CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "build"]
