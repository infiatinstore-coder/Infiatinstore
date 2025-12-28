# 🚀 Deployment Guides - Infiatin Store

Dokumentasi lengkap untuk deployment aplikasi Infiatin Store ke berbagai platform.

---

## 📁 Isi Folder

### 1. **AWS Deployment Files**
- `aws-docker-compose.yml` - Docker Compose configuration untuk AWS EC2
- `aws-setup.sh` - Automated setup script untuk EC2
- `AWS_N8N_WAHA_SETUP.md` - Panduan lengkap setup n8n + WAHA di AWS
- `AWS_QUICK_REFERENCE.md` - Cheat sheet command-command penting

### 2. **Vercel Deployment**
Aplikasi Next.js sudah siap deploy ke Vercel. Lihat section di bawah.

---

## 🎯 Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                   VERCEL (Next.js)                  │
│              infiatin.store                         │
│  - Frontend (SSR + Static)                          │
│  - API Routes                                       │
│  - Authentication (NextAuth)                        │
└─────────────────┬───────────────────────────────────┘
                  │
                  ├─── Database (Neon PostgreSQL)
                  │
                  ├─── File Storage (Cloudinary)
                  │
                  ├─── Email (Brevo SMTP)
                  │
                  └─── WhatsApp Notifications
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│            AWS EC2 (t2.micro Free Tier)             │
│                                                     │
│  ┌─────────────────┐       ┌──────────────────┐   │
│  │   n8n           │       │   WAHA            │   │
│  │   (Port 5678)   │◄─────►│   (Port 3123)    │   │
│  │   Workflows     │       │   WhatsApp API   │   │
│  └─────────────────┘       └──────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Deployment Checklist

### ✅ Prerequisites
- [ ] AWS Account (Free Tier)
- [ ] Vercel Account
- [ ] Neon Database (Free tier)
- [ ] Cloudinary Account (Free tier)
- [ ] Brevo SMTP Account (Free tier)
- [ ] WhatsApp Business Number
- [ ] Domain (optional, bisa pakai Vercel subdomain)

### ✅ AWS Setup (n8n + WAHA)
- [ ] EC2 instance created (t2.micro)
- [ ] Security groups configured
- [ ] Docker installed
- [ ] WAHA deployed & WhatsApp connected
- [ ] n8n deployed
- [ ] All 10 workflows imported
- [ ] Webhooks tested

### ✅ Vercel Setup (Next.js App)
- [ ] GitHub repository synced
- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] Database seeded
- [ ] Build successful
- [ ] Domain configured (if custom)

---

## 🚀 Quick Start

### Option A: Automated Setup (Recommended)

#### 1. Setup AWS EC2
```bash
# SSH to EC2
ssh -i "your-key.pem" ubuntu@YOUR_EC2_IP

# Download setup script
curl -O https://raw.githubusercontent.com/YOUR_REPO/deployment/aws-setup.sh

# Run setup
chmod +x aws-setup.sh
./aws-setup.sh
```

#### 2. Deploy to Vercel
```bash
# From project root
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Option B: Manual Setup

**Lihat dokumentasi lengkap:**
- AWS: `AWS_N8N_WAHA_SETUP.md`
- Vercel: `../docs/VERCEL_DEPLOYMENT_GUIDE.md` (coming soon)

---

## 🔑 Environment Variables Required

### For Vercel (.env)
```env
# Database
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="your-secret"

# App
NEXT_PUBLIC_APP_URL="https://infiatin.store"
NEXT_PUBLIC_APP_NAME="Infiatin Store"

# Admin
ADMIN_EMAIL="admin@infiatin.store"

# Midtrans
MIDTRANS_CLIENT_KEY="..."
MIDTRANS_SERVER_KEY="..."
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="..."

# Email (Brevo)
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."

# n8n Webhooks (pointing to AWS EC2)
N8N_WEBHOOK_OTP="http://YOUR_EC2_IP:5678/webhook/otp-verification"
N8N_WEBHOOK_ORDER_CREATED="http://YOUR_EC2_IP:5678/webhook/order-created"
N8N_WEBHOOK_ORDER_SHIPPED="http://YOUR_EC2_IP:5678/webhook/order-shipped"
# ... (all 10 webhooks)

# WhatsApp
WHATSAPP_API_KEY="infiatin-store-2025DEC-9K7XQ2M8L4A6"

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Sentry (optional)
SENTRY_DSN="..."

# Google Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID="..."
```

Copy dari `.env.example` dan sesuaikan!

---

## 📊 Cost Estimation

### Tahun Pertama (AWS Free Tier):
- **AWS EC2 t2.micro:** FREE (750 jam/bulan)
- **Vercel:** FREE (Hobby tier)
- **Neon Database:** FREE (512MB)
- **Cloudinary:** FREE (25GB storage)
- **Brevo SMTP:** FREE (300 email/day)
- **Total:** **$0/bulan** 🎉

### Setelah Free Tier (Bulan ke-13):
- **AWS EC2 t2.micro:** ~$8/bulan
- **Vercel Pro:** $20/bulan (optional, untuk production)
- **Neon:** $0-19/bulan (tergantung usage)
- **Total:** ~$8-47/bulan

💡 **Tip:** Pakai AWS Reserved Instance untuk hemat 40-60%!

---

## 🔧 Maintenance

### Daily
- Monitor WhatsApp session status
- Check n8n execution logs

### Weekly
- Review server disk space
- Check error logs in Sentry
- Backup database

### Monthly
- Update Docker images
- Review AWS costs
- Security audit

### Automated Backups
```bash
# Auto backup script sudah terinstall via aws-setup.sh
# Runs daily at 2 AM
# Location: ~/infiatin-whatsapp/backups/
```

---

## 📚 Additional Documentation

- **Main Docs:** `../docs/`
- **WhatsApp Setup:** `../docs/WHATSAPP_SETUP_GUIDE.md`
- **n8n Workflows:** `../n8n-workflows/`
- **Database Schema:** `../prisma/schema.prisma`

---

## 🆘 Troubleshooting

### AWS Issues
→ Check `AWS_QUICK_REFERENCE.md`

### Vercel Build Failed
```bash
# Test build locally first
npm run build

# Check build logs in Vercel dashboard
# Common issues: env vars, database connection
```

### WhatsApp Not Connecting
```bash
# SSH to EC2
ssh -i "key.pem" ubuntu@EC2_IP

# Check WAHA logs
docker compose logs waha

# Restart session
curl -X POST http://localhost:3123/api/sessions/default/restart
```

### Database Migration Failed
```bash
# Reset database (WARNING: deletes all data!)
npx prisma migrate reset

# Or apply migrations manually
npx prisma migrate deploy
```

---

## 🎓 Learning Resources

- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Vercel Docs:** https://vercel.com/docs
- **AWS Free Tier:** https://aws.amazon.com/free/
- **Docker Compose:** https://docs.docker.com/compose/
- **n8n Documentation:** https://docs.n8n.io/
- **WAHA Documentation:** https://waha.devlike.pro/

---

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Check dokumentasi di folder `docs/`
2. Review troubleshooting guides
3. Check logs (Vercel, AWS, Docker)

---

**Status:** ✅ Production Ready  
**Last Updated:** 2025-12-28  
**Maintained by:** Infiatin Store Team
