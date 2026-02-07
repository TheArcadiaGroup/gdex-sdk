/**
 * Portfolio Monitoring Example
 * 
 * Demonstrates how to:
 * - Track account balance
 * - Monitor all positions
 * - Calculate portfolio metrics
 * - Set up alerts
 */

import { GdexClient, HLPosition } from '@gdex/sdk';

const client = new GdexClient({
  apiKey: process.env.GDEX_API_KEY!,
});

const WALLET = '0xYourWalletAddress';

// Alert thresholds
const ALERTS = {
  maxDrawdown: 500,     // Alert if losses exceed $500
  maxExposure: 10000,   // Alert if total exposure exceeds $10k
  liquidationWarning: 0.15, // Alert if within 15% of liquidation
};

interface PortfolioMetrics {
  totalValue: number;
  totalPnl: number;
  totalExposure: number;
  longExposure: number;
  shortExposure: number;
  positionCount: number;
  largestPosition: {
    coin: string;
    value: number;
  } | null;
  riskiestPosition: {
    coin: string;
    liquidationDistance: number;
  } | null;
}

async function calculateMetrics(): Promise<PortfolioMetrics> {
  const state = await client.getAccountState(WALLET);
  
  if (!state) {
    return {
      totalValue: 0,
      totalPnl: 0,
      totalExposure: 0,
      longExposure: 0,
      shortExposure: 0,
      positionCount: 0,
      largestPosition: null,
      riskiestPosition: null,
    };
  }

  let totalPnl = 0;
  let longExposure = 0;
  let shortExposure = 0;
  let largestPosition: { coin: string; value: number } | null = null;
  let riskiestPosition: { coin: string; liquidationDistance: number } | null = null;

  // Get current prices for liquidation calculations
  const assets = await client.getAssets();
  const priceMap = new Map(assets.map(a => [a.coin, parseFloat(a.markPx || '0')]));

  state.assetPositions.forEach(({ position }) => {
    const size = parseFloat(position.szi);
    const pnl = parseFloat(position.unrealizedPnl);
    const value = parseFloat(position.positionValue);
    const currentPrice = priceMap.get(position.coin) || parseFloat(position.entryPx);
    const liqPrice = parseFloat(position.liquidationPx);

    totalPnl += pnl;

    if (size > 0) {
      longExposure += value;
    } else {
      shortExposure += value;
    }

    // Track largest position
    if (!largestPosition || value > largestPosition.value) {
      largestPosition = { coin: position.coin, value };
    }

    // Calculate distance to liquidation
    let liquidationDistance: number;
    if (size > 0) {
      // Long: liquidation below current price
      liquidationDistance = (currentPrice - liqPrice) / currentPrice;
    } else {
      // Short: liquidation above current price
      liquidationDistance = (liqPrice - currentPrice) / currentPrice;
    }

    // Track riskiest position
    if (!riskiestPosition || liquidationDistance < riskiestPosition.liquidationDistance) {
      riskiestPosition = { coin: position.coin, liquidationDistance };
    }
  });

  return {
    totalValue: parseFloat(state.crossMarginSummary.accountValue),
    totalPnl,
    totalExposure: longExposure + shortExposure,
    longExposure,
    shortExposure,
    positionCount: state.assetPositions.length,
    largestPosition,
    riskiestPosition,
  };
}

function formatUSD(value: number): string {
  const prefix = value >= 0 ? '' : '-';
  return `${prefix}$${Math.abs(value).toFixed(2)}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

async function printPortfolioSummary(metrics: PortfolioMetrics) {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║        PORTFOLIO SUMMARY             ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║ Account Value:    ${formatUSD(metrics.totalValue).padStart(15)} ║`);
  console.log(`║ Unrealized PnL:   ${formatUSD(metrics.totalPnl).padStart(15)} ║`);
  console.log(`║ Total Exposure:   ${formatUSD(metrics.totalExposure).padStart(15)} ║`);
  console.log(`║   Long:           ${formatUSD(metrics.longExposure).padStart(15)} ║`);
  console.log(`║   Short:          ${formatUSD(metrics.shortExposure).padStart(15)} ║`);
  console.log(`║ Position Count:   ${String(metrics.positionCount).padStart(15)} ║`);
  console.log('╚══════════════════════════════════════╝\n');
}

