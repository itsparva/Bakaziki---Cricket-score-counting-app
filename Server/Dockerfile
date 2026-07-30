# ---------- Stage 1 : Dependencies ----------

FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev


# ---------- Stage 2 : Production ----------

FROM node:22-alpine

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

ENV NODE_ENV=production

EXPOSE 5000

CMD ["npm", "start"]