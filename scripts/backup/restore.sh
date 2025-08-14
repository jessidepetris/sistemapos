#!/usr/bin/env bash
set -euo pipefail

BACKUP_PATH="${1:-}"
if [ -z "$BACKUP_PATH" ]; then
  echo "Uso: $0 <ruta backup>" >&2
  exit 1
fi

PGHOST=${PGHOST:-localhost}
PGUSER=${PGUSER:-postgres}
PGPASSWORD=${PGPASSWORD:-postgres}
PGDB=${PGDB:-puntopastelero}

export PGHOST PGUSER PGPASSWORD

if [ -d "$BACKUP_PATH" ]; then
  if [ -f "$BACKUP_PATH/db.dump.tar.gz" ]; then
    BACKUP_PATH="$BACKUP_PATH/db.dump.tar.gz"
  else
    BACKUP_PATH="$BACKUP_PATH/db.dump"
  fi
fi

TMPDIR=$(mktemp -d)
if [[ "$BACKUP_PATH" == *.tar.gz ]]; then
  tar -xzf "$BACKUP_PATH" -C "$TMPDIR"
  DUMP_FILE="$TMPDIR/db.dump"
else
  DUMP_FILE="$BACKUP_PATH"
fi

psql -v ON_ERROR_STOP=1 -tc "SELECT 1 FROM pg_database WHERE datname = '$PGDB'" | grep -q 1 || psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE $PGDB"
pg_restore --clean --if-exists --no-owner -d "$PGDB" "$DUMP_FILE"

LAST_MIGRATION=$(ls prisma/migrations 2>/dev/null | tail -1 || true)
if [ -n "$LAST_MIGRATION" ]; then
  npx prisma migrate resolve --applied "$LAST_MIGRATION" >/dev/null 2>&1 || true
fi

rm -rf "$TMPDIR"

echo "Restore OK para $PGDB en $PGHOST"
psql -d "$PGDB" -c 'select version();'
