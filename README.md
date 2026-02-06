# GDEX SDK

Official SDK for integrating GDEX.pro trading services into your applications.

## Features

- **HyperLiquid Trading** - Full support for perpetual trading
- **HIP-3 Assets** - Trade on builder-deployed perp DEXes (SPACEX, GOLD, etc.)
- **Copy Trading** - Programmatically copy top traders
- **TypeScript** - Full type definitions included
- **Secure** - Encrypted API communication

## Installation

Install directly from GitHub:

```bash
# npm
npm install github:TheArcadiaGroup/gdex-sdk

# yarn
yarn add github:TheArcadiaGroup/gdex-sdk

# pnpm
pnpm add github:TheArcadiaGroup/gdex-sdk
```

Or add to your `package.json`:

```json
{
  "dependencies": {
    "@gdex/sdk": "github:TheArcadiaGroup/gdex-sdk"
  }
}
```

To install a specific branch or tag:

```bash
# Install from a specific branch
npm install github:TheArcadiaGroup/gdex-sdk#main

# Install from a specific tag
npm install github:TheArcadiaGroup/gdex-sdk#v0.1.0

# Install from a specific commit
npm install github:TheArcadiaGroup/gdex-sdk#abc1234
```

## Quick Start

```typescript
import { GdexClient } from '@gdex/sdk';

// Initialize the client
const client = new GdexClient({
  apiKey: 'your-api-key',
});

// Get all available assets
const assets = await client.getAssets();
console.log(`Found ${assets.length} tradeable assets`);

// Filter HIP-3 assets
const hip3Assets = assets.filter(a => client.isHip3Asset(a.coin));
console.log(`HIP-3 assets: ${hip3Assets.map(a => a.coin).join(', ')}`);
```

## Trading

### Create Order

```typescript
// Market buy BTC
const result = await client.createOrder('userId', 'signature', {
  coin: 'BTC',
  isLong: true,
  price: '50000',
  size: '0.01',
  isMarket: true,
});

// Limit order with TP/SL
const limitOrder = await client.createOrder('userId', 'signature', {
  coin: 'ETH',
  isLong: true,
  price: '3000',
  size: '1',
  tpPrice: '3500',  // Take profit
  slPrice: '2800',  // Stop loss
});

// Trade HIP-3 asset (e.g., SPACEX on Ventuals)
const hip3Order = await client.createOrder('userId', 'signature', {
  coin: 'vntl:SPACEX',
  isLong: true,
  price: '150',
  size: '10',
  isMarket: true,
});
```

### Cancel Orders

```typescript
// Cancel specific order
await client.cancelOrder('userId', 'signature', {
  coin: 'BTC',
  orderId: 12345,
});

// Cancel all orders
await client.cancelAllOrders('userId', 'signature');
```

### Withdraw

```typescript
await client.withdraw('userId', 'signature', {
  amount: '100', // USDC
});
```

## Copy Trading

```typescript
// Start copy trading
await client.startCopyTrade('userId', 'signature', {
  traderAddress: '0x1234...abcd',
  sizeMultiplier: 0.5,        // Copy at 50% size
  maxPositionSize: 1000,      // Max $1000 per position
  coins: ['BTC', 'ETH'],      // Only copy these coins
});

// Stop copy trading
await client.stopCopyTrade('userId', 'signature', '0x1234...abcd');

// Get copy trade stats
const stats = await client.getCopyTradeStats('0xMyWallet...');
console.log(`Total PnL: $${stats.totalPnl}`);
```

## Market Data

```typescript
// Get all assets
const assets = await client.getAssets();

// Get perp DEXes (HIP-3)
const dexes = await client.getPerpDexes();

// Get account state
const state = await client.getAccountState('0xWalletAddress');
console.log(`Withdrawable: $${state.withdrawable}`);

// Get open orders
const orders = await client.getOpenOrders('0xWalletAddress');
```

## HIP-3 Assets

HIP-3 enables builder-deployed perpetual DEXes with unique assets:

```typescript
// Check if asset is HIP-3
client.isHip3Asset('BTC');           // false
client.isHip3Asset('vntl:SPACEX');   // true

// Parse coin name
const { dex, baseCoin } = client.parseCoinName('vntl:SPACEX');
// dex = 'vntl', baseCoin = 'SPACEX'

// Build coin name
const coin = client.buildCoinName('xyz', 'GOLD');
// coin = 'xyz:GOLD'
```

### Available HIP-3 DEXes

| DEX | Description | Example Assets |
|-----|-------------|----------------|
| `xyz` | XYZ Exchange | GOLD, TSLA, NVDA, AAPL |
| `vntl` | Ventuals | SPACEX, OPENAI, MAG7 |
| `flx` | Felix | GOLD, SILVER, XMR |
| `hyna` | HyENA | BTC, ETH, SOL (leveraged) |

## Configuration

```typescript
const client = new GdexClient({
  apiKey: 'your-api-key',
  
  // Optional: Custom base URL (default: production)
  baseUrl: 'https://staging-api.gdex.io/v1',
  
  // Optional: Request timeout (default: 30000ms)
  timeout: 60000,
});
```

## Error Handling

```typescript
try {
  const result = await client.createOrder('userId', 'sig', params);
  
  if (result.isSuccess) {
    console.log('Order placed:', result.retData);
  } else {
    console.error('Order failed:', result.error);
  }
} catch (error) {
  console.error('Network error:', error.message);
}
```

## API Reference

### GdexClient

| Method | Description |
|--------|-------------|
| `getAssets()` | Get all tradeable assets |
| `getPerpDexes()` | Get all HIP-3 perp DEXes |
| `getAccountState(address, dex?)` | Get account balance and positions |
| `getOpenOrders(address, dex?)` | Get open orders |
| `createOrder(userId, sig, params)` | Place an order |
| `cancelOrder(userId, sig, params)` | Cancel an order |
| `cancelAllOrders(userId, sig)` | Cancel all orders |
| `withdraw(userId, sig, params)` | Withdraw USDC |
| `startCopyTrade(userId, sig, config)` | Start copy trading |
| `stopCopyTrade(userId, sig, trader)` | Stop copy trading |
| `isHip3Asset(coin)` | Check if coin is HIP-3 |
| `parseCoinName(coin)` | Parse coin to dex + baseCoin |
| `buildCoinName(dex, baseCoin)` | Build full coin name |

## Development

```bash
# Clone the repo
git clone https://github.com/TheArcadiaGroup/gdex-sdk.git
cd gdex-sdk

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Build
npm run build

# Watch mode (rebuild on changes)
npm run dev
```

## Testing

The SDK includes comprehensive unit tests:

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## License

MIT
