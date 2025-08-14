# Variables de entorno

Este archivo describe todas las variables utilizadas por Punto Pastelero.

## Variables

| Variable | Descripción | Ejemplo | Obligatoria |
|----------|-------------|---------|-------------|
| `NODE_ENV` | Modo de ejecución (`development`, `production`) | `development` | Sí |
| `TZ` | Zona horaria | `America/Argentina/Buenos_Aires` | No |
| `DATABASE_URL` | Cadena de conexión a Postgres | `postgresql://postgres:postgres@localhost:5432/puntopastelero?schema=public` | Sí |
| `API_PORT` | Puerto de la API | `3001` | No |
| `API_LOG_LEVEL` | Nivel de log para pino | `info` | No |
| `CORS_ORIGINS` | Orígenes permitidos para CORS | `http://localhost:3000` | No |
| `RATE_LIMIT_WINDOW_MS` | Ventana de rate limit en ms | `60000` | No |
| `RATE_LIMIT_MAX` | Cantidad máxima de requests por ventana | `200` | No |
| `METRICS_TOKEN` | Token para proteger `/metrics` | `secreta` | No |
| `NEXTAUTH_URL` | URL base del frontend para NextAuth | `http://localhost:3000` | Sí |
| `NEXTAUTH_SECRET` | Clave para sesiones de NextAuth | `changeme` | Sí |
| `AFIP_MODE` | Modo de AFIP (`test` o `prod`) | `test` | Sí |
| `AFIP_CUIT` | CUIT del contribuyente | `20XXXXXXXXX` | Sí |
| `AFIP_CERT_BASE64` | Certificado en base64 | `...` | Sí |
| `AFIP_KEY_BASE64` | Llave privada en base64 | `...` | Sí |
| `AFIP_POINT_OF_SALE` | Punto de venta | `3` | No |
| `MP_ACCESS_TOKEN` | Token de Mercado Pago | `app_...` | No |
| `MP_WEBHOOK_SECRET` | Secreto para webhooks de Mercado Pago | `...` | No |
| `MP_SUCCESS_URL` | URL de éxito | `http://localhost:3000/pago/success` | Sí |
| `MP_FAILURE_URL` | URL de falla | `http://localhost:3000/pago/failure` | Sí |
| `GETNET_CLIENT_ID` | Cliente de Getnet | `...` | No |
| `GETNET_CLIENT_SECRET` | Secreto de Getnet | `...` | No |
| `GETNET_BASE_URL` | Endpoint base de Getnet | `https://api.getnet.com.ar` | No |
| `GETNET_WEBHOOK_SECRET` | Secreto para webhooks de Getnet | `...` | No |
| `SENTRY_DSN` | DSN de Sentry para reportes de errores | `https://...` | No |
| `FRONTEND_BASE_URL` | URL pública del sitio | `http://localhost:3000` | No |
| `ADMIN_BASE_URL` | URL del panel administrativo | `http://localhost:3000` | No |
| `REDIS_URL` | URL para cache Redis (si aplica) | `redis://localhost:6379` | No |

## Configuración por ambiente

| Variable | Local | Staging | Producción |
|----------|-------|---------|------------|
| `NODE_ENV` | `development` | `production` | `production` |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/puntopastelero` | provista por el entorno | provista por el entorno |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://staging.puntopastelero.com` | `https://puntopastelero.com` |
| `AFIP_MODE` | `test` | `prod` | `prod` |
| `MP_SUCCESS_URL` | `http://localhost:3000/pago/success` | `https://staging.puntopastelero.com/pago/success` | `https://puntopastelero.com/pago/success` |
| `MP_FAILURE_URL` | `http://localhost:3000/pago/failure` | `https://staging.puntopastelero.com/pago/failure` | `https://puntopastelero.com/pago/failure` |
| `SENTRY_DSN` | vacío | DSN de staging | DSN de producción |
| `REDIS_URL` | `redis://localhost:6379` | URL de Redis de staging | URL de Redis prod |

> Las variables no listadas en la tabla anterior usan los mismos valores entre ambientes o se documentan en el servicio correspondiente.
