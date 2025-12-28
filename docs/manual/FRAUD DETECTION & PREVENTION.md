# Fraud Detection & Prevention - Implementation Guide

## 🎯 System Overview

### Detection Layers
```
Layer 1: IP/Device Blacklist (Instant Block)
    ↓
Layer 2: User Risk Profile Check
    ↓
Layer 3: Behavioral Analysis (Velocity, Patterns)
    ↓
Layer 4: Transaction-specific Checks
    ↓
Decision: ALLOW / CHALLENGE / REVIEW / BLOCK
```

## 📊 Fraud Patterns Detected

### 1. **Bulk Order Fraud**
**Pattern:** Reseller membeli banyak barang untuk dijual lagi

**Detection:**
- 10+ quantity in single order
- All items from same category
- Multiple orders in short time
- Shipping to commercial address

**Risk Score:** 25-50 points

**Action:** Flag for review if new account

### 2. **Multiple Failed Payments**
**Pattern:** Card testing atau stolen card usage

**Detection:**
- 3+ failed payments in 1 hour
- Different payment methods tried
- Small test transactions followed by large one

**Risk Score:** 40-60 points

**Action:** Block after 3 failures, require verification

### 3. **Promo Code Abuse**
**Pattern:** Multiple accounts untuk claim promo

**Detection:**
- Same IP/device claiming multiple times
- New accounts created just for promo
- Velocity: 10+ attempts per hour

**Risk Score:** 30-50 points

**Action:** Block promo usage, flag account

### 4. **Fake Reviews**
**Pattern:** Kompetitor atau penjual fake review

