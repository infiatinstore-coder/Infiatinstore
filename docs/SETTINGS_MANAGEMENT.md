# Settings Management System

## Overview
Sistem pengaturan website yang dinamis dan dapat dikelola oleh admin melalui dashboard tanpa perlu mengubah code.

## Features
✅ **Database-driven settings** - Semua informasi kontak, alamat, dan media sosial disimpan di database  
✅ **Admin dashboard** - Interface yang user-friendly untuk mengubah settings  
✅ **Dynamic updates** - Perubahan langsung diterapkan ke seluruh website  
✅ **Public API** - Settings dapat diakses oleh frontend components  
✅ **Secure** - Hanya admin yang bisa mengubah settings  

## Settings Available

### Contact Information
- `contact_whatsapp` - Nomor WhatsApp customer service
- `contact_email` - Email utama support
- `contact_email_privacy` - Email untuk pertanyaan privasi
- `contact_email_refund` - Email untuk refund/pengembalian

### Store Information
- `store_address` - Alamat lengkap toko
- `store_address_short` - Alamat singkat
- `store_name` - Nama toko
- `store_tagline` - Tagline toko
- `store_description` - Deskripsi singkat toko

### Operating Hours
- `operating_hours` - Jam operasional toko

### Social Media
- `social_instagram` - Link Instagram
- `social_facebook` - Link Facebook
- `social_twitter` - Link Twitter/X

### Policies
- `free_shipping_min` - Minimum pembelian gratis ongkir (Rupiah)
- `return_period_days` - Periode pengembalian barang (hari)

## How to Use

### For Admin

1. **Access Settings Page**
   - Login ke admin dashboard
   - Klik menu "Pengaturan" di sidebar
   - URL: `/admin/settings`

2. **Edit Settings**
   - Ubah value yang diinginkan
   - Klik "Simpan Perubahan"
   - Settings langsung ter-update di seluruh website

### For Developers

#### 1. Public API (Frontend)
```javascript
// Fetch all public settings
const response = await fetch('/api/settings');
const settings = await response.json();

// Access specific setting
const whatsapp = settings.contact_whatsapp;
const email = settings.contact_email;
```

#### 2. Admin API
```javascript
// GET all settings (admin only)
const response = await fetch('/api/admin/settings');
const { settings } = await response.json();

// UPDATE settings (admin only)
const response = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        settings: [
            { id: 'xxx', value: 'new value' },
            // ... more settings
        ]
    })
});
```

#### 3. Use in Components
```javascript
'use client';
import { useState, useEffect } from 'react';

export default function MyComponent() {
    const [settings, setSettings] = useState({});
    
    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => setSettings(data));
    }, []);
    
    return (
        <div>
            <p>WhatsApp: {settings.contact_whatsapp}</p>
            <p>Email: {settings.contact_email}</p>
        </div>
    );
}
```

## Database Schema

```prisma
model settings {
  id          String   @id
  key         String   @unique
  value       String
  description String?
  is_public   Boolean  @default(false)
  updated_at  DateTime
}
```

## Files Updated

### New Files Created:
1. `app/api/settings/route.js` - Public API endpoint
2. `app/api/admin/settings/route.js` - Admin API endpoint
3. `app/admin/settings/page.js` - Admin settings page
4. `scripts/seed-settings.js` - Seed script for default settings
5. `components/admin/index.js` - Admin components export

### Files Modified:
1. `components/layout/Footer.js` - Now uses dynamic settings
2. `app/admin/layout.js` - Settings link already exists in sidebar

### Files to Update (Next Steps):
These files still have hardcoded contact info that should use settings:
- `app/contact/page.js`
- `app/about/page.js`
- `app/privacy/page.js`
- `app/terms/page.js`
- `app/refund-policy/page.js`

## How to Add New Setting

1. **Add to seed script** (`scripts/seed-settings.js`)
```javascript
{
    key: 'my_new_setting',
    value: 'default value',
    description: 'Description of this setting',
    is_public: true,
}
```

2. **Run seed**
```bash
node scripts/seed-settings.js
```

3. **Use in component**
```javascript
{settings.my_new_setting}
```

## Migration from Hardcoded to Settings

### Before:
```javascript
<p>WhatsApp: 0851-1945-7138</p>
```

### After:
```javascript
const [settings, setSettings] = useState({});

useEffect(() => {
    fetch('/api/settings')
        .then(res => res.json())
        .then(data => setSettings(data));
}, []);

<p>WhatsApp: {settings.contact_whatsapp || '0851-1945-7138'}</p>
```

## Security

- ✅ Public settings API only returns `is_public: true` settings
- ✅ Admin API requires authentication (ADMIN or SUPER_ADMIN role)
- ✅ All sensitive data is protected
- ✅ Settings updates are logged with `updated_at` timestamp

## Performance

- Settings are cached by frontend components
- Settings API responses are small (~2KB)
- No database query needed for each component render
- Can be further optimized with Redis/CDN if needed

## Troubleshooting

**Settings not showing?**
- Check if settings are seeded: `node scripts/seed-settings.js`
- Check API response: Open `/api/settings` in browser
- Check console for errors

**Can't update settings?**
- Verify you're logged in as ADMIN/SUPER_ADMIN
- Check Network tab for API errors
- Verify database connection

**WhatsApp link not working?**
- Format is auto-converted: `0851-1945-7138` → `https://wa.me/6285119457138`
- Ensure no special characters except dash (-)

## Next Steps

1. ✅ Settings system implemented
2. ✅ Footer updated to use settings
3. ⬜ Update Contact page
4. ⬜ Update About page
5. ⬜ Update Privacy page
6. ⬜ Update Terms page
7. ⬜ Update Refund Policy page

---
**Created:** 2025-12-28  
**Last Updated:** 2025-12-28
