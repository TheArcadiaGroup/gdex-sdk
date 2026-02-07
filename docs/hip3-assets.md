# HIP-3 Assets Guide

HIP-3 (Hyperliquid Improvement Proposal 3) enables builder-deployed perpetual DEXes with unique assets not available on the main exchange.

## What are HIP-3 Assets?

HIP-3 allows third parties to deploy their own perpetual markets on Hyperliquid. These assets:

- Have **unique symbols** like `vntl:SPACEX`, `xyz:GOLD`
- Use **isolated margin only** (no cross-margin)
- May have **different leverage limits** than standard assets
- Have their **own liquidity pools**

## Available HIP-3 DEXes

| DEX | Name | Example Assets |
|-----|------|----------------|
| `xyz` | XYZ Exchange | GOLD, SILVER, TSLA, NVDA, AAPL, MSFT |
| `vntl` | Ventuals | SPACEX, OPENAI, ANTHROPIC, MAG7 |
| `flx` | Felix Exchange | GOLD, SILVER, XMR, COPPER |
| `hyna` | HyENA | BTC, ETH, SOL (leveraged variants) |
| `km` | KM | Various assets |
| `cash` | Cash | Various assets |

## Fetching HIP-3 Assets

### Get All Perp DEXes

```typescript
const dexes = await client.getPerpDexes();

dexes.forEach(dex => {
  console.log(`${dex.name}: ${dex.fullName}`);
});
```

**Output:**
```
xyz: XYZ Exchange
vntl: Ventuals
flx: Felix Exchange
hyna: HyENA
```

### Get All Assets (Including HIP-3)

```typescript
const assets = await client.getAssets();

// Filter only HIP-3 assets
const hip3Assets = assets.filter(asset => client.isHip3Asset(asset.coin));

console.log(`Total assets: ${assets.length}`);
console.log(`HIP-3 assets: ${hip3Assets.length}`);

// Group by DEX
const byDex = hip3Assets.reduce((acc, asset) => {
  const { dex } = client.parseCoinName(asset.coin);
  if (!acc[dex]) acc[dex] = [];
  acc[dex].push(asset);
  return acc;
}, {} as Record<string, typeof hip3Assets>);

Object.entries(byDex).forEach(([dex, assets]) => {
  console.log(`\n${dex.toUpperCase()} DEX (${assets.length} assets):`);
  assets.forEach(a => console.log(`  ${a.baseCoin}: $${a.markPx}`));
});
```

**Output:**
```
Total assets: 343
HIP-3 assets: 115

XYZ DEX (42 assets):
  XYZ100: $1250.50
  TSLA: $245.30
  NVDA: $890.20
  GOLD: $2650.00
  ...

VNTL DEX (13 assets):
  SPACEX: $150.00
  OPENAI: $85.50
  ANTHROPIC: $45.20
  MAG7: $520.00
  ...
```

## Trading HIP-3 Assets

### Coin Name Format

HIP-3 assets use the format `dex:COIN`:

```typescript
// Standard asset
'BTC'           // Default DEX

// HIP-3 assets
'vntl:SPACEX'   // SPACEX on Ventuals
'xyz:GOLD'      // GOLD on XYZ
'flx:SILVER'    // SILVER on Felix
```

### Place HIP-3 Order

```typescript
// Buy SPACEX on Ventuals DEX
const result = await client.createOrder('userId', 'signature', {
  coin: 'vntl:SPACEX',    // HIP-3 format: dex:COIN
  isLong: true,
  price: '150',
  size: '10',
  isMarket: true,
});

if (result.isSuccess) {
  console.log('SPACEX position opened!');
}
```

### Trade Gold

```typescript
// Long gold on XYZ DEX
const goldOrder = await client.createOrder('userId', 'signature', {
  coin: 'xyz:GOLD',
  isLong: true,
  price: '2650',
  size: '1',
  tpPrice: '2750',
  slPrice: '2600',
  isMarket: true,
});
```

### Trade Pre-IPO Stocks

