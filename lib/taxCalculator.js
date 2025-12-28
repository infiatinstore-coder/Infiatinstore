/**
 * TAX CALCULATOR
 * PPN 11% calculation for Indonesia
 * Support tax-exempt products
 */

export class TaxCalculator {
    constructor() {
        this.TAX_RATE = 0.11; // PPN 11%
        this.TAX_EXEMPT_CATEGORIES = [
            'basic-food',
            'education',
            'health',
            'books'
        ];
    }

    /**
     * Calculate tax for order items
     */
    calculateOrderTax(items) {
        let subtotal = 0;
        let taxableAmount = 0;
        let taxExemptAmount = 0;
        const itemBreakdown = [];

        for (const item of items) {
            const itemTotal = Number(item.price) * item.quantity;
            subtotal += itemTotal;

            const isTaxExempt = item.product.tax_exempt ||
                this.TAX_EXEMPT_CATEGORIES.includes(item.product.category);

            if (isTaxExempt) {
                taxExemptAmount += itemTotal;
            } else {
                taxableAmount += itemTotal;
            }

            itemBreakdown.push({
                product_id: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                price: item.price,
                total: itemTotal,
                taxable: !isTaxExempt,
                tax: !isTaxExempt ? itemTotal * this.TAX_RATE : 0
            });
        }

        const totalTax = taxableAmount * this.TAX_RATE;

        return {
            subtotal,
            taxableAmount, // DPP
            taxExemptAmount,
            totalTax, // PPN
            itemBreakdown
        };
    }

    /**
     * Calculate total including tax and shipping
     */
    calculateTotal(subtotal, totalTax, shippingCost = 0) {
        return subtotal + totalTax + shippingCost;
    }

    /**
     * Format amount to Rupiah
     */
    formatRupiah(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Convert number to words (Terbilang)
     * Simple implementation for invoice compliance
     */
    toWords(amount) {
        if (amount === 0) return 'Nol Rupiah';

        // For production, use library like 'terbilang-indo' or implement full logic
        // This is a simplified placeholder
        const millions = Math.floor(amount / 1000000);
        const thousands = Math.floor((amount % 1000000) / 1000);

        let words = '';
        if (millions > 0) words += `${millions} Juta `;
        if (thousands > 0) words += `${thousands} Ribu `;
        words += 'Rupiah';

        return words.trim();
    }
}

export const taxCalculator = new TaxCalculator();
