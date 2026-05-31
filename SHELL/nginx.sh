#!/bin/bash

# === CONFIGURABLE VARIABLES ===
DOMAIN="example.com"
BACKEND_HOST="127.0.0.1"
BACKEND_PORT=8000
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
NGINX_ENABLED="/etc/nginx/sites-enabled/$DOMAIN"

# === COLOR FOR ECHO ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Updating package list...${NC}"
sudo apt update && echo -e "${GREEN}✔ Package list updated!${NC}" || {
    echo -e "${RED}✖ Failed to update packages.${NC}"
    exit 1
}
sleep 5

echo -e "${YELLOW}📦 Installing NGINX...${NC}"
sudo apt install -y nginx && echo -e "${GREEN}✔ NGINX installed!${NC}" || {
    echo -e "${RED}✖ Failed to install NGINX.${NC}"
    exit 1
}
sleep 5

echo -e "${YELLOW}⚙ Creating NGINX reverse proxy config for domain ${DOMAIN}...${NC}"

sudo tee $NGINX_CONF >/dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://$BACKEND_HOST:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo -e "${GREEN}✔ NGINX config created at $NGINX_CONF${NC}"
sleep 5

if [ ! -L "$NGINX_ENABLED" ]; then
    sudo ln -s $NGINX_CONF $NGINX_ENABLED
    echo -e "${GREEN}✔ Enabled site by symlinking to sites-enabled${NC}"
else
    echo -e "${YELLOW}⚠ Site already enabled${NC}"
fi

echo -e "${YELLOW}🔍 Testing NGINX configuration...${NC}"
sudo nginx -t && echo -e "${GREEN}✔ NGINX config test passed!${NC}" || {
    echo -e "${RED}✖ NGINX config test failed.${NC}"
    exit 1
}
sleep 5

echo -e "${YELLOW}🔄 Reloading NGINX to apply changes...${NC}"
service nginx restart && echo -e "${GREEN}✔ NGINX reloaded successfully!${NC}" || {
    echo -e "${RED}✖ Failed to reload NGINX.${NC}"
    exit 1
}

echo -e "${CYAN}"
echo "✅ NGINX reverse proxy setup complete!"
echo "Domain       : $DOMAIN"
echo "Backend host : $BACKEND_HOST"
echo "Backend port : $BACKEND_PORT"
echo -e "${NC}"
