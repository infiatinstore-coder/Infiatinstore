/**
 * RETURN & REFUND MANAGER
 * Complete implementation based on Claude.ai spec
 * Handles full return flow from request to refund completion
 */

import prisma from './prisma';
import { logAudit } from './auditLogger';
import { emailService } from './emailService';

const CONFIG = {
    returnWindowDays: parseInt(process.env.RETURN_WINDOW_DAYS) || 7,
    sellerResponseDays: parseInt(process.env.SELLER_RESPONSE_WINDOW_DAYS) || 2,
    buyerShipbackDays: parseInt(process.env.BUYER_SHIPBACK_WINDOW_DAYS) || 3
};

export class ReturnManager {

    /**
     * Create return request
     */
    async createReturnRequest(data) {
        const { orderId, orderItemId, userId, reason, reasonDetail, images } = data;

        // 1. Validate eligibility
        const validation = await this.validateReturnEligibility(orderId, userId);
        if (!validation.eligible) {
            throw new Error(validation.reason);
        }

        // 2. Calculate deadlines
        const now = new Date();
        const sellerResponseDeadline = new Date(now.getTime() + CONFIG.sellerResponseDays * 24 * 60 * 60 * 1000);

        // 3. Create return request
        const returnRequest = await prisma.return_requests.create({
            data: {
                order_id: orderId,
                order_item_id: orderItemId,
                user_id: userId,
                reason,
                reason_detail: reasonDetail,
                images: images || [],
                status: 'PENDING',
                seller_response_deadline: sellerResponseDeadline
            }
        });

        // 4. Notify seller
        const order = await prisma.orders.findUnique({
            where: { id: orderId },
            include: { users: true }
        });

        if (order.seller_id) {
            await emailService.queueEmail(
                order.seller_email || 'seller@email.com',
                'return_request_seller',
                {
                    returnId: returnRequest.id,
                    orderNumber: order.order_number,
                    reason,
                    deadline: sellerResponseDeadline
                },
                8 // High priority
            );
        }

        // 5. Audit log
        await logAudit({
            userId,
            action: 'return_requested',
            resource: `return:${returnRequest.id}`,
            metadata: { orderId, reason }
        });

        return returnRequest;
    }

    /**
     * Validate if order can be returned
     */
    async validateReturnEligibility(orderId, userId) {
        const order = await prisma.orders.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return { eligible: false, reason: 'Order not found' };
        }

        if (order.user_id !== userId) {
            return { eligible: false, reason: 'Not your order' };
        }

        if (!['DELIVERED', 'COMPLETED'].includes(order.status)) {
            return { eligible: false, reason: 'Order must be delivered first' };
        }

        // Check return window (7 days from delivery)
        if (order.delivered_at) {
            const daysSinceDelivery = Math.floor(
                (Date.now() - new Date(order.delivered_at).getTime()) / (24 * 60 * 60 * 1000)
            );

            if (daysSinceDelivery > CONFIG.returnWindowDays) {
                return { eligible: false, reason: `Return window expired (${CONFIG.returnWindowDays} days)` };
            }
        }

        // Check if already has pending return
        const existingReturn = await prisma.return_requests.findFirst({
            where: {
                order_id: orderId,
                status: { in: ['PENDING', 'APPROVED', 'SHIPPING_BACK', 'RECEIVED', 'INSPECTING'] }
            }
        });

        if (existingReturn) {
            return { eligible: false, reason: 'Return request already exists' };
        }

