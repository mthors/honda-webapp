interface RateLimitEntry {
  timestamps: number[];
}

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;
const DUPLICATE_WINDOW_MS = 60 * 1000; // 60 seconds

const ipRateLimits = new Map<string, RateLimitEntry>();
const recentSubmissions = new Map<string, number>();

/**
 * Checks whether an IP or client identifier has exceeded submission rate limits.
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const entry = ipRateLimits.get(identifier);

  if (!entry) {
    return { allowed: true };
  }

  // Filter out timestamps outside the active sliding window
  const activeTimestamps = entry.timestamps.filter((ts) => now - ts < WINDOW_MS);
  ipRateLimits.set(identifier, { timestamps: activeTimestamps });

  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestTimestamp = activeTimestamps[0];
    const retryAfterSeconds = Math.ceil((oldestTimestamp + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  return { allowed: true };
}

/**
 * Records a submission attempt timestamp for an identifier.
 */
export function recordRateLimitAttempt(identifier: string): void {
  const now = Date.now();
  const entry = ipRateLimits.get(identifier) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < WINDOW_MS);
  entry.timestamps.push(now);
  ipRateLimits.set(identifier, entry);
}

/**
 * Backward compatibility alias for recordRateLimitAttempt.
 */
export const recordRateLimitSubmission = recordRateLimitAttempt;

/**
 * Checks if an identical inquiry was submitted within the duplicate window (60s).
 */
export function isDuplicateSubmission(
  phone: string,
  city: string,
  modelSnapshot?: string | null
): boolean {
  const now = Date.now();
  const key = `${phone.trim()}::${city.trim().toLowerCase()}::${(modelSnapshot || '').trim().toLowerCase()}`;

  const lastSubmitted = recentSubmissions.get(key);
  if (lastSubmitted && now - lastSubmitted < DUPLICATE_WINDOW_MS) {
    return true;
  }

  return false;
}

/**
 * Records an inquiry in the duplicate tracking map.
 */
export function recordDuplicateSubmission(
  phone: string,
  city: string,
  modelSnapshot?: string | null
): void {
  const now = Date.now();
  const key = `${phone.trim()}::${city.trim().toLowerCase()}::${(modelSnapshot || '').trim().toLowerCase()}`;

  // Clean expired entries periodically
  for (const [k, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp > DUPLICATE_WINDOW_MS) {
      recentSubmissions.delete(k);
    }
  }

  recentSubmissions.set(key, now);
}

/**
 * Clears all rate limits and duplicate tracking (useful for unit tests).
 */
export function resetRateLimiter(): void {
  ipRateLimits.clear();
  recentSubmissions.clear();
}
