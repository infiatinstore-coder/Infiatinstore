/**
 * Utility Functions Tests
 * Testing helper functions
 */

import { formatRupiah, generateOrderNumber, slugify } from '@/lib/utils';

describe('Utility Functions', () => {
    describe('formatRupiah', () => {
        it('should format number to Rupiah', () => {
            const result1 = formatRupiah(1000000);
            const result2 = formatRupiah(500000);
            const result3 = formatRupiah(0);

            // Just check it contains Rp and numbers
            expect(result1).toContain('Rp');
            expect(result1).toContain('1');
            expect(result2).toContain('Rp');
            expect(result3).toContain('Rp');
            expect(result3).toContain('0');
        });

        it('should handle decimal numbers', () => {
            const result = formatRupiah(1000000.50);
            expect(result).toContain('Rp');
            expect(result).toContain('1');
        });
    });

    describe('generateOrderNumber', () => {
        it('should generate order number with correct format', () => {
            const orderNumber = generateOrderNumber();
            expect(orderNumber).toMatch(/^INV-\d{6}-[A-Z0-9]+$/);
        });

        it('should generate unique order numbers', () => {
            const num1 = generateOrderNumber();
            const num2 = generateOrderNumber();
            expect(num1).not.toBe(num2);
        });
    });

    describe('slugify', () => {
        it('should convert string to slug', () => {
            expect(slugify('iPhone 15 Pro Max')).toBe('iphone-15-pro-max');
            expect(slugify('Laptop Gaming ASUS ROG')).toBe('laptop-gaming-asus-rog');
        });

        it('should handle special characters', () => {
            expect(slugify('Product & Service!')).toBe('product-service');
            expect(slugify('100% Original')).toBe('100-original');
        });

        it('should handle whitespace', () => {
            expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
        });
    });
});
