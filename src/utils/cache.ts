/**
 * Simple in-memory cache with TTL support
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Cache<T> {
  private store: Map<string, CacheEntry<T>> = new Map();
  private defaultTtl: number;

  /**
   * Create a new cache instance
   * @param defaultTtl Default time-to-live in milliseconds (default: 30 minutes)
   */
  constructor(defaultTtl: number = 30 * 60 * 1000) {
    this.defaultTtl = defaultTtl;
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set a value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.defaultTtl);
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
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
  cleanup(): number {
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
  stats(): { size: number; validEntries: number } {
    this.cleanup();
    return {
      size: this.store.size,
      validEntries: this.store.size,
    };
  }
}

// Global cache instances
export const versionCache = new Cache<string>(60 * 60 * 1000); // 1 hour
export const metadataCache = new Cache<unknown>(30 * 60 * 1000); // 30 minutes
