import { describe, it, expect } from 'vitest';
import type {
  GdexConfig,
  HLAsset,
  HLPosition,
  CreateOrderParams,
  CopyTradeConfig,
} from '../src/types';

describe('Type Definitions', () => {
  describe('GdexConfig', () => {
    it('should accept minimal config', () => {
      const config: GdexConfig = {
        apiKey: 'my-api-key',
      };
      expect(config.apiKey).toBe('my-api-key');
    });

    it('should accept full config', () => {
      const config: GdexConfig = {
        apiKey: 'my-api-key',
        baseUrl: 'https://api.example.com',
        timeout: 30000,
      };
      expect(config.baseUrl).toBe('https://api.example.com');
      expect(config.timeout).toBe(30000);
    });
  });

  describe('HLAsset', () => {
    it('should represent default DEX asset', () => {
      const asset: HLAsset = {
        coin: 'BTC',
        baseCoin: 'BTC',
        assetId: 0,
        szDecimals: 5,
        maxLeverage: 50,
        dex: '',
        isDelisted: false,
        onlyIsolated: false,
        markPx: '50000.0',
        oraclePx: '50001.0',
        funding: '0.0001',
      };
      expect(asset.dex).toBe('');
      expect(asset.onlyIsolated).toBe(false);
    });

    it('should represent HIP-3 asset', () => {
      const asset: HLAsset = {
        coin: 'vntl:SPACEX',
        baseCoin: 'SPACEX',
        assetId: 130001,
        szDecimals: 2,
        maxLeverage: 3,
        dex: 'vntl',
        isDelisted: false,
        onlyIsolated: true, // HIP-3 assets are isolated-only
      };
      expect(asset.dex).toBe('vntl');
      expect(asset.onlyIsolated).toBe(true);
    });
  });

  describe('HLPosition', () => {
    it('should represent a long position', () => {
      const position: HLPosition = {
        coin: 'BTC',
        szi: '0.5', // positive = long
        entryPx: '50000',
        unrealizedPnl: '1000',
        leverage: 10,
        liquidationPx: '45000',
        marginUsed: '2500',
        positionValue: '25000',
      };
      expect(parseFloat(position.szi)).toBeGreaterThan(0);
    });

    it('should represent a short position', () => {
      const position: HLPosition = {
        coin: 'ETH',
        szi: '-2', // negative = short
        entryPx: '3000',
        unrealizedPnl: '-100',
        leverage: 5,
        liquidationPx: '3500',
        marginUsed: '1200',
        positionValue: '6000',
      };
      expect(parseFloat(position.szi)).toBeLessThan(0);
    });
  });

  describe('CreateOrderParams', () => {
    it('should accept minimal params', () => {
      const params: CreateOrderParams = {
        coin: 'BTC',
        isLong: true,
        price: '50000',
        size: '0.1',
      };
      expect(params.reduceOnly).toBeUndefined();
    });

    it('should accept full params', () => {
      const params: CreateOrderParams = {
        coin: 'vntl:SPACEX',
        isLong: false,
        price: '150',
        size: '10',
        reduceOnly: false,
        tpPrice: '100',
        slPrice: '180',
        isMarket: true,
      };
      expect(params.tpPrice).toBe('100');
      expect(params.slPrice).toBe('180');
    });
  });

  describe('CopyTradeConfig', () => {
    it('should accept minimal config', () => {
      const config: CopyTradeConfig = {
        traderAddress: '0x1234567890abcdef',
      };
      expect(config.sizeMultiplier).toBeUndefined();
    });

    it('should accept full config', () => {
      const config: CopyTradeConfig = {
        traderAddress: '0x1234567890abcdef',
        coins: ['BTC', 'ETH'],
        sizeMultiplier: 0.5,
        maxPositionSize: 1000,
        reverseCopy: true,
      };
      expect(config.reverseCopy).toBe(true);
    });
  });
});
