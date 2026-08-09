#!/bin/sh
set -e
echo "[Entrypoint] Running seed..."
npx tsx src/database/seed.ts
echo "[Entrypoint] Starting server..."
exec npx tsx src/index.ts