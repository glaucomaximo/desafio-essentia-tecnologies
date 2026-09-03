import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const keyLength = 64;
const scryptOptions = {
  N: 16_384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024
} satisfies ScryptOptions;

const deriveKey = (
  password: string,
  salt: Buffer,
  length: number,
  options: ScryptOptions
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, length, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16);
  const hash = await deriveKey(password, salt, keyLength, scryptOptions);

  return [
    "scrypt",
    String(scryptOptions.N),
    String(scryptOptions.r),
    String(scryptOptions.p),
    salt.toString("base64url"),
    hash.toString("base64url")
  ].join("$");
};

export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const [algorithm, rawCost, rawBlockSize, rawParallelization, salt, expectedHash] =
    storedHash.split("$");

  if (
    algorithm !== "scrypt" ||
    !rawCost ||
    !rawBlockSize ||
    !rawParallelization ||
    !salt ||
    !expectedHash
  ) {
    return false;
  }

  const cost = Number(rawCost);
  const blockSize = Number(rawBlockSize);
  const parallelization = Number(rawParallelization);

  if (
    !Number.isInteger(cost) ||
    !Number.isInteger(blockSize) ||
    !Number.isInteger(parallelization) ||
    cost <= 0 ||
    blockSize <= 0 ||
    parallelization <= 0
  ) {
    return false;
  }

  const expected = Buffer.from(expectedHash, "base64url");

  try {
    const actual = await deriveKey(password, Buffer.from(salt, "base64url"), expected.length, {
      N: cost,
      r: blockSize,
      p: parallelization,
      maxmem: scryptOptions.maxmem
    });

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
};
