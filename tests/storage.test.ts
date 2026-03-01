import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorage, createStorage, type StorageConfig } from '../src/storage';

describe('Storage', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  describe('MemoryStorage', () => {
    it('should store and retrieve value', async () => {
      await storage.set('key1', { foo: 'bar' });
      const value = await storage.get('key1');
      expect(value).toEqual({ foo: 'bar' });
    });

    it('should return null for non-existent key', async () => {
      const value = await storage.get('nonexistent');
      expect(value).toBeNull();
    });

    it('should delete value', async () => {
      await storage.set('key1', 'value');
      await storage.delete('key1');
      const value = await storage.get('key1');
      expect(value).toBeNull();
    });

    it('should handle TTL expiration', async () => {
      await storage.set('key1', 'value', 100); // 100ms TTL
      const value1 = await storage.get('key1');
      expect(value1).toBe('value');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const value2 = await storage.get('key1');
      expect(value2).toBeNull();
    });

    it('should clear all values', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      await storage.clear();
      
      expect(await storage.get('key1')).toBeNull();
      expect(await storage.get('key2')).toBeNull();
    });
  });

  describe('createStorage', () => {
    it('should create memory storage by default', () => {
      const config: StorageConfig = { type: 'memory' };
      const storage = createStorage(config);
      expect(storage).toBeInstanceOf(MemoryStorage);
    });
  });
});
