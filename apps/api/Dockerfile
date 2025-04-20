# Use the official Bun image
FROM oven/bun:1 as builder

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json ./
COPY bun.lockb ./
COPY pnpm-workspace.yaml ./

# Copy workspace packages
COPY packages/auth packages/auth/
COPY packages/db packages/db/
COPY packages/logger packages/logger/
COPY packages/queue packages/queue/
COPY packages/redis packages/redis/
COPY packages/trpc packages/trpc/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-slim

# Set working directory
WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lockb ./

# Copy workspace packages
COPY --from=builder /app/packages/auth packages/auth/
COPY --from=builder /app/packages/db packages/db/
COPY --from=builder /app/packages/logger packages/logger/
COPY --from=builder /app/packages/queue packages/queue/
COPY --from=builder /app/packages/redis packages/redis/
COPY --from=builder /app/packages/trpc packages/trpc/

# Install production dependencies
RUN bun install --frozen-lockfile --production

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["bun", "run", "dist/index.js"]
