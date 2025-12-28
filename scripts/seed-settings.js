const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultSettings = [
    // Contact Information
    {
        key: 'contact_whatsapp',
        value: '0851-1945-7138',
        description: 'Nomor WhatsApp untuk customer service',
        is_public: true,
    },
    {
        key: 'contact_email',
        value: 'support@infiatin.store',
        description: 'Email utama untuk customer support',
        is_public: true,
    },
    {
        key: 'contact_email_privacy',
        value: 'privacy@infiatin.store',
        description: 'Email untuk pertanyaan privasi',
        is_public: true,
    },
    {
        key: 'contact_email_refund',
        value: 'refund@infiatin.store',
        description: 'Email untuk refund/pengembalian',
        is_public: true,
    },

    // Address
    {
        key: 'store_address',
        value: 'GQ7C+793, Cikomprang, Desa Tegalsari, Sidareja, Cilacap, Jawa Tengah 53261',
        description: 'Alamat lengkap toko',
        is_public: true,
    },
    {
        key: 'store_address_short',
        value: 'Sidareja, Cilacap, Jawa Tengah',
        description: 'Alamat singkat toko',
        is_public: true,
    },

    // Operating Hours
    {
        key: 'operating_hours',
        value: 'Buka Setiap Hari: 06.30 – 21.00 WIB',
        description: 'Jam operasional toko',
        is_public: true,
    },

    // Social Media
    {
        key: 'social_instagram',
        value: 'https://instagram.com/infiatinstore',
        description: 'Link Instagram',
        is_public: true,
    },
    {
        key: 'social_facebook',
        value: 'https://facebook.com/infiatinstore',
        description: 'Link Facebook',
        is_public: true,
    },
    {
        key: 'social_twitter',
        value: 'https://twitter.com/infiatinstore',
        description: 'Link Twitter/X',
        is_public: true,
    },

    // Store Info
    {
        key: 'store_name',
        value: 'Infiatin Store',
        description: 'Nama toko',
        is_public: true,
    },
    {
        key: 'store_tagline',
        value: 'Dekat & Bersahabat',
        description: 'Tagline toko',
        is_public: true,
    },
    {
        key: 'store_description',
        value: 'Pusat Kurma & Oleh-Oleh Haji terlengkap di Sidareja. Menyediakan produk berkualitas dengan harga terbaik untuk kebutuhan Ramadhan Anda.',
        description: 'Deskripsi singkat toko',
        is_public: true,
    },

    // Shipping & Policies
    {
        key: 'free_shipping_min',
        value: '200000',
        description: 'Minimum pembelian untuk gratis ongkir (dalam Rupiah)',
        is_public: true,
    },
    {
        key: 'return_period_days',
        value: '7',
        description: 'Periode pengembalian barang (dalam hari)',
        is_public: true,
    },
];

async function main() {
    console.log('Seeding settings...');

    for (const setting of defaultSettings) {
        const existing = await prisma.settings.findUnique({
            where: { key: setting.key }
        });

        if (!existing) {
            await prisma.settings.create({
                data: {
                    id: require('crypto').randomUUID(),
                    ...setting,
                    updated_at: new Date(),
                }
            });
            console.log(`✅ Created setting: ${setting.key}`);
        } else {
            console.log(`⏭️  Setting already exists: ${setting.key}`);
        }
    }

    console.log('✅ Settings seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
