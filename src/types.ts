/**
 * GDEX SDK Type Definitions
 */

// ============================================================================
// Configuration
// ============================================================================

export interface GdexConfig {
  /** Your GDEX API key */
  apiKey: string;
  /** Base URL for GDEX API (defaults to production) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

// ============================================================================
// HyperLiquid Types
// ============================================================================

export interface HLAsset {
  /** Full coin name (e.g., "BTC" or "vntl:SPACEX" for HIP-3) */
  coin: string;
  /** Base coin name without DEX prefix */
  baseCoin: string;
  /** Asset ID for API calls */
  assetId: number;
  /** Size decimals for formatting */
  szDecimals: number;
  /** Maximum leverage allowed */
  maxLeverage: number;
  /** DEX name (empty for default, e.g., "vntl" for HIP-3) */
  dex: string;
  /** Whether asset is delisted */
  isDelisted: boolean;
  /** Whether only isolated margin is allowed (true for HIP-3) */
  onlyIsolated: boolean;
  /** Current mark price */
  markPx?: string;
  /** Current oracle price */
  oraclePx?: string;
  /** Current funding rate */
  funding?: string;
}

export interface HLPosition {
  /** Coin symbol */
  coin: string;
  /** Position size (negative for short) */
  szi: string;
  /** Entry price */
  entryPx: string;
  /** Unrealized PnL */
  unrealizedPnl: string;
  /** Leverage used */
  leverage: number;
  /** Liquidation price */
  liquidationPx: string;
  /** Margin used */
  marginUsed: string;
  /** Position value */
  positionValue: string;
}

export interface HLAccountState {
  /** Available balance for withdrawal */
  withdrawable: string;
  /** Cross margin summary */
  crossMarginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
  };
  /** Asset positions */
  assetPositions: Array<{
    position: HLPosition;
  }>;
}

export interface HLOrder {
  /** Order ID */
  oid: number;
  /** Coin symbol */
  coin: string;
  /** Is buy/long */
  isBuy: boolean;
  /** Limit price */
  limitPx: string;
  /** Order size */
  sz: string;
  /** Order timestamp */
  timestamp: number;
}

// ============================================================================
// Trading Parameters
// ============================================================================

export interface CreateOrderParams {
  /** Coin to trade (e.g., "BTC" or "vntl:SPACEX" for HIP-3) */
  coin: string;
  /** Long (true) or Short (false) */
  isLong: boolean;
  /** Order price */
  price: string;
  /** Position size */
  size: string;
  /** Reduce-only order */
  reduceOnly?: boolean;
  /** Take profit price (optional) */
  tpPrice?: string;
  /** Stop loss price (optional) */
  slPrice?: string;
  /** Market order (true) or limit order (false) */
  isMarket?: boolean;
}

export interface CancelOrderParams {
  /** Coin symbol */
  coin: string;
  /** Order ID to cancel */
  orderId: number;
}

export interface WithdrawParams {
  /** Amount to withdraw in USDC */
  amount: string;
}

// ============================================================================
// Copy Trade Types
// ============================================================================

export interface CopyTradeConfig {
  /** Trader address to copy */
  traderAddress: string;
  /** Coins to copy (empty for all) */
  coins?: string[];
  /** Position size multiplier (1 = same size) */
  sizeMultiplier?: number;
  /** Maximum position size in USD */
  maxPositionSize?: number;
  /** Enable reverse copy (opposite positions) */
  reverseCopy?: boolean;
}

export interface CopyTradeStats {
  /** Total PnL */
  totalPnl: string;
  /** Win rate percentage */
  winRate: number;
  /** Total trades executed */
  totalTrades: number;
  /** Active positions */
  activePositions: number;
}

// ============================================================================
// API Responses
// ============================================================================

export interface ApiResponse<T> {
  isSuccess: boolean;
  data?: T;
  error?: string;
  code?: number;
}

export interface OrderResponse {
  isSuccess: boolean;
  retData?: {
    status: string;
    response?: {
      data: {
        statuses: Array<{
          resting?: { oid: number };
          filled?: { oid: number; totalSz: string; avgPx: string };
          error?: string;
        }>;
      };
    };
  };
  error?: string;
}

// ============================================================================
// Market Data Types
// ============================================================================

export interface MarketInfo {
  /** Coin symbol */
  symbol: string;
  /** Current price */
  price: string;
  /** 24h change percentage */
  change24h: string;
  /** 24h volume in USD */
  volume24h: string;
  /** Open interest */
  openInterest: string;
  /** Funding rate */
  fundingRate: string;
}

export interface OrderBook {
  /** Bid levels [price, size][] */
  bids: [string, string][];
  /** Ask levels [price, size][] */
  asks: [string, string][];
}

// ============================================================================
// Perp DEX Types (HIP-3)
// ============================================================================

export interface PerpDex {
  /** DEX identifier (e.g., "vntl", "xyz") */
  name: string;
  /** Full name */
  fullName: string;
  /** Deployer address */
  deployer: string;
}
