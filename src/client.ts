/**
 * GDEX SDK Client
 * 
 * Main client for interacting with GDEX trading services
 */

import axios, { AxiosInstance } from 'axios';
import {
  GdexConfig,
  HLAsset,
  HLAccountState,
  HLOrder,
  CreateOrderParams,
  CancelOrderParams,
  WithdrawParams,
  CopyTradeConfig,
  CopyTradeStats,
  ApiResponse,
  OrderResponse,
  MarketInfo,
  OrderBook,
  PerpDex,
} from './types';
import {
  encrypt,
  generateNonce,
  encodeOrderData,
  encodeWithdrawData,
  encodeCancelData,
  createEncryptedPayload,
} from './crypto';

const DEFAULT_BASE_URL = 'https://api.gdex.io/v1';
const DEFAULT_TIMEOUT = 30000;

export class GdexClient {
  private readonly apiKey: string;
  private readonly http: AxiosInstance;

  constructor(config: GdexConfig) {
    this.apiKey = config.apiKey;
    
    this.http = axios.create({
      baseURL: config.baseUrl || DEFAULT_BASE_URL,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GDEX-SDK/0.1.0',
      },
    });
  }

  // ==========================================================================
  // Market Data (Public)
  // ==========================================================================

  /**
   * Get all available assets including HIP-3 perp DEX assets
   */
  async getAssets(): Promise<HLAsset[]> {
    const response = await this.http.get<ApiResponse<{ assets: HLAsset[] }>>('/hl/all_assets');
    return response.data.data?.assets || [];
  }

  /**
   * Get all perp DEXes (HIP-3)
   */
  async getPerpDexes(): Promise<PerpDex[]> {
    const response = await this.http.get<ApiResponse<{ dexes: PerpDex[] }>>('/hl/perp_dexes');
    return response.data.data?.dexes || [];
  }

  /**
   * Get market info for a specific coin
   */
  async getMarketInfo(coin: string): Promise<MarketInfo | null> {
    const response = await this.http.get<ApiResponse<MarketInfo>>('/hl/market_info', {
      params: { coin },
    });
    return response.data.data || null;
  }

  /**
   * Get order book for a specific coin
   */
  async getOrderBook(coin: string): Promise<OrderBook | null> {
    const response = await this.http.get<ApiResponse<OrderBook>>('/hl/order_book', {
      params: { coin },
    });
    return response.data.data || null;
  }

  // ==========================================================================
  // Account (Authenticated)
  // ==========================================================================

  /**
   * Get account state for a wallet address
   */
  async getAccountState(address: string, dex?: string): Promise<HLAccountState | null> {
    const response = await this.http.get<ApiResponse<HLAccountState>>('/hl/clearinghouse_state', {
      params: { address, dex },
    });
    return response.data.data || null;
  }

  /**
   * Get open orders for a wallet address
   */
  async getOpenOrders(address: string, dex?: string): Promise<HLOrder[]> {
    const response = await this.http.get<ApiResponse<{ orders: HLOrder[] }>>('/hl/open_orders', {
      params: { address, dex },
    });
    return response.data.data?.orders || [];
  }

  // ==========================================================================
  // Trading (Authenticated)
  // ==========================================================================

  /**
   * Create a new order
   * 
   * @example
   * ```typescript
   * // Market buy BTC
   * await client.createOrder('user123', 'signature', {
   *   coin: 'BTC',
   *   isLong: true,
   *   price: '50000',
   *   size: '0.01',
   *   isMarket: true,
   * });
   * 
   * // Limit sell HIP-3 asset with TP/SL
   * await client.createOrder('user123', 'signature', {
   *   coin: 'vntl:SPACEX',
   *   isLong: false,
   *   price: '100',
   *   size: '10',
   *   tpPrice: '80',
   *   slPrice: '120',
   * });
   * ```
   */
  async createOrder(
    userId: string,
    signature: string,
    params: CreateOrderParams
  ): Promise<OrderResponse> {
    const nonce = generateNonce();
    
    const data = encodeOrderData({
      coin: params.coin,
      isLong: params.isLong,
      price: params.price,
      size: params.size,
      reduceOnly: params.reduceOnly || false,
      nonce,
      tpPrice: params.tpPrice,
      slPrice: params.slPrice,
      isMarket: params.isMarket,
    });

    const computedData = createEncryptedPayload(
      this.apiKey,
      userId,
      'hl_create_order',
      data,
      signature
    );

    const response = await this.http.post<OrderResponse>('/hl/create_order', {
      computedData,
    });

    return response.data;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(
    userId: string,
    signature: string,
    params: CancelOrderParams
  ): Promise<ApiResponse<void>> {
    const nonce = generateNonce();
    
    const data = encodeCancelData({
      nonce,
      coin: params.coin,
      orderId: params.orderId,
    });

    const computedData = createEncryptedPayload(
      this.apiKey,
      userId,
      'hl_cancel_order',
      data,
      signature
    );

    const response = await this.http.post<ApiResponse<void>>('/hl/cancel_order', {
      computedData,
      isCancelAll: false,
    });

    return response.data;
  }

  /**
   * Cancel all orders
   */
  async cancelAllOrders(userId: string, signature: string): Promise<ApiResponse<void>> {
    const nonce = generateNonce();
    
    const data = encodeCancelData({ nonce });

    const computedData = createEncryptedPayload(
      this.apiKey,
      userId,
      'hl_cancel_all_orders',
      data,
      signature
    );

    const response = await this.http.post<ApiResponse<void>>('/hl/cancel_order', {
      computedData,
      isCancelAll: true,
    });

    return response.data;
  }

  /**
   * Withdraw USDC from HyperLiquid
   */
  async withdraw(
    userId: string,
    signature: string,
    params: WithdrawParams
  ): Promise<ApiResponse<{ withdrawn: number }>> {
    const nonce = generateNonce();
    
    const data = encodeWithdrawData({
      amount: params.amount,
      nonce,
    });

    const computedData = createEncryptedPayload(
      this.apiKey,
      userId,
      'hl_withdraw',
      data,
      signature
    );

    const response = await this.http.post<ApiResponse<{ withdrawn: number }>>('/hl/withdraw', {
      computedData,
    });

    return response.data;
  }

  // ==========================================================================
  // Copy Trading
  // ==========================================================================

  /**
   * Start copy trading a trader
   */
  async startCopyTrade(
    userId: string,
    signature: string,
    config: CopyTradeConfig
  ): Promise<ApiResponse<void>> {
    const nonce = generateNonce();
    
    const data = JSON.stringify([
      config.traderAddress,
      config.coins || [],
      config.sizeMultiplier || 1,
      config.maxPositionSize || 0,
      config.reverseCopy || false,
      nonce,
    ]);

    const computedData = createEncryptedPayload(
      this.apiKey,
      userId,
      'hl_create',
      data,
      signature
    );

    const response = await this.http.post<ApiResponse<void>>('/hl/create', {
      computedData,
    });

    return response.data;
  }

  /**
   * Stop copy trading
   */
  async stopCopyTrade(
    userId: string,
    signature: string,
    traderAddress: string
  ): Promise<ApiResponse<void>> {
    const nonce = generateNonce();
    
    const data = JSON.stringify([traderAddress, nonce]);

    const computedData = createEncryptedPayload(
      this.apiKey,
      userId,
      'hl_delete',
      data,
      signature
    );

    const response = await this.http.post<ApiResponse<void>>('/hl/delete', {
      computedData,
    });

    return response.data;
  }

  /**
   * Get copy trade statistics
   */
  async getCopyTradeStats(address: string): Promise<CopyTradeStats | null> {
    const response = await this.http.get<ApiResponse<CopyTradeStats>>('/hl/copy_trade_stats', {
      params: { address },
    });
    return response.data.data || null;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if a coin is a HIP-3 asset
   */
  isHip3Asset(coin: string): boolean {
    return coin.includes(':');
  }

  /**
   * Parse coin name to extract DEX and base coin
   */
  parseCoinName(coin: string): { dex: string; baseCoin: string } {
    if (coin.includes(':')) {
      const [dex, baseCoin] = coin.split(':');
      return { dex, baseCoin };
    }
    return { dex: '', baseCoin: coin };
  }

  /**
   * Build full coin name from DEX and base coin
   */
  buildCoinName(dex: string, baseCoin: string): string {
    if (dex) {
      return `${dex}:${baseCoin}`;
    }
    return baseCoin;
  }
}
