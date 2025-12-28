/**
 * EMAIL SERVICE & NOTIFICATION SYSTEM
 * Handles transactional emails, queues, and templates
 */

import prisma from './prisma';

// Mock transporter (Replace with Resend/Nodemailer in production)
const mockSendEmail = async (to, subject, html) => {
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, id: `msg_${Date.now()}` };
};

export class EmailService {

    /**
     * Queue an email for sending
     */
    async queueEmail(recipient, template, data, priority = 0) {
        if (!recipient) return null;

        return await prisma.email_queue.create({
            data: {
                recipient,
                template,
                data,
                priority,
                status: 'PENDING'
            }
        });
    }

    /**
     * Process email queue (run via cron)
     * Limit to batch size to prevent rate limits
     */
    async processQueue(batchSize = 20) {
        const pendingEmails = await prisma.email_queue.findMany({
            where: {
                status: 'PENDING',
                attempts: { lt: 3 }
            },
            orderBy: [
                { priority: 'desc' },
                { created_at: 'asc' }
            ],
            take: batchSize
        });

        console.log(`Processing ${pendingEmails.length} emails from queue...`);

        for (const email of pendingEmails) {
            try {
                const { subject, html } = this.renderTemplate(email.template, email.data);

                await mockSendEmail(email.recipient, subject, html);

                await prisma.email_queue.update({
                    where: { id: email.id },
                    data: {
                        status: 'SENT',
                        sent_at: new Date(),
                        attempts: { increment: 1 }
                    }
                });

            } catch (error) {
                console.error(`Failed to send email ${email.id}:`, error);

                await prisma.email_queue.update({
                    where: { id: email.id },
                    data: {
                        status: 'FAILED',
                        last_attempt_at: new Date(),
                        attempts: { increment: 1 },
                        error_log: error.message
                    }
                });
            }
        }
    }

    /**
     * Send order confirmation (Critical)
     */
    async sendOrderConfirmation(order) {
        return this.queueEmail(
            order.guest_email || order.users?.email,
            'order_confirmation',
            {
                orderNumber: order.order_number,
                total: order.total,
                items: order.order_items,
                shipping_address: order.shipping_address
            },
            10 // High priority
        );
    }

    /**
     * Send payment reminder (Critical)
     */
    async sendPaymentReminder(order) {
        return this.queueEmail(
            order.guest_email || order.users?.email,
            'payment_reminder',
            {
                orderNumber: order.order_number,
                amount: order.total,
                expiryTime: order.payment_expires_at,
                paymentLink: `/checkout/payment?orderId=${order.order_number}`
            },
            10
        );
    }

    /**
     * Send abandoned cart reminder (Marketing)
     */
    async sendAbandonedCart(cart, user) {
        if (!user.email) return;

        return this.queueEmail(
            user.email,
            'abandoned_cart',
            {
                customerName: user.name,
                item_count: cart.items.length,
                recoveryLink: `/cart?recover=${cart.id}`
            },
            5 // Medium priority
        );
    }

    /**
     * Template Engine (Basic replacement)
     */
    renderTemplate(templateName, data) {
        switch (templateName) {
            case 'order_confirmation':
                return {
                    subject: `Order Confirmed #${data.orderNumber}`,
                    html: `<h1>Thank you for your order!</h1><p>Order #${data.orderNumber} confirmed.</p>`
                };
            case 'payment_reminder':
                return {
                    subject: `Payment Reminder for #${data.orderNumber}`,
                    html: `<h1>Please complete your payment</h1><p>Total: ${data.amount}</p>`
                };
            case 'abandoned_cart':
                return {
                    subject: `You left something behind!`,
                    html: `<p>Come back and finish your purchase.</p>`
                };
            default:
                throw new Error(`Unknown template: ${templateName}`);
        }
    }
}

export const emailService = new EmailService();
