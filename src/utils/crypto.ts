// ============================================================================
// AgroBarú · Huella criptográfica SHA-256 para trazabilidad de productos
// ----------------------------------------------------------------------------
// Usa Web Crypto (`crypto.subtle`) cuando el navegador está en contexto seguro
// (HTTPS o localhost) y recurre a una implementación SHA-256 pura cuando la PWA
// se abre por HTTP en la red local de una finca, donde `crypto.subtle` no está
// disponible. En ambos casos el resultado es un SHA-256 real.
// ============================================================================

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const rotr = (value: number, shift: number): number =>
  (value >>> shift) | (value << (32 - shift));

function sha256Fallback(bytes: Uint8Array): string {
  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const length = bytes.length;
  // Bloque con el bit '1', ceros y longitud de 64 bits (big-endian).
  const paddedLength = (((length + 9 + 63) >> 6) << 6);
  const buffer = new Uint8Array(paddedLength);
  buffer.set(bytes);
  buffer[length] = 0x80;

  const view = new DataView(buffer.buffer);
  const bitLengthHigh = Math.floor((length * 8) / 0x100000000);
  const bitLengthLow = (length * 8) >>> 0;
  view.setUint32(paddedLength - 8, bitLengthHigh);
  view.setUint32(paddedLength - 4, bitLengthLow);

  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let t = 0; t < 16; t += 1) {
      w[t] = view.getUint32(offset + t * 4);
    }
    for (let t = 16; t < 64; t += 1) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }

    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    let f = H[5];
    let g = H[6];
    let h = H[7];

    for (let t = 0; t < 64; t += 1) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  return H.map((part) => part.toString(16).padStart(8, '0')).join('');
}

const toBytes = (input: string): Uint8Array => new TextEncoder().encode(input);

/** Devuelve el SHA-256 en hexadecimal (64 caracteres). */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = toBytes(input);
  if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
    try {
      const digest = await crypto.subtle.digest('SHA-256', bytes.buffer as ArrayBuffer);
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      // Contexto no seguro o API restringida: se usa el respaldo puro.
    }
  }
  return sha256Fallback(bytes);
}

/** Serializa de forma canónica para que el mismo producto genere el mismo hash. */
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(',')}}`;
}

/**
 * Genera la huella de trazabilidad de una cosecha. Incluye productor, producto,
 * cantidades, ubicación y una marca temporal para que cada publicación sea única.
 */
export async function generateTraceabilityHash(
  payload: Record<string, unknown>,
): Promise<string> {
  const canonical = canonicalize(payload);
  return sha256Hex(`agrobaru:v1:${canonical}`);
}

/** Formato corto para mostrar en tarjetas: 0x8f4b…912a */
export function shortenHash(hash: string, head = 8, tail = 6): string {
  if (!hash) return '—';
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}
