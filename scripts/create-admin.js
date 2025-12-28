/**
 * Create Admin User
 * Email: admin@infiatin.store
 * Password: admin123
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        console.log('🔐 Creating admin user...');

        // Hash password
        const passwordHash = await bcrypt.hash('admin123', 10);

        // Create or update admin
        const admin = await prisma.user.upsert({
            where: { email: 'admin@infiatin.store' },
            update: {
                passwordHash,
                role: 'SUPER_ADMIN',
                status: 'ACTIVE',
                emailVerifiedAt: new Date()
            },
            create: {
                email: 'admin@infiatin.store',
                phone: '081234567890',
                name: 'Admin Infiatin',
                passwordHash,
                role: 'SUPER_ADMIN',
                status: 'ACTIVE',
                emailVerifiedAt: new Date()
            }
        });

        console.log('✅ Admin user created/updated:');
        console.log('   Email:', admin.email);
        console.log('   Role:', admin.role);
        console.log('   Status:', admin.status);
        console.log('');
        console.log('📝 Login credentials:');
        console.log('   Email: admin@infiatin.store');
        console.log('   Password: admin123');

        // Create user points if not exists
        const points = await prisma.userPoints.upsert({
            where: { userId: admin.id },
            update: {},
            create: {
                userId: admin.id,
                balance: 0,
                lifetime: 0
            }
        });

        console.log('✅ User points initialized');

    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
