/**
 * Rate Limit Configuration
 *
 * Defines rate limiting policies for different API endpoints.
 * Uses Upstash Redis for distributed rate limiting.
 *
 * Sliding Window Algorithm:
 * - More accurate than fixed window
 * - Prevents burst attacks at window boundaries
 * - Smooths out request distribution
 */

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the time window
   */
  requests: number;

  /**
   * Time window for rate limiting
   * Format: number + unit (s = seconds, m = minutes, h = hours, d = days)
   * Examples: "10 s", "1 m", "1 h", "1 d"
   */
  window: string;

  /**
   * Optional prefix for Redis keys
   */
  prefix?: string;

  /**
   * Optional description of what this limit applies to
   */
  description?: string;
}

/**
 * Rate limit configurations for different endpoints and operations
 */
export const RATE_LIMITS = {
  /**
   * Authentication endpoints (OAuth flows)
   * - Prevents brute force attacks
   * - Limits OAuth abuse
   * - Stricter limit due to security sensitivity
   */
  AUTH: {
    requests: 5,
    window: '1 m',
    prefix: 'ratelimit:auth',
    description: 'OAuth authentication attempts per minute',
  } as RateLimitConfig,

  /**
   * AI generation endpoints
   * - Prevents AI abuse and cost overruns
   * - Balances user experience with resource usage
   * - User-based limiting (not IP-based)
   */
  AI: {
    requests: 10,
    window: '1 h',
    prefix: 'ratelimit:ai',
    description: 'AI content generations per hour per user',
  } as RateLimitConfig,

  /**
   * Publishing endpoints (LinkedIn, Twitter, etc.)
   * - Prevents spam and API abuse
   * - Respects platform API limits
   * - User-based limiting
   */
  PUBLISH: {
    requests: 20,
    window: '1 h',
    prefix: 'ratelimit:publish',
    description: 'Post publications per hour per user',
  } as RateLimitConfig,

  /**
   * General API endpoints
   * - Catch-all for other endpoints
   * - Prevents general abuse
   * - IP-based limiting by default
   */
  API_GENERAL: {
    requests: 100,
    window: '1 h',
    prefix: 'ratelimit:general',
    description: 'General API requests per hour',
  } as RateLimitConfig,

  /**
   * GitHub activity fetching
   * - Protects against excessive GitHub API calls
   * - User-based limiting
   */
  GITHUB_ACTIVITY: {
    requests: 30,
    window: '1 h',
    prefix: 'ratelimit:github',
    description: 'GitHub activity fetches per hour per user',
  } as RateLimitConfig,
} as const;

/**
 * Get a rate limit configuration by key
 */
export function getRateLimitConfig(key: keyof typeof RATE_LIMITS): RateLimitConfig {
  return RATE_LIMITS[key];
}

/**
 * Environment validation
 */
export function validateRateLimitEnv(): void {
  const required = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for rate limiting: ${missing.join(', ')}`
    );
  }
}
