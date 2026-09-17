FROM node:22-bookworm-slim AS builder

WORKDIR /app/server

COPY package.json package-lock.json ./

RUN npm ci

COPY services/project/package.json services/project/package-lock.json ./services/project/

RUN cd services/project && npm ci

COPY services/project/ ./services/project/
COPY shared/ ./shared/

RUN cd services/project && npm run build


FROM node:22-bookworm-slim AS production

WORKDIR /app/server

ENV NODE_ENV=production

COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/server/node_modules ./node_modules

COPY --from=builder /app/server/services/project/package.json ./services/project/package.json
COPY --from=builder /app/server/services/project/node_modules ./services/project/node_modules
COPY --from=builder /app/server/services/project/dist ./services/project/dist

EXPOSE 8002

CMD ["node", "services/project/dist/server/services/project/src/server.js"]