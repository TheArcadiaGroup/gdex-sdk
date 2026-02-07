# API Reference

Complete reference for all GDEX SDK methods and types.

## Table of Contents

- [GdexClient](#gdexclient)
- [Market Data Methods](#market-data-methods)
- [Account Methods](#account-methods)
- [Trading Methods](#trading-methods)
- [Copy Trading Methods](#copy-trading-methods)
- [Utility Methods](#utility-methods)
- [Types](#types)

---

## GdexClient

### Constructor

```typescript
new GdexClient(config: GdexConfig)
```

Creates a new GDEX client instance.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `config.apiKey` | `string` | Yes | Your GDEX API key |
| `config.baseUrl` | `string` | No | API base URL (default: production) |
| `config.timeout` | `number` | No | Request timeout in ms (default: 30000) |

**Example:**

```typescript
const client = new GdexClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.gdex.io/v1',
  timeout: 60000,
});
```

---

## User & Deposit Methods

### getUserInfo()

```typescript
getUserInfo(
  walletAddress: string,
  sessionKey: string,
  chainId: number
): Promise<UserInfo | null>
```

Gets user information including your GDEX deposit address.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `walletAddress` | `string` | Your connected wallet address |
| `sessionKey` | `string` | Session key from authentication |
| `chainId` | `number` | Chain ID (42161 for Arbitrum) |

**Returns:** `UserInfo` object or `null`

**Example:**

```typescript
const userInfo = await client.getUserInfo('0xMyWallet', sessionKey, 42161);
console.log(`Deposit Address: ${userInfo?.address}`);
console.log(`Balance: ${userInfo?.balance}`);
```

---

### getDepositAddress()

```typescript
getDepositAddress(
  walletAddress: string,
  sessionKey: string,
  chainId?: number
): Promise<string | null>
```

Gets your GDEX deposit address. Send USDC to this address on Arbitrum to fund your account.

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `walletAddress` | `string` | - | Your connected wallet address |
| `sessionKey` | `string` | - | Session key from authentication |
| `chainId` | `number` | 42161 | Chain ID |

**Returns:** Deposit address string or `null`

**Example:**

```typescript
const depositAddress = await client.getDepositAddress('0xMyWallet', sessionKey);
console.log(`Send USDC to: ${depositAddress}`);
```

---

### getDepositTokens()

```typescript
getDepositTokens(): Promise<DepositTokens>
```

Gets supported deposit tokens by chain.

**Returns:** Map of chain IDs to supported tokens

**Example:**

```typescript
const tokens = await client.getDepositTokens();
const arbitrumTokens = tokens[42161];
console.log('Supported:', arbitrumTokens.map(t => t.symbol)); // ['USDC']
```

---

## Market Data Methods

### getAssets()

```typescript
getAssets(): Promise<HLAsset[]>
```

Fetches all available trading assets, including HIP-3 perp DEX assets.

**Returns:** Array of `HLAsset` objects

**Example:**

```typescript
const assets = await client.getAssets();
console.log(`Found ${assets.length} assets`);
```

---

### getPerpDexes()

```typescript
getPerpDexes(): Promise<PerpDex[]>
```

Fetches all available HIP-3 perp DEXes.

**Returns:** Array of `PerpDex` objects

**Example:**

```typescript
const dexes = await client.getPerpDexes();
dexes.forEach(dex => console.log(dex.name, dex.fullName));
```

---

### getMarketInfo()

```typescript
getMarketInfo(coin: string): Promise<MarketInfo | null>
```

Fetches market information for a specific coin.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `coin` | `string` | Coin symbol (e.g., "BTC" or "vntl:SPACEX") |

**Returns:** `MarketInfo` object or `null`

**Example:**

```typescript
const info = await client.getMarketInfo('BTC');
console.log(`BTC Price: $${info?.price}`);
```

---

### getOrderBook()

```typescript
getOrderBook(coin: string): Promise<OrderBook | null>
```

Fetches the order book for a specific coin.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `coin` | `string` | Coin symbol |

**Returns:** `OrderBook` object or `null`

**Example:**

```typescript
const book = await client.getOrderBook('ETH');
console.log('Best bid:', book?.bids[0]);
console.log('Best ask:', book?.asks[0]);
```

---

## Account Methods

### getAccountState()

```typescript
getAccountState(address: string, dex?: string): Promise<HLAccountState | null>
```

Fetches account state including balance and positions.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `address` | `string` | Yes | Wallet address |
| `dex` | `string` | No | HIP-3 DEX name (for DEX-specific state) |

**Returns:** `HLAccountState` object or `null`

**Example:**

```typescript
const state = await client.getAccountState('0xWallet');
console.log(`Balance: $${state?.withdrawable}`);
console.log(`Positions: ${state?.assetPositions.length}`);
```

---

### getOpenOrders()

```typescript
getOpenOrders(address: string, dex?: string): Promise<HLOrder[]>
```

Fetches all open orders for an address.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `address` | `string` | Yes | Wallet address |
| `dex` | `string` | No | HIP-3 DEX name |

**Returns:** Array of `HLOrder` objects

**Example:**

```typescript
const orders = await client.getOpenOrders('0xWallet');
orders.forEach(o => console.log(`${o.coin}: ${o.sz} @ ${o.limitPx}`));
```

---

## Trading Methods

### createOrder()

```typescript
createOrder(
  userId: string,
  signature: string,
  params: CreateOrderParams
): Promise<OrderResponse>
```

Creates a new order.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | `string` | Yes | User identifier |
| `signature` | `string` | Yes | Request signature |
| `params.coin` | `string` | Yes | Coin symbol |
| `params.isLong` | `boolean` | Yes | Long (true) or Short (false) |
| `params.price` | `string` | Yes | Order price |
| `params.size` | `string` | Yes | Order size |
| `params.reduceOnly` | `boolean` | No | Reduce-only order (default: false) |
| `params.tpPrice` | `string` | No | Take profit price |
| `params.slPrice` | `string` | No | Stop loss price |
| `params.isMarket` | `boolean` | No | Market order (default: false) |

**Returns:** `OrderResponse` object

**Example:**

```typescript
const result = await client.createOrder('userId', 'sig', {
  coin: 'BTC',
  isLong: true,
  price: '76000',
  size: '0.01',
  tpPrice: '80000',
  slPrice: '74000',
  isMarket: true,
});
```

---

### cancelOrder()

```typescript
cancelOrder(
  userId: string,
  signature: string,
  params: CancelOrderParams
): Promise<ApiResponse<void>>
```

Cancels a specific order.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | `string` | Yes | User identifier |
| `signature` | `string` | Yes | Request signature |
| `params.coin` | `string` | Yes | Coin symbol |
| `params.orderId` | `number` | Yes | Order ID to cancel |

**Returns:** `ApiResponse<void>` object

**Example:**

```typescript
const result = await client.cancelOrder('userId', 'sig', {
  coin: 'BTC',
  orderId: 12345,
});
```

---

### cancelAllOrders()

```typescript
cancelAllOrders(
  userId: string,
  signature: string
): Promise<ApiResponse<void>>
```

Cancels all open orders.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | `string` | Yes | User identifier |
| `signature` | `string` | Yes | Request signature |

**Returns:** `ApiResponse<void>` object

**Example:**

```typescript
const result = await client.cancelAllOrders('userId', 'sig');
```

---

### withdraw()

```typescript
withdraw(
  userId: string,
  signature: string,
  params: WithdrawParams
): Promise<ApiResponse<{ withdrawn: number }>>
```

Withdraws USDC from the trading account.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | `string` | Yes | User identifier |
| `signature` | `string` | Yes | Request signature |
| `params.amount` | `string` | Yes | Amount to withdraw |

**Returns:** `ApiResponse` with withdrawn amount

**Example:**

```typescript
const result = await client.withdraw('userId', 'sig', {
  amount: '100',
});
console.log(`Withdrawn: $${result.data?.withdrawn}`);
```

---

## Copy Trading Methods

### startCopyTrade()

```typescript
startCopyTrade(
  userId: string,
  signature: string,
  config: CopyTradeConfig
): Promise<ApiResponse<void>>
```

Starts copy trading a trader.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | `string` | Yes | User identifier |
| `signature` | `string` | Yes | Request signature |
| `config.traderAddress` | `string` | Yes | Trader's wallet address |
| `config.coins` | `string[]` | No | Coins to copy (empty = all) |
| `config.sizeMultiplier` | `number` | No | Position size multiplier (default: 1) |
| `config.maxPositionSize` | `number` | No | Max position size in USD |
| `config.reverseCopy` | `boolean` | No | Reverse positions (default: false) |

**Returns:** `ApiResponse<void>` object

**Example:**

```typescript
const result = await client.startCopyTrade('userId', 'sig', {
  traderAddress: '0xTrader',
  sizeMultiplier: 0.5,
  maxPositionSize: 1000,
  coins: ['BTC', 'ETH'],
});
```

---

### stopCopyTrade()

```typescript
stopCopyTrade(
  userId: string,
  signature: string,
  traderAddress: string
): Promise<ApiResponse<void>>
```

Stops copy trading a trader.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | `string` | Yes | User identifier |
| `signature` | `string` | Yes | Request signature |
| `traderAddress` | `string` | Yes | Trader's address to stop copying |

**Returns:** `ApiResponse<void>` object

**Example:**

```typescript
await client.stopCopyTrade('userId', 'sig', '0xTrader');
```

---

### getCopyTradeStats()

```typescript
getCopyTradeStats(address: string): Promise<CopyTradeStats | null>
```

Fetches copy trading statistics.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `address` | `string` | Wallet address |

**Returns:** `CopyTradeStats` object or `null`

**Example:**

```typescript
const stats = await client.getCopyTradeStats('0xWallet');
console.log(`PnL: $${stats?.totalPnl}`);
console.log(`Win Rate: ${stats?.winRate}%`);
```

---

## Utility Methods

### isHip3Asset()

```typescript
isHip3Asset(coin: string): boolean
```

Checks if a coin is a HIP-3 asset.

**Example:**

```typescript
client.isHip3Asset('BTC');           // false
client.isHip3Asset('vntl:SPACEX');   // true
```

---

### parseCoinName()

```typescript
parseCoinName(coin: string): { dex: string; baseCoin: string }
```

Parses a coin name into DEX and base coin components.

**Example:**

```typescript
client.parseCoinName('vntl:SPACEX');
// { dex: 'vntl', baseCoin: 'SPACEX' }

client.parseCoinName('BTC');
// { dex: '', baseCoin: 'BTC' }
```

---

### buildCoinName()

```typescript
buildCoinName(dex: string, baseCoin: string): string
```

Builds a full coin name from DEX and base coin.

**Example:**

```typescript
client.buildCoinName('vntl', 'SPACEX');  // 'vntl:SPACEX'
client.buildCoinName('', 'BTC');          // 'BTC'
```

---

## Types

### GdexConfig

```typescript
interface GdexConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}
```

### HLAsset

```typescript
interface HLAsset {
  coin: string;           // Full name (e.g., "BTC" or "vntl:SPACEX")
  baseCoin: string;       // Base coin without DEX prefix
  assetId: number;        // Numeric asset ID
  szDecimals: number;     // Size decimal places
  maxLeverage: number;    // Maximum leverage allowed
  dex: string;            // DEX name (empty for default)
  isDelisted: boolean;    // Whether asset is delisted
  onlyIsolated: boolean;  // Whether only isolated margin allowed
  markPx?: string;        // Current mark price
  oraclePx?: string;      // Current oracle price
  funding?: string;       // Current funding rate
}
```

### HLPosition

```typescript
interface HLPosition {
  coin: string;
  szi: string;            // Size (negative = short)
  entryPx: string;
  unrealizedPnl: string;
  leverage: number;
  liquidationPx: string;
  marginUsed: string;
  positionValue: string;
}
```

### HLAccountState

```typescript
interface HLAccountState {
  withdrawable: string;
  crossMarginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
  };
  assetPositions: Array<{ position: HLPosition }>;
}
```

### CreateOrderParams

```typescript
interface CreateOrderParams {
  coin: string;
  isLong: boolean;
  price: string;
  size: string;
  reduceOnly?: boolean;
  tpPrice?: string;
  slPrice?: string;
  isMarket?: boolean;
}
```

### CopyTradeConfig

```typescript
interface CopyTradeConfig {
  traderAddress: string;
  coins?: string[];
  sizeMultiplier?: number;
  maxPositionSize?: number;
  reverseCopy?: boolean;
}
```

### ApiResponse

```typescript
interface ApiResponse<T> {
  isSuccess: boolean;
  data?: T;
  error?: string;
  code?: number;
}
```

### OrderResponse

```typescript
interface OrderResponse {
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
```

### UserInfo

```typescript
interface UserInfo {
  chainId: number;
  address: string;        // Your GDEX deposit address
  balance: number;        // ETH balance on deposit address
  isNewUser: boolean;
  refCode: string;
  setting: {
    quickBuySlippage: number;
    quickSellSlippage: number;
    buyPriorityFee: number;
    sellPriorityFee: number;
  };
  energies: {
    energyLimit: number;
    energyUsed: number;
    energyAvailable: number;
  };
}
```

### DepositToken

```typescript
interface DepositToken {
  address: string;        // Token contract address
  symbol: string;         // Token symbol (e.g., "USDC")
  decimals: number;       // Token decimals
  minDeposit: string;     // Minimum deposit amount
}
```

### DepositTokens

```typescript
interface DepositTokens {
  [chainId: number]: DepositToken[];
}
```
