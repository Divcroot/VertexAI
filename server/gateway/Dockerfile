FROM node:22-bookworm-slim AS builder

WORKDIR /app/server

COPY package.json package-lock.json ./

RUN npm ci

COPY gateway/package.json gateway/package-lock.json ./gateway/

RUN cd gateway && npm ci

COPY gateway/ ./gateway/
COPY shared/ ./shared/

RUN cd gateway && npm run build


FROM node:22-bookworm-slim AS production

WORKDIR /app/server

ENV NODE_ENV=production

COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/server/node_modules ./node_modules

COPY --from=builder /app/server/gateway/package.json ./gateway/package.json
COPY --from=builder /app/server/gateway/node_modules ./gateway/node_modules
COPY --from=builder /app/server/gateway/dist ./gateway/dist

EXPOSE 8000

CMD ["npm", "--prefix", "gateway", "start"]