FROM node:20-slim

WORKDIR /app

# Copy package files first for layer caching
COPY server/package*.json ./server/

# Install server dependencies
RUN cd server && npm install --legacy-peer-deps --omit=dev

# Copy server source
COPY server/ ./server/

EXPOSE 8000

CMD ["node", "server/src/index.js"]
