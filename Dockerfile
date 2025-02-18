FROM node:18-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Environment setup
ENV NODE_ENV=production
ENV PORT=3000


# Security (for production)
USER node

EXPOSE 3000
CMD ["npm", "start"]