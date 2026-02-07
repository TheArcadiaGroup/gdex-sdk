# Copy Trading Guide

Automatically replicate trades from successful traders on GDEX.

## Overview

Copy trading allows you to:

- **Mirror positions** of top traders automatically
- **Scale position sizes** based on your capital
- **Filter specific coins** to copy
- **Set maximum position limits** for risk management
- **Reverse copy** (take opposite positions)

## Starting Copy Trade

### Basic Setup

```typescript
const result = await client.startCopyTrade('userId', 'signature', {
  traderAddress: '0x1234567890abcdef1234567890abcdef12345678',
});

if (result.isSuccess) {
  console.log('Now copying trader!');
}
```

### With Size Multiplier

Copy at a fraction (or multiple) of the trader's size:

```typescript
// Copy at 50% of trader's position sizes
await client.startCopyTrade('userId', 'signature', {
  traderAddress: '0xTraderAddress',
  sizeMultiplier: 0.5,  // 0.5 = 50%, 2 = 200%
});
```

**Example:**
- Trader opens 1 BTC long
- You (with 0.5x multiplier) open 0.5 BTC long

### With Maximum Position Size

Limit your exposure per trade:

```typescript
// Never copy more than $1000 per position
await client.startCopyTrade('userId', 'signature', {
  traderAddress: '0xTraderAddress',
  maxPositionSize: 1000,  // USD
});
```

**Example:**
- Trader opens $5000 BTC long
- You only open $1000 BTC long (capped)

### Filter Specific Coins

Only copy trades on certain assets:

```typescript
// Only copy BTC and ETH trades
await client.startCopyTrade('userId', 'signature', {
  traderAddress: '0xTraderAddress',
  coins: ['BTC', 'ETH'],
});

// Copy HIP-3 assets only
await client.startCopyTrade('userId', 'signature', {
  traderAddress: '0xTraderAddress',
  coins: ['vntl:SPACEX', 'xyz:GOLD', 'xyz:SILVER'],
});
```

### Reverse Copy

Take the opposite position of the trader:

```typescript
// When trader goes long, you go short (and vice versa)
await client.startCopyTrade('userId', 'signature', {
  traderAddress: '0xTraderAddress',
  reverseCopy: true,
});
```

**Use cases:**
- Fade consistently wrong traders
- Hedge against a trader's strategy

## Complete Configuration Example

```typescript
await client.startCopyTrade('userId', 'signature', {
  traderAddress: '0xTopTraderWallet',
  
  // Size control
  sizeMultiplier: 0.25,    // Copy at 25% size
  maxPositionSize: 500,    // Max $500 per position
  
  // Asset filter
  coins: ['BTC', 'ETH', 'SOL', 'vntl:SPACEX'],
  
  // Strategy
  reverseCopy: false,      // Same direction as trader
});
```

## Stopping Copy Trade

```typescript
const result = await client.stopCopyTrade(
  'userId',
  'signature',
  '0xTraderAddress'  // Trader you want to stop copying
);

if (result.isSuccess) {
  console.log('Stopped copying trader');
}
```

**Note:** Stopping copy trade does NOT close existing positions. You must close those manually.

## Monitoring Copy Trades

### Get Copy Trade Statistics

```typescript
const stats = await client.getCopyTradeStats('0xYourWallet');

if (stats) {
  console.log('Copy Trade Performance:');
  console.log(`  Total PnL: $${stats.totalPnl}`);
  console.log(`  Win Rate: ${stats.winRate}%`);
  console.log(`  Total Trades: ${stats.totalTrades}`);
  console.log(`  Active Positions: ${stats.activePositions}`);
}
```

### View Copied Positions

```typescript
const state = await client.getAccountState('0xYourWallet');

if (state) {
  console.log('Current Positions (from copy trading):');
  state.assetPositions.forEach(({ position }) => {
    const side = parseFloat(position.szi) > 0 ? 'LONG' : 'SHORT';
    console.log(`  ${position.coin} ${side}: $${position.unrealizedPnl} PnL`);
  });
}
```

## Best Practices

### 1. Research Before Copying

```typescript
// Check trader's recent performance
const traderState = await client.getAccountState('0xTraderAddress');

// Look at their positions
traderState?.assetPositions.forEach(({ position }) => {
  console.log(`${position.coin}: ${position.unrealizedPnl} PnL`);
});
```

### 2. Start Small

