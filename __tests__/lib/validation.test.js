/**
 * Simplified API Tests - Testing Validation Logic
 */

import { ProductCreateSchema, LoginSchema, CreateOrderSchema } from '@/lib/validation';

describe('API Validation Tests', () => {
    describe('Product Validation', () => {
        it('should accept valid product data', () => {
            const validData = {
                name: 'iPhone 15 Pro',
                slug: 'iphone-15-pro',
                description: 'Latest Apple smartphone with amazing features',
                categoryId: '123e4567-e89b-12d3-a456-426614174000',
                basePrice: 20000000,
                stock: 50,
                weight: 200,
                images: ['https://example.com/image1.jpg'],
            };

            const result = ProductCreateSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject product with invalid slug', () => {
            const invalidData = {
                name: 'iPhone 15 Pro',
                slug: 'iPhone 15 Pro!', // Invalid: has spaces and special chars
                description: 'Latest Apple smartphone with amazing features',
                categoryId: '123e4567-e89b-12d3-a456-426614174000',
                basePrice: 20000000,
                stock: 50,
                weight: 200,
                images: ['https://example.com/image1.jpg'],
            };

            const result = ProductCreateSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject product with negative price', () => {
            const invalidData = {
                name: 'iPhone 15 Pro',
                slug: 'iphone-15-pro',
                description: 'Latest Apple smartphone',
                categoryId: '123e4567-e89b-12d3-a456-426614174000',
                basePrice: -1000, // Invalid: negative price
                stock: 50,
                weight: 200,
                images: ['https://example.com/image1.jpg'],
            };

            const result = ProductCreateSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('Login Validation', () => {
        it('should accept valid login data', () => {
            const validData = {
                email: 'user@example.com',
                password: 'Password123',
            };

            const result = LoginSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid email', () => {
            const invalidData = {
                email: 'not-an-email',
                password: 'Password123',
            };

            const result = LoginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject empty password', () => {
            const invalidData = {
                email: 'user@example.com',
                password: '',
            };

            const result = LoginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('Order Validation', () => {
        it('should accept valid order data', () => {
            const validData = {
                addressId: '123e4567-e89b-12d3-a456-426614174000',
                items: [
                    { productId: '123e4567-e89b-12d3-a456-426614174001', quantity: 2 }
                ],
                shippingMethod: {
                    courier: 'jne',
                    service: 'REG',
                    cost: 25000,
                    etd: '2-3 hari',
                },
            };

            const result = CreateOrderSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject order with empty items', () => {
            const invalidData = {
                addressId: '123e4567-e89b-12d3-a456-426614174000',
                items: [], // Invalid: empty items
                shippingMethod: {
                    courier: 'jne',
                    service: 'REG',
                    cost: 25000,
                    etd: '2-3 hari',
                },
            };

            const result = CreateOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject order with invalid quantity', () => {
            const invalidData = {
                addressId: '123e4567-e89b-12d3-a456-426614174000',
                items: [
                    { productId: '123e4567-e89b-12d3-a456-426614174001', quantity: 0 } // Invalid: quantity 0
                ],
                shippingMethod: {
                    courier: 'jne',
                    service: 'REG',
                    cost: 25000,
                    etd: '2-3 hari',
                },
            };

            const result = CreateOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
