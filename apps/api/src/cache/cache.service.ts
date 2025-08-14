import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private client?: Redis;
  private memory = new Map<string, { value: any; expire: number }>();

  constructor() {
    const url = process.env.REDIS_URL;
    try {
      if (url) {
        this.client = new Redis(url);
      }
    } catch (e) {
      this.client = undefined;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.client) {
      const data = await this.client.get(key);
      return data ? (JSON.parse(data) as T) : null;
    }
    const cached = this.memory.get(key);
    if (cached && cached.expire > Date.now()) {
      return cached.value as T;
    }
    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number) {
    if (this.client) {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    }
    this.memory.set(key, { value, expire: Date.now() + ttlSeconds * 1000 });
  }
}
