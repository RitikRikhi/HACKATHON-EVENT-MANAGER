FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace configs
COPY package.json tsconfig.json ./
COPY packages/ ./packages/
COPY services/auth-service/ ./services/auth-service/

# Install and build
RUN npm install
RUN npm run build:packages
RUN npm run build --workspace=@event-os/auth-service

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/services/auth-service/dist/ ./services/auth-service/dist/
COPY --from=builder /app/services/auth-service/package.json ./services/auth-service/
COPY --from=builder /app/node_modules/ ./node_modules/

EXPOSE 8001

CMD ["node", "services/auth-service/dist/index.js"]
