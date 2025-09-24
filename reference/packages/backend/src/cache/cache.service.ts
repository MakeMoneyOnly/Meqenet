import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly namespace: string = 'meqenet';

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Generate a namespaced cache key
   * @param key Base key
   * @returns Namespaced key
   */
  private getNamespacedKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      await this.cacheManager.set(namespacedKey, value, ttl);
      this.logger.debug(`Cache set: ${namespacedKey}`);
    } catch (error) {
      this.logger.error(`Error setting cache: ${error.message}`, error.stack);
    }
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      const value = await this.cacheManager.get<T>(namespacedKey);
      this.logger.debug(`Cache ${value ? 'hit' : 'miss'}: ${namespacedKey}`);
      return value;
    } catch (error) {
      this.logger.error(
        `Error getting from cache: ${error.message}`,
        error.stack
      );
      return null;
    }
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      await this.cacheManager.del(namespacedKey);
      this.logger.debug(`Cache deleted: ${namespacedKey}`);
    } catch (error) {
      this.logger.error(
        `Error deleting from cache: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Get or set a value in the cache
   * If the key exists in the cache, return the cached value
   * If not, execute the factory function, cache the result, and return it
   * @param key Cache key
   * @param factory Function to execute if cache miss
   * @param ttl Time to live in seconds (optional)
   * @returns Cached or computed value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      const cachedValue = await this.cacheManager.get<T>(namespacedKey);

      if (cachedValue !== undefined && cachedValue !== null) {
        this.logger.debug(`Cache hit: ${namespacedKey}`);
        return cachedValue;
      }

      this.logger.debug(`Cache miss: ${namespacedKey}`);
      const value = await factory();
      await this.cacheManager.set(namespacedKey, value, ttl);
      return value;
    } catch (error) {
      this.logger.error(`Error in getOrSet: ${error.message}`, error.stack);
      // If cache fails, fall back to the factory function
      return factory();
    }
  }

  /**
   * Clear all cache entries with the given prefix
   * @param prefix Key prefix
   */
  async clearPrefix(prefix: string): Promise<void> {
    try {
      // This is a Redis-specific implementation
      // For memory cache, we would need a different approach
      const namespacedPrefix = this.getNamespacedKey(prefix);
      const store = (this.cacheManager as unknown as { stores?: unknown[] })
        .stores?.[0];

      if (store.getClient) {
        const client = store.getClient();
        const keys = await new Promise<string[]>((resolve, reject) => {
          client.keys(
            `${namespacedPrefix}*`,
            (err: Error | null, result: string[]) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            }
          );
        });

        if (keys.length > 0) {
          await new Promise<void>((resolve, reject) => {
            client.del(keys, (err: Error | null) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
          this.logger.debug(
            `Cleared ${keys.length} cache entries with prefix: ${namespacedPrefix}`
          );
        }
      } else {
        this.logger.warn(
          'Cache store does not support getClient method, cannot clear by prefix'
        );
      }
    } catch (error) {
      this.logger.error(
        `Error clearing cache prefix: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Reset the entire cache
   */
  async reset(): Promise<void> {
    try {
      await this.clearPrefix('');
      this.logger.debug('Cache reset');
    } catch (error) {
      this.logger.error(`Error resetting cache: ${error.message}`, error.stack);
    }
  }
}
