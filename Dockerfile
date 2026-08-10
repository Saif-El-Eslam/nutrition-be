# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# Production stage
FROM node:24-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY src/ ./src/
COPY package.json ./

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

CMD ["node", "src/server.js"]

# docker build -t nutrition-api .
# docker run -p 5000:5000 --env-file .env nutrition-api
