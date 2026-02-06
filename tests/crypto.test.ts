import { describe, it, expect } from 'vitest';
import {
  encrypt,
  decrypt,
  generateNonce,
  encodeOrderData,
  encodeWithdrawData,
  encodeCancelData,
  createEncryptedPayload,
} from '../src/crypto';

describe('Crypto Utilities', () => {
  const testApiKey = 'test-api-key-12345';

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt data correctly', () => {
      const originalData = 'Hello, GDEX!';
      const encrypted = encrypt(originalData, testApiKey);
      const decrypted = decrypt(encrypted, testApiKey);

      expect(encrypted).not.toBe(originalData);
      expect(decrypted).toBe(originalData);
    });

    it('should produce different ciphertext for different data', () => {
      const encrypted1 = encrypt('data1', testApiKey);
      const encrypted2 = encrypt('data2', testApiKey);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should produce different ciphertext for different API keys', () => {
      const data = 'same data';
      const encrypted1 = encrypt(data, 'api-key-1');
      const encrypted2 = encrypt(data, 'api-key-2');

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle JSON data', () => {
      const jsonData = JSON.stringify({ coin: 'BTC', size: '0.1' });
      const encrypted = encrypt(jsonData, testApiKey);
      const decrypted = decrypt(encrypted, testApiKey);

      expect(JSON.parse(decrypted)).toEqual({ coin: 'BTC', size: '0.1' });
    });

    it('should handle empty string', () => {
      const encrypted = encrypt('', testApiKey);
      const decrypted = decrypt(encrypted, testApiKey);

      expect(decrypted).toBe('');
    });

    it('should handle unicode characters', () => {
      const unicodeData = 'Test 🚀 émoji';
      const encrypted = encrypt(unicodeData, testApiKey);
      const decrypted = decrypt(encrypted, testApiKey);

      expect(decrypted).toBe(unicodeData);
    });
  });

  describe('generateNonce', () => {
    it('should generate a positive number', () => {
      const nonce = generateNonce();

      expect(nonce).toBeGreaterThan(0);
    });

    it('should generate unique nonces', () => {
      const nonces = new Set<number>();
      for (let i = 0; i < 100; i++) {
        nonces.add(generateNonce());
      }

      // Should have mostly unique values (allowing for small collision chance)
      expect(nonces.size).toBeGreaterThan(90);
    });

    it('should be based on timestamp', () => {
      const before = Date.now();
      const nonce = generateNonce();
      const after = Date.now() + 1000;

      expect(nonce).toBeGreaterThanOrEqual(before);
      expect(nonce).toBeLessThanOrEqual(after);
    });
  });

  describe('encodeOrderData', () => {
    it('should encode order data correctly', () => {
      const encoded = encodeOrderData({
        coin: 'BTC',
        isLong: true,
        price: '50000',
        size: '0.1',
        reduceOnly: false,
        nonce: 123456,
        tpPrice: '55000',
        slPrice: '45000',
        isMarket: false,
      });

      const parsed = JSON.parse(encoded);
      expect(parsed).toEqual([
        'BTC',
        true,
        '50000',
        '0.1',
        false,
        123456,
        '55000',
        '45000',
        false,
      ]);
    });

    it('should handle missing optional fields', () => {
      const encoded = encodeOrderData({
        coin: 'ETH',
        isLong: false,
        price: '3000',
        size: '1',
        reduceOnly: true,
        nonce: 789,
      });

      const parsed = JSON.parse(encoded);
      expect(parsed[6]).toBe('0'); // tpPrice default
      expect(parsed[7]).toBe('0'); // slPrice default
      expect(parsed[8]).toBe(false); // isMarket default
    });

    it('should handle HIP-3 coin format', () => {
      const encoded = encodeOrderData({
        coin: 'vntl:SPACEX',
        isLong: true,
        price: '150',
        size: '10',
        reduceOnly: false,
        nonce: 999,
        isMarket: true,
      });

      const parsed = JSON.parse(encoded);
      expect(parsed[0]).toBe('vntl:SPACEX');
    });
  });

  describe('encodeWithdrawData', () => {
    it('should encode withdraw data correctly', () => {
      const encoded = encodeWithdrawData({
        amount: '100.5',
        nonce: 456789,
      });

      const parsed = JSON.parse(encoded);
      expect(parsed).toEqual(['100.5', 456789]);
    });
  });

  describe('encodeCancelData', () => {
    it('should encode cancel all data', () => {
      const encoded = encodeCancelData({ nonce: 123 });

      const parsed = JSON.parse(encoded);
      expect(parsed).toEqual([123]);
    });

    it('should encode cancel specific order data', () => {
      const encoded = encodeCancelData({
        nonce: 123,
        coin: 'BTC',
        orderId: 456,
      });

      const parsed = JSON.parse(encoded);
      expect(parsed).toEqual([123, 'BTC', 456]);
    });
  });

  describe('createEncryptedPayload', () => {
    it('should create encrypted payload with all fields', () => {
      const payload = createEncryptedPayload(
        testApiKey,
        'user123',
        'hl_create_order',
        '["BTC",true,"50000"]',
        'signature123'
      );

      // Should be hex string
      expect(payload).toMatch(/^[0-9a-f]+$/i);

      // Should be decryptable
      const decrypted = decrypt(payload, testApiKey);
      const parsed = JSON.parse(decrypted);

      expect(parsed.userId).toBe('user123');
      expect(parsed.data).toBe('["BTC",true,"50000"]');
      expect(parsed.signature).toBe('signature123');
      expect(parsed.apiKey).toBe(testApiKey);
    });
  });
});
