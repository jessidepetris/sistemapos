# Punto Pastelero

Monorepo que contiene la API (NestJS) y el frontend (Next.js) de un sistema de punto de venta. Usa Prisma para acceso a datos y Postgres como base de datos. Los servicios se empaquetan con Docker.

## Requisitos previos
- Node.js 18 o 20
- Docker y Docker Compose
- Git

## Estructura
- `apps/api`: API en NestJS
- `apps/web`: Frontend en Next.js
- `prisma`: esquema y migraciones
- `scripts/`: utilidades varias

## Setup rápido (dev)
```bash
cp .env.example .env
cd apps/api && npm ci && cd ..
cd apps/web && npm ci && cd ..
docker compose up -d db
npx prisma generate
npx prisma migrate dev
npm run dev --workspace apps/api &
npm run dev --workspace apps/web
```

## Scripts útiles
- `npm run build` – compilar aplicaciones
- `npm test` – ejecutar pruebas
- `npm run seed` – cargar datos de ejemplo
- `npm run reset` – limpiar base de datos
- `npm run backup:db` – generar backup
- `npm run restore:db` – restaurar backup
- `npm run verify:backup` – verificar integridad

## Documentación
- [Variables de entorno](docs/env.md)
- [Operaciones](docs/ops.md)
- [Plan de recuperación ante desastres](docs/drp.md)

## Troubleshooting
- **Puertos ocupados:** detener procesos en `3000`, `3001` o `5432`.
- **Prisma 403:** validar conexión y credenciales de la base.
- **PDF/Excel en serverless:** usar funciones `edge` o servidor dedicado.
- **Git LFS:** instalar [Git LFS](https://git-lfs.github.com/) y ejecutar `git lfs install`.
