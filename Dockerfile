# Build Stage
FROM node:20.11.1-alpine AS builder

# Cài đặt curl cho Alpine (dùng trong build nếu cần)
RUN apk add --no-cache mongodb-tools curl tzdata

# Set working directory
WORKDIR /app

# Install dependencies first to leverage Docker cache
COPY package*.json ./
RUN yarn install

# Copy the rest of the application code
COPY . .

# Build the application for production
RUN yarn build

# Production Stage
FROM node:20.11.1-alpine

# Cài đặt mongodb-tools và curl
RUN apk add --no-cache mongodb-tools curl

# Set working directory
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN yarn install --production

# Create necessary directories and set permissions
RUN mkdir -p logs backup uploads && \
    chown -R node:node /app

# Copy built files and node_modules from the builder stage
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production
ENV TZ=Asia/Ho_Chi_Minh

# Switch to non-root user for security
USER node

# Expose the port the app will run on
EXPOSE ${PORT}

# Command to run the application in production mode
CMD ["yarn", "start:prod"]