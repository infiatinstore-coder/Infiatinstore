import { z } from 'zod';

/**
 * Product Schemas
 */
export const ProductCreateSchema = z.object({
    name: z.string().min(3, 'Nama produk minimal 3 karakter').max(200),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug hanya boleh lowercase, angka, dan strip'),
    description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
    categoryId: z.string().uuid('Category ID tidak valid'),
    basePrice: z.number().positive('Harga harus positif').max(999999999),
    salePrice: z.number().positive().max(999999999).optional().nullable(),
    stock: z.number().int().min(0, 'Stok tidak boleh negatif'),
    weight: z.number().int().min(0, 'Berat tidak boleh negatif'),
    images: z.array(z.string().url()).min(1, 'Minimal 1 gambar').max(10, 'Maksimal 10 gambar'),
    isFeatured: z.boolean().optional(),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const ProductSearchSchema = z.object({
    q: z.string().optional(),
    category: z.string().uuid().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sortBy: z.enum(['newest', 'cheapest', 'expensive', 'popular']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});

/**
 * Order Schemas
 */
export const CreateOrderSchema = z.object({
    addressId: z.string().uuid('Address ID tidak valid'),
    items: z.array(z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional().nullable(),
        quantity: z.number().int().min(1, 'Quantity minimal 1').max(999),
    })).min(1, 'Minimal 1 item'),
    voucherCode: z.string().optional(),
    shippingMethod: z.object({
        courier: z.string(),
        service: z.string(),
        cost: z.number().positive(),
        etd: z.string(),
    }),
    usePoints: z.number().int().min(0).optional(),
    notes: z.string().max(500).optional(),
});

export const UpdateOrderStatusSchema = z.object({
    status: z.enum([
        'PENDING_PAYMENT',
        'PAID',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED',
        'REFUNDED',
    ]),
    trackingNumber: z.string().optional(),
    notes: z.string().optional(),
});

/**
 * Auth Schemas
 */
export const RegisterSchema = z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string()
        .min(8, 'Password minimal 8 karakter')
        .regex(/[A-Z]/, 'Password harus ada huruf besar')
        .regex(/[a-z]/, 'Password harus ada huruf kecil')
        .regex(/[0-9]/, 'Password harus ada angka'),
    name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
    phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Nomor telepon tidak valid').optional(),
});

export const LoginSchema = z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(1, 'Password wajib diisi'),
});

export const ResetPasswordSchema = z.object({
    token: z.string().min(1, 'Token tidak valid'),
    password: z.string()
        .min(8, 'Password minimal 8 karakter')
        .regex(/[A-Z]/, 'Password harus ada huruf besar')
        .regex(/[a-z]/, 'Password harus ada huruf kecil')
        .regex(/[0-9]/, 'Password harus ada angka'),
});

/**
 * Review Schemas
 */
export const CreateReviewSchema = z.object({
    productId: z.string().uuid(),
    orderId: z.string().uuid(),
    rating: z.number().int().min(1, 'Rating minimal 1').max(5, 'Rating maksimal 5'),
    title: z.string().max(200).optional(),
    comment: z.string().min(10, 'Review minimal 10 karakter').max(1000),
    images: z.array(z.string().url()).max(5, 'Maksimal 5 gambar').optional(),
});

/**
 * Address Schemas
 */
export const AddressSchema = z.object({
    label: z.enum(['HOME', 'OFFICE', 'OTHER']),
    recipientName: z.string().min(2).max(100),
    phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/),
    provinceId: z.string(),
    provinceName: z.string(),
    cityId: z.string(),
    cityName: z.string(),
    district: z.string().min(2),
    postalCode: z.string().regex(/^[0-9]{5}$/),
    street: z.string().min(5).max(500),
    notes: z.string().max(200).optional(),
    isDefault: z.boolean().optional(),
});

/**
 * Payment Schemas
 */
export const CreatePaymentSchema = z.object({
    orderId: z.string().uuid(),
    paymentMethod: z.string(),
});

/**
 * Voucher Schemas
 */
export const ApplyVoucherSchema = z.object({
    code: z.string().min(3).max(50).toUpperCase(),
    orderTotal: z.number().positive(),
});

/**
 * Flash Sale Schemas
 */
export const CreateFlashSaleSchema = z.object({
    name: z.string().min(3).max(200),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    bannerUrl: z.string().url().optional(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    products: z.array(z.object({
        productId: z.string().uuid(),
        salePrice: z.number().positive(),
        stockLimit: z.number().int().min(1),
    })).min(1),
}).refine(data => data.endTime > data.startTime, {
    message: 'End time harus setelah start time',
    path: ['endTime'],
});

/**
 * Bundle Schemas
 */
export const CreateBundleSchema = z.object({
    name: z.string().min(3).max(200),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    discountValue: z.number().positive(),
    minQuantity: z.number().int().min(2),
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional(),
    products: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
    })).min(2, 'Minimal 2 produk untuk bundle'),
});

/**
 * Helper function to validate request body
 */
export function validateBody(schema) {
    return async (request) => {
        try {
            const body = await request.json();
            return schema.parse(body);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                throw {
                    status: 400,
                    message: 'Validation failed',
                    errors,
                };
            }
            throw error;
        }
    };
}

/**
 * Helper to validate query params
 */
export function validateQuery(schema) {
    return (searchParams) => {
        try {
            const params = Object.fromEntries(searchParams);
            return schema.parse(params);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                throw {
                    status: 400,
                    message: 'Invalid query parameters',
                    errors,
                };
            }
            throw error;
        }
    };
}
