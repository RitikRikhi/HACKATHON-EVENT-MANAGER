FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
COPY packages/ ./packages/
COPY services/team-service/ ./services/team-service/

RUN npm install
RUN npm run build:packages
RUN npm run build --workspace=@event-os/team-service

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/services/team-service/dist/ ./services/team-service/dist/
COPY --from=builder /app/services/team-service/package.json ./services/team-service/
COPY --from=builder /app/node_modules/ ./node_modules/

EXPOSE 8003

CMD ["node", "services/team-service/dist/index.js"]
