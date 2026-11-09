type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

/**
 * In-memory limiter for a single server process. Phase 1 assumes one keeper
 * and one Node server. A multi-instance deploy should move this next to the data.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - bucket.hits[0]!)) / 1000);
    buckets.set(key, bucket);
    return { ok: false, retryAfter: Math.max(retryAfter, 1) };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true };
}

export function clientKey(_request: Request, bucket: string): string {
  return bucket;
}
