# Rate Limiting Infrastructure

Comprehensive rate limiting implementation using Upstash Redis for distributed, serverless-friendly rate limiting.

## Overview

This rate limiting infrastructure provides:

- **Multiple Rate Limiters**: Different limits for different API endpoints
- **Sliding Window Algorithm**: More accurate than fixed window, prevents burst attacks
- **IP & User-Based Limiting**: Support for both anonymous and authenticated users
- **Fail-Open Strategy**: Service continues if Redis is unavailable
- **Standard Headers**: RFC-compliant rate limit headers
- **Analytics**: Built-in monitoring via Upstash

## Architecture

```
src/lib/rate-limit/
├── config.ts          # Rate limit configurations
├── client.ts          # Upstash Redis client and rate limiters
├── middleware.ts      # Reusable middleware for Next.js routes
└── __tests__/
    └── rate-limit.test.ts
```

## Configuration

### Environment Variables

Required environment variables in `.env.local`:

```bash
# Upstash Redis (create free account at https://upstash.com)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here
```

### Rate Limit Policies

Defined in `config.ts`:

| Endpoint Type | Requests | Window | Identifier | Use Case |
|--------------|----------|--------|------------|----------|
| **AUTH** | 5 | 1 minute | IP | OAuth flows, prevent brute force |
| **AI** | 10 | 1 hour | User ID | AI generation, cost control |
| **PUBLISH** | 20 | 1 hour | User ID | Social media posts, prevent spam |
| **API_GENERAL** | 100 | 1 hour | IP | General endpoints, DDoS protection |
| **GITHUB_ACTIVITY** | 30 | 1 hour | User ID | GitHub API calls, respect limits |

## Usage

### Basic IP-Based Rate Limiting

For public endpoints (e.g., OAuth):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { authRateLimit } from '@/lib/rate-limit/client';
import { withRateLimit } from '@/lib/rate-limit/middleware';

export async function GET(request: NextRequest) {
  // Apply rate limiting (IP-based)
  const rateLimitResult = await withRateLimit(request, authRateLimit);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  // Your endpoint logic...
  return NextResponse.json({ success: true });
}
```

### User-Based Rate Limiting

For authenticated endpoints:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { aiRateLimit } from '@/lib/rate-limit/client';
import { withRateLimit, addRateLimitHeaders } from '@/lib/rate-limit/middleware';

export async function POST(request: NextRequest) {
  const userId = await getUserId(request); // Get from session/auth

  // Apply rate limiting (user-based)
  const rateLimitResult = await withRateLimit(request, aiRateLimit, userId);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  // Your endpoint logic...
  const result = await generatePost(/* ... */);

  // Add rate limit headers to successful response
  const response = NextResponse.json(result);
  if (rateLimitResult.metadata) {
    return addRateLimitHeaders(response, rateLimitResult.metadata);
  }

  return response;
}
```

### Custom Error Messages

Create custom rate limit error responses:

```typescript
import { createRateLimitError } from '@/lib/rate-limit/middleware';

const rateLimitResult = await withRateLimit(request, aiRateLimit, userId);
if (!rateLimitResult.allowed) {
  return createRateLimitError(
    rateLimitResult.metadata!,
    'You have used all your AI generations for this hour. Please upgrade for more.'
  );
}
```

## Rate Limiters

### Available Rate Limiters

Import from `@/lib/rate-limit/client`:

```typescript
import {
  authRateLimit,       // 5 req/min - OAuth endpoints
  aiRateLimit,         // 10 req/hour - AI generation
  publishRateLimit,    // 20 req/hour - Social media publishing
  generalRateLimit,    // 100 req/hour - General API
  githubRateLimit,     // 30 req/hour - GitHub activity
} from '@/lib/rate-limit/client';
```

### Direct Usage (Advanced)

You can also use rate limiters directly:

```typescript
import { aiRateLimit } from '@/lib/rate-limit/client';

const { success, limit, remaining, reset } = await aiRateLimit.limit(userId);

if (!success) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  );
}
```

## Response Format

### 429 Rate Limit Exceeded

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "limit": 10,
  "remaining": 0,
  "reset": "2025-11-04T12:30:00.000Z",
  "retryAfter": "3540 seconds"
}
```

**Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until retry (RFC 7231)

### Successful Response Headers

All successful responses include rate limit headers:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1730721000
```

## Implementation Details

### Sliding Window Algorithm

Uses Upstash's sliding window implementation:

- More accurate than fixed window
- Prevents burst attacks at window boundaries
- Smooths out request distribution
- No race conditions

### Fail-Open Strategy

If Redis connection fails:

1. Error is logged to console
2. Request is **allowed** (fail open)
3. Service continues uninterrupted

**Note:** In production, you may want to fail closed (deny requests) if rate limiting is critical for cost control.

### IP Address Detection

Supports multiple proxy configurations:

1. `x-forwarded-for` header (comma-separated list, uses first IP)
2. `x-real-ip` header
3. Next.js `request.ip`
4. Falls back to `127.0.0.1` (localhost)

## Testing

Run tests:

```bash
npm test src/lib/rate-limit/__tests__/rate-limit.test.ts
```

Test coverage includes:

