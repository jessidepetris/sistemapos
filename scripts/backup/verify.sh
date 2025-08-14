#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  echo "Uso: $0 <ruta backup>" >&2
  exit 1
fi

if [ -d "$TARGET" ]; then
  if [ -f "$TARGET/db.dump.tar.gz" ]; then
    DUMP_FILE="$TARGET/db.dump.tar.gz"
  else
    DUMP_FILE="$TARGET/db.dump"
  fi
else
  DUMP_FILE="$TARGET"
  TARGET=$(dirname "$TARGET")
fi

META="$TARGET/META.json"
SUMS="$TARGET/SHA256SUMS"

[ -f "$META" ] || { echo "META.json no encontrado" >&2; exit 1; }

if [ -f "$SUMS" ]; then
  sha256sum -c "$SUMS"
fi

TMPDIR=$(mktemp -d)
if [[ "$DUMP_FILE" == *.tar.gz ]]; then
  tar -xzf "$DUMP_FILE" -C "$TMPDIR"
  TEST_FILE="$TMPDIR/db.dump"
else
  TEST_FILE="$DUMP_FILE"
fi
pg_restore --list "$TEST_FILE" >/dev/null
rm -rf "$TMPDIR"

echo "Backup verificado:"
cat "$META"
