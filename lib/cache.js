/**
 * Redis Cache Layer (like Shopee/Tokopedia)
 * 
 * For production: Install Redis and use ioredis
 * For development: Use in-memory cache
 */

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.ttlTimers = new Map();

        // Try to connect to Redis if available
        this.redisClient = null;
        this.initRedis();
    }

    async initRedis() {
        try {
            if (process.env.REDIS_URL) {
                const Redis = (await import('ioredis')).default;
                this.redisClient = new Redis(process.env.REDIS_URL, {
                    retryStrategy: (times) => {
                        if (times > 3) {
                            console.warn('Redis connection failed, using in-memory cache');
                            return null;
                        }
                        return Math.min(times * 100, 3000);
                    },
                });

                this.redisClient.on('error', (err) => {
                    console.error('Redis error:', err);
                    this.redisClient = null;
                });

                console.log('✅ Redis connected');
            }
        } catch (error) {
            console.warn('Redis not available, using in-memory cache');
        }
    }

    /**
     * Get value from cache
     */
    async get(key) {
        if (this.redisClient) {
            try {
                const value = await this.redisClient.get(key);
                return value ? JSON.parse(value) : null;
            } catch (error) {
                console.error('Redis get error:', error);
            }
        }

        return this.cache.get(key);
    }

    /**
     * Set value in cache with TTL
     */
    async set(key, value, ttl = 300) {
        if (this.redisClient) {
            try {
                await this.redisClient.setex(key, ttl, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Redis set error:', error);
            }
        }

        // In-memory fallback
        this.cache.set(key, value);

        // Clear existing timer
        if (this.ttlTimers.has(key)) {
            clearTimeout(this.ttlTimers.get(key));
        }

        // Set new timer
        const timer = setTimeout(() => {
            this.cache.delete(key);
            this.ttlTimers.delete(key);
        }, ttl * 1000);

        this.ttlTimers.set(key, timer);
        return true;
    }

    /**
     * Delete from cache
     */
    async del(key) {
        if (this.redisClient) {
            try {
                await this.redisClient.del(key);
            } catch (error) {
                console.error('Redis del error:', error);
            }
        }

        if (this.ttlTimers.has(key)) {
            clearTimeout(this.ttlTimers.get(key));
            this.ttlTimers.delete(key);
        }

        this.cache.delete(key);
    }

    /**
     * Delete all keys matching pattern
     */
    async delPattern(pattern) {
        if (this.redisClient) {
            try {
                const keys = await this.redisClient.keys(pattern);
                if (keys.length > 0) {
                    await this.redisClient.del(...keys);
                }
            } catch (error) {
                console.error('Redis delPattern error:', error);
            }
        }

        // In-memory: delete matching keys
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.del(key);
            }
        }
    }

    /**
     * Clear all cache
     */
    async flush() {
        if (this.redisClient) {
            try {
                await this.redisClient.flushdb();
            } catch (error) {
                console.error('Redis flush error:', error);
            }
        }

        this.cache.clear();
        for (const timer of this.ttlTimers.values()) {
            clearTimeout(timer);
        }
        this.ttlTimers.clear();
    }
}

// Singleton instance
const cache = new CacheManager();

/**
 * Cache key generators
 */
export const CacheKeys = {
    product: (slug) => `product:${slug}`,
    productList: (query) => `products:${JSON.stringify(query)}`,
    category: (id) => `category:${id}`,
    categoryList: () => 'categories:all',
    flashSale: () => 'flash-sales:active',
    bundles: (productId) => productId ? `bundles:product:${productId}` : 'bundles:all',
    recommendations: (productSlug) => `recommendations:${productSlug}`,
    userPoints: (userId) => `points:user:${userId}`,
    cart: (userId) => `cart:${userId}`,
};

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CacheTTL = {
    PRODUCT: 300,        // 5 minutes
    PRODUCT_LIST: 60,    // 1 minute
    CATEGORY: 600,       // 10 minutes
    FLASH_SALE: 30,      // 30 seconds (frequently changing)
    BUNDLE: 300,         // 5 minutes
    RECOMMENDATIONS: 600,// 10 minutes
    USER_DATA: 180,      // 3 minutes
    CART: 300,           // 5 minutes
};

/**
 * High-level cache helpers
 */
export async function getCached(key) {
    return cache.get(key);
}

export async function setCached(key, value, ttl = CacheTTL.PRODUCT) {
    return cache.set(key, value, ttl);
}

export async function deleteCached(key) {
    return cache.del(key);
}

export async function deletePattern(pattern) {
    return cache.delPattern(pattern);
}

export async function flushCache() {
    return cache.flush();
}

/**
 * Cache wrapper for functions
 */
export async function withCache(key, fn, ttl = CacheTTL.PRODUCT) {
    // Try to get from cache
    const cached = await getCached(key);
    if (cached !== null && cached !== undefined) {
        return cached;
    }

    // Execute function
    const result = await fn();

    // Store in cache
    if (result !== null && result !== undefined) {
        await setCached(key, result, ttl);
    }

    return result;
}

/**
 * Invalidate cache on data changes
 */
export const InvalidateCache = {
    product: async (productId) => {
        await deletePattern(`product:*`);
        await deletePattern(`products:*`);
        await deletePattern(`recommendations:*`);
    },

    category: async () => {
        await deletePattern(`category:*`);
        await deletePattern(`categories:*`);
    },

    order: async (userId) => {
        await deleteCached(CacheKeys.cart(userId));
        await deleteCached(CacheKeys.userPoints(userId));
    },

    flashSale: async () => {
        await deleteCached(CacheKeys.flashSale());
    },

    bundle: async () => {
        await deletePattern(`bundles:*`);
    },
};

export default cache;
