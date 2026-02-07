# GDEX SDK Documentation

Welcome to the official GDEX SDK documentation. This SDK enables seamless integration with GDEX trading services.

## Overview

The GDEX SDK provides:

- **Perpetual Trading** - Market and limit orders with TP/SL
- **HIP-3 Support** - Trade unique assets like SPACEX, GOLD, SILVER
- **Copy Trading** - Automatically replicate successful traders
- **Portfolio Management** - Monitor positions and account state
- **Full TypeScript Support** - Complete type definitions

## Quick Links

| Guide | Description |
|-------|-------------|
| [Getting Started](./getting-started.md) | Installation and first steps |
| [Deposits](./deposits.md) | Fund your trading account |
| [Trading Guide](./trading.md) | Orders, TP/SL, positions |
| [HIP-3 Assets](./hip3-assets.md) | Builder-deployed perp DEXes |
| [Copy Trading](./copy-trading.md) | Replicate top traders |
| [API Reference](./api-reference.md) | Complete method docs |

## Code Examples

| Example | Description |
|---------|-------------|
| [Basic Trading](./examples/basic-trading.ts) | Market/limit orders, cancels |
| [HIP-3 Trading](./examples/hip3-trading.ts) | Trade pre-IPO stocks, commodities |
| [Copy Trading](./examples/copy-trading.ts) | Start/stop copy trading |
| [Portfolio Monitor](./examples/portfolio-monitor.ts) | Track positions and alerts |

## Installation

```bash
# npm
npm install github:TheArcadiaGroup/gdex-sdk

# yarn
yarn add github:TheArcadiaGroup/gdex-sdk

# pnpm
pnpm add github:TheArcadiaGroup/gdex-sdk
```

## Quick Example

```typescript
import { GdexClient } from '@gdex/sdk';

const client = new GdexClient({ apiKey: 'your-api-key' });

// Get all assets (including HIP-3)
const assets = await client.getAssets();
console.log(`${assets.length} tradeable assets`);

// Place a trade
const result = await client.createOrder('userId', 'signature', {
  coin: 'BTC',
  isLong: true,
  price: '76000',
  size: '0.01',
  isMarket: true,
});
```

## Key Features

### Standard Perpetuals

Trade major cryptocurrencies with up to 50x leverage:

```typescript
await client.createOrder('userId', 'sig', {
  coin: 'BTC',
  isLong: true,
  price: '76000',
  size: '0.01',
  tpPrice: '80000',
  slPrice: '74000',
  isMarket: true,
});
```

### HIP-3 Assets

Trade pre-IPO stocks, commodities, and unique assets:

```typescript
// Trade SpaceX on Ventuals DEX
await client.createOrder('userId', 'sig', {
  coin: 'vntl:SPACEX',
  isLong: true,
  price: '150',
  size: '10',
  isMarket: true,
});

// Trade Gold on XYZ DEX
await client.createOrder('userId', 'sig', {
  coin: 'xyz:GOLD',
  isLong: true,
  price: '2650',
  size: '1',
  isMarket: true,
});
```

### Copy Trading

Automatically replicate successful traders:

```typescript
await client.startCopyTrade('userId', 'sig', {
  traderAddress: '0xTopTrader',
  sizeMultiplier: 0.5,    // 50% of their size
  maxPositionSize: 1000,  // Max $1000 per position
  coins: ['BTC', 'ETH'],  // Only these coins
});
```

## Support

- [GitHub Issues](https://github.com/TheArcadiaGroup/gdex-sdk/issues)
- [Discord](https://discord.gg/gdex)

## License

MIT
