#!/bin/bash

# === CONFIGURABLE VARIABLES ===
APP_NAME="Server-Grpc"
APP_PATH="/workspaces/..." # Ganti path ini sesuai dengan lokasi aplikasimu
NODE_VERSION="lts"         # Atau bisa diubah menjadi versi spesifik seperti "18"
USER_TO_RUN="ubuntu"       # Ganti jika ingin menjalankan PM2 sebagai user lain

# === COLOR FOR ECHO ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# === SCRIPT START ===

echo -e "${YELLOW}📦 Update package list...${NC}"
sudo apt update
sleep 1

echo -e "${YELLOW}📦 Installing curl & NodeSource...${NC}"
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sleep 1

echo -e "${YELLOW}📥 Installing Node.js and npm...${NC}"
sudo apt install -y nodejs
sleep 1

echo -e "${YELLOW}🔁 Verifying Node.js and npm installation...${NC}"
node -v && npm -v
sleep 1

echo -e "${YELLOW}🚀 Installing PM2 globally...${NC}"
sudo npm install -g pm2
sleep 1

echo -e "${YELLOW}🧪 Verifying PM2 installation...${NC}"
pm2 -v
sleep 1

echo -e "${YELLOW}🗂 Starting your app with PM2...${NC}"
pm2 start "$APP_PATH" --name "$APP_NAME"
sleep 1

echo -e "${YELLOW}💾 Saving PM2 process list...${NC}"
pm2 save
sleep 1

echo -e "${YELLOW}🔧 Setting up PM2 to startup on boot...${NC}"
# Jalankan ini sebagai user yang akan menjalankan pm2 (misal: ubuntu)
sudo -u "$USER_TO_RUN" pm2 startup systemd -u "$USER_TO_RUN" --hp "/home/$USER_TO_RUN"
sleep 1

echo -e "${GREEN}✅ PM2 setup completed!"
echo "App name     : $APP_NAME"
echo "App path     : $APP_PATH"
echo "Running user : $USER_TO_RUN"
echo "PM2 startup  : Enabled"
echo -e "${NC}"