```typescript
// Trade SpaceX (pre-IPO)
const spacexOrder = await client.createOrder('userId', 'signature', {
  coin: 'vntl:SPACEX',
  isLong: true,
  price: '150',
  size: '5',
  isMarket: true,
});

// Trade OpenAI (pre-IPO)
const openaiOrder = await client.createOrder('userId', 'signature', {
  coin: 'vntl:OPENAI',
  isLong: false,  // Short
  price: '85',
  size: '10',
  isMarket: true,
});
```

## Utility Functions

### Check if Asset is HIP-3

```typescript
client.isHip3Asset('BTC');           // false
client.isHip3Asset('vntl:SPACEX');   // true
client.isHip3Asset('xyz:GOLD');      // true
```

### Parse Coin Name

```typescript
const { dex, baseCoin } = client.parseCoinName('vntl:SPACEX');
// dex = 'vntl'
// baseCoin = 'SPACEX'

const { dex: dex2, baseCoin: baseCoin2 } = client.parseCoinName('BTC');
// dex2 = ''
// baseCoin2 = 'BTC'
```

### Build Coin Name

```typescript
const coin = client.buildCoinName('vntl', 'SPACEX');
// coin = 'vntl:SPACEX'

const standardCoin = client.buildCoinName('', 'BTC');
// standardCoin = 'BTC'
```

## HIP-3 Specific Considerations

### 1. Isolated Margin Only

HIP-3 assets **only support isolated margin**, not cross margin:

```typescript
const asset = assets.find(a => a.coin === 'vntl:SPACEX');
console.log(asset?.onlyIsolated);  // true
```

### 2. Lower Leverage Limits

HIP-3 assets often have lower max leverage than standard assets:

```typescript
const btc = assets.find(a => a.coin === 'BTC');
const spacex = assets.find(a => a.coin === 'vntl:SPACEX');

console.log(`BTC max leverage: ${btc?.maxLeverage}x`);      // 50x
console.log(`SPACEX max leverage: ${spacex?.maxLeverage}x`); // 3x
```

### 3. Asset IDs

HIP-3 assets have computed asset IDs:

```
Asset ID = 100000 + (perpDexIndex * 10000) + indexInMeta
```

```typescript
const asset = assets.find(a => a.coin === 'vntl:SPACEX');
console.log(`Asset ID: ${asset?.assetId}`);  // e.g., 130001
```

### 4. DEX Abstraction

When trading HIP-3 assets, the system automatically handles collateral movement between your main perp account and the HIP-3 DEX account.

## Complete Example: HIP-3 Trading Bot

```typescript
import { GdexClient, HLAsset } from '@gdex/sdk';

const client = new GdexClient({ apiKey: 'your-api-key' });

async function tradeHip3Assets() {
  // 1. Fetch all assets
  const assets = await client.getAssets();
  
  // 2. Find tradeable HIP-3 assets
  const hip3 = assets.filter(a => 
    client.isHip3Asset(a.coin) && 
    !a.isDelisted &&
    parseFloat(a.markPx || '0') > 0
  );
  
  console.log(`Found ${hip3.length} tradeable HIP-3 assets`);
  
  // 3. Find assets with good volume (price movement)
  const promising = hip3.filter(a => {
    const price = parseFloat(a.markPx || '0');
    return price > 10 && a.maxLeverage >= 3;
  });
  
  // 4. Trade the first promising asset
  if (promising.length > 0) {
    const target = promising[0];
    const { dex, baseCoin } = client.parseCoinName(target.coin);
    
    console.log(`Trading ${baseCoin} on ${dex.toUpperCase()} DEX`);
    console.log(`  Price: $${target.markPx}`);
    console.log(`  Max Leverage: ${target.maxLeverage}x`);
    
    const result = await client.createOrder('userId', 'sig', {
      coin: target.coin,
      isLong: true,
      price: target.markPx!,
      size: '1',
      isMarket: true,
    });
    
    console.log(`  Result: ${result.isSuccess ? 'Success' : result.error}`);
  }
}

tradeHip3Assets();
```

## Next Steps

- [Copy Trading](./copy-trading.md) - Copy traders on HIP-3 assets
- [API Reference](./api-reference.md) - Complete method documentation
