/**
 * Rate Limiting Middleware
 *
 * Reusable middleware for applying rate limits to Next.js API routes.
 * Supports both IP-based and user-based rate limiting with proper headers.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Ratelimit } from '@upstash/ratelimit';

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;

  /**
   * Response to return if rate limit is exceeded
   */
  response?: NextResponse;

  /**
   * Rate limit metadata (useful for custom responses)
   */
  metadata?: {
    limit: number;
    remaining: number;
    reset: number;
    resetDate: string;
  };
}

/**
 * Apply rate limiting to a request
 *
 * @param request - The Next.js request object
 * @param rateLimit - The Upstash rate limiter instance to use
 * @param identifier - Optional custom identifier (e.g., user ID). Falls back to IP address.
 *
 * @returns Rate limit result with allowed status and optional response
 *
 * @example IP-based rate limiting
 * ```typescript
 * const result = await withRateLimit(request, authRateLimit);
 * if (!result.allowed) {
 *   return result.response!;
 * }
 * ```
 *
 * @example User-based rate limiting
 * ```typescript
 * const userId = await getUserId(request);
 * const result = await withRateLimit(request, aiRateLimit, userId);
 * if (!result.allowed) {
 *   return result.response!;
 * }
 * ```
 */
export async function withRateLimit(
  request: NextRequest,
  rateLimit: Ratelimit,
  identifier?: string
): Promise<RateLimitResult> {
  try {
    // Get identifier - prefer custom identifier, fall back to IP
    const id = identifier || getClientIdentifier(request);

    // Check rate limit
    const { success, limit, reset, remaining } = await rateLimit.limit(id);

    // Calculate reset time
    const resetDate = new Date(reset).toISOString();
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);

    const metadata = {
      limit,
      remaining: success ? remaining : 0,
      reset,
      resetDate,
    };

    if (!success) {
      return {
        allowed: false,
        metadata,
        response: NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            limit,
            remaining: 0,
            reset: resetDate,
            retryAfter: `${retryAfter} seconds`,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': reset.toString(),
              'Retry-After': retryAfter.toString(),
              'Content-Type': 'application/json',
            },
          }
        ),
      };
    }

    return {
      allowed: true,
      metadata,
    };
  } catch (error) {
    // Log error but allow request through (fail open)
    console.error('Rate limit check failed:', error);

    // In production, you might want to fail closed instead
    // For now, we fail open to prevent Redis issues from breaking the app
    return {
      allowed: true,
    };
  }
}

/**
 * Get client identifier from request
 *
 * Attempts to get the real IP address, handling proxies and load balancers.
 * Falls back to a default identifier if IP cannot be determined.
 *
 * @param request - The Next.js request object
 * @returns Client identifier (IP address or default)
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from common proxy headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Try Next.js request IP
  // @ts-ignore - ip might not be typed in all Next.js versions
  if (request.ip) {
    // @ts-ignore
    return request.ip;
  }

  // Fallback to localhost (for development)
  return '127.0.0.1';
}

/**
 * Add rate limit headers to a successful response
 *
 * Useful for adding rate limit information to responses that passed the rate limit check.
 *
 * @param response - The response to add headers to
 * @param metadata - Rate limit metadata from withRateLimit
 * @returns Response with rate limit headers
 *
 * @example
 * ```typescript
 * const rateLimitResult = await withRateLimit(request, aiRateLimit, userId);
 * if (!rateLimitResult.allowed) {
 *   return rateLimitResult.response!;
 * }
 *
 * const response = NextResponse.json({ data: 'success' });
 * return addRateLimitHeaders(response, rateLimitResult.metadata!);
 * ```
 */
export function addRateLimitHeaders(
  response: NextResponse,
  metadata: NonNullable<RateLimitResult['metadata']>
): NextResponse {
  response.headers.set('X-RateLimit-Limit', metadata.limit.toString());
  response.headers.set('X-RateLimit-Remaining', metadata.remaining.toString());
  response.headers.set('X-RateLimit-Reset', metadata.reset.toString());

  return response;
}

/**
 * Create a custom rate limit error response
 *
 * Useful for creating custom error messages while maintaining consistent headers.
 *
 * @param metadata - Rate limit metadata
 * @param customMessage - Custom error message
 * @returns Rate limit error response
 *
 * @example
 * ```typescript
 * return createRateLimitError(
 *   metadata,
 *   'You have used all your AI generations for this hour. Please upgrade for more.'
 * );
 * ```
 */
export function createRateLimitError(
  metadata: NonNullable<RateLimitResult['metadata']>,
  customMessage?: string
): NextResponse {
  const retryAfter = Math.ceil((metadata.reset - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: customMessage || 'Too many requests. Please try again later.',
      limit: metadata.limit,
      remaining: 0,
      reset: metadata.resetDate,
      retryAfter: `${retryAfter} seconds`,
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': metadata.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': metadata.reset.toString(),
        'Retry-After': retryAfter.toString(),
        'Content-Type': 'application/json',
      },
    }
  );
}
