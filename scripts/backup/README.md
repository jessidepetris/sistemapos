# Scripts de backup

Herramientas simples para respaldar y restaurar la base de datos.

## Uso

### Generar backup
```bash
./backup.sh
```
Lee `PGHOST`, `PGUSER`, `PGPASSWORD` y `PGDB` del entorno. El backup se guarda en `backups/AAAA-MM-DD_hhmm/` e incluye `META.json` y `SHA256SUMS`.

### Restaurar
```bash
./restore.sh backups/2025-08-14_0100/db.dump
```
Crea la base si no existe y aplica el dump.

### Verificar
```bash
./verify.sh backups/2025-08-14_0100/
```
Revisa checksum y que `pg_restore --list` sea válido.

## Notas para Windows
- Ejecutar los scripts con **Git Bash** o **WSL**.
- Opcionalmente se pueden crear versiones PowerShell (`backup.ps1` y `restore.ps1`).
