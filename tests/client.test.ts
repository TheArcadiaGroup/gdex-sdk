import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GdexClient } from '../src/client';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
    })),
  },
}));

describe('GdexClient', () => {
  let client: GdexClient;

  beforeEach(() => {
    client = new GdexClient({
      apiKey: 'test-api-key',
    });
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      const client = new GdexClient({ apiKey: 'my-key' });
      expect(client).toBeInstanceOf(GdexClient);
    });

    it('should accept custom base URL', () => {
      const client = new GdexClient({
        apiKey: 'my-key',
        baseUrl: 'https://custom.api.com/v1',
      });
      expect(client).toBeInstanceOf(GdexClient);
    });

    it('should accept custom timeout', () => {
      const client = new GdexClient({
        apiKey: 'my-key',
        timeout: 60000,
      });
      expect(client).toBeInstanceOf(GdexClient);
    });
  });

  describe('isHip3Asset', () => {
    it('should return true for HIP-3 assets', () => {
      expect(client.isHip3Asset('vntl:SPACEX')).toBe(true);
      expect(client.isHip3Asset('xyz:GOLD')).toBe(true);
      expect(client.isHip3Asset('flx:SILVER')).toBe(true);
    });

    it('should return false for default DEX assets', () => {
      expect(client.isHip3Asset('BTC')).toBe(false);
      expect(client.isHip3Asset('ETH')).toBe(false);
      expect(client.isHip3Asset('SOL')).toBe(false);
    });
  });

  describe('parseCoinName', () => {
    it('should parse HIP-3 coin names', () => {
      expect(client.parseCoinName('vntl:SPACEX')).toEqual({
        dex: 'vntl',
        baseCoin: 'SPACEX',
      });

      expect(client.parseCoinName('xyz:GOLD')).toEqual({
        dex: 'xyz',
        baseCoin: 'GOLD',
      });
    });

    it('should handle default DEX coins', () => {
      expect(client.parseCoinName('BTC')).toEqual({
        dex: '',
        baseCoin: 'BTC',
      });

      expect(client.parseCoinName('ETH')).toEqual({
        dex: '',
        baseCoin: 'ETH',
      });
    });

    it('should handle lowercase DEX names', () => {
      expect(client.parseCoinName('vntl:SPACEX')).toEqual({
        dex: 'vntl',
        baseCoin: 'SPACEX',
      });
    });
  });

  describe('buildCoinName', () => {
    it('should build HIP-3 coin names', () => {
      expect(client.buildCoinName('vntl', 'SPACEX')).toBe('vntl:SPACEX');
      expect(client.buildCoinName('xyz', 'GOLD')).toBe('xyz:GOLD');
    });

    it('should handle empty DEX', () => {
      expect(client.buildCoinName('', 'BTC')).toBe('BTC');
    });
  });
});
