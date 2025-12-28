const fs = require('fs');
const path = require('path');

// Field name mappings: camelCase -> snake_case (in Prisma queries)
const fieldMappings = {
    // Timestamps
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
    'paidAt': 'paid_at',
    'processedAt': 'processed_at',
    'emailVerifiedAt': 'email_verified_at',
    'shippedAt': 'shipped_at',
    'deliveredAt': 'delivered_at',
    'cancelledAt': 'cancelled_at',
    'resolvedAt': 'resolved_at',
    'readAt': 'read_at',
    'sentAt': 'sent_at',
    'issuedAt': 'issued_at',
    'validFrom': 'valid_from',
    'validUntil': 'valid_until',
    'startTime': 'start_time',
    'endTime': 'end_time',

    // IDs  
    'userId': 'user_id',
    'productId': 'product_id',
    'categoryId': 'category_id',
    'orderId': 'order_id',
    'addressId': 'address_id',
    'voucherId': 'voucher_id',
    'paymentId': 'payment_id',
    'affiliateId': 'affiliate_id',
    'bundleId': 'bundle_id',
    'flashSaleId': 'flash_sale_id',

    // Price fields
    'basePrice': 'base_price',
    'salePrice': 'sale_price',
    'totalAmount': 'total_amount',
    'subtotalAmount': 'subtotal_amount',
    'discountAmount': 'discount_amount',
    'shippingCost': 'shipping_cost',
    'taxAmount': 'tax_amount',
    'finalAmount': 'final_amount',
    'refundAmount': 'refund_amount',
    'orderAmount': 'order_amount',
    'commissionRate': 'commission_rate',
    'commissionAmount': 'commission_amount',
    'totalEarnings': 'total_earnings',
    'availableBalance': 'available_balance',
    'minPurchase': 'min_purchase',
    'maxDiscount': 'max_discount',
    'usageLimit': 'usage_limit',
    'usedCount': 'used_count',
    'stockLimit': 'stock_limit',
    'soldCount': 'sold_count',
    'unitPrice': 'unit_price',

    // Boolean
    'isFeatured': 'is_featured',
    'isDefault': 'is_default',
    'isAdmin': 'is_admin',
    'isHelpful': 'is_helpful',

    // String fields
    'recipientName': 'recipient_name',
    'fullAddress': 'full_address',
    'postalCode': 'postal_code',
    'bankAccount': 'bank_account',
    'proofUrl': 'proof_url',
    'referralCode': 'referral_code',
    'passwordHash': 'password_hash',
    'avatarUrl': 'avatar_url',
    'googleId': 'google_id',
    'verificationToken': 'verification_token',
    'resetPasswordToken': 'reset_password_token',
    'imageUrl': 'image_url',
    'seoMetadata': 'seo_metadata',
    'trackingNumber': 'tracking_number',
    'shippingAddress': 'shipping_address',
    'customerNote': 'customer_note',
    'adminNotes': 'admin_notes',
    'gatewayTransactionId': 'gateway_transaction_id',
    'gatewayResponse': 'gateway_response',
    'paymentMethod': 'payment_method',
    'refundType': 'refund_type',
    'rejectedReason': 'rejected_reason',
    'resolvedBy': 'resolved_by',
    'processedBy': 'processed_by',
    'ipAddress': 'ip_address',
    'userAgent': 'user_agent',
    'entityType': 'entity_type',
    'entityId': 'entity_id',
    'invoiceNumber': 'invoice_number',
    'taxId': 'tax_id',
    'buyerName': 'buyer_name',
    'buyerAddress': 'buyer_address',
    'invoiceData': 'invoice_data',
    'pdfUrl': 'pdf_url',
    'itemCount': 'item_count',
    'variantInfo': 'variant_info',
    'riskScore': 'risk_score',
    'riskFactors': 'risk_factors',
    'eventType': 'event_type',
    'eventData': 'event_data',
    'totalReferrals': 'total_referrals',
};

let fixedCount = 0;

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            processDir(p);
        } else if (f.endsWith('.js')) {
            let content = fs.readFileSync(p, 'utf8');
            let changed = false;

            for (const [camelCase, snakeCase] of Object.entries(fieldMappings)) {
                // Replace in object keys: { createdAt: ... } -> { created_at: ... }
                // And in orderBy/where clauses

                // Pattern 1: { field: value }
                const pattern1 = new RegExp(`([{,\\s])${camelCase}(\\s*:)`, 'g');
                if (content.match(pattern1)) {
                    content = content.replace(pattern1, `$1${snakeCase}$2`);
                    changed = true;
                }

                // Pattern 2: .field (accessing property)
                // Be careful not to replace in regular object access that should stay camelCase
                // Only replace in Prisma-specific contexts
            }

            if (changed) {
                fs.writeFileSync(p, content);
                fixedCount++;
                console.log('Fixed:', p);
            }
        }
    });
}

processDir('app/api');
processDir('lib');
console.log('\nTotal files fixed:', fixedCount);
