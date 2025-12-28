import { clsx } from 'clsx';

/**
 * Merge class names with clsx
 */
export function cn(...inputs) {
    return clsx(inputs);
}

/**
 * Format currency to Indonesian Rupiah
 */
export function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Generate order number
 */
export function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `INV-${year}${month}${day}-${random}`;
}

/**
 * Generate slug from text
 */
export function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(date, options = {}) {
    const defaultOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        ...options,
    };
    return new Intl.DateTimeFormat('id-ID', defaultOptions).format(new Date(date));
}

/**
 * Format relative time
 */
export function formatRelativeTime(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;

    return formatDate(date);
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(originalPrice, salePrice) {
    if (!originalPrice || !salePrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Format sold count in Shopee style (e.g., 1,2rb for 1200)
 */
export function formatSoldCount(count) {
    if (!count || count === 0) return '0';
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1).replace('.0', '') + 'jt';
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1).replace('.0', '').replace('.', ',') + 'rb';
    }
    return count.toString();
}

/**
 * Calculate cart total
 */
export function calculateCartTotal(items) {
    return items.reduce((total, item) => {
        const price = item.sale_price || item.base_price;
        return total + (price * item.quantity);
    }, 0);
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate Indonesian phone number
 */
export function isValidPhone(phone) {
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
}

/**
 * Format phone number
 */
export function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('62')) {
        return `+${cleaned}`;
    }
    if (cleaned.startsWith('0')) {
        return `+62${cleaned.slice(1)}`;
    }
    return phone;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
}

/**
 * Order status labels in Indonesian
 */
export const ORDER_STATUS_LABELS = {
    PENDING_PAYMENT: 'Menunggu Pembayaran',
    PAID: 'Pembayaran Diterima',
    PROCESSING: 'Sedang Diproses',
    SHIPPED: 'Dikirim',
    DELIVERED: 'Diterima',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
    REFUNDED: 'Dikembalikan',
};

/**
 * Order status colors for badges
 */
export const ORDER_STATUS_COLORS = {
    PENDING_PAYMENT: 'warning',
    PAID: 'primary',
    PROCESSING: 'primary',
    SHIPPED: 'primary',
    DELIVERED: 'success',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    REFUNDED: 'danger',
};
