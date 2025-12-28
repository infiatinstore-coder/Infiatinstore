/**
 * SIMPLE PUB/SUB (In-Memory)
 * For development. Use Redis in production.
 */

class SimplePubSub {
    constructor() {
        this.subscribers = new Map();
    }

    subscribe(channel, callback) {
        if (!this.subscribers.has(channel)) {
            this.subscribers.set(channel, new Set());
        }
        this.subscribers.get(channel).add(callback);

        // Return unsubscribe function
        return () => {
            const subs = this.subscribers.get(channel);
            if (subs) {
                subs.delete(callback);
            }
        };
    }

    publish(channel, message) {
        const subs = this.subscribers.get(channel);
        if (subs) {
            subs.forEach(callback => callback(message));
        }
    }
}

export const pubsub = new SimplePubSub();

// For production with Redis:
/*
import Redis from 'ioredis';

const publisher = new Redis(process.env.REDIS_URL);
const subscriber = new Redis(process.env.REDIS_URL);

export const pubsub = {
    async publish(channel, message) {
        await publisher.publish(channel, JSON.stringify(message));
    },
    subscribe(channel, callback) {
        subscriber.subscribe(channel);
        subscriber.on('message', (ch, msg) => {
            if (ch === channel) callback(JSON.parse(msg));
        });
    }
};
*/
