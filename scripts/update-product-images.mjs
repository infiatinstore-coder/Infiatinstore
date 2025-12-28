import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Update products dengan gambar baru
const imageUpdates = [
    { slugContains: 'ajwa', image: '/images/products/kurma-ajwa.png' },
    { slugContains: 'sukari', image: '/images/products/kurma-ajwa.png' },
    { slugContains: 'medjool', image: '/images/products/kurma-ajwa.png' },
    { slugContains: 'zamzam', image: '/images/products/zamzam-water.png' },
    { slugContains: 'madu', image: '/images/products/zamzam-water.png' },
    { slugContains: 'habbatus', image: '/images/products/zamzam-water.png' },
    { slugContains: 'sajadah', image: '/images/products/sajadah.png' },
    { slugContains: 'tasbih', image: '/images/products/sajadah.png' },
    { slugContains: 'peci', image: '/images/products/sajadah.png' },
    { slugContains: 'misk', image: '/images/products/misk.png' },
    { slugContains: 'bukhur', image: '/images/products/misk.png' },
    { slugContains: 'kacang', image: '/images/products/pistachio.png' },
    { slugContains: 'pistachio', image: '/images/products/pistachio.png' },
    { slugContains: 'paket', image: '/images/products/paket.png' },
];

async function updateImages() {
    console.log('Updating product images...\n');

    const products = await p.product.findMany();

    for (const product of products) {
        for (const update of imageUpdates) {
            if (product.slug.includes(update.slugContains)) {
                await p.product.update({
                    where: { id: product.id },
                    data: { images: [update.image] }
                });
                console.log('Updated:', product.name, '->', update.image);
                break;
            }
        }
    }

    console.log('\nDone!');
    await p.$disconnect();
}

updateImages();
