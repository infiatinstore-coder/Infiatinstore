/**
 * COURIER WEBHOOK HANDLER
 * Handles webhooks from JNE, J&T, SiCepat
 * 
 * POST /api/webhooks/couriers/[courier]
 */

import { NextResponse } from 'next/server';
import { trackingService } from '@/lib/trackingService';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
    const { courier } = params;
    const signature = request.headers.get('x-signature') || '';
    const payload = await request.json();

    // Validate webhook signature
    const isValid = trackingService.validateWebhook(courier, payload, signature);

    if (!isValid) {
        console.error(`Invalid webhook signature from ${courier}`);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    try {
        // Extract tracking number (different field names per courier)
        const trackingNumber = payload.tracking_number || payload.awb_no || payload.waybill;

        // Store webhook
        await prisma.courier_webhooks.create({
            data: {
                courier,
                tracking_number: trackingNumber,
                event: payload.status || payload.event,
                raw_payload: payload,
                processed: false
            }
        });

        // Process tracking update
        await processTrackingWebhook(courier, trackingNumber);

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}

async function processTrackingWebhook(courier, trackingNumber) {
    const shipment = await prisma.shipments.findUnique({
        where: { tracking_number: trackingNumber }
    });

    if (!shipment) {
        console.log(`Shipment not found: ${trackingNumber}`);
        return;
    }

    await trackingService.updateShipmentStatus(shipment.id);

    // Mark webhook as processed
    await prisma.courier_webhooks.updateMany({
        where: {
            courier,
            tracking_number: trackingNumber,
            processed: false
        },
        data: {
            processed: true,
            processed_at: new Date()
        }
    });
}
