# Tax & Invoice Generation - Implementation Guide

## 📋 Overview

Sistem ini menyediakan:
- ✅ Tax calculation (PPN 11%) dengan support tax-exempt products
- ✅ Invoice generation dalam format PDF (comply dengan Indonesia)
- ✅ Invoice numbering system otomatis
- ✅ Email delivery otomatis
- ✅ Invoice storage (database + cloud)
- ✅ Monthly tax reporting
- ✅ Invoice correction/cancellation

---

## 🎯 Prerequisites

### Dependencies to Install

```bash
npm install @react-pdf/renderer nodemailer
npm install cloudinary # atau AWS SDK untuk S3
```

### Environment Variables

Create `.env.local`:

```env
# Company Info (for invoices)
COMPANY_NAME="Your Company Name"
COMPANY_NPWP="00.000.000.0-000.000"
COMPANY_ADDRESS="Jl. Example No. 123, Jakarta 12345"
COMPANY_PHONE="021-12345678"
COMPANY_EMAIL="info@example.com"

# Email Configuration
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"

# Cloud Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Or AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="ap-southeast-1"
AWS_BUCKET_NAME="your-bucket"
```

---

## 🗂️ File Structure

```
project/
├── prisma/
│   └── schema.prisma                    # Updated with tax & invoice models
├── lib/
│   ├── services/
│   │   ├── taxCalculator.js            # Tax calculation logic
│   │   ├── invoiceGenerator.js         # PDF generation
│   │   └── orderService.js             # Order processing
│   ├── email/
│   │   ├── templates.js                # Email HTML templates
│   │   └── sender.js                   # Email sending logic
│   └── cloudinary.js                   # Cloud storage helper
├── app/
│   └── api/
│       ├── invoices/
│       │   ├── generate/route.js       # Generate invoice
│       │   └── [id]/
│       │       ├── download/route.js   # Download PDF
│       │       ├── email/route.js      # Email invoice
│       │       ├── cancel/route.js     # Cancel invoice
│       │       └── replace/route.js    # Create replacement
│       └── tax/
│           └── report/route.js         # Monthly tax report
```

---

## 🚀 Implementation Steps

### Step 1: Database Schema

1. Update `schema.prisma` with provided models
2. Add `taxExempt` field to Product model
3. Add `npwp` field to User model
4. Add tax fields to Order model
5. Create Invoice model
6. Run migration:

```bash
npx prisma migrate dev --name add_tax_and_invoice
```

### Step 2: Tax Calculator

1. Copy `taxCalculator.js` to `lib/services/`
2. Configure `TAX_EXEMPT_CATEGORIES` based on your needs
3. Update Product model to include tax info

**Usage Example:**

```javascript
import taxCalculator from '@/lib/services/taxCalculator';

const items = [
  {
    product: { id: '1', name: 'Laptop', category: 'electronics', taxExempt: false },
    quantity: 1,
    price: 10000000
  }
];

const taxCalc = taxCalculator.calculateOrderTax(items);
// Returns: { subtotal, taxableAmount, totalTax, itemBreakdown }
```

### Step 3: Invoice Generator

1. Install React-PDF: `npm install @react-pdf/renderer`
2. Copy `invoiceGenerator.js` to `lib/services/`
3. Customize invoice template styling if needed

**PDF Generation:**

```javascript
import { renderToStream } from '@react-pdf/renderer';
import invoiceGenerator from '@/lib/services/invoiceGenerator';

const invoiceData = invoiceGenerator.prepareInvoiceData(order, seller, sequenceNumber);
const InvoiceDoc = invoiceGenerator.createInvoiceDocument(invoiceData);
const stream = await renderToStream(InvoiceDoc);
```

### Step 4: Cloud Storage Setup

Choose one: **Cloudinary (Recommended)** or AWS S3

**Cloudinary Setup (`lib/cloudinary.js`):**

```javascript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        public_id: filename,
        folder: 'invoices'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    
    uploadStream.end(buffer);
  });
}
```

### Step 5: Email Configuration

1. Setup email service (Gmail, SendGrid, etc.)
2. For Gmail: Enable "App Passwords" in Google Account settings
3. Copy email templates and sender to `lib/email/`

### Step 6: API Routes

1. Create API routes for invoice management
2. Integrate with order confirmation flow
3. Add webhook for payment confirmation

### Step 7: Order Flow Integration

Update your checkout process:

```javascript
// 1. Create order with tax calculation
const orderResult = await processOrder(checkoutData);

// 2. After payment confirmed
const result = await confirmPayment(orderId, paymentDetails);
// This automatically generates invoice and sends email
```

---

## 🧪 Testing Checklist

### Tax Calculation
- [ ] Test regular taxable products (PPN 11% applied)
- [ ] Test tax-exempt products (no PPN)
- [ ] Test mixed cart (taxable + exempt)
- [ ] Verify tax breakdown in order

### Invoice Generation
- [ ] Generate invoice for test order
- [ ] Verify PDF format and content
- [ ] Check invoice numbering sequence
- [ ] Test invoice upload to cloud storage
- [ ] Verify invoice URL is accessible

