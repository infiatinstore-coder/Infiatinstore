/**
 * Enhanced Service Worker for PWA
 * With advanced caching strategies and offline support
 */

const CACHE_VERSION = 'infiatin-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/offline',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
];

// Maximum cache sizes
const MAX_IMAGE_CACHE = 50;
const MAX_DYNAMIC_CACHE = 30;

// Install Event - Precache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Precaching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('infiatin-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== IMAGE_CACHE)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('[SW] Claiming clients');
            return self.clients.claim();
        })
    );
});

// Fetch Event - Advanced caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip cross-origin requests
    if (url.origin !== location.origin) return;

    // Skip API requests (use network only)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(fetch(request));
        return;
    }

    // Images - Cache First strategy
    if (request.destination === 'image') {
        event.respondWith(cacheFirst(request, IMAGE_CACHE, MAX_IMAGE_CACHE));
        return;
    }

    // Static assets - Cache First strategy
    if (url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    // Pages - Network First strategy with offline fallback
    event.respondWith(networkFirst(request, DYNAMIC_CACHE, MAX_DYNAMIC_CACHE));
});

// Cache First Strategy
async function cacheFirst(request, cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.status === 200) {
            // Limit cache size
            if (maxItems) {
                await limitCacheSize(cacheName, maxItems);
            }
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return placeholder for images
        if (request.destination === 'image') {
            return caches.match('/icon-192.png');
        }
        throw error;
    }
}

// Network First Strategy
async function networkFirst(request, cacheName, maxItems) {
    try {
        const response = await fetch(request);
        if (response.status === 200) {
            const cache = await caches.open(cacheName);
            if (maxItems) {
                await limitCacheSize(cacheName, maxItems);
            }
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        // Return offline page
        return caches.match('/offline');
    }
}

// Limit cache size
async function limitCacheSize(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        // Delete oldest items
        const deleteCount = keys.length - maxItems;
        for (let i = 0; i < deleteCount; i++) {
            await cache.delete(keys[i]);
        }
    }
}

// Message Event - Handle update messages
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Push Notification Event (for future use)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Infiatin Store';
    const options = {
        body: data.body || 'Ada update baru!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: data.url || '/',
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data || '/')
    );
});
