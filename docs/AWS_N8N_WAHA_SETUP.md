# 🚀 Deploy n8n + WAHA di AWS Free Tier

**Panduan Lengkap untuk Infiatin Store**

---

## 📋 Overview

Setup ini akan deploy:
- ✅ **WAHA** (WhatsApp API) di EC2
- ✅ **n8n** (Workflow Automation) di EC2
- ✅ **Docker** untuk container management
- ✅ **Nginx** untuk reverse proxy (optional)
- ✅ Semua menggunakan **AWS Free Tier** (gratis 12 bulan)

---

## 💰 AWS Free Tier Includes:

- **EC2:** t2.micro instance (1 vCPU, 1GB RAM) - **750 jam/bulan gratis**
- **EBS:** 30GB storage
- **Data Transfer:** 15GB/bulan
- **Elastic IP:** 1 IP gratis selama attached

**⚠️ NOTE:** 1 EC2 instance untuk WAHA + n8n sudah cukup!

---

## 🔧 Step 1: Buat EC2 Instance

### 1.1 Login ke AWS Console
1. Masuk ke https://aws.amazon.com/console/
2. Pilih region terdekat (contoh: **ap-southeast-1** - Singapore)

### 1.2 Launch EC2 Instance

1. **EC2 Dashboard** → **Launch Instance**
2. **Name:** `infiatin-n8n-waha`
3. **AMI:** Ubuntu Server 22.04 LTS (Free tier eligible)
4. **Instance Type:** `t2.micro` (Free tier eligible)
5. **Key Pair:**
   - Create new key pair
   - Name: `infiatin-whatsapp-key`
   - Type: RSA
   - Format: `.pem` (untuk SSH)
   - **Download dan simpan baik-baik!**

6. **Network Settings:**
   - ✅ Allow SSH (port 22) from **My IP**
   - ✅ Allow HTTP (port 80) from **Anywhere**
   - ✅ Allow HTTPS (port 443) from **Anywhere**
   - ➕ Add Rule: **Custom TCP 5678** (n8n) from **Anywhere**
   - ➕ Add Rule: **Custom TCP 3123** (WAHA) from **Anywhere**

7. **Storage:** 
   - 30 GB gp3 (Free tier eligible)

8. **Launch Instance** 🚀

### 1.3 Allocate Elastic IP (Optional tapi Recommended)

1. **EC2** → **Elastic IPs** → **Allocate Elastic IP**
2. **Associate** dengan instance `infiatin-n8n-waha`
3. **Catat IP Address** (contoh: `52.77.123.456`)

**Kenapa perlu?** Supaya IP tidak berubah saat instance restart.

---

## 🖥️ Step 2: Connect ke EC2

### Windows (PowerShell):
```powershell
# Set permission untuk .pem file
icacls.exe infiatin-whatsapp-key.pem /reset
icacls.exe infiatin-whatsapp-key.pem /grant:r "$($env:username):(r)"
icacls.exe infiatin-whatsapp-key.pem /inheritance:r

# SSH ke server
ssh -i "infiatin-whatsapp-key.pem" ubuntu@52.77.123.456
```

### Linux/Mac:
```bash
chmod 400 infiatin-whatsapp-key.pem
ssh -i "infiatin-whatsapp-key.pem" ubuntu@52.77.123.456
```

**Ganti `52.77.123.456` dengan IP EC2 Anda!**

---

## 📦 Step 3: Install Docker di EC2

Setelah SSH masuk, jalankan:

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group (no need sudo)
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## 📱 Step 4: Deploy WAHA (WhatsApp API)

### 4.1 Create Docker Compose File

```bash
# Create directory
mkdir -p ~/whatsapp-automation
cd ~/whatsapp-automation

# Create docker-compose.yml
nano docker-compose.yml
```

### 4.2 Paste Configuration:

```yaml
version: '3'

services:
  waha:
    image: devlikeapro/waha
    container_name: waha
    restart: always
    ports:
      - "3123:3000"
    environment:
      - WAHA_PRINT_QR=True
      - WAHA_LOG_LEVEL=info
    volumes:
      - ./waha-data:/app/.wwebjs_auth
      - ./waha-cache:/app/.wwebjs_cache

  n8n:
    image: n8nio/n8n
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=ChangeThisStrongPassword123!
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://YOUR_EC2_IP:5678/
      - GENERIC_TIMEZONE=Asia/Jakarta
    volumes:
      - ./n8n-data:/home/node/.n8n
```

**⚠️ IMPORTANT:**
- Ganti `ChangeThisStrongPassword123!` dengan password kuat
- Ganti `YOUR_EC2_IP` dengan IP EC2 Anda
- Save: `Ctrl+O`, Enter, `Ctrl+X`

