# Node 22 LTS — the Gemini SDK and node-redis require Node 20+.
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies, exactly as pinned in the lockfile.
# Copying package files first lets Docker cache this layer between code changes.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# Don't run as root inside the container.
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "src/server.js"]
