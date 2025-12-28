import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';

import { verifyAuth } from '@/lib/auth';


// GET /api/chat - Get chat messages
export async function GET(request) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const limit = parseInt(searchParams.get('limit')) || 50;
        const before = searchParams.get('before'); // cursor for pagination

        const where = {
            user_id: auth.user.id,
        };

        if (orderId) {
            where.orderId = orderId;
        }

        if (before) {
            where.createdAt = { lt: new Date(before) };
        }

        const messages = await prisma.chat_messages.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: limit,
        });

        // Mark unread messages as read
        await prisma.chat_messages.updateMany({
            where: {
                user_id: auth.user.id,
                is_admin: true, // Only mark admin messages as read
                read_at: null,
            },
            data: { read_at: new Date() },
        });

        // Get unread count
        const unreadCount = await prisma.chat_messages.count({
            where: {
                user_id: auth.user.id,
                is_admin: true,
                read_at: null,
            },
        });

        return NextResponse.json({
            messages: messages.reverse().map(m => ({
                id: m.id,
                message: m.message,
                image_url: m.imageUrl,
                is_admin: m.isAdmin,
                created_at: m.createdAt,
            })),
            unreadCount,
        });
    } catch (error) {
        console.error('Get chat error:', error);
        return NextResponse.json({ error: 'Gagal mengambil chat' }, { status: 500 });
    }
}

// POST /api/chat - Send chat message
export async function POST(request) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { message, imageUrl, orderId } = body;

        if (!message && !imageUrl) {
            return NextResponse.json(
                { error: 'Pesan atau gambar wajib diisi' },
                { status: 400 }
            );
        }

        const chatMessage = await prisma.chat_messages.create({
            data: {
                user_id: auth.user.id,
                order_id: orderId || null,
                message: message || '',
                image_url: imageUrl || null,
                is_admin: false,
            },
        });

        return NextResponse.json({
            message: 'Pesan terkirim',
            chat: {
                id: chatMessage.id,
                message: chatMessage.message,
                image_url: chatMessage.imageUrl,
                is_admin: chatMessage.isAdmin,
                created_at: chatMessage.createdAt,
            },
        });
    } catch (error) {
        console.error('Send chat error:', error);
        return NextResponse.json({ error: 'Gagal mengirim pesan' }, { status: 500 });
    }
}

