import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  recordRateLimitSubmission,
  isDuplicateSubmission,
  recordDuplicateSubmission,
  resetRateLimiter,
} from './rate-limiter';

describe('Inquiry Rate Limiter & Duplicate Guard', () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it('allows submissions within the sliding window limit (up to 5)', () => {
    const ip = '192.168.1.100';

    for (let i = 0; i < 5; i++) {
      const check = checkRateLimit(ip);
      expect(check.allowed).toBe(true);
      recordRateLimitSubmission(ip);
    }

    // 6th submission within the window should be blocked
    const blockedCheck = checkRateLimit(ip);
    expect(blockedCheck.allowed).toBe(false);
    expect(blockedCheck.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('evaluates rate limits independently per IP address', () => {
    const ip1 = '192.168.1.1';
    const ip2 = '192.168.1.2';

    for (let i = 0; i < 5; i++) {
      recordRateLimitSubmission(ip1);
    }

    expect(checkRateLimit(ip1).allowed).toBe(false);
    expect(checkRateLimit(ip2).allowed).toBe(true);
  });

  it('detects duplicate submission with same phone, city, and model within 60 seconds', () => {
    const phone = '6281234567890';
    const city = 'Sidoarjo';
    const model = 'All New Honda Vario 160';

    expect(isDuplicateSubmission(phone, city, model)).toBe(false);

    recordDuplicateSubmission(phone, city, model);

    // Immediate duplicate check should return true
    expect(isDuplicateSubmission(phone, city, model)).toBe(true);

    // Different phone number should not be flagged as duplicate
    expect(isDuplicateSubmission('628999999999', city, model)).toBe(false);

    // Different city should not be flagged as duplicate
    expect(isDuplicateSubmission(phone, 'Surabaya', model)).toBe(false);
  });
});
