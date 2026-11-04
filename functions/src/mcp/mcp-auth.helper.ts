import { createHash, timingSafeEqual } from 'node:crypto';

export function isAuthorizedKey(providedKey: unknown, expectedKey: string): boolean {
  if (typeof providedKey !== 'string' || providedKey.length === 0 || expectedKey.length === 0) {
    return false;
  }

  const providedDigest = createHash('sha256').update(providedKey).digest();
  const expectedDigest = createHash('sha256').update(expectedKey).digest();

  return timingSafeEqual(providedDigest, expectedDigest);
}
