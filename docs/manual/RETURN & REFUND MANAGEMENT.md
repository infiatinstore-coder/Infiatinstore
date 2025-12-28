# Return & Refund Implementation Guide

## 🎯 Complete Feature Overview

### Status Flow Diagram
```
PENDING → APPROVED → SHIPPING_BACK → RECEIVED → INSPECTING
    ↓         ↓            ↓             ↓           ↓
REJECTED  CANCELLED  CANCELLED    ESCALATED  INSPECTION_PASSED
                                                      ↓
                                              REFUNDING → COMPLETED
                                                      ↓
                                            INSPECTION_FAILED
```

## 📦 Database Migration

```bash
npx prisma migrate dev --name add_return_refund_system
npx prisma generate
```

## 🔧 Setup & Configuration

### 1. Environment Variables
```env
# Return Configuration
RETURN_WINDOW_DAYS=7
SELLER_RESPONSE_WINDOW_DAYS=2
BUYER_SHIPBACK_WINDOW_DAYS=3

# Payment Gateway
PAYMENT_GATEWAY_REFUND_ENABLED=true

# Notification
NOTIFY_SELLER_RETURN=true
NOTIFY_BUYER_REFUND=true
```

### 2. Initialize Return Manager
```javascript
// lib/index.js
export { returnManager } from './returnManager';
export { escrowManager } from './escrowManager';

// Set up cron jobs
import cron from 'node-cron';
import * as returnJobs from './jobs/returnJobs';

// Run every hour
cron.schedule('0 * * * *', async () => {
  await returnJobs.autoRejectExpiredReturns();
  await returnJobs.autoCancelUnshippedReturns();
  await returnJobs.syncReturnTracking();
});

// Run every 6 hours
cron.schedule('0 */6 * * *', async () => {
  await returnJobs.sendReturnReminders();
});
```

### 3. Integrate with Order State Machine
```javascript
// When order delivered
async function handleOrderDelivered(orderId) {
  // Update order status
  await orderManager.transitionToDelivered(orderId);
  
  // Set return deadline (7 days from delivery)
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });
  
  console.log(`Return window open until ${order.returnDeadline}`);
}

// Before completing order
async function handleOrderCompletion(orderId) {
  const check = await orderManager.canCompleteOrder(orderId);
  
  if (!check.canComplete) {
    throw new Error(check.reason);
  }
  
  await orderManager.transitionToCompleted(orderId);
}
```

## 🎨 Frontend Integration

### Return Request Form
```javascript
// components/ReturnRequestForm.jsx
import { useState } from 'react';
import { returnManager } from '@/lib/returnManager';

export default function ReturnRequestForm({ orderId }) {
  const [formData, setFormData] = useState({
    reason: '',
    reasonDetail: '',
    images: [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await fetch('/api/returns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          ...formData,
        }),
      });

      const data = await result.json();
      
      if (data.success) {
        alert('Return request submitted!');
        // Redirect to return details
        router.push(`/returns/${data.returnRequest.id}`);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select
        value={formData.reason}
        onChange={(e) => setFormData({...formData, reason: e.target.value})}
        required
      >
        <option value="">Pilih alasan</option>
        <option value="DEFECTIVE">Barang rusak/cacat</option>
        <option value="WRONG_ITEM">Salah kirim barang</option>
        <option value="NOT_AS_DESCRIBED">Tidak sesuai deskripsi</option>
        <option value="SIZE_ISSUE">Ukuran tidak pas</option>
        <option value="CHANGED_MIND">Berubah pikiran</option>
      </select>

      <textarea
        placeholder="Jelaskan detail masalah (min 10 karakter)"
        value={formData.reasonDetail}
        onChange={(e) => setFormData({...formData, reasonDetail: e.target.value})}
        minLength={10}
        required
      />

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleImageUpload(e.target.files)}
        required
      />
      
      <p className="text-sm text-gray-600">
        Upload minimal 1 foto sebagai bukti
      </p>

      <button type="submit">
        Ajukan Pengembalian
      </button>
    </form>
  );
}
```