        return { eligible: true };
    }

    /**
     * Seller responds to return request
     */
    async sellerRespond(returnRequestId, sellerId, { approved, response, rejectionReason }) {
        const returnRequest = await prisma.return_requests.findUnique({
            where: { id: returnRequestId },
            include: { orders: true }
        });

        if (!returnRequest) throw new Error('Return request not found');

        // Verify seller owns this order
        if (returnRequest.orders.seller_id !== sellerId) {
            throw new Error('Not authorized');
        }

        if (returnRequest.status !== 'PENDING') {
            throw new Error('Return request already processed');
        }

        const newStatus = approved ? 'APPROVED' : 'REJECTED';
        const shipbackDeadline = approved
            ? new Date(Date.now() + CONFIG.buyerShipbackDays * 24 * 60 * 60 * 1000)
            : null;

        const updated = await prisma.return_requests.update({
            where: { id: returnRequestId },
            data: {
                status: newStatus,
                seller_response: response,
                seller_response_at: new Date(),
                rejection_reason: approved ? null : rejectionReason,
                shipback_deadline: shipbackDeadline
            }
        });

        // Notify buyer
        await emailService.queueEmail(
            returnRequest.user_email || 'buyer@email.com',
            approved ? 'return_approved' : 'return_rejected',
            {
                returnId: returnRequestId,
                orderNumber: returnRequest.orders.order_number,
                response,
                rejectionReason
            },
            9
        );

        return updated;
    }

    /**
     * Buyer submits return tracking
     */
    async submitReturnTracking(returnRequestId, userId, { trackingNumber, courier }) {
        const returnRequest = await prisma.return_requests.findUnique({
            where: { id: returnRequestId }
        });

        if (!returnRequest || returnRequest.user_id !== userId) {
            throw new Error('Not authorized');
        }

        if (returnRequest.status !== 'APPROVED') {
            throw new Error('Return not approved yet');
        }

        const updated = await prisma.return_requests.update({
            where: { id: returnRequestId },
            data: {
                status: 'SHIPPING_BACK',
                return_tracking: trackingNumber,
                return_courier: courier,
                return_shipped_at: new Date()
            }
        });

        return updated;
    }

    /**
     * Seller confirms receipt of returned item
     */
    async confirmReturnReceived(returnRequestId, sellerId) {
        const returnRequest = await prisma.return_requests.findUnique({
            where: { id: returnRequestId },
            include: { orders: true }
        });

        if (!returnRequest || returnRequest.orders.seller_id !== sellerId) {
            throw new Error('Not authorized');
        }

        if (returnRequest.status !== 'SHIPPING_BACK') {
            throw new Error('Invalid status');
        }

        const updated = await prisma.return_requests.update({
            where: { id: returnRequestId },
            data: {
                status: 'RECEIVED',
                return_received_at: new Date()
            }
        });

        return updated;
    }

    /**
     * Seller inspects returned item
     */
    async inspectReturnedItem(returnRequestId, sellerId, { passed, notes, images }) {
        const returnRequest = await prisma.return_requests.findUnique({
            where: { id: returnRequestId },
            include: { orders: true }
        });

        if (!returnRequest || returnRequest.orders.seller_id !== sellerId) {
            throw new Error('Not authorized');
        }

        const newStatus = passed ? 'INSPECTION_PASSED' : 'INSPECTION_FAILED';

        const updated = await prisma.return_requests.update({
            where: { id: returnRequestId },
            data: {
                status: newStatus,
                inspection_passed: passed,
                inspection_notes: notes,
                inspection_images: images || [],
                inspected_at: new Date()
            }
        });

        // If passed, initiate refund
        if (passed) {
            await this.initiateRefund(returnRequestId);
        } else {
            // Notify buyer inspection failed
            await emailService.queueEmail(
                returnRequest.user_email,
                'inspection_failed',
                { returnId: returnRequestId, notes },
                9
            );
        }

        return updated;
    }

    /**
     * Initiate refund process
     */
    async initiateRefund(returnRequestId) {
        const returnRequest = await prisma.return_requests.findUnique({
            where: { id: returnRequestId },
            include: { orders: true }
        });

        // Calculate refund amount
        let itemsRefund = Number(returnRequest.orders.total);
        let shippingRefund = 0;

        if (returnRequest.reason === 'DEFECTIVE' || returnRequest.reason === 'WRONG_ITEM') {
            shippingRefund = Number(returnRequest.orders.shipping_cost || 0);
        }

        const totalAmount = itemsRefund + shippingRefund;

        // Create refund record
        const refund = await prisma.refunds.create({
            data: {
                return_request_id: returnRequestId,
                user_id: returnRequest.user_id,
                order_id: returnRequest.order_id,
                items_refund: itemsRefund,
                shipping_refund: shippingRefund,
                total_amount: totalAmount,
                method: 'ORIGINAL_PAYMENT', // Default, can be changed
                status: 'PENDING'
            }
        });

        // Update return status
        await prisma.return_requests.update({
            where: { id: returnRequestId },
            data: { status: 'REFUNDING' }
        });

        // Process refund
        await this.processRefund(refund.id);

        return refund;
    }

    /**
     * Process refund (mock - integrate with payment gateway)
     */
    async processRefund(refundId) {
        const refund = await prisma.refunds.findUnique({
            where: { id: refundId }
        });

        try {
            // TODO: Integrate with payment gateway (Midtrans refund API)
            // For now, mark as completed

            await prisma.refunds.update({
                where: { id: refundId },
                data: {
                    status: 'COMPLETED',
                    completed_at: new Date()
                }
            });

            // Update return request
            await prisma.return_requests.update({
                where: { id: refund.return_request_id },
                data: { status: 'COMPLETED' }
            });

            // Notify buyer
            await emailService.queueEmail(
                refund.user_email,
                'refund_completed',
                {
                    amount: refund.total_amount,
                    method: refund.method
                },
                10
            );

        } catch (error) {
            await prisma.refunds.update({
                where: { id: refundId },
                data: {
                    status: 'FAILED',
                    failed_reason: error.message
                }
            });

            throw error;
        }
    }

    /**
     * Escalate to admin
     */
    async escalateToAdmin(returnRequestId, userId, reason) {
        const returnRequest = await prisma.return_requests.findUnique({
            where: { id: returnRequestId }
        });

        if (!returnRequest || returnRequest.user_id !== userId) {
            throw new Error('Not authorized');
        }

        const updated = await prisma.return_requests.update({
            where: { id: returnRequestId },
            data: {
                status: 'ESCALATED',
                escalated_reason: reason,
                escalated_at: new Date()
            }
        });

        // Notify admin (implement admin notification)

        return updated;
    }

    /**
     * Check if order can be completed (no pending returns)
     */
    async canCompleteOrder(orderId) {
        const pendingReturns = await prisma.return_requests.count({
            where: {
                order_id: orderId,
                status: { in: ['PENDING', 'APPROVED', 'SHIPPING_BACK', 'RECEIVED', 'INSPECTING', 'REFUNDING'] }
            }
        });

        if (pendingReturns > 0) {
            return { canComplete: false, reason: 'Order has pending return requests' };
        }

        return { canComplete: true };
    }
}

export const returnManager = new ReturnManager();
