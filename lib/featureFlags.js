/**
 * FEATURE FLAGS CONFIGURATION
 * 
 * Admin dapat mengubah nilai ini dari dashboard /admin/settings
 * Fitur yang di-disable akan menampilkan halaman "Segera Hadir" 
 */

// Default feature flags (bisa di-override dari database/env)
export const DEFAULT_FEATURES = {
    // Points System
    POINTS_REDEEM: {
        enabled: false,
        name: 'Tukar Koin',
        description: 'User bisa tukar koin dengan voucher diskon',
        category: 'points',
    },
    POINTS_MISSIONS: {
        enabled: false,
        name: 'Misi Harian',
        description: 'User bisa selesaikan misi untuk dapat koin',
        category: 'points',
    },
    POINTS_HISTORY: {
        enabled: true,
        name: 'Riwayat Koin',
        description: 'User bisa lihat riwayat transaksi koin',
        category: 'points',
    },

    // Affiliate System
    AFFILIATE_PROGRAM: {
        enabled: false,
        name: 'Program Afiliasi',
        description: 'User bisa daftar jadi affiliate dan dapat komisi',
        category: 'affiliate',
    },

    // Chat System
    LIVE_CHAT: {
        enabled: true,
        name: 'Live Chat',
        description: 'User bisa chat langsung dengan admin',
        category: 'support',
    },

    // Flash Sale
    FLASH_SALE: {
        enabled: true,
        name: 'Flash Sale',
        description: 'Promo flash sale dengan timer countdown',
        category: 'promo',
    },

    // Guest Checkout
    GUEST_CHECKOUT: {
        enabled: true,
        name: 'Guest Checkout',
        description: 'User bisa checkout tanpa login',
        category: 'checkout',
    },

    // COD Payment
    COD_PAYMENT: {
        enabled: true,
        name: 'Bayar di Tempat (COD)',
        description: 'Metode pembayaran Cash on Delivery',
        category: 'payment',
    },
};

// In-memory cache for feature flags
let featureFlagsCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Get all feature flags
 */
export async function getFeatureFlags() {
    const now = Date.now();

    // Return cache if still valid
    if (featureFlagsCache && (now - lastFetchTime) < CACHE_TTL) {
        return featureFlagsCache;
    }

    try {
        // Try to get from database
        const { default: prisma } = await import('./prisma');

        const settings = await prisma.setting.findFirst({
            where: { key: 'feature_flags' }
        });

        if (settings && settings.value) {
            const dbFlags = JSON.parse(settings.value);
            // Merge with defaults (in case new flags added)
            featureFlagsCache = { ...DEFAULT_FEATURES };
            for (const key of Object.keys(dbFlags)) {
                if (featureFlagsCache[key]) {
                    featureFlagsCache[key].enabled = dbFlags[key];
                }
            }
        } else {
            featureFlagsCache = DEFAULT_FEATURES;
        }

        lastFetchTime = now;
        return featureFlagsCache;
    } catch (error) {
        console.error('Failed to fetch feature flags:', error);
        return DEFAULT_FEATURES;
    }
}

/**
 * Check if a specific feature is enabled
 */
export async function isFeatureEnabled(featureKey) {
    const flags = await getFeatureFlags();
    return flags[featureKey]?.enabled ?? false;
}

/**
 * Update feature flags (admin only)
 */
export async function updateFeatureFlags(newFlags) {
    try {
        const { default: prisma } = await import('./prisma');

        // Convert to simple key:boolean format for storage
        const flagsToStore = {};
        for (const [key, value] of Object.entries(newFlags)) {
            flagsToStore[key] = typeof value === 'boolean' ? value : value.enabled;
        }

        await prisma.setting.upsert({
            where: { key: 'feature_flags' },
            update: { value: JSON.stringify(flagsToStore) },
            create: { key: 'feature_flags', value: JSON.stringify(flagsToStore) }
        });

        // Clear cache
        featureFlagsCache = null;

        return { success: true };
    } catch (error) {
        console.error('Failed to update feature flags:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get feature flags for client-side (safe, no sensitive data)
 */
export async function getClientFeatureFlags() {
    const flags = await getFeatureFlags();
    const clientFlags = {};

    for (const [key, value] of Object.entries(flags)) {
        clientFlags[key] = value.enabled;
    }

    return clientFlags;
}