### 4.3 Start Containers

```bash
# Start services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f waha
# Press Ctrl+C to exit logs
```

---

## 🔐 Step 5: Setup WhatsApp Connection

### 5.1 Access WAHA Dashboard

1. Buka browser: `http://YOUR_EC2_IP:3123/`
2. Anda akan melihat **Swagger API Documentation**
3. Scroll ke section **"Sessions"**
4. Klik **POST /api/sessions/start**
5. Click **"Try it out"**
6. Paste JSON berikut:

```json
{
  "name": "default",
  "config": {
    "proxy": null,
    "webhooks": []
  }
}
```

7. **Execute**
8. Cek response untuk **QR Code**

### 5.2 Alternative: Get QR via API

```bash
# From your local machine
curl -X POST http://YOUR_EC2_IP:3123/api/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"name":"default"}'

# Get QR Code
curl http://YOUR_EC2_IP:3123/api/sessions/default/auth/qr
```

### 5.3 Scan QR Code

1. Buka **WhatsApp Business** di HP Anda
2. **Settings** → **Linked Devices** → **Link a Device**
3. **Scan QR Code** yang muncul
4. Tunggu sampai status **"WORKING"**

### 5.4 Verify Connection

```bash
curl http://YOUR_EC2_IP:3123/api/sessions
```

Response harus menunjukkan `status: "WORKING"`

---

## 🤖 Step 6: Setup n8n Workflows

### 6.1 Access n8n Dashboard

1. Buka: `http://YOUR_EC2_IP:5678/`
2. Login dengan:
   - **Username:** `admin`
   - **Password:** (yang Anda set di docker-compose.yml)

### 6.2 Import Workflows

Untuk setiap workflow file di folder `n8n-workflows/`:

1. **Download workflows dari GitHub** ke local Anda
2. Di n8n dashboard: **New Workflow**
3. Click **"..."** menu → **"Import from File"**
4. Upload file (contoh: `WA_ORDER_CREATED.json`)
5. **Update WAHA URL** di node "Send WA":
   ```
   http://waha:3000/api/sendText
   ```
   **Note:** Gunakan `waha:3000` karena dalam Docker network yang sama!

6. **Save Workflow**
7. **Toggle "Active"** switch
8. **Copy Webhook URL** (contoh: `http://YOUR_EC2_IP:5678/webhook/order-created`)

**Repeat untuk semua 10 workflows!**

---

## 📝 Step 7: Update .env di Project Anda

Di file `.env` local project Anda, update dengan:

```env
# ==============================================
# WHATSAPP NOTIFICATIONS (via n8n + WAHA)
# ==============================================

# Ganti YOUR_EC2_IP dengan IP EC2 Anda
N8N_WEBHOOK_OTP="http://YOUR_EC2_IP:5678/webhook/otp-verification"
N8N_WEBHOOK_ORDER_CREATED="http://YOUR_EC2_IP:5678/webhook/order-created"
N8N_WEBHOOK_ORDER_SHIPPED="http://YOUR_EC2_IP:5678/webhook/order-shipped"
N8N_WEBHOOK_ORDER_COMPLETED="http://YOUR_EC2_IP:5678/webhook/order-completed"
N8N_WEBHOOK_ORDER_CANCELLED="http://YOUR_EC2_IP:5678/webhook/order-cancelled"
N8N_WEBHOOK_PAYMENT_SUCCESS="http://YOUR_EC2_IP:5678/webhook/payment-success"
N8N_WEBHOOK_PAYMENT_EXPIRED="http://YOUR_EC2_IP:5678/webhook/payment-expired"
N8N_WEBHOOK_REFUND_REQUESTED="http://YOUR_EC2_IP:5678/webhook/refund-requested"
N8N_WEBHOOK_SECURITY_ALERT="http://YOUR_EC2_IP:5678/webhook/security-alert"
N8N_WEBHOOK_ERROR_SPIKE="http://YOUR_EC2_IP:5678/webhook/error-spike"

# WhatsApp API Key (sesuaikan dengan yang di n8n workflows)
WHATSAPP_API_KEY="infiatin-store-2025DEC-9K7XQ2M8L4A6"
```

**⚠️ Jika deploy ke Vercel, set di Vercel Environment Variables juga!**

---

## 🧪 Step 8: Testing

### Test dari Local Machine:

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
```

**Ganti `6281234567890` dengan nomor WhatsApp Anda!**

Jika berhasil, Anda akan menerima WhatsApp message! 🎉

---

## 🔒 Step 9: Security Hardening (IMPORTANT!)

### 9.1 Update Security Group

1. **EC2** → **Security Groups**
2. **Edit Inbound Rules:**
   - Port 5678 (n8n): **Only from Your Vercel IPs** atau Cloudflare
   - Port 3123 (WAHA): **Only from localhost** (internal docker network)
   - Port 22 (SSH): **Only from Your IP**

### 9.2 Setup Firewall di EC2

```bash
# Enable UFW
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 5678/tcp    # n8n
sudo ufw --force enable

