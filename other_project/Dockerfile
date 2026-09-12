# multi-stage Dockerfile for equityflow-terminal
# Build stage: install dependencies and produce the front-end bundle
FROM node:20-alpine AS builder

WORKDIR /app

# copy package manifest and install everything (including dev deps)
COPY package.json package-lock.json* ./
RUN npm ci

# copy the rest of the sources and run the build
COPY . .
RUN npm run build

# final image contains only what is needed to run the server
FROM node:20-alpine AS runner

WORKDIR /app

# copy production deps (we already installed them in the builder stage)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# copy compiled frontend and server sources/data required at runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src ./src

# set production environment
ENV NODE_ENV=production

# expose the port the Express server listens on
EXPOSE 3010

# start the server using tsx (installed in node_modules from builder stage)
CMD ["npx", "tsx", "server.ts"]
