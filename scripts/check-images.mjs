import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function checkImages() {
    const products = await p.product.findMany({
        select: { name: true, images: true },
        orderBy: { name: 'asc' }
    });

    let withImage = 0;
    let withoutImage = 0;

    console.log('PRODUCT IMAGE STATUS:\n');

    products.forEach(prod => {
        const hasImage = prod.images && prod.images.length > 0 && prod.images[0];
        if (hasImage) {
            console.log('✅', prod.name, '->', prod.images[0]);
            withImage++;
        } else {
            console.log('⬜', prod.name, '-> (no image)');
            withoutImage++;
        }
    });

    console.log(`\n--- SUMMARY ---`);
    console.log(`With image: ${withImage}`);
    console.log(`Without image: ${withoutImage}`);
    console.log(`Total: ${products.length}`);

    await p.$disconnect();
}

checkImages();
