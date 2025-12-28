import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Mulai seeding database oleh-oleh Haji & Umroh...');

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@infiatin.store' },
        update: {},
        create: {
            email: 'admin@infiatin.store',
            passwordHash: adminPassword,
            name: 'Admin Infiatin Store',
            phone: '081234567890',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            emailVerifiedAt: new Date(),
        },
    });
    console.log('✅ Admin user created:', admin.email);

    // Create Demo Customer
    const customerPassword = await bcrypt.hash('password123', 10);
    const customer = await prisma.user.upsert({
        where: { email: 'demo@infiatin.store' },
        update: {},
        create: {
            email: 'demo@infiatin.store',
            passwordHash: customerPassword,
            name: 'Demo Customer',
            phone: '081987654321',
            role: 'CUSTOMER',
            status: 'ACTIVE',
            emailVerifiedAt: new Date(),
        },
    });
    console.log('✅ Demo customer created:', customer.email);

    // 1. Create Categories
    const categoriesData = [
        {
            name: 'Kurma & Buah Kering',
            slug: 'kurma-buah-kering',
            description: 'Aneka kurma pilihan (Ajwa, Sukari, Tunisia) dan kismis.',
            imageUrl: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=400'
        },
        {
            name: 'Air Zamzam & Minuman',
            slug: 'air-zamzam',
            description: 'Air Zamzam asli dan minuman kesehatan timur tengah.',
            imageUrl: 'https://images.unsplash.com/photo-1544256743-34e2621434c4?auto=format&fit=crop&q=80&w=400'
        },
        {
            name: 'Kacang & Camilan',
            slug: 'kacang-camilan',
            description: 'Kacang Arab, Pistachio, Almond, dan Cokelat Arab.',
            imageUrl: 'https://images.unsplash.com/photo-1563503287-ba8ae85906ef?auto=format&fit=crop&q=80&w=400'
        },
        {
            name: 'Perlengkapan Ibadah',
            slug: 'perlengkapan-ibadah',
            description: 'Sajadah, tasbih, peci, dan perlengkapan haji.',
            imageUrl: 'https://images.unsplash.com/photo-1564639088613-286820c7841c?auto=format&fit=crop&q=80&w=400'
        },
        {
            name: 'Parfum & Wewangian',
            slug: 'parfum-wewangian',
            description: 'Minyak wangi non-alkohol, bukhor, dan gaharu.',
            imageUrl: 'https://images.unsplash.com/photo-1595126839352-09f0df887e07?auto=format&fit=crop&q=80&w=400'
        },
        {
            name: 'Paket Oleh-Oleh',
            slug: 'paket-oleh-oleh',
            description: 'Paket hemat oleh-oleh haji siap bagikan.',
            imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=400'
        }
    ];

    const categoryMap = {}; // name -> id

    for (const cat of categoriesData) {
        const created = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {
                name: cat.name,
                description: cat.description,
                imageUrl: cat.imageUrl
            },
            create: cat,
        });
        categoryMap[cat.slug] = created.id;
    }
    console.log('✅ Categories created (Hajj theme)');

    // 2. Create Products
    const productsData = [
        {
            name: 'Kurma Ajwa Al-Madinah Premium - 1kg',
            slug: 'kurma-ajwa-madinah-premium-1kg',
            description: 'Kurma Ajwa asli Madinah kualitas premium. Berwarna hitam pekat, tekstur lembut, rasa tidak terlalu manis.',
            categoryId: categoryMap['kurma-buah-kering'],
            basePrice: 250000,
            salePrice: 199000,
            stock: 50,
            weight: 1000,
            images: ['https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=800'],
            isFeatured: true,
        },
        {
            name: 'Kurma Sukari Al-Qassim (Ember) - 1kg',
            slug: 'kurma-sukari-alqassim-1kg',
            description: 'Kurma Sukari kualitas terbaik, tekstur sangat lembut (basah/ruthob), rasa manis legit.',
            categoryId: categoryMap['kurma-buah-kering'],
            basePrice: 85000,
            salePrice: 65000,
            stock: 200,
            weight: 1000,
            images: ['https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?auto=format&fit=crop&q=80&w=800'],
            isFeatured: true,
        },
        {
            name: 'Air Zamzam Asli 5 Liter (Galon)',
            slug: 'air-zamzam-asli-5-liter',
            description: 'Air Zamzam murni 100% asli dari Makkah. Dikemas dalam galon 5 liter bersegel.',
            categoryId: categoryMap['air-zamzam'],
            basePrice: 550000,
            stock: 20,
            weight: 5000,
            images: ['https://images.unsplash.com/photo-1544256743-34e2621434c4?auto=format&fit=crop&q=80&w=800'],
            isFeatured: true,
        },
        {
            name: 'Kacang Pistachio USA - 500g',
            slug: 'kacang-pistachio-usa-500g',
            description: 'Kacang Pistachio kualitas USA, gurih, renyah, dan sudah terbuka cangkangnya.',
            categoryId: categoryMap['kacang-camilan'],
            basePrice: 135000,
            salePrice: 120000,
            stock: 45,
            weight: 500,
            images: ['https://images.unsplash.com/photo-1596280459562-b9e7c270725a?auto=format&fit=crop&q=80&w=800'],
            isFeatured: false,
        },
        {
            name: 'Sajadah Turki Motif Raudhah',
            slug: 'sajadah-turki-motif-raudhah',
            description: 'Sajadah import Turki bahan bludru tebal dan halus. Motif terinspirasi dari karpet Masjid Nabawi.',
            categoryId: categoryMap['perlengkapan-ibadah'],
            basePrice: 150000,
            salePrice: 125000,
            stock: 30,
            weight: 800,
            images: ['https://images.unsplash.com/photo-1564639088613-286820c7841c?auto=format&fit=crop&q=80&w=800'],
            isFeatured: true,
        },
        {
            name: 'Paket Oleh-Oleh Haji Hemat A',
            slug: 'paket-oleh-oleh-haji-hemat-a',
            description: 'Praktis! Paket sudah dikemas cantik. Isi: Air Zamzam botol kecil, Kurma, Kismis, Kacang Arab, Cokelat, dan Tasbih.',
            categoryId: categoryMap['paket-oleh-oleh'],
            basePrice: 25000,
            stock: 500,
            weight: 250,
            images: ['https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=800'],
            isFeatured: true,
        }
    ];

    for (const prod of productsData) {
        if (!prod.categoryId) continue;
        await prisma.product.upsert({
            where: { slug: prod.slug },
            update: {
                name: prod.name,
                description: prod.description,
                basePrice: prod.basePrice,
                salePrice: prod.salePrice,
                images: prod.images,
                categoryId: prod.categoryId
            },
            create: prod,
        });
    }
    console.log('✅ Products created (Hajj theme)');

    // Create Voucher
    await prisma.voucher.upsert({
        where: { code: 'HAJIMABRUR' },
        update: {},
        create: {
            code: 'HAJIMABRUR',
            type: 'PERCENTAGE',
            value: 10,
            minPurchase: 200000,
            maxDiscount: 50000,
            usageLimit: 1000,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
    });
    console.log('✅ Voucher HAJIMABRUR created');

    console.log('🎉 Seeding selesai! Database kini bernuansa Haji & Umroh.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
