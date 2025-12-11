import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { CacheService } from './cacheService';
import { connectRedis, disconnectRedis } from '../config/redis';
import { User } from '../../../shared/types/user';

describe('CacheService', () => {
  let cacheService: CacheService;

  before(async () => {
    await connectRedis();
    cacheService = new CacheService();
  });

  after(async () => {
    await cacheService.clear();
    await disconnectRedis();
  });

  describe('set and get', () => {
    it('should set and get a value', async () => {
      const user: User = { id: 1, name: 'John Doe', email: 'john@example.com' };
      await cacheService.set('1', user);
      const cached = await cacheService.get('1');

      expect(cached).to.not.be.null;
      expect(cached?.name).to.equal('John Doe');
      expect(cached?.email).to.equal('john@example.com');
    });

    it('should return null for non-existent key', async () => {
      const cached = await cacheService.get('nonexistent');
      expect(cached).to.be.null;
    });
  });

  describe('delete', () => {
    it('should delete a cached value', async () => {
      const user: User = { id: 2, name: 'Jane Doe', email: 'jane@example.com' };
      await cacheService.set('2', user);
      await cacheService.delete('2');
      const cached = await cacheService.get('2');

      expect(cached).to.be.null;
    });
  });

  describe('clear', () => {
    it('should clear all cache', async () => {
      await cacheService.set('1', { id: 1, name: 'User 1', email: 'user1@example.com' });
      await cacheService.set('2', { id: 2, name: 'User 2', email: 'user2@example.com' });
      await cacheService.clear();

      const stats = await cacheService.getStats();
      expect(stats.size).to.equal(0);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      await cacheService.set('1', { id: 1, name: 'Test', email: 'test@example.com' });
      const stats = await cacheService.getStats();

      expect(stats).to.have.property('size');
      expect(stats).to.have.property('hits');
      expect(stats).to.have.property('misses');
      expect(stats.size).to.be.at.least(1);
    });
  });
});

