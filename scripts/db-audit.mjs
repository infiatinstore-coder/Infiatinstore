import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function run() {
    // Categories
    const cats = await p.category.findMany({
        include: { _count: { select: { products: true } } }
    });

    // Products  
    const prods = await p.product.findMany({
        include: { category: true },
        orderBy: { name: 'asc' }
    });

    // Summary counts
    const users = await p.user.count();
    const orders = await p.order.count();
    const vouchers = await p.voucher.count();
    const reviews = await p.review.count();

    console.log('');
    console.log('========================================');
    console.log('   DEEP DATABASE AUDIT - Infiatin Store');
    console.log('========================================');

    console.log('\n--- CATEGORIES (' + cats.length + ') ---');
    cats.forEach(c => {
        console.log('  ' + c.name + ': ' + c._count.products + ' produk');
    });

    console.log('\n--- PRODUCTS (' + prods.length + ') ---');
    prods.forEach((prod, i) => {
        const price = Number(prod.salePrice || prod.basePrice);
        const featured = prod.isFeatured ? '[FEATURED]' : '';
        console.log((i + 1) + '. ' + prod.name);
        console.log('   Harga: Rp ' + price.toLocaleString('id-ID'));
        console.log('   Stok: ' + prod.stock + ' | Kategori: ' + (prod.category?.name || 'N/A') + ' ' + featured);
    });

    console.log('\n--- SUMMARY ---');
    console.log('  Users: ' + users);
    console.log('  Categories: ' + cats.length);
    console.log('  Products: ' + prods.length);
    console.log('  Orders: ' + orders);
    console.log('  Vouchers: ' + vouchers);
    console.log('  Reviews: ' + reviews);

    const featuredCount = prods.filter(p => p.isFeatured).length;
    console.log('  Featured Products: ' + featuredCount);

    console.log('\n--- STATUS ---');
    if (prods.length >= 20) {
        console.log('  [OK] Database memiliki ' + prods.length + ' produk real');
    }
    if (cats.length >= 5) {
        console.log('  [OK] ' + cats.length + ' kategori tersedia');
    }
    if (featuredCount >= 5) {
        console.log('  [OK] ' + featuredCount + ' produk featured untuk homepage');
    }

    console.log('\n========================================');
    console.log('         AUDIT COMPLETE!');
    console.log('========================================\n');

    await p.$disconnect();
}

run().catch(e => {
    console.error('Error:', e.message);
    p.$disconnect();
});
