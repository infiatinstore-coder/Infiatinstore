import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function deepCheck() {
    console.log('\n========== DEEP ISSUE CHECK ==========\n');

    const issues = [];

    // 1. CHECK PRODUCTS
    console.log('[1] Checking products...');
    const products = await p.product.findMany({
        orderBy: { name: 'asc' },
        include: { category: true }
    });

    // Check similar names
    for (let i = 0; i < products.length; i++) {
        for (let j = i + 1; j < products.length; j++) {
            const name1 = products[i].name.toLowerCase().replace(/\s+/g, ' ').trim();
            const name2 = products[j].name.toLowerCase().replace(/\s+/g, ' ').trim();

            // Very similar names (80%+ match)
            const shorter = name1.length < name2.length ? name1 : name2;
            const longer = name1.length < name2.length ? name2 : name1;

            if (longer.includes(shorter) && shorter.length > 15) {
                issues.push({
                    type: 'SIMILAR_NAME',
                    message: `"${products[i].name}" vs "${products[j].name}"`
                });
            }
        }
    }

    // Check products without images
    console.log('[2] Checking images...');
    products.forEach(prod => {
        const images = prod.images;
        if (!images || images.length === 0) {
            issues.push({ type: 'NO_IMAGE', message: `"${prod.name}"` });
        }
    });

    // Check price consistency
    console.log('[3] Checking prices...');
    products.forEach(prod => {
        if (prod.salePrice && Number(prod.salePrice) >= Number(prod.basePrice)) {
            issues.push({ type: 'PRICE_ERROR', message: `Sale >= Base: "${prod.name}"` });
        }
    });

    // Check short descriptions
    console.log('[4] Checking descriptions...');
    products.forEach(prod => {
        if (!prod.description || prod.description.length < 30) {
            issues.push({ type: 'SHORT_DESC', message: `"${prod.name}" (${prod.description?.length || 0} chars)` });
        }
    });

    // 5. CHECK CATEGORIES
    console.log('[5] Checking categories...');
    const cats = await p.category.findMany({
        include: { _count: { select: { products: true } } }
    });
    cats.forEach(cat => {
        if (cat._count.products === 0) {
            issues.push({ type: 'EMPTY_CATEGORY', message: `"${cat.name}"` });
        }
    });

    // 6. CHECK VOUCHERS
    console.log('[6] Checking vouchers...');
    const vouchers = await p.voucher.findMany();
    const now = new Date();
    vouchers.forEach(v => {
        if (new Date(v.validUntil) < now && v.status === 'ACTIVE') {
            issues.push({ type: 'EXPIRED_VOUCHER', message: `"${v.code}" sudah expired tapi masih ACTIVE` });
        }
    });

    // PRINT RESULTS
    console.log('\n========== ISSUES FOUND ==========\n');

    if (issues.length === 0) {
        console.log('*** TIDAK ADA MASALAH CRITICAL DITEMUKAN! ***\n');
    } else {
        const grouped = {};
        issues.forEach(issue => {
            if (!grouped[issue.type]) grouped[issue.type] = [];
            grouped[issue.type].push(issue.message);
        });

        Object.keys(grouped).forEach(type => {
            console.log(`[${type}] (${grouped[type].length} items)`);
            grouped[type].slice(0, 5).forEach(msg => console.log('  - ' + msg));
            if (grouped[type].length > 5) {
                console.log(`  ... dan ${grouped[type].length - 5} lainnya`);
            }
            console.log('');
        });

        console.log(`Total Issues: ${issues.length}`);
    }

    console.log('\n===================================\n');

    await p.$disconnect();
}

deepCheck().catch(e => {
    console.error('Error:', e.message);
    p.$disconnect();
});