```typescript
// Start with small multiplier to test
await client.startCopyTrade('userId', 'sig', {
  traderAddress: '0xTrader',
  sizeMultiplier: 0.1,     // Only 10% of their size
  maxPositionSize: 100,    // Max $100 to start
});
```

### 3. Diversify Across Traders

```typescript
const traders = [
  { address: '0xTrader1', multiplier: 0.2 },
  { address: '0xTrader2', multiplier: 0.15 },
  { address: '0xTrader3', multiplier: 0.1 },
];

for (const trader of traders) {
  await client.startCopyTrade('userId', 'sig', {
    traderAddress: trader.address,
    sizeMultiplier: trader.multiplier,
    maxPositionSize: 500,
  });
}
```

### 4. Set Risk Limits

```typescript
// Always use maxPositionSize to limit risk
await client.startCopyTrade('userId', 'sig', {
  traderAddress: '0xTrader',
  sizeMultiplier: 1,       // 100% copy
  maxPositionSize: 1000,   // But never more than $1000
});
```

### 5. Monitor Regularly

```typescript
async function monitorCopyTrades() {
  const stats = await client.getCopyTradeStats('0xMyWallet');
  const state = await client.getAccountState('0xMyWallet');
  
  // Alert on losses
  if (stats && parseFloat(stats.totalPnl) < -500) {
    console.warn('WARNING: Copy trade losses exceed $500');
    // Consider stopping copy trade
  }
  
  // Alert on high exposure
  const totalValue = state?.assetPositions.reduce((sum, { position }) => {
    return sum + parseFloat(position.positionValue);
  }, 0) || 0;
  
  if (totalValue > 10000) {
    console.warn('WARNING: Total exposure exceeds $10,000');
  }
}

// Run every 5 minutes
setInterval(monitorCopyTrades, 5 * 60 * 1000);
```

## Complete Copy Trading Bot

```typescript
import { GdexClient } from '@gdex/sdk';

const client = new GdexClient({ apiKey: 'your-api-key' });
const MY_WALLET = '0xMyWalletAddress';

interface TraderConfig {
  address: string;
  multiplier: number;
  maxSize: number;
  coins?: string[];
}

const tradersToFollow: TraderConfig[] = [
  {
    address: '0xTopBTCTrader',
    multiplier: 0.25,
    maxSize: 500,
    coins: ['BTC'],
  },
  {
    address: '0xAltcoinTrader',
    multiplier: 0.2,
    maxSize: 300,
    coins: ['ETH', 'SOL', 'AVAX'],
  },
  {
    address: '0xHIP3Specialist',
    multiplier: 0.15,
    maxSize: 200,
    coins: ['vntl:SPACEX', 'xyz:GOLD'],
  },
];

async function setupCopyTrading() {
  console.log('Setting up copy trading...\n');
  
  for (const trader of tradersToFollow) {
    console.log(`Starting to copy ${trader.address.slice(0, 10)}...`);
    
    const result = await client.startCopyTrade('userId', 'sig', {
      traderAddress: trader.address,
      sizeMultiplier: trader.multiplier,
      maxPositionSize: trader.maxSize,
      coins: trader.coins,
    });
    
    console.log(`  Result: ${result.isSuccess ? 'Success' : result.error}`);
  }
}

async function checkPerformance() {
  const stats = await client.getCopyTradeStats(MY_WALLET);
  const state = await client.getAccountState(MY_WALLET);
  
  console.log('\n=== Copy Trade Performance ===');
  console.log(`Total PnL: $${stats?.totalPnl || 0}`);
  console.log(`Win Rate: ${stats?.winRate || 0}%`);
  console.log(`Active Positions: ${state?.assetPositions.length || 0}`);
  
  if (state?.assetPositions.length) {
    console.log('\nPositions:');
    state.assetPositions.forEach(({ position }) => {
      const side = parseFloat(position.szi) > 0 ? 'LONG' : 'SHORT';
      const pnl = parseFloat(position.unrealizedPnl);
      const emoji = pnl >= 0 ? '✅' : '❌';
      console.log(`  ${emoji} ${position.coin} ${side}: $${pnl.toFixed(2)}`);
    });
  }
}

// Run
setupCopyTrading()
  .then(() => checkPerformance())
  .catch(console.error);
```

## Next Steps

- [API Reference](./api-reference.md) - Complete method documentation
- [Trading Guide](./trading.md) - Manual trading options
