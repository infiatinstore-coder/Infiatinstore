/**
 * Seed Categories to Database
 * Run: node scripts/seed-categories.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
        imageUrl: '/images/categories/wewangian.png',
    },
    {
        id: 'cat_paket',
        name: 'Paket Oleh-Oleh',
        slug: 'paket-oleh-oleh',
        description: 'Paket hemat oleh-oleh haji siap bagikan.',
        imageUrl: '/images/categories/paket.png',
    }
];

async function main() {
    console.log('🌱 Seeding categories...');

    for (const category of categories) {
        const existing = await prisma.category.findUnique({
            where: { id: category.id }
        });

        if (existing) {
            console.log(`✅ Category "${category.name}" already exists, skipping...`);
            continue;
        }

        await prisma.category.create({
            data: category
        });

        console.log(`✅ Created category: ${category.name}`);
    }

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
