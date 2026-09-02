# Production Dockerfile for ResQCampus AI (Cloud Run Ready)
FROM node:20-alpine AS base

# Create app directory
WORKDIR /app

# Install dependencies (only production dependencies for lean container size)
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose standard Cloud Run port
EXPOSE 8080

# Use non-root user for enhanced security
USER node

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 8080) + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the Express server
CMD ["node", "src/index.js"]
