# Operaciones

## Logs
Los logs usan [pino](https://github.com/pinojs/pino) con formato JSON. Para leerlos de forma legible:

```
node archivo.log | npx pino-pretty
```

## Métricas
El endpoint `/metrics` expone estadísticas en formato Prometheus. Ejemplos de consultas:

```
rate(http_request_duration_seconds_sum[5m])
rate(http_request_duration_seconds_count[5m])
```

## Health vs Readiness
- `/health` verifica memoria y uptime del servicio.
- `/ready` valida conexión a la base de datos.

## Sentry
El muestreo de trazas y errores se controla mediante las variables de entorno `SENTRY_DSN` y `SENTRY_TRACES_SAMPLE_RATE`.
