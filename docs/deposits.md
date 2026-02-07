# Deposits Guide

How to deposit funds into your GDEX trading account.

## Overview

GDEX uses a **custodial wallet system**. When you sign up:

1. GDEX creates a dedicated deposit address for you
2. You send funds (USDC, ETH) to this address on Arbitrum
3. GDEX deposits those funds into Hyperliquid for trading

This allows for seamless deposits without requiring you to interact directly with Hyperliquid's smart contracts.

## Getting Your Deposit Address

### Using the SDK

```typescript
import { GdexClient } from '@gdex/sdk';

const client = new GdexClient({ apiKey: 'your-api-key' });

// Get your deposit address
const depositAddress = await client.getDepositAddress(
  '0xYourConnectedWallet',  // The wallet you signed up with
  sessionKey,               // Your session key from authentication
  42161                     // Arbitrum chain ID (default)
);

console.log(`Send USDC to: ${depositAddress}`);
```

### Get Full User Info

For more details including balance:

```typescript
const userInfo = await client.getUserInfo(
  '0xYourConnectedWallet',
  sessionKey,
  42161
);

console.log(`Deposit Address: ${userInfo.address}`);
console.log(`ETH Balance: ${userInfo.balance}`);
console.log(`Is New User: ${userInfo.isNewUser}`);
console.log(`Referral Code: ${userInfo.refCode}`);
```

## Supported Tokens

### Check Supported Deposit Tokens

```typescript
const depositTokens = await client.getDepositTokens();

// Get tokens supported on Arbitrum
const arbitrumTokens = depositTokens[42161];

arbitrumTokens.forEach(token => {
  console.log(`${token.symbol}:`);
  console.log(`  Address: ${token.address}`);
  console.log(`  Decimals: ${token.decimals}`);
  console.log(`  Min Deposit: ${token.minDeposit}`);
});
```

### Currently Supported

| Chain | Token | Min Deposit |
|-------|-------|-------------|
| Arbitrum (42161) | USDC | 5 USDC |
| Arbitrum (42161) | ETH | - |

## Deposit Flow

### Step 1: Get Your Deposit Address

```typescript
const depositAddress = await client.getDepositAddress(walletAddress, sessionKey);
```

### Step 2: Send Tokens

Send USDC (or supported tokens) from your wallet to the deposit address on Arbitrum.

**Using ethers.js:**

```typescript
import { ethers } from 'ethers';

const USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const USDC_ABI = ['function transfer(address to, uint256 amount) returns (bool)'];

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

// Send 100 USDC (6 decimals)
const amount = ethers.parseUnits('100', 6);
const tx = await usdc.transfer(depositAddress, amount);
await tx.wait();

console.log('Deposit sent:', tx.hash);
```

**Using viem:**

```typescript
import { createWalletClient, custom, parseUnits } from 'viem';
import { arbitrum } from 'viem/chains';

const USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

const client = createWalletClient({
  chain: arbitrum,
  transport: custom(window.ethereum),
});

const [account] = await client.getAddresses();

const hash = await client.writeContract({
  address: USDC_ADDRESS,
  abi: [
    {
      name: 'transfer',
      type: 'function',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ type: 'bool' }],
    },
  ],
  functionName: 'transfer',
  args: [depositAddress, parseUnits('100', 6)],
  account,
});

console.log('Deposit sent:', hash);
```

### Step 3: Wait for Confirmation

Deposits typically take **1-10 minutes** to appear in your Hyperliquid account, depending on network congestion.

```typescript
// Poll for updated balance
async function waitForDeposit(expectedIncrease: number) {
  const initialState = await client.getAccountState(depositAddress);
  const initialBalance = parseFloat(initialState?.withdrawable || '0');
  
  console.log('Waiting for deposit...');
  
  while (true) {
    await sleep(30000); // Check every 30 seconds
    
    const state = await client.getAccountState(depositAddress);
    const currentBalance = parseFloat(state?.withdrawable || '0');
    
    if (currentBalance >= initialBalance + expectedIncrease * 0.99) {
      console.log('Deposit confirmed!');
      console.log(`New balance: $${currentBalance}`);
      return;
    }
    
    console.log('Still waiting...');
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## Complete Deposit Example

```typescript
import { GdexClient } from '@gdex/sdk';
import { ethers } from 'ethers';

const client = new GdexClient({ apiKey: 'your-api-key' });

const USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

async function deposit(walletAddress: string, sessionKey: string, amount: string) {
  // 1. Get deposit address
  const depositAddress = await client.getDepositAddress(walletAddress, sessionKey);
  
  if (!depositAddress) {
    throw new Error('Could not get deposit address');
  }
  
  console.log(`Depositing ${amount} USDC to ${depositAddress}`);
  
  // 2. Check minimum deposit
  const tokens = await client.getDepositTokens();
  const usdcConfig = tokens[42161]?.find(t => t.symbol === 'USDC');
  
  if (usdcConfig && parseFloat(amount) < parseFloat(usdcConfig.minDeposit)) {
    throw new Error(`Minimum deposit is ${usdcConfig.minDeposit} USDC`);
  }
  
  // 3. Get current balance
  const beforeState = await client.getAccountState(depositAddress);
  const beforeBalance = parseFloat(beforeState?.withdrawable || '0');
  console.log(`Balance before: $${beforeBalance}`);
  
  // 4. Send USDC
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const usdc = new ethers.Contract(
    USDC_ADDRESS,
    ['function transfer(address to, uint256 amount) returns (bool)'],
    signer
  );
  
  const amountWei = ethers.parseUnits(amount, 6);
  const tx = await usdc.transfer(depositAddress, amountWei);
  
  console.log('Transaction sent:', tx.hash);
  await tx.wait();
  console.log('Transaction confirmed!');
  
  // 5. Wait for deposit to process
  console.log('Waiting for Hyperliquid deposit (1-10 minutes)...');
  
  let attempts = 0;
  while (attempts < 20) {
    await new Promise(r => setTimeout(r, 30000));
    
    const afterState = await client.getAccountState(depositAddress);
    const afterBalance = parseFloat(afterState?.withdrawable || '0');
    
    if (afterBalance > beforeBalance) {
      console.log(`Deposit complete! New balance: $${afterBalance}`);
      return { success: true, balance: afterBalance };
    }
    
    console.log(`Attempt ${++attempts}/20 - Balance: $${afterBalance}`);
  }
  
  console.log('Deposit may still be processing. Check again later.');
  return { success: false, message: 'Timeout waiting for deposit' };
}

// Usage
deposit('0xMyWallet', sessionKey, '100')
  .then(result => console.log('Result:', result))
  .catch(err => console.error('Error:', err));
```

## Important Notes

### Network

- **Arbitrum Only**: Deposits are currently only supported on Arbitrum (chain ID 42161)
- Ensure your wallet is connected to Arbitrum before depositing

### Minimum Amounts

- USDC: Minimum 5 USDC per deposit
- Deposits below the minimum will fail

### Processing Time

- Deposits typically take 1-10 minutes to appear in Hyperliquid
- During high network congestion, it may take longer

### Security

- The deposit address is **custodial** - GDEX controls the private key
- Only send funds you intend to trade with
- Always verify the deposit address before sending

## Next Steps

- [Trading Guide](./trading.md) - Start trading after depositing
- [Withdrawals](./trading.md#withdrawals) - Learn how to withdraw funds
