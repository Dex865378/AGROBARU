/**
 * AgroBarú Cryptographic Verifier and SHA-256 Hash Engine
 * Implements immutable block hashing for field logs and photo proofs
 */

// Web Crypto SHA-256 computation
export async function calculateSha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback to JS implementation
    }
  }

  return fallbackSha256(data);
}

// Deterministic mock / fallback SHA-256 for offline environments
function fallbackSha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1/3) * maxWord) | 0;
    }
  }
  
  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = (asciiBitLength);
  
  for (j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = hash;
    hash = hash.slice(0, 8);
    
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0);
      const temp2 = (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj;
      
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  
  for (i = 0; i < 8; i++) {
    for (let bit = 3; bit >= 0; bit--) {
      const b = (hash[i] >> (8 * bit)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Generate cryptographic signature for a farm log
 */
export async function signLogEntry(
  farmId: string,
  activityType: string,
  timestamp: string,
  gpsCoords: { lat: number; lng: number },
  operator: string,
  previousHash: string
): Promise<string> {
  const payload = `${farmId}|${activityType}|${timestamp}|${gpsCoords.lat.toFixed(6)},${gpsCoords.lng.toFixed(6)}|${operator}|${previousHash}`;
  return calculateSha256(payload);
}

/**
 * Verify blockchain-style hash chain integrity
 */
export async function verifyHashChain(
  logs: Array<{
    id: string;
    cryptoHash: string;
    previousHash: string;
    farmId: string;
    activityType: string;
    date: string;
    gpsCoords: { lat: number; lng: number };
    operatorName: string;
  }>
): Promise<{ isValid: boolean; brokenAtLogId?: string }> {
  for (let i = 0; i < logs.length; i++) {
    const current = logs[i];
    
    // Check previous hash link
    if (i > 0) {
      const prev = logs[i - 1];
      if (current.previousHash !== prev.cryptoHash) {
        return { isValid: false, brokenAtLogId: current.id };
      }
    }

    // Verify hash integrity
    const expectedHash = await signLogEntry(
      current.farmId,
      current.activityType,
      current.date,
      current.gpsCoords,
      current.operatorName,
      current.previousHash
    );

    if (expectedHash !== current.cryptoHash) {
      return { isValid: false, brokenAtLogId: current.id };
    }
  }

  return { isValid: true };
}

/**
 * Compute Merkle root for a batch given its list of log hashes
 */
export async function computeMerkleRoot(hashes: string[]): Promise<string> {
  if (!hashes || hashes.length === 0) {
    return calculateSha256('GENESIS_MERKLE_ROOT_BARU_2026');
  }
  if (hashes.length === 1) {
    return hashes[0];
  }

  let currentLevel = [...hashes];
  if (currentLevel.length % 2 !== 0) {
    currentLevel.push(currentLevel[currentLevel.length - 1]);
  }

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const combined = currentLevel[i] + currentLevel[i + 1];
      const parentHash = await calculateSha256(combined);
      nextLevel.push(parentHash);
    }
    if (nextLevel.length > 1 && nextLevel.length % 2 !== 0) {
      nextLevel.push(nextLevel[nextLevel.length - 1]);
    }
    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

/**
 * Validates whether GPS coordinates fall strictly within Barú District boundaries
 */
export function isWithinBaruDistrict(lat: number, lng: number): boolean {
  const isLatValid = lat >= 8.15 && lat <= 8.42;
  const isLngValid = lng >= -82.98 && lng <= -82.75;
  return isLatValid && isLngValid;
}