# Check status
sudo ufw status
```

### 9.3 Change n8n Password

Di `docker-compose.yml`, ganti password:
```yaml
- N8N_BASIC_AUTH_PASSWORD=YourVeryStrongPassword123!@#
```

Restart:
```bash
docker compose down
docker compose up -d
```

---

## 🌐 Step 10: Setup Domain (Optional)

### 10.1 Point Domain to EC2

Di DNS provider Anda:
```
A Record: n8n.infiatin.store → YOUR_EC2_IP
A Record: waha.infiatin.store → YOUR_EC2_IP
```

### 10.2 Install Nginx + SSL

```bash
# Install nginx
sudo apt install -y nginx certbot python3-certbot-nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/n8n
```

Paste config:
```nginx
server {
    listen 80;
    server_name n8n.infiatin.store;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable & get SSL:
```bash
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d n8n.infiatin.store
```

Now access: `https://n8n.infiatin.store` 🔒

---

## 📊 Step 11: Monitoring & Maintenance

### Check Logs

```bash
# WAHA logs
docker compose logs -f waha

# n8n logs
docker compose logs -f n8n

# All logs
docker compose logs -f
```

### Check WhatsApp Session

```bash
curl http://localhost:3123/api/sessions
```

### Auto-restart on Reboot

Services already configured with `restart: always` in docker-compose.yml

### Backup Data

```bash
# Backup script
cd ~/whatsapp-automation
tar -czf backup-$(date +%Y%m%d).tar.gz waha-data/ n8n-data/

# Download to local
scp -i infiatin-whatsapp-key.pem ubuntu@YOUR_EC2_IP:~/whatsapp-automation/backup-*.tar.gz ./
```

---

## 💾 Step 12: Stop/Start Services

```bash
# Stop all
docker compose down

# Start all
docker compose up -d

# Restart all
docker compose restart

# Update containers
docker compose pull
docker compose up -d
```

---

## 🆘 Troubleshooting

### QR Code tidak muncul
```bash
docker compose logs waha
docker compose restart waha
```

### n8n tidak bisa diakses
```bash
# Check if running
docker ps

# Check logs
docker compose logs n8n

# Restart
docker compose restart n8n
```

### WhatsApp disconnected
```bash
# Check session
curl http://localhost:3123/api/sessions

# Restart session
curl -X POST http://localhost:3123/api/sessions/default/restart
```

### Disk space penuh
```bash
# Check space
df -h

# Clean docker
docker system prune -a
```

---

## 💰 Biaya Estimasi

**AWS Free Tier (12 bulan pertama):**
- EC2 t2.micro: **FREE** (750 jam/bulan)
- 30GB storage: **FREE**
- Data transfer 15GB: **FREE**
- Elastic IP: **FREE** (jika attached)

**Setelah free tier:**
- EC2 t2.micro: ~$8/bulan
- 30GB EBS: ~$3/bulan
- **Total:** ~$11/bulan

**💡 TIP:** Pakai t3.micro dengan Reserved Instance = $3-4/bulan setelah free tier!

---

## ✅ Production Checklist

- [ ] EC2 instance running (t2.micro)
- [ ] Docker & Docker Compose installed
- [ ] WAHA container running
- [ ] n8n container running
- [ ] WhatsApp session connected
- [ ] All 10 workflows imported & active
- [ ] Webhook URLs updated di .env
- [ ] Tested all notifications
- [ ] Security groups configured
- [ ] Firewall enabled (UFW)
- [ ] Strong password untuk n8n
- [ ] Backup script setup
- [ ] (Optional) Domain + SSL configured

---

## 📚 Resources

- **AWS Free Tier:** https://aws.amazon.com/free/
- **WAHA Docs:** https://waha.devlike.pro/
- **n8n Docs:** https://docs.n8n.io/
- **Docker Compose:** https://docs.docker.com/compose/

---

## 🎯 Next Steps

1. **Setup AWS Account** jika belum punya
2. **Launch EC2 Instance** (ikuti Step 1)
3. **Deploy WAHA + n8n** (ikuti Step 3-6)
4. **Import Workflows** (Step 6)
5. **Update .env** di project (Step 7)
6. **Test Notifications** (Step 8)
7. **Deploy Vercel** dengan .env baru

---

**Status:** 📖 Ready to Deploy  
**Difficulty:** ⭐⭐⭐ (Medium)  
**Time Required:** 1-2 hours  
**Cost:** FREE (12 months), then ~$11/month
