#!/bin/bash
set -e
mkdir -p perf
for f in scripts/sql/*.sql; do
  name=$(basename "$f" .sql)
  psql "$DATABASE_URL" -f "$f" -o "perf/$name.plan"
done
