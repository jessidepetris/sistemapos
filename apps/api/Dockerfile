FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install || :
COPY ../../prisma ./prisma
COPY src ./src
RUN npx prisma generate || :
RUN npm run build || :
CMD ["node", "dist/main.js"]
