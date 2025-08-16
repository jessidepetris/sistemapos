FROM node:20-alpine AS builder
WORKDIR /app

COPY apps/api/package*.json ./
RUN npm ci || npm install

COPY prisma ./prisma
COPY apps/api/tsconfig.json ./tsconfig.json
COPY apps/api/src ./src

# Prisma client antes de compilar
RUN npx prisma generate

RUN npm run build

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

