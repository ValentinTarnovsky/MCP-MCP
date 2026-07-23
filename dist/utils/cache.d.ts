/**
 * Simple in-memory cache with TTL support
 */
export declare class Cache<T> {
    private store;
    private defaultTtl;
    /**
     * Create a new cache instance
     * @param defaultTtl Default time-to-live in milliseconds (default: 30 minutes)
     */
    constructor(defaultTtl?: number);
    /**
     * Get a value from cache
     */
    get(key: string): T | undefined;
    /**
     * Set a value in cache
     */
    set(key: string, value: T, ttl?: number): void;
    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean;
    /**
     * Delete a specific key
     */
    delete(key: string): boolean;
    /**
     * Clear all cached values
     */
    clear(): void;
    /**
     * Get or set pattern - fetch from cache or compute and cache
     */
    getOrSet(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
    /**
     * Clean expired entries
     */
    cleanup(): number;
    /**
     * Get cache statistics
     */
    stats(): {
        size: number;
        validEntries: number;
    };
}
export declare const versionCache: Cache<string>;
export declare const metadataCache: Cache<unknown>;
//# sourceMappingURL=cache.d.ts.map