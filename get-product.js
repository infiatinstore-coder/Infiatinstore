const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getProduct() {
    const product = await prisma.product.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, basePrice: true }
    });
    console.log(JSON.stringify(product));
    await prisma.$disconnect();
}

getProduct();
