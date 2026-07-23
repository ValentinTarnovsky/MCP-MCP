"use strict";
/**
 * Simple in-memory cache with TTL support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadataCache = exports.versionCache = exports.Cache = void 0;
class Cache {
    store = new Map();
    defaultTtl;
    /**
     * Create a new cache instance
     * @param defaultTtl Default time-to-live in milliseconds (default: 30 minutes)
     */
    constructor(defaultTtl = 30 * 60 * 1000) {
        this.defaultTtl = defaultTtl;
    }
    /**
     * Get a value from cache
     */
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        return entry.value;
    }
    /**
     * Set a value in cache
     */
    set(key, value, ttl) {
        const expiresAt = Date.now() + (ttl ?? this.defaultTtl);
        this.store.set(key, { value, expiresAt });
    }
    /**
     * Check if key exists and is not expired
     */
    has(key) {
        const entry = this.store.get(key);
        if (!entry)
            return false;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Delete a specific key
     */
    delete(key) {
        return this.store.delete(key);
    }
    /**
     * Clear all cached values
     */
    clear() {
        this.store.clear();
    }
    /**
     * Get or set pattern - fetch from cache or compute and cache
     */
    async getOrSet(key, factory, ttl) {
        const cached = this.get(key);
        if (cached !== undefined) {
            return cached;
        }
        const value = await factory();
        this.set(key, value, ttl);
        return value;
    }
    /**
     * Clean expired entries
     */
    cleanup() {
        let cleaned = 0;
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) {
                this.store.delete(key);
                cleaned++;
            }
        }
        return cleaned;
    }
    /**
     * Get cache statistics
     */
    stats() {
        this.cleanup();
        return {
            size: this.store.size,
            validEntries: this.store.size,
        };
    }
}
exports.Cache = Cache;
// Global cache instances
exports.versionCache = new Cache(60 * 60 * 1000); // 1 hour
exports.metadataCache = new Cache(30 * 60 * 1000); // 30 minutes
//# sourceMappingURL=cache.js.map