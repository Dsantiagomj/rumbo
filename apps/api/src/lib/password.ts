/**
 * PBKDF2 password hashing via Web Crypto API.
 *
 * Replaces Better Auth's default scrypt (pure JS) which exceeds
 * Cloudflare Workers' CPU time limit on cold starts.
 * Web Crypto's PBKDF2 runs natively (C/Rust) and stays within budget.
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const ALGORITHM = 'SHA-256';

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// biome-ignore lint/suspicious/noExplicitAny: Web Crypto types not available without DOM lib
const subtle = (crypto as any).subtle as {
  importKey(
    format: string,
    keyData: ArrayBuffer | Uint8Array,
    algorithm: string,
    extractable: boolean,
    usages: string[],
  ): Promise<CryptoKey>;
  deriveBits(
    algorithm: { name: string; salt: Uint8Array; iterations: number; hash: string },
    key: CryptoKey,
    length: number,
  ): Promise<ArrayBuffer>;
};

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: ALGORITHM },
    key,
    KEY_LENGTH * 8,
  );
  return `pbkdf2:${PBKDF2_ITERATIONS}:${toBase64(salt)}:${toBase64(new Uint8Array(bits))}`;
}

export async function verifyPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  const [prefix, iterStr, saltStr, hashStr] = hash.split(':');
  if (prefix !== 'pbkdf2' || !iterStr || !saltStr || !hashStr) return false;

  const iterations = Number.parseInt(iterStr, 10);
  const salt = fromBase64(saltStr);
  const storedHash = fromBase64(hashStr);

  const key = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: ALGORITHM },
    key,
    storedHash.length * 8,
  );
  const computed = new Uint8Array(bits);

  // Constant-time comparison
  if (computed.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= (computed[i] as number) ^ (storedHash[i] as number);
  }
  return diff === 0;
}
