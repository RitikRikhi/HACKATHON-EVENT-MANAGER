FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
COPY packages/ ./packages/
COPY services/ticket-service/ ./services/ticket-service/

RUN npm install
RUN npm run build:packages
RUN npm run build --workspace=@event-os/ticket-service

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/services/ticket-service/dist/ ./services/ticket-service/dist/
COPY --from=builder /app/services/ticket-service/package.json ./services/ticket-service/
COPY --from=builder /app/node_modules/ ./node_modules/

EXPOSE 8004

CMD ["node", "services/ticket-service/dist/index.js"]
