import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export const createSecurityToken = (): string => randomBytes(32).toString("base64url");

export const hashSecurityToken = (token: string): string =>
  createHash("sha256").update(token).digest("base64url");

export const createMfaSecret = (): string => {
  const bytes = randomBytes(20);
  let bits = "";
  let secret = "";

  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, "0");
  }

  for (let index = 0; index + 5 <= bits.length; index += 5) {
    secret += base32Alphabet[Number.parseInt(bits.slice(index, index + 5), 2)];
  }

  return secret;
};

const decodeBase32 = (value: string): Buffer => {
  let bits = "";

  for (const character of value.replace(/=+$/u, "").toUpperCase()) {
    const index = base32Alphabet.indexOf(character);

    if (index === -1) {
      throw new Error("Segredo MFA invalido.");
    }

    bits += index.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];

  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
};

export const createTotpCode = (secret: string, timestamp = Date.now()): string => {
  const counter = Math.floor(timestamp / 30_000);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", decodeBase32(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 1_000_000).padStart(6, "0");
};

export const verifyTotpCode = (secret: string, code: string, timestamp = Date.now()): boolean => {
  if (!/^\d{6}$/u.test(code)) {
    return false;
  }

  const received = Buffer.from(code);

  for (const offset of [-30_000, 0, 30_000]) {
    const expected = Buffer.from(createTotpCode(secret, timestamp + offset));

    if (received.length === expected.length && timingSafeEqual(received, expected)) {
      return true;
    }
  }

  return false;
};
