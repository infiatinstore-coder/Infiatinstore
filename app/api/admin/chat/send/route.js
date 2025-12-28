/**
 * Admin Live Chat API
 * Admin send message to customer
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';

import { requireAuth } from '@/lib/auth';


/**
 * POST /api/admin/chat/send
 * Admin send message to customer
 */
export const POST = requireAuth(async function POST(request, context) {
    try {
        // Check admin permission
        if (context.user.role !== 'ADMIN' && context.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        const { userId, message, orderId, imageUrl } = await request.json();

        if (!userId || !message) {
            return NextResponse.json(
                { error: 'userId and message are required' },
                { status: 400 }
            );
        }

        // Create chat message
        const chatMessage = await prisma.chat_messages.create({
            data: {
                userId,
                message,
                orderId,
                imageUrl,
                is_admin: true
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });

        // TODO: Send WhatsApp notification to customer
        // const user = chatMessage.user;
        // if (user.phone) {
        //     await sendWhatsAppNotification({
        //         phone: user.phone,
        //         message: `Admin: ${message}`
        //     });
        // }

        return NextResponse.json({
            success: true,
            message: chatMessage
        });

    } catch (error) {
        console.error('[Admin Chat Send] Error:', error);
        return NextResponse.json(
            { error: 'Failed to send message', details: error.message },
            { status: 500 }
        );
    }
});

/**
 * GET /api/admin/chat/send
 * Get all customer conversations
 */
export const GET = requireAuth(async function GET(request, context) {
    try {
        // Check admin permission
        if (context.user.role !== 'ADMIN' && context.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        // Get unique users who have sent messages
        const conversations = await prisma.chat_messages.groupBy({
            by: ['userId'],
            _count: {
                id: true
            },
            _max: {
                created_at: true
            },
            orderBy: {
                _max: {
                    created_at: 'desc'
                }
            }
        });

        // Get user details
        const conversationsWithUsers = await Promise.all(
            conversations.map(async (conv) => {
                const user = await prisma.users.findUnique({
                    where: { id: conv.userId },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar_url: true
                    }
                });

                // Get last message
                const lastMessage = await prisma.chat_messages.findFirst({
                    where: { user_id: conv.userId },
                    orderBy: { created_at: 'desc' }
                });

                // Count unread messages from customer
                const unreadCount = await prisma.chat_messages.count({
                    where: {
                        user_id: conv.userId,
                        is_admin: false,
                        read_at: null
                    }
                });

                return {
                    user,
                    messageCount: conv._count.id,
                    lastMessageAt: conv._max.createdAt,
                    lastMessage: lastMessage?.message,
                    unreadCount
                };
            })
        );

        return NextResponse.json({
            conversations: conversationsWithUsers
        });

    } catch (error) {
        console.error('[Admin Chat Conversations] Error:', error);
        return NextResponse.json(
            { error: 'Failed to get conversations', details: error.message },
            { status: 500 }
        );
    }
});

