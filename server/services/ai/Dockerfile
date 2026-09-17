FROM node:22-bookworm-slim AS builder

WORKDIR /app/server

COPY package.json package-lock.json ./

RUN npm ci

COPY services/ai/package.json services/ai/package-lock.json ./services/ai/

RUN cd services/ai && npm ci

COPY services/ai/ ./services/ai/
COPY shared/ ./shared/

RUN cd services/ai && npm run build


FROM node:22-bookworm-slim AS production

WORKDIR /app/server

ENV NODE_ENV=production

COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/server/node_modules ./node_modules

COPY --from=builder /app/server/services/ai/package.json ./services/ai/package.json
COPY --from=builder /app/server/services/ai/node_modules ./services/ai/node_modules
COPY --from=builder /app/server/services/ai/dist ./services/ai/dist

EXPOSE 8004

CMD ["node", "services/ai/dist/server/services/ai/src/server.js"]