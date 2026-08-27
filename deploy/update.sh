#!/usr/bin/env bash
# Redeploy aplikasi setelah ada perubahan kode baru di GitHub.
# Hanya menyentuh proses pm2 "securewatch-ai" — aplikasi lain di VPS tidak terpengaruh.
set -euo pipefail

APP_DIR="/var/www/securewatch-ai"

cd "$APP_DIR"
echo "=== Menarik update dari GitHub ==="
git pull

echo "=== Install dependencies ==="
npm install --omit=dev

echo "=== Restart aplikasi (pm2) ==="
pm2 restart securewatch-ai

echo "=== Selesai. Status: ==="
pm2 status securewatch-ai
