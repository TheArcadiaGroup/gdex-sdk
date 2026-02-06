/**
 * GDEX SDK Cryptographic Utilities
 * 
 * Handles encryption/decryption of payloads for secure API communication
 */

import { createHash, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-cbc';

/**
 * Derive encryption key and IV from API key
 */
function deriveKeyAndIv(apiKey: string): { key: Buffer; iv: Buffer } {
  const hashAPI = createHash('sha256')
    .update(apiKey)
    .digest('hex');
  
  const key = Buffer.from(hashAPI.slice(0, 64), 'hex');
  
  const ivHash = createHash('sha256')
    .update(hashAPI)
    .digest('hex')
    .slice(0, 32);
  
  const iv = Buffer.from(ivHash, 'hex');
  
  return { key, iv };
}

/**
 * Encrypt data using the API key
 */
export function encrypt(data: string, apiKey: string): string {
  const { key, iv } = deriveKeyAndIv(apiKey);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return encrypted;
}

/**
 * Decrypt data using the API key
 */
export function decrypt(encryptedData: string, apiKey: string): string {
  const { key, iv } = deriveKeyAndIv(apiKey);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate a random nonce for request signing
 */
export function generateNonce(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/**
 * Encode order data for API transmission
 */
export function encodeOrderData(params: {
  coin: string;
  isLong: boolean;
  price: string;
  size: string;
  reduceOnly: boolean;
  nonce: number;
  tpPrice?: string;
  slPrice?: string;
  isMarket?: boolean;
}): string {
  const data = [
    params.coin,
    params.isLong,
    params.price,
    params.size,
    params.reduceOnly,
    params.nonce,
    params.tpPrice || '0',
    params.slPrice || '0',
    params.isMarket || false,
  ];
  
  return JSON.stringify(data);
}

/**
 * Encode withdraw data for API transmission
 */
export function encodeWithdrawData(params: {
  amount: string;
  nonce: number;
}): string {
  const data = [params.amount, params.nonce];
  return JSON.stringify(data);
}

/**
 * Encode cancel order data for API transmission
 */
export function encodeCancelData(params: {
  nonce: number;
  coin?: string;
  orderId?: number;
}): string {
  if (params.coin && params.orderId !== undefined) {
    return JSON.stringify([params.nonce, params.coin, params.orderId]);
  }
  return JSON.stringify([params.nonce]);
}

/**
 * Create encrypted payload for API request
 */
export function createEncryptedPayload(
  apiKey: string,
  userId: string,
  _action: string,
  data: string,
  signature: string
): string {
  const payload = {
    userId,
    data,
    signature,
    apiKey,
  };
  
  return encrypt(JSON.stringify(payload), apiKey);
}
