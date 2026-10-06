FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
COPY packages/ ./packages/
COPY services/announcement-service/ ./services/announcement-service/

RUN npm install
RUN npm run build:packages
RUN npm run build --workspace=@event-os/announcement-service

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/services/announcement-service/dist/ ./services/announcement-service/dist/
COPY --from=builder /app/services/announcement-service/package.json ./services/announcement-service/
COPY --from=builder /app/node_modules/ ./node_modules/

EXPOSE 8006

CMD ["node", "services/announcement-service/dist/index.js"]
