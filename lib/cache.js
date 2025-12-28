/**
 * CACHING WRAPPER
 * Simple abstraction for Redis/Memory cache
 */

// In-memory fallback
const memoryCache = new Map();

export class CacheService {
    constructor() {
        this.redis = null;
        // In production: this.redis = new Redis(process.env.REDIS_URL);
    }

    async get(key) {
        if (this.redis) {
            const val = await this.redis.get(key);
            return val ? JSON.parse(val) : null;
        }
        return memoryCache.get(key) || null;
    }

    async set(key, value, ttlSeconds = 300) {
        const stringVal = JSON.stringify(value);

        if (this.redis) {
            await this.redis.set(key, stringVal, 'EX', ttlSeconds);
        } else {
            memoryCache.set(key, value);
            // Simple cleanup timeout
            setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000);
        }
    }

    async del(key) {
        if (this.redis) {
            await this.redis.del(key);
        } else {
            memoryCache.delete(key);
        }
    }

    /**
     * Cache-aside pattern helper
     */
    async remember(key, ttlSeconds, fetchFn) {
        const cached = await this.get(key);
        if (cached) return cached;

        const fresh = await fetchFn();
        if (fresh) {
            await this.set(key, fresh, ttlSeconds);
        }
        return fresh;
    }
}

export const cache = new CacheService();

// Cache TTL definitions (in seconds)
export const CacheTTL = {
    PRODUCT_LIST: 300,      // 5 minutes
    PRODUCT_DETAIL: 600,    // 10 minutes
    CATEGORY_LIST: 3600,    // 1 hour
    USER_SESSION: 86400,    // 1 day
    SEARCH_RESULTS: 180,    // 3 minutes
};

// Cache key generators
export const CacheKeys = {
    productList: (params) => `products:list:${JSON.stringify(params)}`,
    productDetail: (slug) => `products:detail:${slug}`,
    categoryList: () => 'categories:list',
    search: (query) => `search:${query}`,
};

/**
 * HOC for caching async functions
 */
export async function withCache(key, fetchFn, ttl = CacheTTL.PRODUCT_LIST) {
    return cache.remember(key, ttl, fetchFn);
}

