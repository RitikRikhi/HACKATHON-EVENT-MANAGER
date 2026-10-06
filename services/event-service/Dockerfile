FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
COPY packages/ ./packages/
COPY services/event-service/ ./services/event-service/

RUN npm install
RUN npm run build:packages
RUN npm run build --workspace=@event-os/event-service

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/services/event-service/dist/ ./services/event-service/dist/
COPY --from=builder /app/services/event-service/package.json ./services/event-service/
COPY --from=builder /app/node_modules/ ./node_modules/

EXPOSE 8002

CMD ["node", "services/event-service/dist/index.js"]
