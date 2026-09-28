# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies needed for build
COPY package*.json ./
RUN npm ci

# Copy source code and config files
COPY . .

# Build the TypeScript code and resolve aliases
RUN npm run build

# Production Stage
FROM node:22-alpine

WORKDIR /app

# Only install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built code from builder stage
COPY --from=builder /app/dist ./dist

# Provide environment variables (defaults that can be overridden by docker-compose)
ENV PORT=12113
ENV NODE_ENV=production

EXPOSE 12113

CMD ["node", "dist/index.js"]
