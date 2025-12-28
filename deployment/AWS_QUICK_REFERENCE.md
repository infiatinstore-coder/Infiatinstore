# 📋 Quick Reference: AWS n8n + WAHA Commands

Cheat sheet untuk mengelola n8n dan WAHA di AWS EC2.

---

## 🔐 SSH Connection

```bash
# Windows (PowerShell)
ssh -i "infiatin-whatsapp-key.pem" ubuntu@YOUR_EC2_IP

# Linux/Mac
chmod 400 infiatin-whatsapp-key.pem
ssh -i "infiatin-whatsapp-key.pem" ubuntu@YOUR_EC2_IP
```

---

## 🐳 Docker Commands

### Start/Stop Services
```bash
cd ~/infiatin-whatsapp

# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart all services
docker compose restart

# Restart individual service
docker compose restart waha
docker compose restart n8n
```

### View Logs
```bash
# All logs (follow mode)
docker compose logs -f

# WAHA logs only
docker compose logs -f waha

# n8n logs only
docker compose logs -f n8n

# Last 100 lines
docker compose logs --tail=100

# Logs with timestamps
docker compose logs -f -t
```

### Container Status
```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Container stats (CPU, memory usage)
docker stats
```

### Update Containers
```bash
cd ~/infiatin-whatsapp

# Pull latest images
docker compose pull

# Recreate containers with new images
docker compose up -d --force-recreate
```

---

## 📱 WAHA Commands

### Get WhatsApp QR Code
```bash
# Method 1: From logs
docker compose logs waha | grep -A 30 "Scan"

# Method 2: Start session via API
curl -X POST http://localhost:3123/api/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"name":"default"}'

# Method 3: Get QR as image
curl http://localhost:3123/api/sessions/default/auth/qr
```

### Check WhatsApp Session Status
```bash
# All sessions
curl http://localhost:3123/api/sessions

# Specific session
curl http://localhost:3123/api/sessions/default

# Pretty print with jq
curl -s http://localhost:3123/api/sessions | jq .
```

### Send Test Message
```bash
curl -X POST http://localhost:3123/api/sendText \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: infiatin-store-2025DEC-9K7XQ2M8L4A6" \
  -d '{
    "session": "default",
    "chatId": "6281234567890@c.us",
    "text": "Test message from Infiatin Store!"
  }'
```

### Restart WhatsApp Session
```bash
# Stop session
curl -X POST http://localhost:3123/api/sessions/default/stop

# Start session
curl -X POST http://localhost:3123/api/sessions/default/start

# Restart session
curl -X POST http://localhost:3123/api/sessions/default/restart
```

---

## 🤖 n8n Commands

### Access Dashboard
```
http://YOUR_EC2_IP:5678
Username: admin
Password: [your-password]
```

### Test Webhooks
```bash
# Test Order Created
curl -X POST http://YOUR_EC2_IP:5678/webhook/order-created \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "INV-TEST-001",
    "customerName": "Test User",
    "phone": "6281234567890",
    "total": "Rp 500,000",
    "itemsCount": 3
  }'

# Test Payment Success
curl -X POST http://YOUR_EC2_IP:5678/webhook/payment-success \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "INV-TEST-001",
    "phone": "6281234567890"
  }'

# Test Order Shipped
curl -X POST http://YOUR_EC2_IP:5678/webhook/order-shipped \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "INV-TEST-001",
    "phone": "6281234567890",
    "courier": "JNE",
    "trackingNumber": "JP1234567890"
  }'
```

---

## 💾 Backup & Restore

### Manual Backup
```bash
# Run backup script
~/infiatin-whatsapp/backup.sh

# Or manual tar
cd ~/infiatin-whatsapp
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# List backups
ls -lh ~/infiatin-whatsapp/backups/
```

### Download Backup to Local
```bash
# From your local machine (not EC2)
scp -i "infiatin-whatsapp-key.pem" \
  ubuntu@YOUR_EC2_IP:~/infiatin-whatsapp/backups/backup_*.tar.gz \
  ./
```

### Restore from Backup
```bash
cd ~/infiatin-whatsapp

# Stop services
docker compose down

# Extract backup
tar -xzf backups/backup_20250128.tar.gz

# Start services
docker compose up -d
```

---

## 🔍 Monitoring

### System Resources
```bash
# Disk usage
df -h

# Memory usage
free -h

# CPU info
top

# Docker stats
docker stats --no-stream

# Disk usage by containers
docker system df
```

### Check Service Health
```bash
# WAHA health
curl http://localhost:3123/api/sessions

# n8n health
curl http://localhost:5678/healthz

# Response code check
curl -o /dev/null -s -w "%{http_code}\n" http://localhost:5678/
```

