# Plan de Recuperación ante Desastres (DRP)

## Objetivos
- **RTO sugerido:** ≤ 2 horas.
- **RPO sugerido:** ≤ 1 hora.

## Activos a respaldar
- Base de datos **Postgres**.
- Carpeta `exports/` con reportes generados.
- Imágenes o archivos estáticos subidos (Cloudinary u otro storage externo).

## Frecuencia y retención
- Backups diarios: conservar 30 días.
- Backups semanales: conservar 12 semanas.
- Backups mensuales: conservar 12 meses.

## Procedimiento de backup
1. Ejecutar `npm run backup:db`.
2. Copiar `exports/` e imágenes a almacenamiento seguro.

## Procedimiento de restauración
1. Detener servicios afectados.
2. Restaurar base de datos: `npm run restore:db <backup>`.
3. Restaurar carpeta `exports/` e imágenes si corresponde.
4. Levantar servicios: `docker compose up -d`.
5. Verificar integridad: `npm run verify:backup <backup>`.
6. Probar endpoints críticos: `/health`, venta simple, export PDF/Excel.

## Pruebas
- Realizar prueba de restore **trimestral** en entorno de staging.
- Registrar tiempos de restauración para validar el RTO.

## Playbook: Servidor caído
1. Confirmar incidente y notificar al equipo.
2. Restaurar DB desde último backup verificado.
3. Recuperar `exports/` e imágenes si aplica.
4. Levantar servicios con `docker compose up -d`.
5. Ejecutar `npm run verify:backup`.
6. Validar endpoints críticos.
7. Comunicar estado a stakeholders.

## Contactos y escalamiento
- Responsable de infraestructura.
- Responsable de desarrollo.
- Contacto de soporte del proveedor de hosting.

## Checklist post-incidente
- [ ] Causa raíz identificada.
- [ ] Acciones correctivas definidas.
- [ ] Backups verificados.
- [ ] Documentación actualizada.
