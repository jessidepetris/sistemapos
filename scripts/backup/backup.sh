#!/usr/bin/env bash
set -euo pipefail

PGHOST=${PGHOST:-localhost}
PGUSER=${PGUSER:-postgres}
PGPASSWORD=${PGPASSWORD:-postgres}
PGDB=${PGDB:-puntopastelero}
RETENTION_DAYS=${RETENTION_DAYS:-}

export PGHOST PGUSER PGPASSWORD

TIMESTAMP=$(date +%F_%H%M)
DEST_DIR="backups/${TIMESTAMP}"
mkdir -p "$DEST_DIR"

DUMP_FILE="$DEST_DIR/db.dump"
pg_dump -Fc "$PGDB" > "$DUMP_FILE"

if command -v tar >/dev/null 2>&1; then
  tar -czf "$DUMP_FILE.tar.gz" -C "$DEST_DIR" db.dump
  rm "$DUMP_FILE"
  DUMP_FILE="$DUMP_FILE.tar.gz"
fi

SHA256=$(sha256sum "$DUMP_FILE" | awk '{print $1}')
echo "$SHA256  $(basename "$DUMP_FILE")" > "$DEST_DIR/SHA256SUMS"

SCHEMA_HASH=$(npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma 2>/dev/null | sha256sum | cut -c1-8 || echo "unknown")
PG_VERSION=$(psql -At -c 'select version()' 2>/dev/null || echo "unknown")
SIZE=$(stat -c%s "$DUMP_FILE" 2>/dev/null || wc -c < "$DUMP_FILE")

cat > "$DEST_DIR/META.json" <<JSON
{
  "date": "$(date --iso-8601=seconds)",
  "schemaHash": "$SCHEMA_HASH",
  "size": $SIZE,
  "pgHost": "$PGHOST",
  "pgVersion": "$PG_VERSION"
}
JSON

if [ -n "$RETENTION_DAYS" ]; then
  find backups -maxdepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true
fi

echo "Backup creado en $DEST_DIR"
