/**
 * Script to migrate mock products and categories to database
 * Run with: node scripts/migrate-mock-to-db.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Categories from data/categories.js
const categories = [
    {
        id: 'cat_kurma',
        name: 'Kurma & Buah Kering',
        slug: 'kurma-buah-kering',
        description: 'Aneka kurma pilihan (Ajwa, Sukari, Tunisia) dan kismis.',
        imageUrl: '/images/categories/kurma.png',
    },
    {
        id: 'cat_zamzam',
        name: 'Air Zamzam & Minuman',
        slug: 'air-zamzam',
        description: 'Air Zamzam asli dan minuman kesehatan timur tengah.',
        imageUrl: '/images/categories/zamzam.png',
    },
    {
        id: 'cat_kacang',
        name: 'Kacang & Camilan',
        slug: 'kacang-camilan',
        description: 'Kacang Arab, Pistachio, Almond, dan Cokelat Arab.',
        imageUrl: '/images/categories/kacang.png',
    },
    {
        id: 'cat_perlengkapan',
        name: 'Perlengkapan Ibadah',
        slug: 'perlengkapan-ibadah',
        description: 'Sajadah, tasbih, peci, dan perlengkapan haji.',
        imageUrl: '/images/categories/ibadah.png',
    },
    {
        id: 'cat_wewangian',
        name: 'Parfum & Wewangian',
        slug: 'parfum-wewangian',
        description: 'Minyak wangi non-alkohol, bukhor, dan gaharu.',
        imageUrl: '/images/categories/parfum.png',
    },
    {
        id: 'cat_paket',
        name: 'Paket Oleh-Oleh',
        slug: 'paket-oleh-oleh',
        description: 'Paket hemat oleh-oleh haji siap bagikan.',
        imageUrl: '/images/categories/paket.png',
    }
];

// Products from data/products.js
const products = [
    // === KURMA AJWA MADINAH ===
    {
        name: 'Kurma Ajwa Al-Waafi Madinah Premium Box 5kg',
        slug: 'kurma-ajwa-waafi-5kg',
        description: `🌙 KURMA AJWA AL-WAAFI - Kurma Nabi Kualitas Premium

Kurma Ajwa Al-Waafi adalah kurma terbaik yang berasal langsung dari kebun-kebun di Madinah Al-Munawwarah. Dikenal sebagai "Kurma Nabi" karena Rasulullah ﷺ bersabda:

"Barangsiapa memakan 7 butir kurma Ajwa di pagi hari, maka tidak akan terkena racun dan sihir pada hari itu." (HR. Bukhari & Muslim)

✨ KEUNGGULAN:
• Langsung import dari Madinah
• Branded Al-Waafi (kualitas terjamin)
• Warna hitam pekat dengan tekstur lembut
• Rasa tidak terlalu manis, pas di lidah
• Kemasan box eksklusif 5kg

💡 MANFAAT KESEHATAN:
• Melancarkan pencernaan
• Sumber energi alami
• Kaya antioksidan dan serat
• Baik untuk ibu hamil

📦 Cocok untuk: Konsumsi pribadi, hadiah, atau dijual kembali.`,
        basePrice: 2750000,
        salePrice: 2500000,
        stock: 15,
        weight: 5000,
        categorySlug: 'kurma-buah-kering',
        status: 'ACTIVE',
        isFeatured: true,
        images: ['/images/products-v2/p_ajwa_waafi_5kg_1766505477373.png'],
    },
    {
        name: 'Kurma Ajwa Al-Madinah Premium Box 5kg',
        slug: 'kurma-ajwa-madinah-5kg',
        description: `🕌 KURMA AJWA MADINAH - Kurma Favorit Jamaah Haji

Kurma Ajwa asli Madinah dengan kualitas premium grade A.`,
        basePrice: 2750000,
        salePrice: 2500000,
        stock: 25,
        weight: 5000,
        categorySlug: 'kurma-buah-kering',
        status: 'ACTIVE',
        isFeatured: true,
        images: ['/images/products-v2/p_ajwa_madinah_5kg_1766505584944.png'],
    },
    {
        name: 'Kurma Ajwa Al-Madinah Premium 1kg',
        slug: 'kurma-ajwa-madinah-1kg',
        description: `🌙 KURMA AJWA 1KG - Ukuran Pas untuk Keluarga`,
        basePrice: 600000,
        salePrice: 550000,
        stock: 50,
        weight: 1000,
        categorySlug: 'kurma-buah-kering',
        status: 'ACTIVE',
        isFeatured: true,
        images: ['/images/products-v2/p_ajwa_madinah_1kg_1766505600256.png'],
    },
    {
        name: 'Kurma Ajwa Al-Madinah Premium 500g',
        slug: 'kurma-ajwa-madinah-500g',
        description: `Kurma Ajwa asli Madinah kemasan 500g - cocok untuk mencoba atau stok mingguan.`,
        basePrice: 320000,
        salePrice: 289000,
        stock: 75,
        weight: 500,
        categorySlug: 'kurma-buah-kering',
        status: 'ACTIVE',
        isFeatured: false,
        images: ['/images/products-v2/p_ajwa_madinah_500g_1766505609954.png'],
    },
    {
        name: 'Kurma Sukari Al-Qassim 1kg',
        slug: 'kurma-sukari-qassim-1kg',
        description: `🌴 KURMA SUKARI - Kurma Manis Favorit

Kurma Sukari dari Al-Qassim, Arab Saudi. Rasanya manis legit dengan tekstur lembut.`,
        basePrice: 189000,
        salePrice: 165000,
        stock: 60,
        weight: 1000,
        categorySlug: 'kurma-buah-kering',
        status: 'ACTIVE',
        isFeatured: true,
        images: ['/images/products-v2/p_kurma_sukari_1kg_1766505691571.png'],
    },
    {
        name: 'Kurma Medjool Premium 500g',
        slug: 'kurma-medjool-premium-500g',
        description: `👑 KURMA MEDJOOL - Raja Kurma

Kurma Medjool adalah kurma paling premium dengan ukuran jumbo dan rasa yang sangat manis.`,
        basePrice: 175000,
        salePrice: 159000,
        stock: 40,
        weight: 500,
        categorySlug: 'kurma-buah-kering',
        status: 'ACTIVE',
        isFeatured: true,
        images: ['/images/products-v2/p_kurma_medjool_500g_1766505700654.png'],
    },
    // === AIR ZAMZAM ===
    {
        name: 'Air Zamzam Asli Makkah 5 Liter',
        slug: 'air-zamzam-5-liter',
        description: `💧 AIR ZAMZAM ASLI - Langsung dari Makkah Al-Mukarramah`,
        basePrice: 350000,
        salePrice: 299000,
        stock: 30,
        weight: 5500,
        categorySlug: 'air-zamzam',
        status: 'ACTIVE',
        isFeatured: true,
        images: ['/images/products-v2/p_zamzam_5l_1766505477452.png'],
    },
    {
        name: 'Air Zamzam Asli Makkah 1 Liter',
        slug: 'air-zamzam-1-liter',
        description: `Air Zamzam asli kemasan 1 liter - praktis sebagai oleh-oleh.`,
        basePrice: 85000,
        salePrice: 75000,
        stock: 100,
        weight: 1200,
        categorySlug: 'air-zamzam',
        status: 'ACTIVE',
        isFeatured: true,
        images: ['/images/products-v2/p_zamzam_1l_1766505619587.png'],
    },
    {
        name: 'Air Zamzam Asli Makkah 500ml',
        slug: 'air-zamzam-500ml',
        description: `Air Zamzam kemasan kecil 500ml - pas untuk satu keluarga.`,
        basePrice: 50000,
        salePrice: 45000,
        stock: 150,
        weight: 600,
        categorySlug: 'air-zamzam',
        status: 'ACTIVE',
        isFeatured: false,
        images: ['/images/products-v2/p_zamzam_500ml_1766505627787.png'],
    },
    {
        name: 'Habbatussauda Kapsul 120 Caps',
        slug: 'habbatussauda-kapsul-120',
        description: `🌿 HABBATUSSAUDA - Obat Segala Penyakit`,
        basePrice: 89000,
        salePrice: 79000,
        stock: 100,
        weight: 150,
        categorySlug: 'air-zamzam',
        status: 'ACTIVE',
        isFeatured: false,
        images: ['/images/products-v2/p_habbatussauda_1766505709740.png'],
    },
    {
        name: 'Madu Sidr Yaman Premium 500g',
        slug: 'madu-sidr-yaman-500g',
        description: `🍯 MADU SIDR YAMAN - Madu Terbaik Dunia`,
        basePrice: 450000,
        salePrice: 399000,
        stock: 20,
        weight: 600,
        categorySlug: 'air-zamzam',
        status: 'ACTIVE',
        isFeatured: true,
        images: ['/images/products-v2/p_madu_sidr_1766505718828.png'],
    },
    // === PERLENGKAPAN IBADAH ===
    {
        name: 'Sajadah Turki Premium Motif Raudhah',
        slug: 'sajadah-turki-premium-raudhah',
        description: `🕌 SAJADAH TURKI PREMIUM - Motif Raudhah`,
        basePrice: 150000,
        salePrice: 125000,
        stock: 40,
        weight: 800,
        categorySlug: 'perlengkapan-ibadah',
        status: 'ACTIVE',
        isFeatured: true,
        images: ['/images/products-v2/p_sajadah_turki_1766505477511.png'],
    },
    {
        name: 'Tasbih Kayu Kokka 99 Butir',
        slug: 'tasbih-kayu-kokka-99',
        description: `📿 TASBIH KAYU KOKKA - 99 Butir`,
        basePrice: 75000,
        salePrice: 65000,
        stock: 60,
        weight: 100,
        categorySlug: 'perlengkapan-ibadah',
        status: 'ACTIVE',
        isFeatured: false,
        images: ['/images/products-v2/p_tasbih_kayu_99_1766505636980.png'],
    },
    {
        name: 'Peci Hitam Premium Songkok',
        slug: 'peci-hitam-premium-songkok',
        description: `🎩 PECI SONGKOK PREMIUM`,
        basePrice: 45000,
        salePrice: 39000,
        stock: 100,
        weight: 150,
        categorySlug: 'perlengkapan-ibadah',
        status: 'ACTIVE',
        isFeatured: false,
        images: ['/images/products-v2/p_peci_kopiah_1766505646050.png'],
    },
    // === PARFUM & WEWANGIAN ===
    {
        name: 'Misk Thaharah Original Arab',
        slug: 'misk-thaharah-original',
        description: `🌸 MISK THAHARAH - Wangi Suci Khas Arab`,
        basePrice: 35000,
        salePrice: 29000,
        stock: 200,
        weight: 50,
        categorySlug: 'parfum-wewangian',
        status: 'ACTIVE',
        isFeatured: true,
        images: ['/images/products-v2/p_misk_thaharah_1766505477572.png'],
    },
    {
        name: 'Bukhur Oud Asli Arab Premium',
        slug: 'bukhur-oud-asli-premium',
        description: `🔥 BUKHUR OUD PREMIUM`,
        basePrice: 120000,
        salePrice: 99000,
        stock: 45,
        weight: 200,
        categorySlug: 'parfum-wewangian',
        status: 'ACTIVE',
        isFeatured: true,
        images: ['/images/products-v2/p_bukhur_oud_1766505655202.png'],
    },
    // === KACANG & CAMILAN ===
    {
        name: 'Kacang Arab Panggang Renyah 500g',
        slug: 'kacang-arab-panggang-500g',
        description: `🥜 KACANG ARAB PANGGANG`,
        basePrice: 65000,
        salePrice: 55000,
        stock: 80,
        weight: 500,
        categorySlug: 'kacang-camilan',
        status: 'ACTIVE',
        isFeatured: false,
        images: ['/images/products-v2/p_kacang_arab_1766505664308.png'],
    },
    {
        name: 'Kacang Pistachio Premium 500g',
        slug: 'kacang-pistachio-premium-500g',
        description: `🌰 PISTACHIO PREMIUM`,
        basePrice: 150000,
        salePrice: 135000,
        stock: 35,
        weight: 500,
        categorySlug: 'kacang-camilan',
        status: 'ACTIVE',
        isFeatured: true,
        images: ['/images/products-v2/p_pistachio_500g_1766505673391.png'],
    },
    // === PAKET OLEH-OLEH ===
    {
        name: 'Paket Oleh-Oleh Haji Hemat A',
        slug: 'paket-oleh-oleh-haji-hemat-a',
        description: `🎁 PAKET OLEH-OLEH HEMAT A

Paket lengkap berisi:
• Kurma Ajwa 500g
• Air Zamzam 500ml
• Tasbih Kayu 33 butir
• Misk Thaharah

Hemat dan praktis untuk oleh-oleh keluarga!`,
        basePrice: 350000,
        salePrice: 299000,
        stock: 25,
        weight: 1500,
        categorySlug: 'paket-oleh-oleh',
        status: 'ACTIVE',
        isFeatured: true,
        images: ['/images/products-v2/p_paket_hemat_a_1766505477634.png'],
    },
    {
        name: 'Paket Oleh-Oleh Haji Premium B',
        slug: 'paket-oleh-oleh-haji-premium-b',
        description: `🎁 PAKET OLEH-OLEH PREMIUM B

Paket eksklusif berisi:
• Kurma Ajwa 1kg
• Air Zamzam 1 Liter
• Sajadah Turki Premium
• Tasbih Kayu Kokka 99 butir
• Misk Thaharah
• Bukhur Oud

Cocok untuk hadiah spesial!`,
        basePrice: 750000,
        salePrice: 649000,
        stock: 15,
        weight: 3000,
        categorySlug: 'paket-oleh-oleh',
        status: 'ACTIVE',
        isFeatured: true,
        images: ['/images/products-v2/p_paket_premium_b_1766505682482.png'],
    },
];

// Map category slugs to database IDs
const categoryIdMap = new Map();

async function main() {
    console.log('🚀 Starting migration of mock data to database...\n');

    // Step 1: Create or update categories
    console.log('📁 Migrating categories...');
    for (const cat of categories) {
        try {
            const existing = await prisma.category.findFirst({
                where: { slug: cat.slug }
            });

            if (existing) {
                console.log(`  ⏩ Category "${cat.name}" already exists, updating...`);
                await prisma.category.update({
                    where: { id: existing.id },
                    data: {
                        name: cat.name,
                        description: cat.description,
                        imageUrl: cat.imageUrl,
                    }
                });
                categoryIdMap.set(cat.slug, existing.id);
            } else {
                console.log(`  ✅ Creating category "${cat.name}"...`);
                const created = await prisma.category.create({
                    data: {
                        name: cat.name,
                        slug: cat.slug,
                        description: cat.description,
                        imageUrl: cat.imageUrl,
                    }
                });
                categoryIdMap.set(cat.slug, created.id);
            }
        } catch (error) {
            console.error(`  ❌ Failed for category "${cat.name}":`, error.message);
        }
    }
    console.log(`  ✅ ${categories.length} categories processed\n`);

    // Step 2: Create or update products
    console.log('📦 Migrating products...');
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
        try {
            const categoryId = categoryIdMap.get(product.categorySlug);

            if (!categoryId) {
                console.log(`  ⏩ Skipping "${product.name}" - category "${product.categorySlug}" not found`);
                skippedCount++;
                continue;
            }

            const existing = await prisma.product.findFirst({
                where: { slug: product.slug }
            });

            if (existing) {
                console.log(`  🔄 Updating "${product.name}"...`);
                await prisma.product.update({
                    where: { id: existing.id },
                    data: {
                        name: product.name,
                        description: product.description,
                        basePrice: product.basePrice,
                        salePrice: product.salePrice || null,
                        stock: product.stock,
                        weight: product.weight,
                        categoryId: categoryId,
                        status: product.status || 'ACTIVE',
                        isFeatured: product.isFeatured || false,
                        images: product.images || [],
                    }
                });
                updatedCount++;
            } else {
                console.log(`  ✅ Creating "${product.name}"...`);
                await prisma.product.create({
                    data: {
                        name: product.name,
                        slug: product.slug,
                        description: product.description,
                        basePrice: product.basePrice,
                        salePrice: product.salePrice || null,
                        stock: product.stock,
                        weight: product.weight,
                        categoryId: categoryId,
                        status: product.status || 'ACTIVE',
                        isFeatured: product.isFeatured || false,
                        images: product.images || [],
                    }
                });
                createdCount++;
            }
        } catch (error) {
            console.error(`  ❌ Failed for "${product.name}":`, error.message);
        }
    }

    console.log(`\n📊 MIGRATION SUMMARY:`);
    console.log(`  ✅ Categories: ${categories.length} processed`);
    console.log(`  ✅ Products Created: ${createdCount}`);
    console.log(`  🔄 Products Updated: ${updatedCount}`);
    console.log(`  ⏩ Products Skipped: ${skippedCount}`);
    console.log(`\n🎉 Migration complete!`);
}

main()
    .catch((e) => {
        console.error('Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
