# apps/web/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY apps/web/package*.json ./
RUN npm ci || npm install

# Copiar código Next.js
COPY apps/web ./

RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["npm", "start"]
