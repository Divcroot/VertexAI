FROM node:22-bookworm-slim AS builder

WORKDIR /app/server

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        python3 \
        make \
        g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

COPY services/terminal/package.json services/terminal/package-lock.json ./services/terminal/

RUN cd services/terminal && npm ci

COPY services/terminal/ ./services/terminal/
COPY shared/ ./shared/

RUN cd services/terminal && npm run build


FROM node:22-bookworm-slim AS production

WORKDIR /app/server

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/server/node_modules ./node_modules

COPY --from=builder /app/server/services/terminal/package.json ./services/terminal/package.json
COPY --from=builder /app/server/services/terminal/node_modules ./services/terminal/node_modules
COPY --from=builder /app/server/services/terminal/dist ./services/terminal/dist

EXPOSE 8005

CMD ["node", "services/terminal/dist/server/services/terminal/src/server.js"]