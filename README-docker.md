# Docker setup

## Pre-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Archivo `.env` basado en `.env.example` con `DATABASE_URL=postgresql://postgres:postgres@db:5432/sistemapos?schema=public`

## Pasos
```bash
# 1) Build imágenes
docker compose build --no-cache

# 2) Levantar DB
docker compose up -d db

# 3) Generar Prisma Client y migrar (desde contenedor API)
docker compose run --rm api npx prisma generate
docker compose run --rm api npx prisma migrate deploy

# 4) Levantar todo
docker compose up -d

# 5) Health checks
curl -I http://localhost:3001/health
# Abrir http://localhost:3000
```

## Troubleshooting
- Verifica que los puertos 3000, 3001 y 5432 estén libres.
- Ajusta variables como `NEXTAUTH_SECRET` o reglas de CORS en `.env` si es necesario.
- Si `prisma` falla por dependencias, ejecuta `npm install` dentro del contenedor antes de generar.
