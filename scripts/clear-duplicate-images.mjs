import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function clearDuplicateImages() {
    console.log('Checking for duplicate images...\n');

    const products = await p.product.findMany({
        select: { id: true, name: true, slug: true, images: true }
    });

    // Track which images are used
    const usedImages = new Map();
    const updates = [];

    for (const product of products) {
        const img = product.images?.[0] || null;

        if (img) {
            if (usedImages.has(img)) {
                // Duplicate found - clear this product's image
                console.log(`DUPLICATE: "${product.name}" uses same image as "${usedImages.get(img)}"`);
                updates.push({
                    id: product.id,
                    name: product.name,
                    clearImage: true
                });
            } else {
                usedImages.set(img, product.name);
            }
        }
    }

    console.log(`\nFound ${updates.length} products with duplicate images\n`);

    // Clear duplicate images
    for (const update of updates) {
        await p.product.update({
            where: { id: update.id },
            data: { images: [] }
        });
        console.log(`Cleared image for: ${update.name}`);
    }

    console.log('\nDone!');
    await p.$disconnect();
}

clearDuplicateImages();
