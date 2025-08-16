# apps/api/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar deps del API
COPY apps/api/package*.json ./
RUN npm ci || npm install

# Copiar Prisma y código del API (contexto raíz)
COPY prisma ./prisma
COPY apps/api/tsconfig.json ./tsconfig.json
# COPY apps/api/nest-cli.json ./nest-cli.json   # descomentar si existe
COPY apps/api/src ./src

# Compilar (no correr prisma generate aquí para no fallar el build por schema)
RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY apps/api/package*.json ./

EXPOSE 3001
CMD ["node", "dist/main.js"]