- ✅ Request allowed under limit
- ✅ Request denied over limit
- ✅ Correct 429 response format
- ✅ Rate limit headers
- ✅ Custom identifiers
- ✅ IP extraction from headers
- ✅ Fail-open behavior
- ✅ Edge cases (past reset time, zero remaining, etc.)

## Monitoring

### Upstash Analytics

View rate limit analytics in your Upstash dashboard:

- Request counts per endpoint
- Rate limit hit rates
- Geographic distribution
- Time-series graphs

### Custom Monitoring

Add custom logging:

```typescript
const rateLimitResult = await withRateLimit(request, aiRateLimit, userId);
if (!rateLimitResult.allowed) {
  // Log rate limit violation
  console.warn('Rate limit exceeded', {
    userId,
    endpoint: '/api/ai',
    limit: rateLimitResult.metadata?.limit,
    reset: rateLimitResult.metadata?.resetDate,
  });

  return rateLimitResult.response!;
}
```

## API Routes Using Rate Limiting

| Route | Rate Limiter | Type | Description |
|-------|-------------|------|-------------|
| `/api/auth/linkedin` | authRateLimit | IP | LinkedIn OAuth initiation |
| `/api/auth/linkedin/callback` | authRateLimit | IP | LinkedIn OAuth callback |
| `/api/auth/github` | authRateLimit | IP | GitHub OAuth |
| `/api/ai` | aiRateLimit | User | AI post generation |
| `/api/publish/linkedin` | publishRateLimit | User | LinkedIn publishing |
| `/api/github/activity` | githubRateLimit | User | GitHub activity fetch |

## Customization

### Creating Custom Rate Limiters

Add new rate limiters in `client.ts`:

```typescript
export const customRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '5 m'), // 50 requests per 5 minutes
  analytics: true,
  prefix: 'ratelimit:custom',
});
```

Add configuration in `config.ts`:

```typescript
export const RATE_LIMITS = {
  // ... existing configs
  CUSTOM: {
    requests: 50,
    window: '5 m',
    prefix: 'ratelimit:custom',
    description: 'Custom endpoint rate limit',
  },
} as const;
```

### Adjusting Limits

Modify `config.ts` to change rate limits:

```typescript
AI: {
  requests: 20,      // Increase from 10 to 20
  window: '1 h',
  prefix: 'ratelimit:ai',
  description: 'AI content generations per hour per user',
}
```

**Note:** Changes take effect immediately (no Redis flush needed with sliding window).

## Best Practices

### 1. Choose Appropriate Identifiers

- **IP-based**: Public endpoints, login pages, OAuth flows
- **User-based**: Authenticated endpoints, per-user quotas
- **API Key-based**: Third-party integrations

### 2. Set Conservative Limits

Start with stricter limits and increase based on usage:

```typescript
// Start conservative
AI: { requests: 10, window: '1 h' }

// Increase after monitoring
AI: { requests: 20, window: '1 h' }
```

### 3. Provide Clear Error Messages

Help users understand limits:

```typescript
return createRateLimitError(
  metadata,
  `You've used ${metadata.limit} AI generations this hour. Limit resets at ${metadata.resetDate}.`
);
```

### 4. Monitor and Alert

Set up alerts for high rate limit violation rates:

- May indicate abuse
- May indicate limits are too strict
- May indicate UI issues (e.g., retry loops)

### 5. Document Limits

Include rate limits in API documentation for client developers.

## Troubleshooting

### Rate Limit Always Failing

**Issue:** All requests get 429 errors

**Solutions:**
1. Check Upstash Redis credentials in `.env.local`
2. Verify Upstash Redis is active (check dashboard)
3. Check for clock skew (reset time in past)

### Rate Limit Never Failing

**Issue:** Requests never hit rate limit

**Solutions:**
1. Check identifier is consistent (not changing per request)
2. Verify rate limiter is imported correctly
3. Check Upstash Redis connection (may be failing open)

### Inconsistent Rate Limiting

**Issue:** Limits seem random or inconsistent

**Solutions:**
1. Ensure using same identifier (IP vs User ID)
2. Check for multiple instances with different configs
3. Verify sliding window is working (not fixed window)

## Performance

### Latency

Typical Upstash Redis latency:

- **Global edge**: 10-50ms
- **Regional**: 5-20ms

### Throughput

Upstash can handle:

- **Free tier**: 10,000 requests/day
- **Paid tiers**: Unlimited requests

### Scaling

Rate limiting scales automatically:

- No database setup required
- No Redis cluster management
- Distributed across edge locations

## Security Considerations

### DDoS Protection

Rate limiting provides basic DDoS protection but should be combined with:

- CDN/WAF (Cloudflare, AWS WAF)
- Network-level filtering
- Anomaly detection

### IP Spoofing

When using IP-based limiting:

- Trust proxy headers only from trusted sources
- Use Vercel/Cloudflare IP validation
- Consider combining IP + User Agent + other fingerprints

### Cost Control

Rate limiting is essential for cost control with:

- OpenAI API (AI generation)
- External API calls (GitHub, LinkedIn)
- Database operations

## License

Part of vibe-posts project. See main project LICENSE.

## Support

For issues or questions:

1. Check Upstash documentation: https://upstash.com/docs/redis/features/ratelimit
2. Review test cases in `__tests__/rate-limit.test.ts`
3. Check environment variables are set correctly
4. Verify Upstash Redis is active and accessible
