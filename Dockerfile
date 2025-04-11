# Build Stage
FROM node:20.10.0-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN yarn install

COPY . .
RUN yarn build

# Production Stage
FROM node:20.10.0-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN yarn install --production

# Create necessary directories
RUN mkdir -p logs backup && \
    chown -R node:node /app

# Copy built assets from builder
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Switch to non-root user
USER node

EXPOSE 8080

CMD ["node", "dist/main"]
