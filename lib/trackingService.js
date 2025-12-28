/**
 * MULTI-COURIER TRACKING SERVICE
 * Supports JNE, J&T, SiCepat with webhook integration
 */

import axios from 'axios';
import crypto from 'crypto';
import prisma from './prisma';

class JNEAdapter {
    apiKey = process.env.JNE_API_KEY;

    async track(trackingNumber) {
        try {
            const response = await axios.get(
                `https://apiv2.jne.co.id:10443/tracing/api/list/v1/${trackingNumber}`,
                { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
            );

            return response.data.detail.map(event => ({
                timestamp: new Date(event.date),
                status: this.mapStatus(event.code),
                description: event.desc,
                location: event.city
            }));
        } catch (error) {
            console.error('JNE tracking error:', error.message);
            return [];
        }
    }

    validateWebhook(payload, signature) {
        const expected = crypto
            .createHmac('sha256', process.env.JNE_WEBHOOK_SECRET)
            .update(JSON.stringify(payload))
            .digest('hex');
        return signature === expected;
    }

    mapStatus(code) {
        const mapping = {
            'PICKUP': 'picked_up',
            'MANIFESTED': 'in_transit',
            'DELIVERED': 'delivered',
            'FAILED': 'failed'
        };
        return mapping[code] || 'in_transit';
    }
}

class JNTAdapter {
    apiKey = process.env.JNT_API_KEY;
    apiSecret = process.env.JNT_API_SECRET;

    async track(trackingNumber) {
        const timestamp = Date.now();
        const signature = this.generateSignature(trackingNumber, timestamp);

        try {
            const response = await axios.post(
                'https://api.jet.co.id/jet/api/track/v1',
                { awb_no: trackingNumber },
                {
                    headers: {
                        'api_key': this.apiKey,
                        'timestamp': timestamp.toString(),
                        'signature': signature
                    }
                }
            );

            return response.data.data.details.map(event => ({
                timestamp: new Date(event.date_time),
                status: this.mapStatus(event.status),
                description: event.description,
                location: event.city
            }));
        } catch (error) {
            console.error('JNT tracking error:', error.message);
            return [];
        }
    }

    generateSignature(data, timestamp) {
        const message = `${this.apiKey}${data}${timestamp}${this.apiSecret}`;
        return crypto.createHash('md5').update(message).digest('hex');
    }

    validateWebhook(payload, signature) {
        const expected = this.generateSignature(JSON.stringify(payload), payload.timestamp);
        return signature === expected;
    }

    mapStatus(status) {
        const mapping = {
            '100': 'picked_up',
            '200': 'in_transit',
            '300': 'delivered',
            '400': 'failed'
        };
        return mapping[status] || 'in_transit';
    }
}

class SiCepatAdapter {
    apiKey = process.env.SICEPAT_API_KEY;

    async track(trackingNumber) {
        try {
            const response = await axios.get(
                'https://api.sicepat.com/customer/waybill',
                {
                    params: { waybill: trackingNumber },
                    headers: { 'api-key': this.apiKey }
                }
            );

            return response.data.sicepat.track_history.map(event => ({
                timestamp: new Date(event.date_time),
                status: this.mapStatus(event.status),
                description: event.description,
                location: event.city
            }));
        } catch (error) {
            console.error('SiCepat tracking error:', error.message);
            return [];
        }
    }

    validateWebhook(payload, signature) {
        const expected = crypto
            .createHmac('sha256', this.apiKey)
            .update(JSON.stringify(payload))
            .digest('base64');
        return signature === expected;
    }

    mapStatus(status) {
        const mapping = {
            'PICKUP': 'picked_up',
            'TRANSIT': 'in_transit',
            'DELIVERED': 'delivered',
            'CANCEL': 'failed'
        };
        return mapping[status] || 'in_transit';
    }
}

export class TrackingService {
    adapters = {
        jne: new JNEAdapter(),
        jnt: new JNTAdapter(),
        sicepat: new SiCepatAdapter()
    };

    async trackShipment(courierCode, trackingNumber) {
        const adapter = this.adapters[courierCode.toLowerCase()];
        if (!adapter) {
            throw new Error(`Unsupported courier: ${courierCode}`);
        }
        return await adapter.track(trackingNumber);
    }

    async updateShipmentStatus(shipmentId) {
        const shipment = await prisma.shipments.findUnique({
            where: { id: shipmentId },
            include: { orders: true }
        });

        if (!shipment) throw new Error('Shipment not found');

        const events = await this.trackShipment(shipment.courier_code, shipment.tracking_number);
        if (events.length === 0) return;

        const latestEvent = events[0];

        await prisma.shipments.update({
            where: { id: shipmentId },
            data: {
                status: latestEvent.status,
                current_location: latestEvent.location,
                tracking_history: events,
                last_sync_at: new Date()
            }
        });

        // Update order if delivered
        if (latestEvent.status === 'delivered') {
            const { transitionOrderState } = await import('./orderStateMachine-v2.js');
            await transitionOrderState(shipment.order_id, 'markDelivered');

            await prisma.shipments.update({
                where: { id: shipmentId },
                data: {
                    received_at: new Date(),
                    actual_delivery: new Date()
                }
            });
        }
    }

    validateWebhook(courierCode, payload, signature) {
        const adapter = this.adapters[courierCode.toLowerCase()];
        if (!adapter) return false;
        return adapter.validateWebhook(payload, signature);
    }

    async syncAllActiveShipments() {
        const activeShipments = await prisma.shipments.findMany({
            where: {
                status: { in: ['picked_up', 'in_transit'] },
                OR: [
                    { last_sync_at: null },
                    { last_sync_at: { lte: new Date(Date.now() - 2 * 60 * 60 * 1000) } }
                ]
            },
            take: 100
        });

        for (const shipment of activeShipments) {
            try {
                await this.updateShipmentStatus(shipment.id);
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Failed to sync shipment ${shipment.id}:`, error.message);
            }
        }

        console.log(`Synced ${activeShipments.length} shipments`);
        return activeShipments;
    }
}

export const trackingService = new TrackingService();
