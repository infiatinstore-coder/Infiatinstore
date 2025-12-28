/**
 * PRICE VALIDATION UTILITIES
 * Prevents catastrophic pricing errors
 */

/**
 * Validate price change to prevent typos and fraud
 */
export function validatePriceChange(oldPrice, newPrice, options = {}) {
    const {
        maxChangePercent = 50, // Max 50% change without approval
        minPrice = 1000, // Minimum Rp 1,000
        maxPrice = 100000000, // Max Rp 100,000,000
    } = options;

    const errors = [];

    // Check minimum price
    if (newPrice < minPrice) {
        errors.push(`Harga tidak boleh kurang dari Rp ${minPrice.toLocaleString('id-ID')}`);
    }

    // Check maximum price (prevent absurd typos)
    if (newPrice > maxPrice) {
        errors.push(`Harga tidak boleh lebih dari Rp ${maxPrice.toLocaleString('id-ID')}`);
    }

    // Check drastic change
    if (oldPrice && oldPrice > 0) {
        const changePercent = Math.abs((newPrice - oldPrice) / oldPrice) * 100;

        if (changePercent > maxChangePercent) {
            errors.push(
                `Perubahan harga terlalu besar (${changePercent.toFixed(1)}%). ` +
                `Maksimal ${maxChangePercent}% tanpa approval manager.`
            );
        }
    }

    // Check for decimal precision (max 2 decimal places for Rupiah)
    const decimalPlaces = (newPrice.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
        errors.push('Harga maksimal 2 angka desimal');
    }

    return {
        valid: errors.length === 0,
        errors,
        changePercent: oldPrice ? Math.abs((newPrice - oldPrice) / oldPrice) * 100 : 0,
        needsApproval: oldPrice ? Math.abs((newPrice - oldPrice) / oldPrice) * 100 > maxChangePercent : false
    };
}

/**
 * Validate discount percentage
 */
export function validateDiscount(basePrice, salePrice) {
    if (!salePrice) return { valid: true, discountPercent: 0 };

    const errors = [];

    if (salePrice >= basePrice) {
        errors.push('Harga diskon harus lebih rendah dari harga normal');
    }

    const discountPercent = ((basePrice - salePrice) / basePrice) * 100;

    if (discountPercent > 90) {
        errors.push('Diskon maksimal 90%');
    }

    if (discountPercent < 1) {
        errors.push('Diskon minimal 1%');
    }

    return {
        valid: errors.length === 0,
        errors,
        discountPercent
    };
}

/**
 * Validate flash sale price
 */
export function validateFlashSalePrice(basePrice, flashSalePrice) {
    const errors = [];

    if (flashSalePrice >= basePrice) {
        errors.push('Harga Flash Sale harus lebih rendah dari harga normal');
    }

    const discountPercent = ((basePrice - flashSalePrice) / basePrice) * 100;

    if (discountPercent < 10) {
        errors.push('Diskon Flash Sale minimal 10%');
    }

    if (discountPercent > 80) {
        errors.push('Diskon Flash Sale maksimal 80%');
    }

    return {
        valid: errors.length === 0,
        errors,
        discountPercent
    };
}

/**
 * Format price for display
 */
export function formatPrice(price, includeSymbol = true) {
    const formatted = new Intl.NumberFormat('id-ID').format(price);
    return includeSymbol ? `Rp ${formatted}` : formatted;
}

/**
 * Round price to nearest valid amount
 * E.g., 12,345 -> 12,000 or 12,500
 */
export function roundPrice(price, roundTo = 1000) {
    return Math.round(price / roundTo) * roundTo;
}
