import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl || 300); // Default 5 minutes
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async clear(): Promise<void> {
    await this.cacheManager.clear();
  }

  // Cache keys generators
  static offersKey(params: any = {}): string {
    return `offers:${JSON.stringify(params)}`;
  }

  static storesKey(params: any = {}): string {
    return `stores:${JSON.stringify(params)}`;
  }

  static categoriesKey(): string {
    return 'categories:all';
  }

  static userKey(userId: string): string {
    return `user:${userId}`;
  }

  static storeOffersKey(storeId: string): string {
    return `store:${storeId}:offers`;
  }
}
