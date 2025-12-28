
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const imageMapping = {
    // Air Zamzam
    'air-zamzam-asli-5-liter': '/images/products/zamzam_jerrycan.png',
    'air-zamzam-5-liter': '/images/products/zamzam_jerrycan.png',
    'air-zamzam-1-liter': '/images/products/zamzam_bottle_group.png',
    'air-zamzam-500ml': '/images/products/zamzam_bottle_group.png',

    // Kurma
    'kurma-ajwa-waafi-5kg': '/images/products/kurma_ajwa_box.png',
    'kurma-ajwa-madinah-5kg': '/images/products/kurma_ajwa_box.png',
    'kurma-ajwa-madinah-premium-1kg': '/images/products/kurma_ajwa_box.png',
    'kurma-ajwa-madinah-1kg': '/images/products/kurma_ajwa_box.png',
    'kurma-ajwa-madinah-500g': '/images/products/kurma_ajwa_box.png',
    'kurma-sukari-qassim-1kg': '/images/products/kurma_ajwa_box.png',
    'kurma-sukari-alqassim-1kg': '/images/products/kurma_ajwa_box.png',
    'kurma-medjool-premium-500g': '/images/products/kurma_ajwa_box.png',

    // Kacang & Camilan
    'kacang-pistachio-usa-500g': '/images/products/pistachio_bowl.png',
    'kacang-pistachio-premium-500g': '/images/products/pistachio_bowl.png',
    'kacang-arab-panggang-500g': '/images/products/roasted_chickpeas.png',

    // Herbal & Wangian
    'madu-sidr-yaman-500g': '/images/products/madu_yaman.png',
    'habbatussauda-kapsul-120': '/images/products/habbatussauda_bottle.png',
    'bukhur-oud-asli-premium': '/images/products/bukhur_oud.png',
    'misk-thaharah-original': '/images/products/madu_yaman.png', // Temporary placeholder

    // Perlengkapan Ibadah
    'peci-hitam-premium-songkok': '/images/products/peci_hitam.png',
    'tasbih-kayu-kokka-99': '/images/products/tasbih_kokka.png',
    'sajadah-turki-premium-raudhah': '/images/products/hajj_package_premium.png',
    'sajadah-turki-motif-raudhah': '/images/products/hajj_package_premium.png',

    // Paket
    'paket-oleh-oleh-haji-premium-b': '/images/products/hajj_package_premium.png',
    'paket-oleh-oleh-haji-hemat-a': '/images/products/hajj_package_premium.png',
};

async function main() {
    console.log('🔄 Updating product images...');

    for (const [slug, imagePath] of Object.entries(imageMapping)) {
        try {
            const product = await prisma.product.findUnique({
                where: { slug }
            });

            if (product) {
                // Force update if in mapping
                await prisma.product.update({
                    where: { slug },
                    data: {
                        images: [imagePath]
                    }
                });
                console.log(`✅ Updated: ${slug} -> ${imagePath}`);
            } else {
                console.log(`⚠️ Product not found: ${slug}`);
            }
        } catch (e) {
            console.error(`❌ Error updating ${slug}:`, e.message);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