### View System Logs
```bash
# Docker daemon logs
sudo journalctl -u docker -f

# System logs
sudo tail -f /var/log/syslog

# UFW firewall logs
sudo tail -f /var/log/ufw.log
```

---

## 🔒 Security

### Update n8n Password
```bash
# Edit docker-compose.yml
cd ~/infiatin-whatsapp
nano docker-compose.yml

# Change this line:
# - N8N_BASIC_AUTH_PASSWORD=NewStrongPassword123!

# Restart n8n
docker compose restart n8n
```

### Firewall Management
```bash
# Check firewall status
sudo ufw status numbered

# Add rule
sudo ufw allow 8080/tcp

# Delete rule
sudo ufw delete [number]

# Deny specific IP
sudo ufw deny from 1.2.3.4

# Allow from specific IP only
sudo ufw allow from YOUR_VERCEL_IP to any port 5678
```

### View Active Connections
```bash
# Active connections to n8n
sudo netstat -tulpn | grep :5678

# Active connections to WAHA
sudo netstat -tulpn | grep :3123
```

---

## 🧹 Maintenance

### Clean Docker
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes

# Auto cleanup script
cat > ~/cleanup.sh <<'EOF'
#!/bin/bash
docker system prune -af --volumes
docker volume prune -f
df -h
EOF

chmod +x ~/cleanup.sh
```

### Update System
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Update Docker
sudo apt install --only-upgrade docker-ce docker-ce-cli containerd.io

# Reboot if needed
sudo reboot
```

### Auto-restart on Crash
Already configured with `restart: always` in docker-compose.yml, but verify:
```bash
docker inspect infiatin-waha | grep -A 3 RestartPolicy
docker inspect infiatin-n8n | grep -A 3 RestartPolicy
```

---

## 📊 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker compose logs [service_name]

# Check docker daemon
sudo systemctl status docker

# Restart docker daemon
sudo systemctl restart docker

# Full reset
docker compose down
docker compose up -d
```

### Out of Disk Space
```bash
# Check space
df -h

# Clean Docker
sh ~/cleanup.sh

# Remove old logs
docker compose logs > /dev/null
sudo journalctl --vacuum-time=7d

# Find large files
sudo du -h / | sort -rh | head -20
```

### WhatsApp Disconnected
```bash
# Check session
curl http://localhost:3123/api/sessions

# Restart session
curl -X POST http://localhost:3123/api/sessions/default/restart

# View QR again
docker compose logs waha | grep -A 30 "Scan"

# Full WAHA restart
docker compose restart waha
```

### n8n Webhooks Not Working
```bash
# Check if n8n is accessible
curl http://localhost:5678/healthz

# Check webhook URL in workflow
# Should be: http://YOUR_EC2_IP:5678/webhook/...

# Test webhook manually
curl -X POST http://YOUR_EC2_IP:5678/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Check n8n executions in dashboard
# n8n Dashboard -> Executions
```

---

## 🚀 Performance Optimization

### Limit Docker Resources
Edit docker-compose.yml:
```yaml
services:
  waha:
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
```

### Enable Swap (for t2.micro)
```bash
# Create 2GB swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
free -h
```

---

## 📱 Quick Testing Script

Save as `test-notifications.sh`:
```bash
#!/bin/bash
EC2_IP="YOUR_EC2_IP"
PHONE="6281234567890"

echo "Testing all webhooks..."

# 1. Order Created
curl -X POST http://${EC2_IP}:5678/webhook/order-created \
  -H "Content-Type: application/json" \
  -d "{\"orderNumber\":\"TEST-001\",\"customerName\":\"Test\",\"phone\":\"${PHONE}\",\"total\":\"100000\",\"itemsCount\":1}"

sleep 2

# 2. Payment Success
curl -X POST http://${EC2_IP}:5678/webhook/payment-success \
  -H "Content-Type: application/json" \
  -d "{\"orderNumber\":\"TEST-001\",\"phone\":\"${PHONE}\"}"

sleep 2

# 3. Order Shipped
curl -X POST http://${EC2_IP}:5678/webhook/order-shipped \
  -H "Content-Type: application/json" \
  -d "{\"orderNumber\":\"TEST-001\",\"phone\":\"${PHONE}\",\"courier\":\"JNE\",\"trackingNumber\":\"TEST123\"}"

echo "All tests sent! Check WhatsApp."
```

---

**💡 Pro Tips:**
- Always backup before updates
- Monitor disk space regularly (AWS free tier = 30GB only)
- Set up CloudWatch alarms for EC2
- Use Elastic IP to prevent IP changes
- Enable automated snapshots for EBS volume

**📚 Full Documentation:**
- Main Setup: `docs/AWS_N8N_WAHA_SETUP.md`
- WhatsApp Guide: `docs/WHATSAPP_SETUP_GUIDE.md`