async function printPositions() {
  const state = await client.getAccountState(WALLET);
  
  if (!state || state.assetPositions.length === 0) {
    console.log('No open positions.\n');
    return;
  }

  console.log('POSITIONS:');
  console.log('─'.repeat(70));
  console.log(
    'ASSET'.padEnd(15) +
    'SIDE'.padEnd(8) +
    'SIZE'.padEnd(12) +
    'ENTRY'.padEnd(12) +
    'PNL'.padEnd(12) +
    'LIQ PRICE'.padEnd(12)
  );
  console.log('─'.repeat(70));

  state.assetPositions.forEach(({ position }) => {
    const size = parseFloat(position.szi);
    const side = size > 0 ? 'LONG' : 'SHORT';
    const pnl = parseFloat(position.unrealizedPnl);
    const pnlStr = pnl >= 0 ? `+${pnl.toFixed(2)}` : pnl.toFixed(2);

    console.log(
      position.coin.padEnd(15) +
      side.padEnd(8) +
      Math.abs(size).toString().padEnd(12) +
      `$${position.entryPx}`.padEnd(12) +
      `$${pnlStr}`.padEnd(12) +
      `$${position.liquidationPx}`.padEnd(12)
    );
  });
  console.log('─'.repeat(70) + '\n');
}

async function checkAlerts(metrics: PortfolioMetrics) {
  console.log('ALERTS:');
  let hasAlerts = false;

  // Check drawdown
  if (metrics.totalPnl < -ALERTS.maxDrawdown) {
    console.log(`⚠️  DRAWDOWN ALERT: PnL ${formatUSD(metrics.totalPnl)} exceeds -$${ALERTS.maxDrawdown} threshold`);
    hasAlerts = true;
  }

  // Check exposure
  if (metrics.totalExposure > ALERTS.maxExposure) {
    console.log(`⚠️  EXPOSURE ALERT: ${formatUSD(metrics.totalExposure)} exceeds $${ALERTS.maxExposure} threshold`);
    hasAlerts = true;
  }

  // Check liquidation distance
  if (metrics.riskiestPosition && 
      metrics.riskiestPosition.liquidationDistance < ALERTS.liquidationWarning) {
    console.log(
      `⚠️  LIQUIDATION WARNING: ${metrics.riskiestPosition.coin} is ` +
      `${formatPercent(metrics.riskiestPosition.liquidationDistance)} from liquidation`
    );
    hasAlerts = true;
  }

  if (!hasAlerts) {
    console.log('✅ No alerts - portfolio within normal parameters');
  }
  console.log('');
}

async function monitor(intervalMs: number = 60000) {
  console.log('=== Portfolio Monitor Started ===');
  console.log(`Monitoring ${WALLET}`);
  console.log(`Update interval: ${intervalMs / 1000} seconds\n`);

  const tick = async () => {
    console.clear();
    console.log(`Last updated: ${new Date().toLocaleTimeString()}`);
    
    try {
      const metrics = await calculateMetrics();
      await printPortfolioSummary(metrics);
      await printPositions();
      await checkAlerts(metrics);
    } catch (error: any) {
      console.error('Error fetching data:', error.message);
    }
  };

  // Initial tick
  await tick();

  // Set up interval
  setInterval(tick, intervalMs);
}

async function main() {
  console.log('=== Portfolio Monitoring Example ===\n');

  // Single snapshot
  console.log('Taking portfolio snapshot...\n');
  
  const metrics = await calculateMetrics();
  await printPortfolioSummary(metrics);
  await printPositions();
  await checkAlerts(metrics);

  // Uncomment to start continuous monitoring:
  // await monitor(30000); // Update every 30 seconds
}

main().catch(console.error);
