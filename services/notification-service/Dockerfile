FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
COPY packages/ ./packages/
COPY services/notification-service/ ./services/notification-service/

RUN npm install
RUN npm run build:packages
RUN npm run build --workspace=@event-os/notification-service

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/services/notification-service/dist/ ./services/notification-service/dist/
COPY --from=builder /app/services/notification-service/package.json ./services/notification-service/
COPY --from=builder /app/node_modules/ ./node_modules/

EXPOSE 8007

CMD ["node", "services/notification-service/dist/index.js"]