### Seller Response Panel
```javascript
// components/SellerReturnPanel.jsx
export default function SellerReturnPanel({ returnRequest }) {
  const handleRespond = async (approved) => {
    const response = prompt('Masukkan tanggapan Anda:');
    if (!response) return;

    let rejectionReason = null;
    if (!approved) {
      rejectionReason = prompt('Alasan penolakan:');
      if (!rejectionReason) return;
    }

    await fetch(`/api/returns/${returnRequest.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approved,
        response,
        rejectionReason,
      }),
    });

    alert(approved ? 'Return disetujui' : 'Return ditolak');
    window.location.reload();
  };

  return (
    <div>
      <h3>Request Return dari {returnRequest.user.name}</h3>
      
      <div>
        <strong>Alasan:</strong> {returnRequest.reason}
      </div>
      <div>
        <strong>Detail:</strong> {returnRequest.reasonDetail}
      </div>
      
      <div className="images">
        {returnRequest.images.map((img, i) => (
          <img key={i} src={img} alt={`Evidence ${i+1}`} />
        ))}
      </div>

      <div className="actions">
        <button onClick={() => handleRespond(true)}>
          Setujui Return
        </button>
        <button onClick={() => handleRespond(false)}>
          Tolak Return
        </button>
      </div>
    </div>
  );
}
```

## ⚠️ Edge Cases Handling

### 1. Escrow Already Released
**Scenario:** Buyer requests return after escrow released to seller

**Solution:**
```javascript
// returnManager.js already handles this
if (escrow && escrow.status === 'RELEASED') {
  // Attempt payment gateway refund
  if (refund.method === 'ORIGINAL_PAYMENT') {
    const gatewayRefund = await paymentGateway.refund({
      paymentId: refund.paymentReference,
      amount: refund.totalAmount.toNumber(),
    });
  } else {
    // Give store credit instead
    await addStoreCredit({
      userId: refund.userId,
      amount: refund.totalAmount,
    });
  }
}
```

**Note:** Seller gets charged back, or store absorbs cost with credit.

### 2. Partial Returns
**Scenario:** User wants to return only 1 item from multi-item order

**Solution:**
```javascript
// When creating return, specify orderItemId
await returnManager.createReturnRequest({
  orderId: 'order_123',
  orderItemId: 'item_456', // Specific item
  reason: 'SIZE_ISSUE',
  // ...
});

// Refund calculation automatically handles partial amount
```

### 3. Return Fraud Detection
**Scenario:** User with suspicious return patterns

**Solution:**
```javascript
import { ReturnFraudDetection } from '@/lib/fraud/returnFraudDetection';

// On return creation
const fraud = new ReturnFraudDetection();
const analysis = await fraud.analyzeReturnRequest(returnRequest.id);

if (analysis.riskLevel === 'HIGH') {
  // Auto-flag for manual review
  // Admin must approve before processing
}
```

**Fraud Indicators:**
- 5+ returns in 30 days
- Return rate > 30%
- Frequent "changed mind" returns
- Immediate returns (< 1 hour after delivery)
- Insufficient evidence (< 2 photos)

### 4. Lost Return Shipment
**Scenario:** Return package lost in transit

**Solution:**
```javascript
// Buyer can escalate
await returnManager.escalateToAdmin(returnRequestId, 
  'Paket return hilang di pengiriman'
);

// Admin reviews tracking history and decides
await returnManager.adminResolve({
  returnRequestId,
  adminId: 'admin_123',
  decision: 'APPROVE', // or 'REJECT'
  approvedAmount: originalAmount,
  notes: 'Approved based on valid tracking proof',
});
```

### 5. Inspection Disputes
**Scenario:** Seller claims item damaged by buyer, buyer disagrees

**Solution:**
```javascript
// Seller marks inspection failed
await returnManager.inspectReturnedItem({
  returnRequestId,
  sellerId: 'seller_123',
  passed: false,
  inspectionNotes: 'Item has scratches not present in original',
  inspectionImages: ['photo1.jpg', 'photo2.jpg'],
});

// Buyer can escalate with counter-evidence
await returnManager.escalateToAdmin(returnRequestId,
  'Item kondisi sama seperti saat kirim'
);

