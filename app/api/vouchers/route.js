import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/vouchers - Get all vouchers
export async function GET(request) {
    try {
        const vouchers = await prisma.vouchers.findMany({
            orderBy: { created_at: 'desc' },
        });

        return NextResponse.json({
            success: true,
            vouchers: vouchers.map(v => ({
                id: v.id,
                code: v.code,
                name: v.code, // Use code as name if no name field
                type: v.type,
                value: Number(v.value),
                min_purchase: Number(v.minPurchase || 0),
                max_discount: v.maxDiscount ? Number(v.maxDiscount) : null,
                usage_limit: v.usageLimit,
                used_count: v.usedCount || 0,
                valid_from: v.validFrom,
                valid_until: v.validUntil,
                status: v.status,
                isActive: v.status === 'ACTIVE',
            })),
        });
    } catch (error) {
        console.error('Error fetching vouchers:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/vouchers - Create new voucher
export async function POST(request) {
    try {
        const body = await request.json();

        const voucher = await prisma.vouchers.create({
            data: {
                code: body.code.toUpperCase(),
                type: body.type || 'PERCENTAGE',
                value: body.value,
                min_purchase: body.minPurchase || 0,
                max_discount: body.maxDiscount || null,
                usage_limit: body.usageLimit || null,
                valid_from: new Date(body.validFrom),
                valid_until: new Date(body.validUntil),
                status: body.status || 'ACTIVE',
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Voucher berhasil dibuat',
            voucher,
        });
    } catch (error) {
        console.error('Error creating voucher:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

