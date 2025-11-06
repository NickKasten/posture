# Security Guide - Vibe Posts

**Last Updated:** 2025-10-30
**Status:** MVP Phase - Core security implemented

This document outlines security practices and implementation details for Vibe Posts.

---

## Table of Contents

1. [Token Encryption](#token-encryption)
2. [OAuth Security](#oauth-security)
3. [Content Moderation](#content-moderation)
4. [Input Validation](#input-validation)
5. [Database Security](#database-security)
6. [Environment Variables](#environment-variables)
7. [GDPR Compliance](#gdpr-compliance)
8. [Security Checklist](#security-checklist)

---

## Token Encryption

### Current Implementation

All OAuth tokens are encrypted using **AES-256-CBC** before storage in the database.

**Implementation** (src/lib/storage/supabase.ts:18):

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return iv.toString('base64') + ':' + encrypted;
}

export function decrypt(encrypted: string): string {
  const [ivBase64, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Usage

```typescript
// Storing token
const encryptedToken = encrypt(accessToken);
await supabaseClient.from('user_tokens').insert({
  user_id: userId,
  provider: 'github',
  encrypted_token: encryptedToken,
});

// Retrieving token
const { data } = await supabaseClient
  .from('user_tokens')
  .select('encrypted_token')
  .eq('user_id', userId)
  .single();

const accessToken = decrypt(data.encrypted_token);
```

### Security Properties

- **Algorithm:** AES-256-CBC (industry standard)
- **IV:** Randomly generated for each encryption (prevents pattern analysis)
- **Key Storage:** Environment variable (32 characters)
- **Key Rotation:** Supported (decrypt old, re-encrypt with new key)

### Best Practices

✅ **Do:**
- Encrypt before database insert
- Decrypt only when needed (API calls)
- Never log decrypted tokens
- Never send tokens to client

❌ **Don't:**
- Store encryption key in code
- Use same IV for multiple encryptions
- Log encrypted tokens (still sensitive)
- Decrypt for display purposes

---

## OAuth Security

### OAuth 2.1 with PKCE

**PKCE (Proof Key for Code Exchange)** prevents authorization code interception.

**Flow:**

1. Generate random `code_verifier` (43+ chars)
2. Compute `code_challenge = SHA256(code_verifier)`
3. Authorization URL includes `code_challenge`
4. Token exchange includes original `code_verifier`
5. Server validates `SHA256(code_verifier) === code_challenge`

**Implementation:**

```typescript
// Generate PKCE parameters
import crypto from 'crypto';

export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// OAuth authorization
const verifier = generateCodeVerifier();
const challenge = generateCodeChallenge(verifier);

// Store verifier in session for later
session.set('pkce_verifier', verifier);

// Redirect to provider
const authUrl = `https://provider.com/oauth/authorize?
  client_id=${clientId}&
  redirect_uri=${redirectUri}&
  code_challenge=${challenge}&
  code_challenge_method=S256&
  scope=${scopes}`;
```

### Supported Providers

| Provider | Implementation Status | Scopes |
|----------|----------------------|--------|
| **GitHub** | ✅ Complete | `read:user`, `user:email` |
| **LinkedIn** | 📋 Planned (Phase 1) | `r_liteprofile`, `w_member_social` |
| **Twitter** | 📋 Planned (Phase 1) | `tweet.read`, `tweet.write`, `users.read` |
| **MCP (OpenAI)** | 📋 Planned (Phase 1) | `posts.read`, `posts.write`, `brand.read` |

### OAuth Checklist

- ✅ PKCE enabled for all flows
- ✅ State parameter for CSRF protection
- ✅ Exact redirect URI matching
- ✅ Token expiration handling
- ✅ Refresh token rotation
- ✅ Scope validation (least privilege)
- 📋 Consent screen UI (MCP requirement)
- 📋 Token revocation endpoint

---

## Content Moderation

### OpenAI Moderation API

All user-generated content is filtered before posting.

**Implementation:**

```typescript
import { openai } from '@/lib/ai/client';

export async function moderateContent(
  content: string
): Promise<{ safe: boolean; reason?: string }> {
  const moderation = await openai.moderations.create({
    input: content,
  });

  const result = moderation.results[0];

  if (result.flagged) {
    const categories = Object.entries(result.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category);

    return {
      safe: false,
      reason: `Content flagged for: ${categories.join(', ')}`,
    };
  }

  return { safe: true };
}
```

### Usage in API Routes

```typescript
// api/posts/route.ts
export async function POST(request: Request) {
  const { content } = await request.json();

  // Moderate content before posting
  const moderation = await moderateContent(content);

  if (!moderation.safe) {
    return Response.json(
      { error: 'Content blocked', reason: moderation.reason },
      { status: 403 }
    );
  }

  // Proceed with posting...
}
```

### Moderation Categories

OpenAI Moderation API checks for:
- `hate` - Hateful content
- `hate/threatening` - Hateful threats
- `harassment` - Harassment
- `harassment/threatening` - Harassment with threats
- `self-harm` - Self-harm content
- `sexual` - Sexual content
- `sexual/minors` - Sexual content involving minors
- `violence` - Violent content
- `violence/graphic` - Graphic violence

### False Positives

Allow users to report false positives:

```typescript
// User feedback collection
export async function reportFalsePositive(
  postId: string,
  reason: string
) {
  await db.moderationFeedback.create({
    data: {
      post_id: postId,
      flagged_content: content,
      user_reason: reason,
      timestamp: new Date(),
    },
  });

  // Review manually and potentially whitelist patterns
}
```

---

## Input Validation

### Sanitization

**Implementation** (src/utils/sanitize.ts):

```typescript
export function sanitizeInput(input: string): string {
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Encode special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return sanitized.trim();
}

export function sanitizeGitHubToken(token: string): string {
  // Only allow valid GitHub token format
  if (!/^(ghp_|gho_)[a-zA-Z0-9]{36,}$/.test(token)) {
    throw new Error('Invalid GitHub token format');
  }
  return token;
}
```

### Validation

**Implementation** (src/utils/validation.ts):

```typescript
export function isValidGitHubToken(token: string): boolean {
  return /^(ghp_|gho_)[a-zA-Z0-9]{36,}$/.test(token);
}

export function isValidUserId(userId: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(userId) && userId.length <= 100;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### Runtime Validation with Zod

```typescript
import { z } from 'zod';

const PostInputSchema = z.object({
  content: z.string().min(10).max(1300),
  platform: z.enum(['linkedin', 'twitter']),
  hashtags: z.array(z.string()).max(30).optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const result = PostInputSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: 'Invalid input', details: result.error.issues },
      { status: 400 }
    );
  }

  // result.data is fully typed and validated
  const { content, platform, hashtags } = result.data;
}
```

---

## Database Security

### Row-Level Security (RLS)

**Current Status:** Defined but disabled (using service key for development)

**Production Implementation:**

```sql
-- Enable RLS
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users access own tokens" ON user_tokens
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users access own posts" ON posts
  FOR ALL USING (auth.uid()::text = user_id);

-- Service role bypasses RLS
CREATE POLICY "Service role full access" ON user_tokens
  FOR ALL TO service_role USING (true);
```

### SQL Injection Prevention

**✅ Safe:** Parameterized queries via Supabase client

```typescript
// Safe - parameters are sanitized
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('user_id', userId);
```

**❌ Unsafe:** Raw SQL with string concatenation

```typescript
// NEVER do this
const query = `SELECT * FROM posts WHERE user_id = '${userId}'`;
```

### Database Indexes

**Current indexes:**
- `user_tokens(user_id)` - Fast user lookup
- `user_tokens(provider)` - Fast provider lookup
- `posts(user_id)` - Fast user posts query
- `posts(created_at DESC)` - Recent posts query

**Planned indexes (Phase 2+):**
- `posts(status, user_id)` - Filtered queries
- `user_profiles(email)` - Email lookups
- `subscriptions(stripe_customer_id)` - Billing queries

---

## Environment Variables

### Required Variables

```env
# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Encryption (32 characters)
ENCRYPTION_KEY=your_32_character_encryption_key

# OpenAI (Phase 1)
OPENAI_API_KEY=sk-your_api_key

# Stripe (Phase 3)
STRIPE_SECRET_KEY=sk_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Security Best Practices

✅ **Do:**
- Use `.env.local` for local development
- Never commit `.env` files to Git
- Use Vercel environment variables for production
- Rotate secrets regularly
- Use different keys for development/production

❌ **Don't:**
- Hardcode secrets in code
- Share `.env` files via email/Slack
- Use production keys in development
- Prefix all environment variables with `NEXT_PUBLIC_` (only for client-side)

### Validation

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  ENCRYPTION_KEY: z.string().length(32),
  GITHUB_CLIENT_SECRET: z.string().min(20),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const env = envSchema.parse(process.env);
```

---

## GDPR Compliance

### User Rights

**1. Right to Access**
```typescript
// GET /api/user/export
export async function GET(request: Request) {
  const userId = await getUserIdFromSession(request);

  const data = {
    profile: await db.userProfile.findUnique({ where: { userId } }),
    tokens: await db.userTokens.findMany({ where: { userId }, select: { provider: true, scopes: true } }),
    posts: await db.posts.findMany({ where: { userId } }),
    analytics: await db.postAnalytics.findMany({ where: { post: { userId } } }),
  };

  return Response.json(data);
}
```

**2. Right to Deletion**
```typescript
// DELETE /api/user/account
export async function DELETE(request: Request) {
  const userId = await getUserIdFromSession(request);

  // Cascade delete all user data
  await db.$transaction([
    db.postAnalytics.deleteMany({ where: { post: { userId } } }),
    db.posts.deleteMany({ where: { userId } }),
    db.userTokens.deleteMany({ where: { userId } }),
    db.subscription.delete({ where: { userId } }),
    db.userProfile.delete({ where: { userId } }),
  ]);

  return Response.json({ success: true });
}
```

**3. Data Retention**
- User data: Retained until deletion request
- Post analytics: 90 days
- Audit logs: 90 days
- Moderation flags: 1 year

**4. Privacy Policy Requirements**
- Clear data collection disclosure
- Purpose of data processing
- Third-party integrations (OpenAI, LinkedIn, Twitter)
- User rights (access, deletion, portability)
- Contact email: support@vibe-posts.com

---

## Security Checklist

### Development Phase

- [x] TypeScript strict mode enabled
- [x] OAuth 2.1 with PKCE (GitHub)
- [x] Token encryption (AES-256-CBC)
- [x] Input validation (sanitize.ts, validation.ts)
- [x] Environment variable validation
- [x] `.gitignore` configured (no secrets committed)
- [ ] Content moderation (OpenAI Moderation API)
- [ ] LinkedIn/Twitter OAuth with PKCE
- [ ] MCP OAuth with consent flows

### Pre-Production

- [ ] Database RLS policies enabled
- [ ] HTTPS enforced (Vercel automatic)
- [ ] Rate limiting (Upstash Redis)
- [ ] Content Security Policy (CSP) headers
- [ ] CORS policy (strict origin validation)
- [ ] Dependency vulnerability scan (Snyk)
- [ ] Penetration testing
- [ ] Security audit (manual review)

### Production

- [ ] Error monitoring (Sentry)
- [ ] Audit logging (sensitive actions)
- [ ] Backup strategy (database snapshots)
- [ ] Incident response plan
- [ ] Bug bounty program (future)
- [ ] Regular security reviews (quarterly)

### Compliance

- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] GDPR data export endpoint
- [ ] GDPR data deletion endpoint
- [ ] OpenAI Apps SDK compliance (50 items)
- [ ] WCAG 2.1 AA accessibility

---

## Incident Response

### If Tokens Are Compromised

1. **Immediate:** Revoke all affected tokens via provider APIs
2. **Rotate:** Generate new encryption key
3. **Re-encrypt:** Migrate existing tokens to new key
4. **Notify:** Email affected users
5. **Investigate:** Audit logs to determine scope
6. **Patch:** Fix vulnerability that led to compromise

### If Database Is Breached

1. **Immediate:** Take database offline
2. **Assess:** Determine what data was accessed
3. **Notify:** Inform affected users within 72 hours (GDPR requirement)
4. **Remediate:** Patch vulnerability, restore from clean backup
5. **Monitor:** Enhanced monitoring for 30 days

### Contact

**Security Issues:** security@vibe-posts.com
**Response Time:** <24 hours for critical issues

---

**Related Documentation:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical implementation details
- [API_CONTRACTS.md](./API_CONTRACTS.md) - Type-safe contracts
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guidelines
