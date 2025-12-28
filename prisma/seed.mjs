import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function uuid() {
    return crypto.randomUUID();
}

async function main() {
    console.log('🌱 Mulai seeding database oleh-oleh Haji & Umroh...');

    // ===================================================================
    // USERS SEED DATA
    // ===================================================================

    // 1. Super Admin Account
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.users.upsert({
        where: { email: 'admin@infiatin.store' },
        update: {},
        create: {
            id: uuid(),
            email: 'admin@infiatin.store',
            password_hash: adminPassword,
            name: 'Administrator',
            phone: '081234567890',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            email_verified_at: new Date(),
            updated_at: new Date(),
        },
    });
    console.log('✅ Super Admin created:', admin.email, '(Password: admin123)');

    // 2. Regular Customer Account (untuk testing)
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customer = await prisma.users.upsert({
        where: { email: 'customer@infiatin.store' },
        update: {},
        create: {
            id: uuid(),
            email: 'customer@infiatin.store',
            password_hash: customerPassword,
            name: 'Ahmad Wijaya',
            phone: '081987654321',
            role: 'CUSTOMER',
            status: 'ACTIVE',
            email_verified_at: new Date(),
            updated_at: new Date(),
        },
    });
    console.log('✅ Test Customer created:', customer.email, '(Password: customer123)');

    // 1. Create Categories
    const categoriesData = [
        {
            id: uuid(),
            name: 'Kurma & Buah Kering',
            slug: 'kurma-buah-kering',
            description: 'Aneka kurma pilihan (Ajwa, Sukari, Tunisia) dan kismis.',
            image_url: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=400'
        },
        {
            id: uuid(),
            name: 'Air Zamzam & Minuman',
            slug: 'air-zamzam',
            description: 'Air Zamzam asli dan minuman kesehatan timur tengah.',
            image_url: 'https://images.unsplash.com/photo-1544256743-34e2621434c4?auto=format&fit=crop&q=80&w=400'
        },
        {
            id: uuid(),
            name: 'Kacang & Camilan',
            slug: 'kacang-camilan',
            description: 'Kacang Arab, Pistachio, Almond, dan Cokelat Arab.',
            image_url: 'https://images.unsplash.com/photo-1563503287-ba8ae85906ef?auto=format&fit=crop&q=80&w=400'
        },
        {
            id: uuid(),
            name: 'Perlengkapan Ibadah',
            slug: 'perlengkapan-ibadah',
            description: 'Sajadah, tasbih, peci, dan perlengkapan haji.',
            image_url: 'https://images.unsplash.com/photo-1564639088613-286820c7841c?auto=format&fit=crop&q=80&w=400'
        },
        {
            id: uuid(),
            name: 'Parfum & Wewangian',
            slug: 'parfum-wewangian',
            description: 'Minyak wangi non-alkohol, bukhor, dan gaharu.',
            image_url: 'https://images.unsplash.com/photo-1595126839352-09f0df887e07?auto=format&fit=crop&q=80&w=400'
        },
        {
            id: uuid(),
            name: 'Paket Oleh-Oleh',
            slug: 'paket-oleh-oleh',
            description: 'Paket hemat oleh-oleh haji siap bagikan.',
            image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=400'
        }
    ];

    const categoryMap = {}; // slug -> id

    for (const cat of categoriesData) {
        const created = await prisma.categories.upsert({
            where: { slug: cat.slug },
            update: {
                name: cat.name,
                description: cat.description,
                image_url: cat.image_url
            },
            create: cat,
        });
        categoryMap[cat.slug] = created.id;
    }
    console.log('✅ Categories created (Hajj theme)');

    // 2. Create Products
    const productsData = [
        {
            id: uuid(),
            name: 'Kurma Ajwa Al-Madinah Premium - 1kg',
            slug: 'kurma-ajwa-madinah-premium-1kg',
            description: 'Kurma Ajwa asli Madinah kualitas premium. Berwarna hitam pekat, tekstur lembut, rasa tidak terlalu manis.',
            category_id: categoryMap['kurma-buah-kering'],
            base_price: 250000,
            sale_price: 199000,
            stock: 50,
            weight: 1000,
            images: JSON.stringify(['https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=800']),
            is_featured: true,
            updated_at: new Date(),
        },
        {
            id: uuid(),
            name: 'Kurma Sukari Al-Qassim (Ember) - 1kg',
            slug: 'kurma-sukari-alqassim-1kg',
            description: 'Kurma Sukari kualitas terbaik, tekstur sangat lembut (basah/ruthob), rasa manis legit.',
            category_id: categoryMap['kurma-buah-kering'],
            base_price: 85000,
            sale_price: 65000,
            stock: 200,
            weight: 1000,
            images: JSON.stringify(['https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?auto=format&fit=crop&q=80&w=800']),
            is_featured: true,
            updated_at: new Date(),
        },
        {
            id: uuid(),
            name: 'Air Zamzam Asli 5 Liter (Galon)',
            slug: 'air-zamzam-asli-5-liter',
            description: 'Air Zamzam murni 100% asli dari Makkah. Dikemas dalam galon 5 liter bersegel.',
            category_id: categoryMap['air-zamzam'],
            base_price: 550000,
            stock: 20,
            weight: 5000,
            images: JSON.stringify(['https://images.unsplash.com/photo-1544256743-34e2621434c4?auto=format&fit=crop&q=80&w=800']),
            is_featured: true,
            updated_at: new Date(),
        },
        {
            id: uuid(),
            name: 'Kacang Pistachio USA - 500g',
            slug: 'kacang-pistachio-usa-500g',
            description: 'Kacang Pistachio kualitas USA, gurih, renyah, dan sudah terbuka cangkangnya.',
            category_id: categoryMap['kacang-camilan'],
            base_price: 135000,
            sale_price: 120000,
            stock: 45,
            weight: 500,
            images: JSON.stringify(['https://images.unsplash.com/photo-1596280459562-b9e7c270725a?auto=format&fit=crop&q=80&w=800']),
            is_featured: false,
            updated_at: new Date(),
        },
        {
            id: uuid(),
            name: 'Sajadah Turki Motif Raudhah',
            slug: 'sajadah-turki-motif-raudhah',
            description: 'Sajadah import Turki bahan bludru tebal dan halus. Motif terinspirasi dari karpet Masjid Nabawi.',
            category_id: categoryMap['perlengkapan-ibadah'],
            base_price: 150000,
            sale_price: 125000,
            stock: 30,
            weight: 800,
            images: JSON.stringify(['https://images.unsplash.com/photo-1564639088613-286820c7841c?auto=format&fit=crop&q=80&w=800']),
            is_featured: true,
            updated_at: new Date(),
        },
        {
            id: uuid(),
            name: 'Paket Oleh-Oleh Haji Hemat A',
            slug: 'paket-oleh-oleh-haji-hemat-a',
            description: 'Praktis! Paket sudah dikemas cantik. Isi: Air Zamzam botol kecil, Kurma, Kismis, Kacang Arab, Cokelat, dan Tasbih.',
            category_id: categoryMap['paket-oleh-oleh'],
            base_price: 25000,
            stock: 500,
            weight: 250,
            images: JSON.stringify(['https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=800']),
            is_featured: true,
            updated_at: new Date(),
        }
    ];

    for (const prod of productsData) {
        if (!prod.category_id) continue;
        await prisma.products.upsert({
            where: { slug: prod.slug },
            update: {
                name: prod.name,
                description: prod.description,
                base_price: prod.base_price,
                sale_price: prod.sale_price,
                images: prod.images,
                category_id: prod.category_id
            },
            create: prod,
        });
    }
    console.log('✅ Products created (Hajj theme)');

    // Create Voucher
    await prisma.vouchers.upsert({
        where: { code: 'HAJIMABRUR' },
        update: {},
        create: {
            id: uuid(),
            code: 'HAJIMABRUR',
            type: 'PERCENTAGE',
            value: 10,
            min_purchase: 200000,
            max_discount: 50000,
            usage_limit: 1000,
            valid_from: new Date(),
            valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
    });
    console.log('✅ Voucher HAJIMABRUR created');

    // Create Flash Sale
    const flashSaleEndTime = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 jam dari sekarang
    const flashSale = await prisma.flash_sales.upsert({
        where: { slug: 'flash-sale-ramadhan-2026' },
        update: {},
        create: {
            id: uuid(),
            name: 'Flash Sale Ramadhan 2026',
            slug: 'flash-sale-ramadhan-2026',
            start_time: new Date(),
            end_time: flashSaleEndTime,
            status: 'ACTIVE',
            updated_at: new Date(),
        },
    });
    console.log('✅ Flash Sale created:', flashSale.name);

    // Add products with sale_price to flash sale
    const productsWithSale = await prisma.products.findMany({
        where: {
            sale_price: { not: null }
        }
    });

    for (const prod of productsWithSale) {
        await prisma.flash_sale_products.upsert({
            where: {
                flash_sale_id_product_id: {
                    flash_sale_id: flashSale.id,
                    product_id: prod.id
                }
            },
            update: {},
            create: {
                id: uuid(),
                flash_sale_id: flashSale.id,
                product_id: prod.id,
                sale_price: prod.sale_price,
                stock_limit: prod.stock,
                sold_count: Math.floor(Math.random() * (prod.stock * 0.3)), // simulasi terjual 0-30%
            }
        });
    }
    console.log(`✅ Added ${productsWithSale.length} products to Flash Sale`);

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
