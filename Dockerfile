FROM node:22-bookworm-slim
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps ./apps
COPY scripts ./scripts

RUN npm --prefix apps/api install \
 && npm --prefix apps/web install \
 && npm run build \
 && npm --prefix apps/api prune --omit=dev

ENV NODE_ENV=production PORT=8080 HOST=0.0.0.0
EXPOSE 8080
CMD ["node", "scripts/start-prod.mjs"]
