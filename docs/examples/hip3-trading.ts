/**
 * HIP-3 Assets Trading Example
 * 
 * Demonstrates how to:
 * - Fetch HIP-3 perp DEXes
 * - List all HIP-3 assets
 * - Trade pre-IPO stocks and commodities
 * - Work with DEX-specific features
 */

import { GdexClient, HLAsset } from '@gdex/sdk';

const client = new GdexClient({
  apiKey: process.env.GDEX_API_KEY!,
});

const USER_ID = 'your-user-id';
const SIGNATURE = 'your-signature';
const WALLET = '0xYourWalletAddress';

async function main() {
  console.log('=== HIP-3 Assets Trading Example ===\n');

  // 1. Fetch all perp DEXes
  console.log('1. Available HIP-3 Perp DEXes:');
  const dexes = await client.getPerpDexes();
  dexes.forEach(dex => {
    console.log(`   ${dex.name.toUpperCase()}: ${dex.fullName || dex.name}`);
  });
  console.log('');

  // 2. Fetch all assets
  console.log('2. Fetching all assets...');
  const assets = await client.getAssets();
  
  // 3. Filter HIP-3 assets
  const hip3Assets = assets.filter(a => client.isHip3Asset(a.coin));
  console.log(`   Total assets: ${assets.length}`);
  console.log(`   HIP-3 assets: ${hip3Assets.length}\n`);

  // 4. Group by DEX
  console.log('3. HIP-3 Assets by DEX:');
  const byDex = hip3Assets.reduce((acc, asset) => {
    const { dex } = client.parseCoinName(asset.coin);
    if (!acc[dex]) acc[dex] = [];
    acc[dex].push(asset);
    return acc;
  }, {} as Record<string, HLAsset[]>);

  Object.entries(byDex).forEach(([dex, assets]) => {
    console.log(`\n   ${dex.toUpperCase()} DEX (${assets.length} assets):`);
    // Show first 5 assets
    assets.slice(0, 5).forEach(a => {
      const price = a.markPx ? `$${parseFloat(a.markPx).toFixed(2)}` : 'N/A';
      console.log(`     ${a.baseCoin}: ${price} (${a.maxLeverage}x max)`);
    });
    if (assets.length > 5) {
      console.log(`     ... and ${assets.length - 5} more`);
    }
  });
  console.log('');

  // 5. Find specific HIP-3 assets
  console.log('4. Finding interesting HIP-3 assets...');
  
  // Find SPACEX on Ventuals
  const spacex = hip3Assets.find(a => 
    a.baseCoin.toUpperCase() === 'SPACEX' || 
    a.coin.toLowerCase().includes('spacex')
  );
  
  // Find GOLD
  const gold = hip3Assets.find(a => 
    a.baseCoin.toUpperCase() === 'GOLD' || 
    a.coin.toLowerCase().includes('gold')
  );
  
  if (spacex) {
    console.log(`\n   Found SPACEX: ${spacex.coin}`);
    console.log(`     Price: $${spacex.markPx}`);
    console.log(`     Max Leverage: ${spacex.maxLeverage}x`);
    console.log(`     Isolated Only: ${spacex.onlyIsolated}`);
  }
  
  if (gold) {
    console.log(`\n   Found GOLD: ${gold.coin}`);
    console.log(`     Price: $${gold.markPx}`);
    console.log(`     Max Leverage: ${gold.maxLeverage}x`);
  }
  console.log('');

  // 6. Trade a HIP-3 asset (SPACEX or first available)
  const targetAsset = spacex || hip3Assets[0];
  
  if (targetAsset) {
    const { dex, baseCoin } = client.parseCoinName(targetAsset.coin);
    console.log(`5. Trading ${baseCoin} on ${dex.toUpperCase()} DEX...`);
    
    const result = await client.createOrder(USER_ID, SIGNATURE, {
      coin: targetAsset.coin,  // Use full coin name: "vntl:SPACEX"
      isLong: true,
      price: targetAsset.markPx || '100',
      size: '1',
      isMarket: true,
    });

    if (result.isSuccess) {
      const status = result.retData?.response?.data?.statuses[0];
      if (status?.filled) {
        console.log(`   ✅ Filled ${baseCoin} at $${status.filled.avgPx}`);
      } else if (status?.resting) {
        console.log(`   📋 Order placed, ID: ${status.resting.oid}`);
      }
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
    }
    console.log('');
  }

  // 7. View HIP-3 positions
  console.log('6. Checking HIP-3 positions...');
  const state = await client.getAccountState(WALLET);
  
  if (state) {
    const hip3Positions = state.assetPositions.filter(p => 
      client.isHip3Asset(p.position.coin)
    );
    
    if (hip3Positions.length > 0) {
      console.log(`   Found ${hip3Positions.length} HIP-3 position(s):`);
      hip3Positions.forEach(({ position }) => {
        const { dex, baseCoin } = client.parseCoinName(position.coin);
        const side = parseFloat(position.szi) > 0 ? 'LONG' : 'SHORT';
        const size = Math.abs(parseFloat(position.szi));
        
        console.log(`\n   ${baseCoin} on ${dex.toUpperCase()} (${side})`);
        console.log(`     Size: ${size}`);
        console.log(`     Entry: $${position.entryPx}`);
        console.log(`     PnL: $${position.unrealizedPnl}`);
      });
    } else {
      console.log('   No HIP-3 positions found');
    }
  }
  console.log('');

  // 8. Demonstrate utility functions
  console.log('7. Utility function examples:');
  
  console.log('\n   isHip3Asset():');
  console.log(`     client.isHip3Asset('BTC') = ${client.isHip3Asset('BTC')}`);
  console.log(`     client.isHip3Asset('vntl:SPACEX') = ${client.isHip3Asset('vntl:SPACEX')}`);
  
  console.log('\n   parseCoinName():');
  const parsed = client.parseCoinName('xyz:GOLD');
  console.log(`     client.parseCoinName('xyz:GOLD') = { dex: '${parsed.dex}', baseCoin: '${parsed.baseCoin}' }`);
  
  console.log('\n   buildCoinName():');
  console.log(`     client.buildCoinName('vntl', 'SPACEX') = '${client.buildCoinName('vntl', 'SPACEX')}'`);
  console.log(`     client.buildCoinName('', 'BTC') = '${client.buildCoinName('', 'BTC')}'`);
  
  console.log('\n=== Demo Complete ===');
}

main().catch(console.error);
