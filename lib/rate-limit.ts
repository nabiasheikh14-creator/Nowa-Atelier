type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

/**
 * In-memory limiter, per server instance. On serverless hosting each instance keeps its
 * own count, so this slows guessing rather than stopping it outright.
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

/** Per visitor: the first address in x-forwarded-for (set by Vercel), else one shared bucket. */
export function clientKey(request: Request, bucket: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "local";
  return `${bucket}:${ip}`;
}