**Detection:**
- Review without verified purchase
- 10+ reviews in 24 hours
- Contains spam keywords (http://, wa.me, telegram)
- Duplicate content

**Risk Score:** 30-50 points

**Action:** Auto-reject, flag for manual review

### 5. **Account Takeover**
**Pattern:** Account login dari location/device baru

**Detection:**
- Login from new country
- New device fingerprint
- Immediate high-value purchase
- Password recently changed

**Risk Score:** 60-80 points

**Action:** Require OTP verification

### 6. **Dropship/Reseller Patterns**
**Pattern:** Beli untuk dijual lagi (not necessarily fraud)

**Detection:**
- Shipping to ekspedisi/kurir address
- Bulk same-category orders
- No personal address history
- High order frequency

**Risk Score:** 15-25 points

**Action:** Monitor, may require verification

### 7. **Return Fraud**
**Pattern:** Beli → return → repeat (already covered in returnManager)

**Detection:**
- High return rate (>30%)
- Frequent "changed mind" returns
- Immediate returns after delivery

**Risk Score:** 25-35 points

**Action:** Flag for manual approval

### 8. **Chargeback Abuse**
**Pattern:** Buy → receive → chargeback via bank

**Detection:**
- History of chargebacks
- High-value orders from new accounts
- COD orders with fake address

**Risk Score:** 100 points (auto-block)

**Action:** Blacklist user, block IP

## 🔧 Implementation Steps

### 1. Database Migration

```bash
npx prisma migrate dev --name add_fraud_detection
npx prisma generate
```

### 2. Environment Variables

```env
# Fraud Detection
FRAUD_DETECTION_ENABLED=true
AUTO_BLOCK_ENABLED=false  # Manual review first
RISK_THRESHOLD_MEDIUM=60
RISK_THRESHOLD_HIGH=80

# Notifications
ADMIN_EMAIL_FRAUD=admin@example.com
ADMIN_WHATSAPP=+628123456789
SLACK_WEBHOOK_FRAUD=https://hooks.slack.com/...
```

### 3. Integration Points

**Checkout Flow:**
```javascript
// Before creating order
const fraudCheck = await fraudDetectionService.checkOrder({
  order: orderData,
  user,
  ipAddress,
  deviceFingerprint,
});

if (fraudCheck.decision === 'BLOCK') {
  return res.status(403).json({ error: 'Order blocked' });
}

if (fraudCheck.requiresVerification) {
  // Request additional verification
  await requestVerification(user.id, 'ID_CARD');
}
```

**Payment Flow:**
```javascript
// Before processing payment
const fraudCheck = await fraudDetectionService.checkPayment({
  payment,
  order,
  user,
  ipAddress,
});

if (fraudCheck.requiresReview) {
  // Hold payment for manual review
  await notifyAdminPaymentReview(payment, fraudCheck);
}
```

**Review Submission:**
```javascript
// Before saving review
const fraudCheck = await fraudDetectionService.checkReview({
  review,
  user,
  product,
});

if (fraudCheck.isSuspicious) {
  review.status = 'FLAGGED';
}
```

### 4. Device Fingerprinting

**Client-side (add to checkout page):**
```javascript
// pages/checkout.js
import FingerprintJS from '@fingerprintjs/fingerprintjs';

useEffect(() => {
  const setFingerprint = async () => {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    setDeviceFingerprint(result.visitorId);
  };
  setFingerprint();
}, []);
```

**Install:**
```bash
npm install @fingerprintjs/fingerprintjs
```

### 5. Middleware Integration

**Protect all authenticated routes:**
```javascript
// pages/_middleware.js (Next.js 12+) or middleware.js (Next.js 13+)
import { withFraudCheck } from '@/lib/middleware/fraudCheck';

export default withFraudCheck(async (req) => {
  // Your route handler
});
```

## 🚨 Response Actions

### Decision Matrix

| Risk Score | Decision  | Action |
|-----------|-----------|--------|
| 0-29      | ALLOW     | Proceed normally |
| 30-59     | CHALLENGE | Require OTP/verification |
| 60-79     | REVIEW    | Hold for manual review |
| 80-100    | BLOCK     | Reject immediately |

### Verification Levels

**BASIC** (Email only)
- Default for all users
- Required: Email verification

**STANDARD** (Email + Phone)
- Triggered: Risk score 30-50
- Required: Email + Phone OTP

**ENHANCED** (Email + Phone + ID)
- Triggered: Risk score 50-70
- Required: Email + Phone + ID Card photo

**PREMIUM** (Full KYC)
- Triggered: Risk score 70+
- Required: Email + Phone + ID + Selfie + Address proof

### Automated Actions

```javascript
// lib/jobs/fraudMonitoring.js
export async function autoBlockHighRisk() {
  // Find users with critical risk
  const criticalUsers = await prisma.userRiskProfile.findMany({
    where: {
      riskScore: { gte: 90 },
      isBlacklisted: false,
    },
  });

  for (const profile of criticalUsers) {
    await fraudDetectionService.blockUser(
      profile.userId,
      'Auto-blocked: Risk score 90+'
    );
    
    // Notify admin
    await notifyAdmin(`User ${profile.userId} auto-blocked`);
  }
}

// Run hourly
cron.schedule('0 * * * *', autoBlockHighRisk);
```

## 📧 Notification System

### Email Templates

**To User - Verification Required:**
```
Subject: Verifikasi Akun Diperlukan

Hai {user_name},

Untuk keamanan akun Anda, kami memerlukan verifikasi tambahan:
- Upload foto KTP
- Selfie dengan KTP
- Nomor HP yang dapat dihubungi

[Verifikasi Sekarang]

Jika tidak diverifikasi dalam 24 jam, order Anda akan dibatalkan.
```

**To Admin - Order Flagged:**
```
Subject: [FRAUD ALERT] Order #ORDER_ID Flagged

Order Details:
- Order ID: #ORDER_ID
- Customer: {user_name} ({email})
- Amount: Rp {amount}
- Risk Score: {risk_score}/100

Flags:
- Multiple failed payments
- New account
- High-value first order

[Review Order] [Block User] [Approve]
```

### WhatsApp Integration

```javascript
// lib/notifications/whatsapp.js
import axios from 'axios';

export async function sendWhatsAppAlert(message) {
  const WHATSAPP_API = process.env.WHATSAPP_API_URL;
  const ADMIN_NUMBER = process.env.ADMIN_WHATSAPP;

  await axios.post(WHATSAPP_API, {
    to: ADMIN_NUMBER,
    message: `🚨 FRAUD ALERT

${message}

Check dashboard: ${process.env.NEXT_PUBLIC_URL}/admin/fraud`,
  });
}
```

## 📊 Admin Dashboard Features

### Real-time Monitoring
- Pending fraud events (requires action)
- Flagged orders (high risk score)
- High-risk users (score >70)
- Daily blocked attempts

### Analytics
- Fraud patterns by type
- Risk score distribution
- False positive rate
- Most triggered rules

### Actions
- Approve/reject flagged orders
- Block/unblock users
- Add IP to blacklist
- Adjust fraud rules
- Export reports

## 🔒 Security Best Practices

### 1. Rate Limiting
```javascript
// lib/middleware/rateLimit.js
import rateLimit from 'express-rate-limit';

export const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 orders per hour
  message: 'Too many orders from this IP',
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3, // 3 payment attempts per hour
  message: 'Too many payment attempts',
});
```

### 2. Webhook Signature Verification
```javascript
// Always verify payment webhooks
if (!verifyWebhookSignature(req.body, signature)) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### 3. Sensitive Data Protection
- Hash device fingerprints
- Encrypt ID card photos
- Mask credit card numbers
- Log access to user data

### 4. GDPR Compliance
- Allow users to request data deletion
- Anonymize fraud logs after 90 days
- Don't store unnecessary personal data

## 🧪 Testing Fraud Detection

### Test Cases

```javascript
// tests/fraud-detection.test.js
describe('Fraud Detection', () => {
  it('should block order with risk score > 80', async () => {
    const result = await fraudDetectionService.checkOrder({
      order: {
        totalAmount: 10000000, // 10M first order
        orderItems: [{ quantity: 50 }], // Bulk
      },
      user: {
        id: 'new-user',
        emailVerified: false,
        createdAt: new Date(), // Brand new
      },
      ipAddress: '1.2.3.4',
      deviceFingerprint: 'unknown',
    });

    expect(result.decision).toBe('BLOCK');
    expect(result.riskScore).toBeGreaterThan(80);
  });

  it('should detect promo abuse', async () => {
    // Simulate 5 attempts from same IP
    for (let i = 0; i < 5; i++) {
      await fraudDetectionService.checkPromoCodeUsage({
        promoCode: testPromo,
        user: users[i],
        ipAddress: '1.2.3.4', // Same IP
        deviceFingerprint: 'abc123', // Same device
      });
    }

    const result = await fraudDetectionService.checkPromoCodeUsage({
      promoCode: testPromo,
      user: users[5],
      ipAddress: '1.2.3.4',
      deviceFingerprint: 'abc123',
    });

    expect(result.allowed).toBe(false);
    expect(result.isSuspicious).toBe(true);
  });
});
```

## 📈 Monitoring & Optimization

### Key Metrics

**Effectiveness:**
- True positive rate (actual fraud caught)
- False positive rate (good users blocked)
- Response time (manual review speed)
- Recovery rate (chargebacks prevented)

**Business Impact:**
- Fraud losses prevented (Rp)
- Legitimate sales approved
- Customer satisfaction (friction)

### Tuning Risk Thresholds

```javascript
// Start conservative, tune based on data
RISK_THRESHOLDS = {
  LOW: 30,    // Challenge (OTP)
  MEDIUM: 60, // Manual review
  HIGH: 80,   // Auto-block
};

// After 30 days, analyze:
// - How many false positives at each level?
// - How much actual fraud was caught?
// - Adjust thresholds accordingly
```

### Rule Performance Tracking

```sql
-- Find rules with high false positive rate
SELECT 
  r.name,
  r.triggered_count,
  r.true_positives,
  r.false_positives,
  (r.false_positives::float / r.triggered_count * 100) as false_positive_rate
FROM "FraudRule" r
WHERE r.is_active = true
ORDER BY false_positive_rate DESC;
```

## 🚀 Advanced Features (Phase 2)

### Machine Learning Integration
- Train model on historical fraud data
- Real-time scoring via API
- Continuous learning from outcomes

### Graph Analysis
- Detect fraud rings (connected accounts)
- Device/IP sharing networks
- Address clustering

### Behavioral Biometrics
- Mouse movement patterns
- Typing speed
- Session duration

### External Services
- Email validation API
- Phone number verification
- Address verification
- Credit scoring

## 🎯 Success Metrics

After 90 days, measure:
- ✅ Fraud rate < 0.5% of orders
- ✅ False positive rate < 5%
- ✅ 95% of fraud caught before payout
- ✅ Average review time < 4 hours
- ✅ Customer complaint rate < 1%

## 📚 Resources

**Fraud Patterns:**
- Shopee Seller Center - Fraud Prevention Guide
- Tokopedia - Keamanan Transaksi
- Payment Gateway Docs - Fraud Detection

**Tools:**
- FingerprintJS - Device identification
- MaxMind - IP geolocation
- Sift Science - Fraud scoring (paid)