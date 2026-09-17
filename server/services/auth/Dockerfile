FROM node:22-bookworm-slim AS builder

WORKDIR /app/server

COPY package.json package-lock.json ./

RUN npm ci

COPY services/auth/package.json services/auth/package-lock.json ./services/auth/

RUN cd services/auth && npm ci

COPY services/auth/ ./services/auth/
COPY shared/ ./shared/

RUN cd services/auth && npm run build


FROM node:22-bookworm-slim AS production

WORKDIR /app/server

ENV NODE_ENV=production

COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/server/node_modules ./node_modules

COPY --from=builder /app/server/services/auth/package.json ./services/auth/package.json
COPY --from=builder /app/server/services/auth/node_modules ./services/auth/node_modules
COPY --from=builder /app/server/services/auth/dist ./services/auth/dist

EXPOSE 8001

CMD ["node", "services/auth/dist/server/services/auth/src/server.js"]