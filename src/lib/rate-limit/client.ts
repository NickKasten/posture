/**
 * Upstash Redis Rate Limiting Client
 *
 * Provides pre-configured rate limiters for different API endpoints.
 * Uses Upstash Redis for distributed, serverless-friendly rate limiting.
 *
 * Features:
 * - Sliding window algorithm for accurate rate limiting
 * - Built-in analytics for monitoring
 * - Separate limiters for different use cases
 * - Automatic key prefixing for organization
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { RATE_LIMITS } from './config';

/**
 * Initialize Redis client
 * Uses Upstash REST API for serverless compatibility
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Authentication Rate Limiter
 *
 * Apply to OAuth endpoints to prevent:
 * - Brute force attacks
 * - OAuth flow abuse
 * - Account enumeration
 *
 * Limit: 5 requests per minute (IP-based)
 *
 * @example
 * ```typescript
 * const result = await authRateLimit.limit(request.ip);
 * if (!result.success) {
 *   return new Response('Too many requests', { status: 429 });
 * }
 * ```
 */
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RATE_LIMITS.AUTH.requests,
    RATE_LIMITS.AUTH.window
  ),
  analytics: true,
  prefix: RATE_LIMITS.AUTH.prefix,
});

/**
 * AI Generation Rate Limiter
 *
 * Apply to AI content generation endpoints to:
 * - Control OpenAI API costs
 * - Prevent abuse
 * - Ensure fair usage
 *
 * Limit: 10 requests per hour (user-based)
 *
 * @example
 * ```typescript
 * const result = await aiRateLimit.limit(userId);
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: 'Rate limit exceeded' },
 *     { status: 429 }
 *   );
 * }
 * ```
 */
export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RATE_LIMITS.AI.requests,
    RATE_LIMITS.AI.window
  ),
  analytics: true,
  prefix: RATE_LIMITS.AI.prefix,
});

/**
 * Publishing Rate Limiter
 *
 * Apply to social media publishing endpoints to:
 * - Prevent spam
 * - Respect platform API limits
 * - Protect user reputation
 *
 * Limit: 20 requests per hour (user-based)
 *
 * @example
 * ```typescript
 * const result = await publishRateLimit.limit(userId);
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: 'Publishing rate limit exceeded' },
 *     { status: 429 }
 *   );
 * }
 * ```
 */
export const publishRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RATE_LIMITS.PUBLISH.requests,
    RATE_LIMITS.PUBLISH.window
  ),
  analytics: true,
  prefix: RATE_LIMITS.PUBLISH.prefix,
});

/**
 * General API Rate Limiter
 *
 * Apply to general API endpoints as a catch-all:
 * - Basic DDoS protection
 * - Resource conservation
 * - Fair usage enforcement
 *
 * Limit: 100 requests per hour (IP-based)
 *
 * @example
 * ```typescript
 * const result = await generalRateLimit.limit(request.ip);
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: 'Too many requests' },
 *     { status: 429 }
 *   );
 * }
 * ```
 */
export const generalRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RATE_LIMITS.API_GENERAL.requests,
    RATE_LIMITS.API_GENERAL.window
  ),
  analytics: true,
  prefix: RATE_LIMITS.API_GENERAL.prefix,
});

/**
 * GitHub Activity Rate Limiter
 *
 * Apply to GitHub activity fetching endpoints to:
 * - Respect GitHub API limits
 * - Prevent excessive API calls
 * - Cache results effectively
 *
 * Limit: 30 requests per hour (user-based)
 *
 * @example
 * ```typescript
 * const result = await githubRateLimit.limit(userId);
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: 'GitHub API rate limit exceeded' },
 *     { status: 429 }
 *   );
 * }
 * ```
 */
export const githubRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RATE_LIMITS.GITHUB_ACTIVITY.requests,
    RATE_LIMITS.GITHUB_ACTIVITY.window
  ),
  analytics: true,
  prefix: RATE_LIMITS.GITHUB_ACTIVITY.prefix,
});

/**
 * Export Redis client for direct access if needed
 */
export { redis };

/**
 * Type exports for convenience
 */
export type { Ratelimit } from '@upstash/ratelimit';
export type RateLimitResponse = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending: Promise<unknown>;
};
