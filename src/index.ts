/**
 * GDEX SDK
 * 
 * Official SDK for integrating GDEX trading services
 * 
 * @example
 * ```typescript
 * import { GdexClient } from '@gdex/sdk';
 * 
 * const client = new GdexClient({
 *   apiKey: 'your-api-key',
 * });
 * 
 * // Get all available assets (including HIP-3)
 * const assets = await client.getAssets();
 * 
 * // Create a market order
 * const result = await client.createOrder('userId', 'signature', {
 *   coin: 'BTC',
 *   isLong: true,
 *   price: '50000',
 *   size: '0.01',
 *   isMarket: true,
 * });
 * ```
 * 
 * @packageDocumentation
 */

// Main client
export { GdexClient } from './client';

// Types
export type {
  // Configuration
  GdexConfig,
  
  // HyperLiquid types
  HLAsset,
  HLPosition,
  HLAccountState,
  HLOrder,
  
  // Trading parameters
  CreateOrderParams,
  CancelOrderParams,
  WithdrawParams,
  
  // Copy trading
  CopyTradeConfig,
  CopyTradeStats,
  
  // API responses
  ApiResponse,
  OrderResponse,
  
  // Market data
  MarketInfo,
  OrderBook,
  
  // HIP-3 Perp DEX
  PerpDex,
} from './types';

// Crypto utilities (for advanced use cases)
export {
  encrypt,
  decrypt,
  generateNonce,
} from './crypto';
