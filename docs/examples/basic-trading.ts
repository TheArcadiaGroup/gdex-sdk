/**
 * Basic Trading Example
 * 
 * Demonstrates how to:
 * - Initialize the client
 * - Fetch assets
 * - Place market and limit orders
 * - Set take profit and stop loss
 * - Cancel orders
 */

import { GdexClient } from '@gdex/sdk';

// Initialize client
const client = new GdexClient({
  apiKey: process.env.GDEX_API_KEY!,
});

// Your credentials (in production, use secure storage)
const USER_ID = 'your-user-id';
const SIGNATURE = 'your-signature';
const WALLET = '0xYourWalletAddress';

async function main() {
  console.log('=== GDEX Basic Trading Example ===\n');

  // 1. Fetch available assets
  console.log('1. Fetching available assets...');
  const assets = await client.getAssets();
  console.log(`   Found ${assets.length} tradeable assets\n`);

  // 2. Get BTC info
  const btc = assets.find(a => a.coin === 'BTC');
  if (btc) {
    console.log('2. BTC Information:');
    console.log(`   Price: $${btc.markPx}`);
    console.log(`   Max Leverage: ${btc.maxLeverage}x`);
    console.log(`   Size Decimals: ${btc.szDecimals}\n`);
  }

  // 3. Check account balance
  console.log('3. Checking account balance...');
  const state = await client.getAccountState(WALLET);
  if (state) {
    console.log(`   Withdrawable: $${state.withdrawable}`);
    console.log(`   Account Value: $${state.crossMarginSummary.accountValue}`);
    console.log(`   Open Positions: ${state.assetPositions.length}\n`);
  }

  // 4. Place a market long order
  console.log('4. Placing market buy order...');
  const marketOrder = await client.createOrder(USER_ID, SIGNATURE, {
    coin: 'BTC',
    isLong: true,
    price: btc?.markPx || '76000',
    size: '0.001', // Small size for demo
    isMarket: true,
  });

  if (marketOrder.isSuccess) {
    const status = marketOrder.retData?.response?.data?.statuses[0];
    if (status?.filled) {
      console.log(`   ✅ Filled at $${status.filled.avgPx}`);
      console.log(`   Size: ${status.filled.totalSz} BTC\n`);
    }
  } else {
    console.log(`   ❌ Failed: ${marketOrder.error}\n`);
  }

  // 5. Place a limit order with TP/SL
  console.log('5. Placing limit order with TP/SL...');
  const currentPrice = parseFloat(btc?.markPx || '76000');
  const limitPrice = (currentPrice * 0.99).toFixed(0); // 1% below current
  const tpPrice = (currentPrice * 1.05).toFixed(0);    // 5% above current
  const slPrice = (currentPrice * 0.97).toFixed(0);    // 3% below current

  const limitOrder = await client.createOrder(USER_ID, SIGNATURE, {
    coin: 'BTC',
    isLong: true,
    price: limitPrice,
    size: '0.001',
    tpPrice: tpPrice,
    slPrice: slPrice,
    isMarket: false, // Limit order
  });

  if (limitOrder.isSuccess) {
    const status = limitOrder.retData?.response?.data?.statuses[0];
    if (status?.resting) {
      console.log(`   ✅ Limit order placed`);
      console.log(`   Order ID: ${status.resting.oid}`);
      console.log(`   Entry: $${limitPrice}`);
      console.log(`   TP: $${tpPrice}, SL: $${slPrice}\n`);
    }
  } else {
    console.log(`   ❌ Failed: ${limitOrder.error}\n`);
  }

  // 6. View open orders
  console.log('6. Viewing open orders...');
  const orders = await client.getOpenOrders(WALLET);
  if (orders.length > 0) {
    orders.forEach(order => {
      const side = order.isBuy ? 'BUY' : 'SELL';
      console.log(`   ${order.coin} ${side} ${order.sz} @ $${order.limitPx}`);
    });
  } else {
    console.log('   No open orders');
  }
  console.log('');

  // 7. Cancel all orders
  console.log('7. Canceling all orders...');
  const cancelResult = await client.cancelAllOrders(USER_ID, SIGNATURE);
  if (cancelResult.isSuccess) {
    console.log('   ✅ All orders canceled\n');
  } else {
    console.log(`   ❌ Failed: ${cancelResult.error}\n`);
  }

  console.log('=== Demo Complete ===');
}

main().catch(console.error);
