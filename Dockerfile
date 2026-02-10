FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=development
ENV WRANGLER_SEND_METRICS=false

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 8787
EXPOSE 5173

CMD sh -lc '\
  set -e; \
  echo "==> pwd:"; pwd; \
  echo "==> node:"; node -v; \
  echo "==> npm:"; npm -v; \
  echo "==> wrangler:"; npx wrangler -v; \
  echo "==> verificando workerd:"; ls -lah node_modules/wrangler/node_modules/@cloudflare || true; \
  echo "==> D1 schema"; npx wrangler d1 execute DB --local --file=./schema.sql; \
  echo "==> BACK"; npm run dev:back & \
  echo "==> FRONT"; npm run dev:front & \
  wait \
'
