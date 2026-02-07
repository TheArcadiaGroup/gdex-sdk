/**
 * Copy Trading Example
 * 
 * Demonstrates how to:
 * - Start copy trading a trader
 * - Configure copy settings
 * - Monitor copy trade performance
 * - Stop copy trading
 */

import { GdexClient } from '@gdex/sdk';

const client = new GdexClient({
  apiKey: process.env.GDEX_API_KEY!,
});

const USER_ID = 'your-user-id';
const SIGNATURE = 'your-signature';
const WALLET = '0xYourWalletAddress';

// Example trader addresses (replace with real ones)
const TRADERS = {
  btcSpecialist: '0x1234567890abcdef1234567890abcdef12345678',
  altcoinTrader: '0xabcdef1234567890abcdef1234567890abcdef12',
  hip3Expert: '0x7890abcdef1234567890abcdef1234567890abcd',
};

async function main() {
  console.log('=== Copy Trading Example ===\n');

  // 1. Basic copy trade
  console.log('1. Starting basic copy trade...');
  const basicResult = await client.startCopyTrade(USER_ID, SIGNATURE, {
    traderAddress: TRADERS.btcSpecialist,
  });
  
  if (basicResult.isSuccess) {
    console.log('   ✅ Now copying BTC specialist\n');
  } else {
    console.log(`   ❌ Failed: ${basicResult.error}\n`);
  }

  // 2. Copy with size multiplier
  console.log('2. Starting copy trade at 50% size...');
  const scaledResult = await client.startCopyTrade(USER_ID, SIGNATURE, {
    traderAddress: TRADERS.altcoinTrader,
    sizeMultiplier: 0.5, // Copy at 50% of trader's size
  });
  
  if (scaledResult.isSuccess) {
    console.log('   ✅ Now copying altcoin trader at 50%\n');
  } else {
    console.log(`   ❌ Failed: ${scaledResult.error}\n`);
  }

  // 3. Copy with max position size
  console.log('3. Starting copy trade with $1000 max...');
  const cappedResult = await client.startCopyTrade(USER_ID, SIGNATURE, {
    traderAddress: TRADERS.hip3Expert,
    maxPositionSize: 1000, // Never more than $1000 per position
  });
  
  if (cappedResult.isSuccess) {
    console.log('   ✅ Now copying HIP-3 expert (max $1000)\n');
  } else {
    console.log(`   ❌ Failed: ${cappedResult.error}\n`);
  }

  // 4. Copy specific coins only
  console.log('4. Starting selective copy trade...');
  const selectiveResult = await client.startCopyTrade(USER_ID, SIGNATURE, {
    traderAddress: TRADERS.btcSpecialist,
    coins: ['BTC', 'ETH'], // Only copy BTC and ETH trades
    sizeMultiplier: 0.25,
    maxPositionSize: 500,
  });
  
  if (selectiveResult.isSuccess) {
    console.log('   ✅ Copying BTC/ETH trades only at 25% size\n');
  } else {
    console.log(`   ❌ Failed: ${selectiveResult.error}\n`);
  }

  // 5. Reverse copy (fade the trader)
  console.log('5. Starting reverse copy trade...');
  const reverseResult = await client.startCopyTrade(USER_ID, SIGNATURE, {
    traderAddress: TRADERS.altcoinTrader,
    reverseCopy: true, // Go opposite direction
    sizeMultiplier: 0.1,
    maxPositionSize: 200,
  });
  
  if (reverseResult.isSuccess) {
    console.log('   ✅ Now fading altcoin trader (reverse copy)\n');
  } else {
    console.log(`   ❌ Failed: ${reverseResult.error}\n`);
  }

  // 6. Copy HIP-3 assets
  console.log('6. Copy trading HIP-3 assets...');
  const hip3CopyResult = await client.startCopyTrade(USER_ID, SIGNATURE, {
    traderAddress: TRADERS.hip3Expert,
    coins: ['vntl:SPACEX', 'xyz:GOLD', 'xyz:SILVER'],
    sizeMultiplier: 0.2,
    maxPositionSize: 300,
  });
  
  if (hip3CopyResult.isSuccess) {
    console.log('   ✅ Copying HIP-3 trades (SPACEX, GOLD, SILVER)\n');
  } else {
    console.log(`   ❌ Failed: ${hip3CopyResult.error}\n`);
  }

  // 7. Check copy trade performance
  console.log('7. Checking copy trade performance...');
  const stats = await client.getCopyTradeStats(WALLET);
  
  if (stats) {
    console.log('   Copy Trade Statistics:');
    console.log(`     Total PnL: $${stats.totalPnl}`);
    console.log(`     Win Rate: ${stats.winRate}%`);
    console.log(`     Total Trades: ${stats.totalTrades}`);
    console.log(`     Active Positions: ${stats.activePositions}\n`);
  } else {
    console.log('   No copy trade stats available\n');
  }

  // 8. View copied positions
  console.log('8. Viewing current positions...');
  const state = await client.getAccountState(WALLET);
  
  if (state && state.assetPositions.length > 0) {
    console.log(`   You have ${state.assetPositions.length} position(s):\n`);
    
    state.assetPositions.forEach(({ position }) => {
      const size = parseFloat(position.szi);
      const side = size > 0 ? 'LONG' : 'SHORT';
      const pnl = parseFloat(position.unrealizedPnl);
      const emoji = pnl >= 0 ? '🟢' : '🔴';
      
      console.log(`   ${emoji} ${position.coin} ${side}`);
      console.log(`      Size: ${Math.abs(size)}`);
      console.log(`      Entry: $${position.entryPx}`);
      console.log(`      PnL: $${pnl.toFixed(2)}`);
      console.log('');
    });
  } else {
    console.log('   No positions (copy trades pending)\n');
  }

  // 9. Stop copy trading
  console.log('9. Stopping copy trade...');
  const stopResult = await client.stopCopyTrade(
    USER_ID, 
    SIGNATURE, 
    TRADERS.btcSpecialist
  );
  
  if (stopResult.isSuccess) {
    console.log('   ✅ Stopped copying BTC specialist');
    console.log('   Note: Existing positions remain open\n');
  } else {
    console.log(`   ❌ Failed: ${stopResult.error}\n`);
  }

  console.log('=== Demo Complete ===');
}

main().catch(console.error);
