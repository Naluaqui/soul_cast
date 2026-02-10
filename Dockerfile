FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 8787
EXPOSE 5173

ENV WRANGLER_SEND_METRICS=false

CMD sh -lc '\
  set -e; \
  npx wrangler d1 execute DB --local --file=./schema.sql; \
  npx wrangler dev --local --ip 0.0.0.0 --port 8787 & \
  npm run dev -- --host 0.0.0.0 --port 5173 & \
  wait \
'
