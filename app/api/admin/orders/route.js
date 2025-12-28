import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';

import { verifyAuth } from '@/lib/auth';

import { sendShippingNotification } from '@/lib/whatsapp';

import { sendOrderShippedSMTP } from '@/lib/smtp';


// GET /api/admin/orders - Get all orders for admin
export async function GET(request) {
    try {
        // Verify admin access
        const auth = await verifyAuth(request);
        if (!auth.success || !['ADMIN', 'SUPER_ADMIN'].includes(auth.users.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 20;
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        // Build where clause
        const where = {};

        if (status && status !== 'all') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { users: { name: { contains: search, mode: 'insensitive' } } },
                { users: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }

        if (dateFrom || dateTo) {
            where.created_at = {};
            if (dateFrom) where.created_at.gte = new Date(dateFrom);
            if (dateTo) where.created_at.lte = new Date(dateTo + 'T23:59:59');
        }

        // Get orders with pagination
        const [orders, total] = await Promise.all([
            prisma.orders.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    users: {
                        select: { id: true, name: true, email: true, phone: true },
                    },
                    addresses: {
                        select: { city: true, province: true },
                    },
                    items: {
                        include: {
                            products: {
                                select: { name: true, images: true },
                            },
                        },
                    },
                    payments: {
                        select: { status: true, payment_method: true, paid_at: true },
                    },
                    shipments: {
                        select: { status: true, tracking_number: true, courier: true },
                    },
                },
            }),
            prisma.orders.count({ where }),
        ]);

        // Format orders
        const formattedOrders = orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customer: {
                id: order.user?.id,
                name: order.user?.name || 'Guest',
                email: order.user?.email,
                phone: order.user?.phone,
            },
            location: order.address ? `${order.addresses.city}, ${order.addresses.province}` : '-',
            items: order.items.map(item => ({
                name: item.productName,
                quantity: item.quantity,
                price: Number(item.priceAtPurchase),
                image: item.product?.images?.[0] || null,
            })),
            item_count: order.items.reduce((sum, item) => sum + item.quantity, 0),
            subtotal: Number(order.subtotal),
            shipping_cost: Number(order.shipping_cost),
            discount: Number(order.discount),
            tax: Number(order.tax),
            total: Number(order.total),
            status: order.status,
            paymentStatus: order.payment?.status || 'PENDING',
            payment_method: order.payment?.paymentMethod || order.payment_method,
            shippingStatus: order.shipment?.status || 'PENDING',
            tracking_number: order.shipment?.trackingNumber,
            courier: order.shipment?.courier || order.shippingMethod,
            notes: order.notes,
            created_at: order.created_at,
            paid_at: order.payment?.paidAt,
        }));

        return NextResponse.json({
            orders: formattedOrders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Admin orders error:', error);
        return NextResponse.json(
            { error: 'Gagal mengambil data pesanan' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/orders - Update order status
export async function PATCH(request) {
    try {
        // Verify admin access
        const auth = await verifyAuth(request);
        if (!auth.success || !['ADMIN', 'SUPER_ADMIN'].includes(auth.users.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, status, trackingNumber, notes } = body;

        if (!orderId || !status) {
            return NextResponse.json(
                { error: 'Order ID dan status wajib diisi' },
                { status: 400 }
            );
        }

        // ============================================================
        // CRITICAL GUARD: ADMIN TIDAK BOLEH OVERRIDE PAYMENT
        // ============================================================
        // Get current order status
        const currentOrder = await prisma.orders.findUnique({
            where: { id: orderId },
            include: {
                payments: true
            }
        });

        if (!currentOrder) {
            return NextResponse.json(
                { error: 'Order tidak ditemukan' },
                { status: 404 }
            );
        }

        // GUARD 1: Admin CANNOT manually set order to PAID
        // Order can only become PAID via payment webhook when payment.status = SUCCESS
        if (status === 'PAID') {
            return NextResponse.json(
                {
                    error: 'FORBIDDEN: Admin tidak boleh mengubah status ke PAID secara manual. Status PAID hanya bisa diubah otomatis via payment gateway callback.',
                    currentStatus: currentOrder.status,
                    paymentStatus: currentOrder.payment?.status
                },
                { status: 403 }
            );
        }

        // GUARD 2: Admin CANNOT change status FROM PAID to PENDING_PAYMENT
        // (would bypass payment verification)
        if (currentOrder.status === 'PAID' && status === 'PENDING_PAYMENT') {
            return NextResponse.json(
                {
                    error: 'FORBIDDEN: Tidak bisa mengembalikan order yang sudah PAID ke PENDING_PAYMENT'
                },
                { status: 403 }
            );
        }

        // GUARD 3: Admin CANNOT manually set order to FAILED
        // Order can only become FAILED via payment webhook when payment fails
        // Per ORDER_PAYMENT_RULES.md section 5: FAILED payment → FAILED order
        if (status === 'FAILED') {
            return NextResponse.json(
                {
                    error: 'FORBIDDEN: Admin tidak boleh mengubah status ke FAILED secara manual. Status FAILED hanya bisa diubah otomatis via payment gateway callback.',
                    currentStatus: currentOrder.status
                },
                { status: 403 }
            );
        }

        // Use orderStateMachine for status updates
        // This ensures all guards and side-effects are applied
        const { updateOrderStatus } = await import('@/lib/orderStateMachine');

        try {
            await updateOrderStatus(
                orderId,
                status,
                auth.users.id, // changedBy: admin user ID
                notes || `Admin update via dashboard`,
                { tracking_number: trackingNumber || null }
            );
        } catch (error) {
            // State machine will throw if invalid transition
            return NextResponse.json(
                {
                    error: `Gagal mengupdate status: ${error.message}`,
                    hint: 'Periksa apakah transisi status valid'
                },
                { status: 400 }
            );
        }


        // Update shipment if tracking number provided
        if (trackingNumber) {
            await prisma.shipments.updateMany({
                where: { orderId },
                data: {
                    trackingNumber,
                    status: 'IN_TRANSIT',
                    shipped_at: new Date(),
                },
            });
        }

        // Update shipment status based on order status
        if (status === 'SHIPPED') {
            await prisma.shipments.updateMany({
                where: { orderId },
                data: { status: 'IN_TRANSIT', shipped_at: new Date() },
            });
        } else if (status === 'DELIVERED') {
            await prisma.shipments.updateMany({
                where: { orderId },
                data: { status: 'DELIVERED', delivered_at: new Date() },
            });
        }

        // Get updated order with details for notification
        const updatedOrder = await prisma.orders.findUnique({
            where: { id: orderId },
            include: { users: true, addresses: true, shipments: true, items: true }
        });

        // Send WhatsApp notification when order is shipped
        if (status === 'SHIPPED' && trackingNumber) {
            sendShippingNotification(
                updatedOrder,
                trackingNumber,
                updatedOrder.shipment?.courier || 'KURIR'
            ).catch(err => {
                console.error('[WhatsApp] Shipping notification failed:', err);
            });

            // Send Email notification when order is shipped
            sendOrderShippedSMTP(
                updatedOrder,
                trackingNumber,
                updatedOrder.shipment?.courier || 'JNE'
            ).catch(err => {
                console.error('[Email] Shipping notification failed:', err);
            });
        }

        return NextResponse.json({
            message: 'Status pesanan berhasil diupdate',
            orders: {
                id: updatedOrder.id,
                orderNumber: updatedOrder.orderNumber,
                status: updatedOrder.status,
            },
        });
    } catch (error) {
        console.error('Update order error:', error);
        return NextResponse.json(
            { error: 'Gagal mengupdate pesanan' },
            { status: 500 }
        );
    }
}

