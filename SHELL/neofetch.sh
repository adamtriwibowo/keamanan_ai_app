#!/bin/bash

# Warna
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}Updating Package List"
sudo apt update

echo "installing neofetch"
sudo apt install neofetch -y

echo -e "${GREEN}Succes installing neofetch"
neofetch