### Email Delivery
- [ ] Test order confirmation email
- [ ] Test invoice-only email
- [ ] Verify PDF attachment works
- [ ] Check email formatting on mobile

### Invoice Management
- [ ] Test invoice download
- [ ] Test invoice cancellation
- [ ] Test replacement invoice generation
- [ ] Verify status tracking

### Tax Reporting
- [ ] Generate monthly tax report
- [ ] Verify aggregated totals
- [ ] Test report for different date ranges

---

## 📊 Usage Examples

### 1. Create Order with Tax

```javascript
const checkoutData = {
  userId: 'user123',
  items: [
    { productId: 'prod1', quantity: 2 },
    { productId: 'prod2', quantity: 1 }
  ],
  shippingAddress: {
    fullAddress: 'Jl. Example No. 123',
    city: 'Jakarta',
    province: 'DKI Jakarta',
    postalCode: '12345'
  },
  shippingCost: 15000,
  paymentMethod: 'bank_transfer'
};

const result = await processOrder(checkoutData);
```

### 2. Generate Invoice After Payment

```javascript
// Webhook from payment gateway
const paymentDetails = {
  transactionId: 'TXN123456',
  method: 'bank_transfer',
  paidAmount: 1000000,
  paidAt: new Date()
};

const result = await confirmPayment(orderId, paymentDetails);
// Invoice automatically generated and emailed
```

### 3. Download Invoice

```javascript
// GET /api/invoices/{invoiceId}/download
// Returns PDF file or redirect to cloud URL
```

### 4. Monthly Tax Report

```javascript
// GET /api/tax/report?year=2024&month=12
const report = await fetch('/api/tax/report?year=2024&month=12');
// Returns aggregated tax data for the month
```

---

## 🔒 Compliance Notes

### Indonesian Tax Requirements

1. **NPWP Tracking**
   - Store seller NPWP in environment variables
   - Optionally collect buyer NPWP for business customers
   - Display NPWP on invoices

2. **Invoice Format**
   - Must include: Nomor Faktur, Tanggal, NPWP, DPP, PPN
   - Use official format: "FAKTUR PAJAK"
   - Include "Terbilang" (amount in words)

3. **Record Retention**
   - Keep invoices for minimum 10 years
   - Store both database records and PDF files
   - Implement soft delete (never hard delete invoices)

4. **Monthly Reporting**
   - Generate SPT Masa PPN report monthly
   - Track total DPP and PPN collected
   - Aggregate by month for easy reporting

### Invoice Corrections

When correction needed:
1. Mark original invoice as "REPLACED"
2. Generate new invoice with note "Pengganti"
3. Reference original invoice number
4. Keep both invoices in system

---

## 🎨 Customization Tips

### Invoice Template

Customize styling in `invoiceGenerator.js`:

```javascript
const styles = StyleSheet.create({
  // Modify colors, fonts, spacing
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#your-brand-color'
  }
});
```

### Tax Categories

Add more tax-exempt categories:

```javascript
this.TAX_EXEMPT_CATEGORIES = [
  'basic-food',
  'education',
  'health',
  'books',
  'your-custom-category' // Add here
];
```

### Email Templates

Customize email design in `templates.js`:
- Change colors to match brand
- Add logo/images
- Modify layout
- Add social media links

---

## 🐛 Troubleshooting

### Issue: Invoice PDF not generating
**Solution:** Check React-PDF version compatibility, ensure all fonts are available

### Issue: Email not sending
**Solution:** Verify email credentials, check firewall/port access, test with simple email first

### Issue: Invoice sequence duplicate
**Solution:** Use database transaction for sequence increment, add unique constraint

### Issue: Tax calculation incorrect
**Solution:** Verify product taxExempt flag, check tax rate (should be 0.11 for 11%)

### Issue: PDF upload fails
**Solution:** Check cloud storage credentials, verify buffer conversion, test upload separately

---

## 📈 Performance Optimization

1. **Async Processing**
   - Generate invoice in background job
   - Use queue (Bull, BullMQ) for high volume

2. **Caching**
   - Cache seller info (rarely changes)
   - Cache tax calculation results temporarily

3. **PDF Generation**
   - Generate once, store permanently
   - Don't regenerate unless replacement needed

4. **Database Indexes**
   - Add index on invoiceNumber for fast lookup
   - Index on issuedAt for reporting

---

## ✅ Go-Live Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Email service tested and working
- [ ] Cloud storage configured and accessible
- [ ] Test orders created and invoices generated
- [ ] Email templates reviewed and approved
- [ ] Tax calculation verified with accountant
- [ ] Invoice format approved by finance team
- [ ] Monthly reporting tested
- [ ] Error handling and logging in place
- [ ] Monitoring and alerts configured
- [ ] Documentation updated for team

---

## 🤝 Support

For questions or issues:
1. Check troubleshooting section above
2. Review code comments in each file
3. Test with sample data first
4. Consult with accountant for tax compliance questions

**Key Files to Reference:**
- `taxCalculator.js` - Tax calculation logic
- `invoiceGenerator.js` - PDF generation
- `orderService.js` - Complete flow example
- API routes - Endpoint implementations