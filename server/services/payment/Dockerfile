FROM node:22-bookworm-slim AS builder

WORKDIR /app/server

COPY package.json package-lock.json ./

RUN npm ci

COPY services/payment/package.json services/payment/package-lock.json ./services/payment/

RUN cd services/payment && npm ci

COPY services/payment/ ./services/payment/
COPY shared/ ./shared/

RUN cd services/payment && npm run build


FROM node:22-bookworm-slim AS production

WORKDIR /app/server

ENV NODE_ENV=production

COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/server/node_modules ./node_modules

COPY --from=builder /app/server/services/payment/package.json ./services/payment/package.json
COPY --from=builder /app/server/services/payment/node_modules ./services/payment/node_modules
COPY --from=builder /app/server/services/payment/dist ./services/payment/dist

EXPOSE 8006

CMD ["node", "services/payment/dist/server/services/payment/src/server.js"]