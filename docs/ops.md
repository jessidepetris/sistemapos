# Operaciones

Guía operativa para administrar el sistema Punto Pastelero.

## Logs
- Los servicios usan [pino](https://github.com/pinojs/pino) en formato JSON.
- Para una visualización legible: `node archivo.log | npx pino-pretty`.
- Niveles disponibles: `fatal`, `error`, `warn`, `info`, `debug`, `trace`.
- Cada request incluye `request-id` para correlación.

## Endpoints de salud y métricas
- `GET /health`: verifica memoria y uptime del servicio.
- `GET /ready`: valida conexión a la base de datos.
- `GET /metrics`: expone métricas Prometheus (protegido con `METRICS_TOKEN`).

## Reinicio de servicios
- Con Docker: `docker compose restart api web` o `docker compose up -d`.
- Sin Docker: reiniciar con `npm run dev` o `npm run start` según el servicio.

## Exportación de reportes
- Reportes PDF: `/api/reports/:id/pdf`.
- Reportes Excel: `/api/reports/:id/xlsx`.
- Los archivos se guardan en `exports/`.

## Conciliación de pagos
1. **Carga**: importar movimientos desde el proveedor (AFIP, Mercado Pago, Getnet).
2. **Pull**: el sistema obtiene los pagos registrados.
3. **Match**: conciliación automática y manual de transacciones.
4. **Export**: generar reporte conciliado en PDF o Excel.

## Cierre contable mensual
1. Ejecutar cierre: `POST /api/accounting/close`.
2. Para reabrir: `POST /api/accounting/reopen`.
3. Exportar reportes: `GET /api/accounting/export`.

## Inventarios
1. Iniciar inventario: `POST /api/inventory/start`.
2. Escanear productos: `POST /api/inventory/scan`.
3. Aprobar conteo: `POST /api/inventory/approve`.
4. Ajustar stock: `POST /api/inventory/adjust`.

## Backups
- Generar backup: `npm run backup:db`.
- Los archivos se guardan en `backups/` con fecha.
- Verificar integridad: `npm run verify:backup backups/AAAA-MM-DD_hhmm`.

## Restore
- Restaurar: `npm run restore:db backups/AAAA-MM-DD_hhmm/db.dump`
- Utiliza `pg_restore --clean --if-exists --no-owner`.
- Confirmar migraciones con Prisma si aplica.
