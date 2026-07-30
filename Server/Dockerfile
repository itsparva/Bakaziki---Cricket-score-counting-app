# ---------- Stage 1 : Dependencies ----------
FROM node:22-alpine AS deps

WORKDIR /app

# Update npm to latest
RUN npm install -g npm@latest

COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# ---------- Stage 2 : Runtime ----------
FROM node:22-alpine

WORKDIR /app

# Update npm in runtime image as well
RUN npm install -g npm@latest

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

EXPOSE 5000

CMD ["npm", "start"]