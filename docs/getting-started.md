# Getting Started with GDEX SDK

This guide will help you get up and running with the GDEX SDK in minutes.

## Installation

Install the SDK directly from GitHub:

```bash
# Using npm
npm install github:TheArcadiaGroup/gdex-sdk

# Using yarn
yarn add github:TheArcadiaGroup/gdex-sdk

# Using pnpm
pnpm add github:TheArcadiaGroup/gdex-sdk
```

## Quick Start

### 1. Initialize the Client

```typescript
import { GdexClient } from '@gdex/sdk';

const client = new GdexClient({
  apiKey: 'your-api-key-here',
});
```

### 2. Fetch Available Assets

```typescript
// Get all tradeable assets
const assets = await client.getAssets();

console.log(`Total assets: ${assets.length}`);

// Display first 5 assets
assets.slice(0, 5).forEach(asset => {
  console.log(`${asset.coin}: $${asset.markPx} (${asset.maxLeverage}x max leverage)`);
});
```

**Example Output:**
```
Total assets: 343
BTC: $76240.0 (50x max leverage)
ETH: $2850.0 (50x max leverage)
SOL: $125.0 (20x max leverage)
vntl:SPACEX: $150.0 (3x max leverage)
xyz:GOLD: $2650.0 (10x max leverage)
```

### 3. Check Account Balance

```typescript
const walletAddress = '0xYourWalletAddress';
const state = await client.getAccountState(walletAddress);

if (state) {
  console.log(`Withdrawable: $${state.withdrawable}`);
  console.log(`Account Value: $${state.crossMarginSummary.accountValue}`);
  console.log(`Open Positions: ${state.assetPositions.length}`);
}
```

### 4. Place Your First Trade

```typescript
// Market buy 0.01 BTC
const result = await client.createOrder('userId', 'signature', {
  coin: 'BTC',
  isLong: true,
  price: '76000',
  size: '0.01',
  isMarket: true,
});

if (result.isSuccess) {
  console.log('Order placed successfully!');
  console.log('Order ID:', result.retData?.response?.data?.statuses[0]?.resting?.oid);
} else {
  console.error('Order failed:', result.error);
}
```

## Configuration Options

```typescript
const client = new GdexClient({
  // Required: Your API key
  apiKey: 'your-api-key',
  
  // Optional: Custom API endpoint (default: production)
  baseUrl: 'https://api.gdex.io/v1',
  
  // Optional: Request timeout in ms (default: 30000)
  timeout: 60000,
});
```

## Environment-Specific Configuration

### Production
```typescript
const client = new GdexClient({
  apiKey: process.env.GDEX_API_KEY!,
  // Uses default production URL
});
```

### Staging/Testing
```typescript
const client = new GdexClient({
  apiKey: process.env.GDEX_STAGING_API_KEY!,
  baseUrl: 'https://staging-api.gdex.io/v1',
});
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import { 
  GdexClient,
  GdexConfig,
  HLAsset,
  CreateOrderParams,
  OrderResponse,
} from '@gdex/sdk';

// Full autocomplete and type checking
const config: GdexConfig = {
  apiKey: 'my-key',
};

const client = new GdexClient(config);

const params: CreateOrderParams = {
  coin: 'BTC',
  isLong: true,
  price: '50000',
  size: '0.1',
};
```

## Next Steps

- [Trading Guide](./trading.md) - Learn how to place orders, set TP/SL, and manage positions
- [HIP-3 Assets](./hip3-assets.md) - Trade on builder-deployed perp DEXes
- [Copy Trading](./copy-trading.md) - Automatically copy successful traders
- [API Reference](./api-reference.md) - Complete method documentation
