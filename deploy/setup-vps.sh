#!/usr/bin/env bash
# ============================================================
# SecureWatch AI — Setup awal di VPS (aman untuk VPS yang sudah
# menjalankan aplikasi lain). Semua langkah bersifat check-first:
# tidak akan menimpa/menghapus apa pun yang sudah terpasang.
#
# Jalankan sebagai user yang punya akses sudo:
#   bash setup-vps.sh
# ============================================================
set -euo pipefail

APP_DIR="/var/www/securewatch-ai"
REPO_URL="https://github.com/adamtriwibowo/keamanan_ai_app.git"
NODE_MIN_MAJOR=18

echo "=== 1. Folder aplikasi (terisolasi dari aplikasi lain) ==="
if [ -d "$APP_DIR" ]; then
  echo "Folder $APP_DIR sudah ada — pastikan ini memang untuk aplikasi SecureWatch AI."
else
  sudo mkdir -p "$APP_DIR"
  sudo chown "$(id -u):$(id -g)" "$APP_DIR"
  echo "Folder $APP_DIR dibuat."
fi

echo ""
echo "=== 2. Node.js ==="
if command -v node >/dev/null 2>&1; then
  CURRENT_MAJOR="$(node -v | sed 's/v//' | cut -d. -f1)"
  echo "Node.js sudah terpasang: $(node -v)"
  if [ "$CURRENT_MAJOR" -lt "$NODE_MIN_MAJOR" ]; then
    echo "PERINGATAN: versi Node < $NODE_MIN_MAJOR."
    echo "Karena VPS ini sudah dipakai aplikasi lain, skrip TIDAK akan upgrade Node secara paksa."
    echo "Install Node $NODE_MIN_MAJOR+ terpisah (mis. via nvm) lalu jalankan ulang skrip ini."
    exit 1
  fi
else
  echo "Node.js belum terpasang. Menginstall Node.js 20.x LTS via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo ""
echo "=== 3. MongoDB ==="
if systemctl is-active --quiet mongod 2>/dev/null; then
  echo "MongoDB sudah berjalan di VPS ini — akan dipakai bersama (database aplikasi ini terpisah lewat nama DB 'keamananai')."
elif command -v mongod >/dev/null 2>&1; then
  echo "MongoDB terpasang tapi service tidak aktif. Menyalakan..."
  sudo systemctl enable --now mongod
else
  echo "MongoDB belum terpasang. Menginstall MongoDB Community Edition 7.0..."
  curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
  echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | \
    sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  sudo apt-get update
  sudo apt-get install -y mongodb-org
  sudo systemctl enable --now mongod
fi

echo ""
echo "=== 4. pm2 (process manager) ==="
if command -v pm2 >/dev/null 2>&1; then
  echo "pm2 sudah terpasang: $(pm2 -v)"
else
  echo "Menginstall pm2 secara global..."
  sudo npm install -g pm2
fi

echo ""
echo "=== 5. Ambil kode aplikasi ==="
if [ -d "$APP_DIR/.git" ]; then
  echo "Repo sudah ada di $APP_DIR, menarik update terbaru..."
  git -C "$APP_DIR" pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi

echo ""
echo "=== 6. Install dependencies ==="
cd "$APP_DIR"
npm install --omit=dev

echo ""
echo "=== 7. File .env ==="
if [ -f "$APP_DIR/.env" ]; then
  echo ".env sudah ada, tidak ditimpa."
else
  cp "$APP_DIR/deploy/.env.production.example" "$APP_DIR/.env"
  echo "File .env dibuat dari template."
fi

mkdir -p "$APP_DIR/logs"

echo ""
echo "=================================================="
echo " SELESAI. Langkah selanjutnya (WAJIB manual):"
echo "=================================================="
echo "1. Cek port yang sudah dipakai aplikasi lain di VPS ini:"
echo "     sudo ss -tulpn | grep LISTEN"
echo "   Lalu edit $APP_DIR/.env — pastikan PORT_GRAPHQL BELUM dipakai."
echo ""
echo "2. Lengkapi $APP_DIR/.env:"
echo "     nano $APP_DIR/.env"
echo "   Isi: OPENROUTER_API_KEY, SERPAPI_API_KEY, JWT_SECRET (acak, mis. dari 'openssl rand -hex 32')"
echo ""
echo "3. Jalankan aplikasi lewat pm2 (nama proses: securewatch-ai, tidak akan menyentuh proses pm2 lain):"
echo "     cd $APP_DIR && pm2 start deploy/ecosystem.config.js"
echo "     pm2 save && pm2 startup   # agar otomatis nyala lagi setelah VPS reboot"
echo ""
echo "4. Buka firewall untuk port yang dipakai (kalau ufw aktif):"
echo "     sudo ufw allow <PORT_GRAPHQL>/tcp"
echo ""
echo "5. Uji coba:"
echo "     curl http://127.0.0.1:<PORT_GRAPHQL>/login"
echo "     Akses dari luar: http://<IP-VPS>:<PORT_GRAPHQL>/login"