// Admin reviews both parties' evidence and decides
```

### 6. Store Credit vs Refund
**Refund Method Priority:**
1. **ORIGINAL_PAYMENT** - If payment gateway supports refund
2. **STORE_CREDIT** - If gateway doesn't support or failed
3. **BANK_TRANSFER** - Manual process for large amounts

```javascript
// User can choose preference
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { preferredRefundMethod: true },
});

// System respects preference but may override based on availability
```

## 📊 Admin Dashboard Queries

### Returns Overview
```javascript
// pages/api/admin/returns/stats.js
export default async function handler(req, res) {
  const stats = await prisma.$transaction([
    // Pending seller response
    prisma.returnRequest.count({
      where: { status: 'PENDING' }
    }),
    
    // Awaiting inspection
    prisma.returnRequest.count({
      where: { status: 'RECEIVED' }
    }),
    
    // Escalated cases
    prisma.returnRequest.count({
      where: { status: 'ESCALATED' }
    }),
    
    // Total refunded this month
    prisma.refund.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(new Date().setDate(1))
        }
      },
      _sum: { totalAmount: true }
    }),
  ]);

  res.json({
    pendingResponse: stats[0],
    awaitingInspection: stats[1],
    escalated: stats[2],
    totalRefunded: stats[3]._sum.totalAmount || 0,
  });
}
```

## 🔔 Notification Templates

### To Seller: New Return Request
```
Subject: [Action Required] Permintaan Return Order #ORDER_NUMBER

Hai {seller_name},

Ada permintaan return untuk order #{order_number}:
- Alasan: {reason}
- Nilai: Rp {amount}

Anda harus merespons dalam 2 hari kerja (sebelum {deadline}).

[Lihat Detail] [Setujui] [Tolak]
```

### To Buyer: Return Approved
```
Subject: Return Disetujui - Order #ORDER_NUMBER

Hai {buyer_name},

Seller telah menyetujui permintaan return Anda.

Silakan kirim barang kembali dalam 3 hari ke:
{seller_address}

Gunakan ekspedisi: {courier_list}
Foto resi akan diminta saat submit tracking.

[Kirim Tracking Info]
```

### To Buyer: Refund Completed
```
Subject: Refund Berhasil - Rp {amount}

Hai {buyer_name},

Refund Anda sebesar Rp {amount} telah diproses!

Metode: {method}
{if STORE_CREDIT:}
  Saldo toko Anda sekarang: Rp {balance}
{if ORIGINAL_PAYMENT:}
  Dana akan muncul dalam 3-7 hari kerja
  
[Lihat Detail]
```

## 🚀 Deployment Checklist

- [ ] Run Prisma migrations
- [ ] Set up cron jobs for auto-actions
- [ ] Configure payment gateway refund API
- [ ] Set up fraud detection alerts
- [ ] Train support team on escalation process
- [ ] Prepare email/SMS templates
- [ ] Create admin dashboard views
- [ ] Test full return flow in staging
- [ ] Enable monitoring/logging
- [ ] Document SOP for edge cases

## 📈 Monitoring & Metrics

**Key Metrics to Track:**
- Return rate (returns / total orders)
- Average resolution time
- Seller response rate
- Inspection pass rate
- Refund success rate
- Fraud detection accuracy

**Alerts:**
- Return rate spike (> 15% daily)
- Pending returns exceeding deadline
- Failed refunds requiring manual intervention
- High-risk return patterns

## 🎯 Best Practices

1. **Always validate eligibility** before allowing return creation
2. **Require evidence** (photos/videos) for all returns
3. **Track deadlines** and automate when possible
4. **Be transparent** with status updates
5. **Protect both parties** - fair to buyer and seller
6. **Learn from disputes** - improve product descriptions
7. **Monitor fraud patterns** - adjust detection rules

## 🔒 Security Considerations

- Validate user authorization for all actions
- Rate limit return requests (max 3 per day)
- Prevent return spam from single IP
- Verify image uploads (no malicious files)
- Sanitize user input (XSS prevention)
- Use idempotency keys for refund operations