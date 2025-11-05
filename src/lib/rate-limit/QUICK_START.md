# Rate Limiting Quick Start

## Setup (1 minute)

1. **Get Upstash Redis credentials:**
   - Visit https://upstash.com (free account)
   - Create new Redis database
   - Copy REST URL and token

2. **Add to `.env.local`:**
   ```bash
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   ```

3. **Done!** Rate limiting is now active on all API routes.

## Usage Examples

### Example 1: IP-Based Rate Limiting (Public Endpoint)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { authRateLimit } from '@/lib/rate-limit/client';
import { withRateLimit } from '@/lib/rate-limit/middleware';

export async function GET(request: NextRequest) {
  // Check rate limit (IP-based)
  const rateLimitResult = await withRateLimit(request, authRateLimit);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!; // Returns 429 with proper headers
  }

  // Your logic here...
  return NextResponse.json({ success: true });
}
```

### Example 2: User-Based Rate Limiting (Authenticated Endpoint)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { aiRateLimit } from '@/lib/rate-limit/client';
import { withRateLimit, addRateLimitHeaders } from '@/lib/rate-limit/middleware';

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromSession(request); // Get user ID

  // Check rate limit (user-based)
  const rateLimitResult = await withRateLimit(request, aiRateLimit, userId);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!; // Returns 429
  }

  // Your logic here...
  const result = await doWork();

  // Add rate limit headers to success response
  const response = NextResponse.json(result);
  if (rateLimitResult.metadata) {
    return addRateLimitHeaders(response, rateLimitResult.metadata);
  }

  return response;
}
```

### Example 3: Custom Error Message

```typescript
import { createRateLimitError } from '@/lib/rate-limit/middleware';

const rateLimitResult = await withRateLimit(request, aiRateLimit, userId);
if (!rateLimitResult.allowed) {
  return createRateLimitError(
    rateLimitResult.metadata!,
    'You have reached your daily AI generation limit. Upgrade to Pro for unlimited access.'
  );
}
```

## Available Rate Limiters

```typescript
import {
  authRateLimit,       // 5 requests/minute - OAuth, auth
  aiRateLimit,         // 10 requests/hour - AI generation
  publishRateLimit,    // 20 requests/hour - Social posts
  generalRateLimit,    // 100 requests/hour - General API
  githubRateLimit,     // 30 requests/hour - GitHub activity
} from '@/lib/rate-limit/client';
```

## Response Format

### Success (HTTP 200)
```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1730721000

{"data": "..."}
```

### Rate Limit Exceeded (HTTP 429)
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1730721000
Retry-After: 3540

{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "limit": 10,
  "remaining": 0,
  "reset": "2025-11-04T12:30:00.000Z",
  "retryAfter": "3540 seconds"
}
```

## Testing

All rate limiting is automatically mocked in tests. No setup required!

```typescript
// Tests will run normally without Redis connection
test('my endpoint', async () => {
  const response = await POST(mockRequest);
  expect(response.status).toBe(200);
});
```

## Troubleshooting

### "Rate limit exceeded" immediately
- Check if identifier is changing per request
- Verify Redis credentials are correct
- Check Upstash dashboard for errors

### Rate limiting not working
- Verify `.env.local` has Upstash credentials
- Check Redis database is active in Upstash dashboard
- Restart dev server after adding environment variables

### All requests fail with 429
- Check system clock (time sync issues)
- Verify rate limit window hasn't expired
- Check Upstash Redis quota (free tier: 10k req/day)

## Need Help?

1. **Full documentation:** See `README.md` in this directory
2. **Examples:** Check updated API routes in `src/app/api/`
3. **Tests:** Review test cases in `__tests__/rate-limit.test.ts`

## Pro Tips

1. **Use IP-based for public endpoints** (OAuth, auth)
2. **Use user-based for authenticated endpoints** (AI, publishing)
3. **Always add rate limit headers to success responses**
4. **Provide clear error messages** with `createRateLimitError()`
5. **Monitor via Upstash dashboard** for analytics

---

**That's it!** You're ready to use rate limiting. 🚀
