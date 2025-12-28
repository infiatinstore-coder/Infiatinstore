#!/bin/bash

# ==============================================
# 🚀 Infiatin Store - AWS n8n + WAHA Setup Script
# ==============================================
# This script automates the deployment of n8n and WAHA
# on AWS EC2 Free Tier (Ubuntu 22.04)
#
# Usage: 
#   chmod +x aws-setup.sh
#   ./aws-setup.sh
# ==============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Header
echo "=================================================="
echo "🚀 Infiatin Store - AWS Setup"
echo "📱 n8n + WAHA Deployment Script"
echo "=================================================="
echo ""

# Check if running on Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    print_error "This script is designed for Ubuntu 22.04 LTS"
    exit 1
fi

# ==============================================
# Step 1: Update System
# ==============================================
print_info "Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated!"

# ==============================================
# Step 2: Install Docker
# ==============================================
print_info "Step 2: Installing Docker..."

# Remove old versions
sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Install dependencies
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    gnupg \
    lsb-release

# Add Docker GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

print_success "Docker installed! Version: $(docker --version)"

# ==============================================
# Step 3: Setup Firewall
# ==============================================
print_info "Step 3: Configuring UFW firewall..."

sudo ufw --force enable
sudo ufw allow 22/tcp    comment 'SSH'
sudo ufw allow 80/tcp    comment 'HTTP'
sudo ufw allow 443/tcp   comment 'HTTPS'
sudo ufw allow 5678/tcp  comment 'n8n'
sudo ufw allow 3123/tcp  comment 'WAHA'

print_success "Firewall configured!"

# ==============================================
# Step 4: Create Directory Structure
# ==============================================
print_info "Step 4: Creating directory structure..."

mkdir -p ~/infiatin-whatsapp/{data/{waha-auth,waha-cache,n8n},logs,backups}
cd ~/infiatin-whatsapp

print_success "Directory structure created!"

# ==============================================
# Step 5: Get Configuration
# ==============================================
print_info "Step 5: Configuring deployment..."

# Get EC2 public IP
EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "UNKNOWN")

if [ "$EC2_PUBLIC_IP" != "UNKNOWN" ]; then
    print_info "Detected EC2 Public IP: $EC2_PUBLIC_IP"
else
    print_warning "Could not detect EC2 IP. You'll need to set it manually."
    read -p "Enter your EC2 Public IP: " EC2_PUBLIC_IP
fi

# Get n8n password
read -sp "Enter n8n admin password (min 12 chars): " N8N_PASSWORD
echo ""

if [ ${#N8N_PASSWORD} -lt 12 ]; then
    print_error "Password must be at least 12 characters!"
    exit 1
fi

# ==============================================
# Step 6: Create Docker Compose File
# ==============================================
print_info "Step 6: Creating docker-compose.yml..."

cat > docker-compose.yml <<EOF
version: '3.8'

services:
  waha:
    image: devlikeapro/waha:latest
    container_name: infiatin-waha
    restart: always
    ports:
      - "3123:3000"
    environment:
      - WAHA_PRINT_QR=True
      - WAHA_LOG_LEVEL=info
      - TZ=Asia/Jakarta
    volumes:
      - ./data/waha-auth:/app/.wwebjs_auth
      - ./data/waha-cache:/app/.wwebjs_cache
    networks:
      - infiatin-network

  n8n:
    image: n8nio/n8n:latest
    container_name: infiatin-n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://${EC2_PUBLIC_IP}:5678/
      - N8N_EDITOR_BASE_URL=http://${EC2_PUBLIC_IP}:5678/
      - GENERIC_TIMEZONE=Asia/Jakarta
      - TZ=Asia/Jakarta
    volumes:
      - ./data/n8n:/home/node/.n8n
    networks:
      - infiatin-network
    depends_on:
      - waha

networks:
  infiatin-network:
    driver: bridge
EOF

print_success "docker-compose.yml created!"

# ==============================================
# Step 7: Start Services
# ==============================================
print_info "Step 7: Starting Docker containers..."

# Use newgrp to apply docker group (for current session)
newgrp docker <<ENDGROUP
docker compose up -d
ENDGROUP

sleep 5

# Check if containers are running
if docker ps | grep -q "infiatin-waha" && docker ps | grep -q "infiatin-n8n"; then
    print_success "Containers started successfully!"
else
    print_error "Failed to start containers. Check logs with: docker compose logs"
    exit 1
fi

# ==============================================
# Step 8: Create Backup Script
# ==============================================
print_info "Step 8: Creating backup script..."

cat > ~/infiatin-whatsapp/backup.sh <<'BACKUP_SCRIPT'
#!/bin/bash
BACKUP_DIR=~/infiatin-whatsapp/backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.tar.gz"

cd ~/infiatin-whatsapp
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" data/

# Keep only last 7 backups
cd "${BACKUP_DIR}"
ls -t backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup created: ${BACKUP_FILE}"
BACKUP_SCRIPT

chmod +x ~/infiatin-whatsapp/backup.sh

# Add to crontab (daily backup at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * ~/infiatin-whatsapp/backup.sh >> ~/infiatin-whatsapp/logs/backup.log 2>&1") | crontab -

print_success "Backup script created and scheduled!"

# ==============================================
# Step 9: Display Information
# ==============================================
echo ""
echo "=================================================="
echo "✅ INSTALLATION COMPLETE!"
echo "=================================================="
echo ""
print_info "Access URLs:"
echo "  🤖 n8n Dashboard: http://${EC2_PUBLIC_IP}:5678"
echo "     Username: admin"
echo "     Password: ${N8N_PASSWORD}"
echo ""
echo "  📱 WAHA API: http://${EC2_PUBLIC_IP}:3123"
echo ""
print_info "Next Steps:"
echo "  1. Get WhatsApp QR Code:"
echo "     docker compose logs waha | grep -A 30 'Scan'"
echo ""
echo "  2. Or start session via API:"
echo "     curl -X POST http://localhost:3123/api/sessions/start -H 'Content-Type: application/json' -d '{\"name\":\"default\"}'"
echo ""
echo "  3. Import n8n workflows from project folder: n8n-workflows/"
echo ""
echo "  4. Update .env in your Next.js project:"
echo "     N8N_WEBHOOK_ORDER_CREATED=http://${EC2_PUBLIC_IP}:5678/webhook/order-created"
echo "     (and all other webhook URLs)"
echo ""
print_info "Useful Commands:"
echo "  • View logs: cd ~/infiatin-whatsapp && docker compose logs -f"
echo "  • Restart: docker compose restart"
echo "  • Stop: docker compose down"
echo "  • Start: docker compose up -d"
echo "  • Backup: ~/infiatin-whatsapp/backup.sh"
echo ""
print_warning "IMPORTANT SECURITY NOTES:"
echo "  • Change n8n password regularly"
echo "  • Setup SSL/HTTPS for production (use nginx + certbot)"
echo "  • Restrict Security Group to only allow traffic from Vercel IPs"
echo "  • Enable CloudWatch monitoring"
echo ""
echo "=================================================="
print_success "Setup script completed successfully! 🎉"
echo "=================================================="
