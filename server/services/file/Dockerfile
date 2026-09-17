FROM node:22-bookworm-slim AS builder

WORKDIR /app/server

COPY package.json package-lock.json ./

RUN npm ci

COPY services/file/package.json services/file/package-lock.json ./services/file/

RUN cd services/file && npm ci

COPY services/file/ ./services/file/
COPY shared/ ./shared/

RUN cd services/file && npm run build


FROM node:22-bookworm-slim AS production

WORKDIR /app/server

ENV NODE_ENV=production

COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/server/node_modules ./node_modules

COPY --from=builder /app/server/services/file/package.json ./services/file/package.json
COPY --from=builder /app/server/services/file/node_modules ./services/file/node_modules
COPY --from=builder /app/server/services/file/dist ./services/file/dist

EXPOSE 8003

CMD ["node", "services/file/dist/server/services/file/src/server.js"]