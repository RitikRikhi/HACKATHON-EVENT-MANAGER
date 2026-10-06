FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
COPY packages/ ./packages/
COPY services/api-gateway/ ./services/api-gateway/

RUN npm install
RUN npm run build:packages
RUN npm run build --workspace=@event-os/api-gateway

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/services/api-gateway/dist/ ./services/api-gateway/dist/
COPY --from=builder /app/services/api-gateway/package.json ./services/api-gateway/
COPY --from=builder /app/node_modules/ ./node_modules/

EXPOSE 8000

CMD ["node", "services/api-gateway/dist/index.js"]
