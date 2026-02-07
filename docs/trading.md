# Trading Guide

Complete guide to trading perpetuals on GDEX.

## Table of Contents

- [Order Types](#order-types)
- [Creating Orders](#creating-orders)
- [Take Profit & Stop Loss](#take-profit--stop-loss)
- [Closing Positions](#closing-positions)
- [Canceling Orders](#canceling-orders)
- [Managing Positions](#managing-positions)
- [Withdrawals](#withdrawals)

## Order Types

GDEX supports two order types:

| Type | Description | Use Case |
|------|-------------|----------|
| **Market** | Executes immediately at best available price | Quick entry/exit |
| **Limit** | Executes only at specified price or better | Precise entries |

## Creating Orders

### Market Order

Execute immediately at the current market price:

```typescript
const result = await client.createOrder('userId', 'signature', {
  coin: 'BTC',
  isLong: true,        // true = long, false = short
  price: '76000',      // Reference price (for slippage protection)
  size: '0.01',        // Position size in base currency
  isMarket: true,      // Market order
});

if (result.isSuccess) {
  const status = result.retData?.response?.data?.statuses[0];
  if (status?.filled) {
    console.log(`Filled at ${status.filled.avgPx}`);
    console.log(`Size: ${status.filled.totalSz}`);
  }
}
```

### Limit Order

Execute only when price reaches your target:

```typescript
const result = await client.createOrder('userId', 'signature', {
  coin: 'ETH',
  isLong: true,
  price: '2800',       // Limit price
  size: '1',
  isMarket: false,     // Limit order (default)
});

if (result.isSuccess) {
  const status = result.retData?.response?.data?.statuses[0];
  if (status?.resting) {
    console.log(`Order placed with ID: ${status.resting.oid}`);
  }
}
```

### Short Position

Profit when price goes down:

```typescript
const result = await client.createOrder('userId', 'signature', {
  coin: 'BTC',
  isLong: false,       // Short position
  price: '76000',
  size: '0.01',
  isMarket: true,
});
```

## Take Profit & Stop Loss

Protect your positions with TP/SL orders:

```typescript
// Long with TP/SL
const longWithTPSL = await client.createOrder('userId', 'signature', {
  coin: 'BTC',
  isLong: true,
  price: '76000',
  size: '0.01',
  tpPrice: '80000',    // Take profit at $80,000
  slPrice: '74000',    // Stop loss at $74,000
  isMarket: true,
});

// Short with TP/SL
const shortWithTPSL = await client.createOrder('userId', 'signature', {
  coin: 'ETH',
  isLong: false,
  price: '2850',
  size: '1',
  tpPrice: '2700',     // Take profit at $2,700 (price drops)
  slPrice: '2950',     // Stop loss at $2,950 (price rises)
  isMarket: true,
});
```

### TP/SL Rules

| Position | Take Profit | Stop Loss |
|----------|-------------|-----------|
| Long | Above entry price | Below entry price |
| Short | Below entry price | Above entry price |

### Orders Without TP/SL

TP/SL is optional - you can open positions without them:

```typescript
const result = await client.createOrder('userId', 'signature', {
  coin: 'SOL',
  isLong: true,
  price: '125',
  size: '10',
  isMarket: true,
  // No tpPrice or slPrice - position has no automatic exit
});
```

## Closing Positions

### Reduce-Only Orders

Close an existing position:

```typescript
// Close a long position (sell)
const closeResult = await client.createOrder('userId', 'signature', {
  coin: 'BTC',
  isLong: false,       // Opposite direction to close
  price: '76000',
  size: '0.01',        // Size to close
  reduceOnly: true,    // Only reduces position, won't open new
  isMarket: true,
});
```

### Partial Close

Close part of your position:

```typescript
// If you have 1 BTC long, close 0.5
const partialClose = await client.createOrder('userId', 'signature', {
  coin: 'BTC',
  isLong: false,
  price: '76000',
  size: '0.5',         // Close half
  reduceOnly: true,
  isMarket: true,
});
```

## Canceling Orders

### Cancel Single Order

```typescript
const result = await client.cancelOrder('userId', 'signature', {
  coin: 'BTC',
  orderId: 12345,
});

if (result.isSuccess) {
  console.log('Order canceled successfully');
}
```

### Cancel All Orders

```typescript
const result = await client.cancelAllOrders('userId', 'signature');

if (result.isSuccess) {
  console.log('All orders canceled');
}
```

## Managing Positions

### View Current Positions

```typescript
const state = await client.getAccountState('0xYourWallet');

if (state && state.assetPositions.length > 0) {
  state.assetPositions.forEach(({ position }) => {
    const side = parseFloat(position.szi) > 0 ? 'LONG' : 'SHORT';
    const size = Math.abs(parseFloat(position.szi));
    
    console.log(`${position.coin} ${side}`);
    console.log(`  Size: ${size}`);
    console.log(`  Entry: $${position.entryPx}`);
    console.log(`  PnL: $${position.unrealizedPnl}`);
    console.log(`  Liquidation: $${position.liquidationPx}`);
    console.log('');
  });
}
```

**Example Output:**
```
BTC LONG
  Size: 0.01
  Entry: $75500
  PnL: $7.40
  Liquidation: $72000

ETH SHORT
  Size: 2
  Entry: $2900
  PnL: $100
  Liquidation: $3100
```

### View Open Orders

```typescript
const orders = await client.getOpenOrders('0xYourWallet');

orders.forEach(order => {
  const side = order.isBuy ? 'BUY' : 'SELL';
  console.log(`${order.coin} ${side} @ $${order.limitPx} (${order.sz})`);
});
```

## Withdrawals

Withdraw USDC from your trading account:

```typescript
// Check available balance first
const state = await client.getAccountState('0xYourWallet');
console.log(`Available to withdraw: $${state?.withdrawable}`);

// Withdraw $100
const result = await client.withdraw('userId', 'signature', {
  amount: '100',
});

if (result.isSuccess) {
  console.log(`Withdrawn: $${result.data?.withdrawn}`);
}
```

## Best Practices

### 1. Always Check Balance Before Trading

```typescript
const state = await client.getAccountState(walletAddress);
const available = parseFloat(state?.withdrawable || '0');

const orderValue = parseFloat(price) * parseFloat(size);
const requiredMargin = orderValue / leverage;

if (available < requiredMargin) {
  throw new Error(`Insufficient balance. Need $${requiredMargin}, have $${available}`);
}
```

### 2. Use Try-Catch for Error Handling

```typescript
try {
  const result = await client.createOrder('userId', 'sig', params);
  
  if (!result.isSuccess) {
    console.error('Order rejected:', result.error);
    return;
  }
  
  console.log('Order successful');
} catch (error) {
  console.error('Network error:', error.message);
}
```

### 3. Minimum Order Size

GDEX requires minimum $11 order value:

```typescript
const orderValue = parseFloat(price) * parseFloat(size);
if (orderValue < 11) {
  throw new Error('Minimum order value is $11');
}
```

## Next Steps

- [HIP-3 Assets](./hip3-assets.md) - Trade unique assets like SPACEX, GOLD
- [Copy Trading](./copy-trading.md) - Automatically copy top traders
- [API Reference](./api-reference.md) - Complete method documentation
