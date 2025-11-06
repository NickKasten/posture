# Integration Contracts v3.0

**Version:** 3.0
**Purpose:** Type-safe interfaces between all 11 agent teams
**Timeline:** Reference throughout Days 1-12
**Success Metric:** Zero integration failures (type contracts enforced)

---

## Table of Contents

1. [Overview](#overview)
2. [Shared Types](#shared-types)
3. [Team 1 ↔ Team 2: Onboarding → AI Engine](#team-1--team-2-onboarding--ai-engine)
4. [Team 2 ↔ Team 3: AI Engine → Social Integration](#team-2--team-3-ai-engine--social-integration)
5. [Team 3 ↔ Team 4: Social Integration → Backend](#team-3--team-4-social-integration--backend)
6. [Team 4 ↔ All: Database Contracts](#team-4--all-database-contracts)
7. [Team 6 ↔ All: Security Contracts](#team-6--all-security-contracts)
8. [Team 9 ↔ Team 2: MCP → AI Engine](#team-9--team-2-mcp--ai-engine)
9. [Team 10 ↔ All: Billing Contracts](#team-10--all-billing-contracts)
10. [Team 11 ↔ Team 3: Analytics → Social](#team-11--team-3-analytics--social)
11. [Cross-Cutting Contracts](#cross-cutting-contracts)

---

## Overview

This document defines **type-safe contracts** between all teams. Every data exchange must use these interfaces to prevent integration failures.

**Contract Principles:**
1. **Branded types** for security-critical data (tokens, IDs)
2. **Discriminated unions** for state machines
3. **Zod schemas** for runtime validation
4. **Readonly properties** where mutations are forbidden
5. **Exhaustive switch statements** for completeness

**Enforcement:**
- TypeScript strict mode (`tsconfig.json`)
- Pre-commit hook runs `tsc --noEmit`
- CI/CD fails on type errors

---

## Shared Types

### Core Branded Types

```typescript
// lib/types/branded.ts

// User identifiers
export type UserId = string & { readonly __brand: 'UserId' };
export type Email = string & { readonly __brand: 'Email' };

// OAuth tokens
export type GitHubToken = string & { readonly __brand: 'GitHubToken' };
export type LinkedInToken = string & { readonly __brand: 'LinkedInToken' };
export type TwitterToken = string & { readonly __brand: 'TwitterToken' };
export type AccessToken = string & { readonly __brand: 'AccessToken' };
export type RefreshToken = string & { readonly __brand: 'RefreshToken' };

// MCP OAuth
export type AuthCode = string & { readonly __brand: 'AuthCode' };
export type PKCEVerifier = string & { readonly __brand: 'PKCEVerifier' };
export type PKCEChallenge = string & { readonly __brand: 'PKCEChallenge' };

// Stripe
export type CustomerId = string & { readonly __brand: 'CustomerId' };
export type PriceId = string & { readonly __brand: 'PriceId' };
export type ProductId = string & { readonly __brand: 'ProductId' };

// Entities
export type PostId = string & { readonly __brand: 'PostId' };
export type SessionId = string & { readonly __brand: 'SessionId' };
export type AchievementId = string & { readonly __brand: 'AchievementId' };
```

### Platform Enum

```typescript
// lib/types/platform.ts
export enum Platform {
  LINKEDIN = 'LINKEDIN',
  TWITTER = 'TWITTER',
}

export type PlatformLowercase = 'linkedin' | 'twitter';

export function toPlatformEnum(platform: PlatformLowercase): Platform {
  return platform === 'linkedin' ? Platform.LINKEDIN : Platform.TWITTER;
}

export function toPlatformLowercase(platform: Platform): PlatformLowercase {
  return platform === Platform.LINKEDIN ? 'linkedin' : 'twitter';
}
```

### Post Status (Discriminated Union)

```typescript
// lib/types/post.ts
export type PostStatus =
  | { status: 'draft'; createdAt: Date }
  | { status: 'scheduled'; scheduledFor: Date }
  | { status: 'publishing'; startedAt: Date }
  | { status: 'published'; publishedAt: Date; url: string }
  | { status: 'failed'; error: string; failedAt: Date; retryAt?: Date };

export function getStatusString(postStatus: PostStatus): string {
  return postStatus.status;
}

export function canRetry(postStatus: PostStatus): boolean {
  return postStatus.status === 'failed' && postStatus.retryAt !== undefined;
}
```

### Subscription Tier (Discriminated Union)

```typescript
// lib/types/subscription.ts
export type SubscriptionTier =
  | { type: 'free'; postsRemaining: number; maxPosts: 2 }
  | { type: 'standard'; coachSessionsRemaining: number; maxSessions: 2 }
  | { type: 'premium'; internEnabled: boolean; analyticsEnabled: true };

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
}

export function canAccessFeature(tier: SubscriptionTier, feature: Feature): boolean {
  switch (feature) {
    case 'unlimited_posts':
      return tier.type !== 'free';
    case 'ai_coach':
      return tier.type === 'standard' || tier.type === 'premium';
    case 'ai_intern':
      return tier.type === 'premium';
    case 'advanced_analytics':
      return tier.type === 'premium';
    default:
      const _exhaustive: never = feature;
      return false;
  }
}

export enum Feature {
  UNLIMITED_POSTS = 'unlimited_posts',
  AI_COACH = 'ai_coach',
  AI_INTERN = 'ai_intern',
  ADVANCED_ANALYTICS = 'advanced_analytics',
}
```

---

## Team 1 ↔ Team 2: Onboarding → AI Engine

### Contract: Brand Profile Creation

**Flow:** User completes onboarding → Team 1 creates brand profile → Team 2 uses for AI content generation

```typescript
// lib/contracts/brand-profile.ts
import { z } from 'zod';

export const BrandProfileSchema = z.object({
  userId: z.string().uuid(),
  tone: z.enum(['professional', 'casual', 'inspiring', 'technical']).optional(),
  expertise: z.array(z.string()).max(10),
  targetAudience: z.string().max(500).optional(),
  platforms: z.array(z.enum(['linkedin', 'twitter'])),
});

export type BrandProfile = z.infer<typeof BrandProfileSchema>;

// API Contract: Team 1 → Team 4 (Database)
export interface CreateBrandProfileRequest {
  userId: UserId;
  data: Omit<BrandProfile, 'userId'>;
}

export interface CreateBrandProfileResponse {
  success: boolean;
  profileId: string;
}

// API Contract: Team 2 (AI Engine) reads brand profile
export interface GetBrandProfileRequest {
  userId: UserId;
}

export interface GetBrandProfileResponse {
  profile: BrandProfile | null;
}
```

**Implementation:**
```typescript
// app/api/brand-profile/route.ts (Team 1 calls this)
export async function POST(request: Request) {
  const body = await request.json();
  const validatedData = BrandProfileSchema.parse(body);

  const profile = await db.brandProfile.create({
    data: validatedData,
  });

  return Response.json({ success: true, profileId: profile.id });
}

// Team 2 fetches profile
const profile = await db.brandProfile.findUnique({
  where: { userId: user.id },
});
```

---

## Team 2 ↔ Team 3: AI Engine → Social Integration

### Contract: Post Content Generation

**Flow:** AI generates post content → Social Integration team publishes to platform

```typescript
// lib/contracts/post-content.ts
import { z } from 'zod';

export const PostContentSchema = z.object({
  content: z.string().min(1).max(1300), // LinkedIn max length
  platform: z.enum(['linkedin', 'twitter']),
  hashtags: z.array(z.string()).max(30).optional(),
  mentions: z.array(z.string()).optional(),
  linkUrl: z.string().url().optional(),
});

export type PostContent = z.infer<typeof PostContentSchema>;

// API Contract: Team 2 → Team 3
export interface GeneratePostRequest {
  userId: UserId;
  topic: string;
  platform: PlatformLowercase;
  tone?: 'professional' | 'casual' | 'inspiring' | 'technical';
  includeHashtags?: boolean;
}

export interface GeneratePostResponse {
  content: PostContent;
  estimatedEngagement?: number; // 0-100 score
}

// API Contract: Team 3 publishes post
export interface PublishPostRequest {
  userId: UserId;
  postId: PostId;
  content: PostContent;
}

export interface PublishPostResponse {
  success: boolean;
  url?: string;
  error?: string;
}
```

**Implementation:**
```typescript
// lib/ai/generate.ts (Team 2)
export async function generatePost(request: GeneratePostRequest): Promise<GeneratePostResponse> {
  const profile = await db.brandProfile.findUnique({
    where: { userId: request.userId },
  });

  const tone = request.tone || profile?.tone || 'professional';

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a ${tone} social media content creator.`,
      },
      {
        role: 'user',
        content: `Write a ${request.platform} post about: ${request.topic}`,
      },
    ],
  });

  const content: PostContent = {
    content: response.choices[0].message.content!,
    platform: request.platform,
    hashtags: request.includeHashtags ? extractHashtags(content) : undefined,
  };

  return { content };
}

// lib/publish/linkedin.ts (Team 3)
export async function publishToLinkedIn(request: PublishPostRequest): Promise<PublishPostResponse> {
  const user = await db.user.findUnique({ where: { id: request.userId } });
  const token = decryptToken(user!.linkedinTokenEncrypted!);

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      author: `urn:li:person:${user!.linkedinId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: request.content.content },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  });

  if (!response.ok) {
    return { success: false, error: `LinkedIn API error: ${response.status}` };
  }

  const { id } = await response.json();
  const url = `https://www.linkedin.com/feed/update/${id}`;

  return { success: true, url };
}
```

---

## Team 3 ↔ Team 4: Social Integration → Backend

### Contract: Post Persistence

**Flow:** Team 3 publishes post → Team 4 stores post + URL in database

```typescript
// lib/contracts/post.ts
import { z } from 'zod';

export const CreatePostSchema = z.object({
  userId: z.string().uuid(),
  content: z.string().max(1300),
  platform: z.enum(['LINKEDIN', 'TWITTER']),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED']),
  scheduledFor: z.date().optional(),
  publishedAt: z.date().optional(),
  publishedUrl: z.string().url().optional(),
});

export type CreatePost = z.infer<typeof CreatePostSchema>;

// API Contract
export interface CreatePostRequest {
  userId: UserId;
  content: string;
  platform: Platform;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  scheduledFor?: Date;
}

export interface CreatePostResponse {
  postId: PostId;
}

export interface UpdatePostStatusRequest {
  postId: PostId;
  status: PostStatus;
  publishedUrl?: string;
}

export interface UpdatePostStatusResponse {
  success: boolean;
}
```

**Implementation:**
```typescript
// app/api/posts/route.ts (Team 4)
export async function POST(request: Request) {
  const body = await request.json();
  const validatedData = CreatePostSchema.parse(body);

  const post = await db.post.create({
    data: validatedData,
  });

  return Response.json({ postId: post.id as PostId });
}

// Team 3 updates post after publishing
export async function updatePostStatus(request: UpdatePostStatusRequest): Promise<UpdatePostStatusResponse> {
  await db.post.update({
    where: { id: request.postId },
    data: {
      status: request.status.status.toUpperCase(),
      publishedAt: request.status.status === 'published' ? request.status.publishedAt : undefined,
      publishedUrl: request.status.status === 'published' ? request.status.url : undefined,
    },
  });

  return { success: true };
}
```

---

## Team 4 ↔ All: Database Contracts

### Prisma Generated Types

All teams use Prisma-generated types as source of truth.

```typescript
// Generated by Prisma
import { User, Post, Subscription, BrandProfile, PostAnalytics } from '@prisma/client';

// Type-safe includes
export type UserWithSubscription = User & { subscription: Subscription | null };
export type PostWithAnalytics = Post & { analytics: PostAnalytics | null };
export type UserWithBrandProfile = User & { brandProfile: BrandProfile | null };
```

### Database Query Contracts

```typescript
// lib/db/queries.ts

// Contract: Get user with all relations
export async function getUserFull(userId: UserId): Promise<UserWithAllRelations | null> {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
      brandProfile: true,
      posts: { include: { analytics: true } },
      achievements: true,
    },
  });
}

export type UserWithAllRelations = NonNullable<Awaited<ReturnType<typeof getUserFull>>>;

// Contract: Get posts by user
export async function getPostsByUser(
  userId: UserId,
  options?: {
    status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
    limit?: number;
  }
): Promise<PostWithAnalytics[]> {
  return db.post.findMany({
    where: {
      userId,
      status: options?.status,
    },
    include: { analytics: true },
    orderBy: { createdAt: 'desc' },
    take: options?.limit,
  });
}
```

---

## Team 6 ↔ All: Security Contracts

### Token Encryption/Decryption

```typescript
// lib/security/tokens.ts (Team 6)

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptToken(encryptedToken: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Contract: All teams MUST encrypt tokens before storing
export interface StoreTokenRequest {
  userId: UserId;
  platform: 'github' | 'linkedin' | 'twitter';
  accessToken: string;
  refreshToken?: string;
}

export async function storeEncryptedToken(request: StoreTokenRequest): Promise<void> {
  const encryptedAccessToken = encryptToken(request.accessToken);
  const encryptedRefreshToken = request.refreshToken
    ? encryptToken(request.refreshToken)
    : null;

  await db.user.update({
    where: { id: request.userId },
    data: {
      [`${request.platform}TokenEncrypted`]: encryptedAccessToken,
      [`${request.platform}RefreshTokenEncrypted`]: encryptedRefreshToken,
    },
  });
}
```

### Content Moderation

```typescript
// lib/security/moderation.ts (Team 6)

export interface ModerationResult {
  safe: boolean;
  reason?: string; // 'harassment', 'hate-speech', etc.
  categories: {
    harassment: boolean;
    'hate-speech': boolean;
    violence: boolean;
    sexual: boolean;
    'self-harm': boolean;
  };
}

export async function moderateContent(content: string): Promise<ModerationResult> {
  const response = await openai.moderations.create({ input: content });
  const result = response.results[0];

  if (result.flagged) {
    const categories = Object.entries(result.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category);

    return {
      safe: false,
      reason: categories.join(', '),
      categories: result.categories as any,
    };
  }

  return { safe: true, categories: result.categories as any };
}

// Contract: All user-generated content MUST be moderated before storage/publishing
export async function validateUserContent(content: string): Promise<void> {
  const moderation = await moderateContent(content);

  if (!moderation.safe) {
    throw new Error(`Content moderated: ${moderation.reason}`);
  }
}
```

---

## Team 9 ↔ Team 2: MCP → AI Engine

### MCP Tool Execution Contract

```typescript
// lib/mcp/types.ts (Team 9)

export interface MCPToolRequest {
  tool: 'generate_post' | 'schedule_post' | 'list_posts' | 'brand_profile';
  parameters: Record<string, any>;
  userId: UserId;
  accessToken: AccessToken;
}

export interface MCPToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Contract: Team 9 validates request, Team 2 executes AI logic
export async function executeMCPTool(request: MCPToolRequest): Promise<MCPToolResponse> {
  // Team 9: Validate OAuth token
  const { userId, scope } = await verifyAccessToken(request.accessToken);

  // Team 9: Check rate limit
  const allowed = await checkRateLimit(userId, request.tool);
  if (!allowed) {
    return { success: false, error: 'Rate limit exceeded' };
  }

  // Team 2: Execute tool
  switch (request.tool) {
    case 'generate_post':
      const result = await generatePost({
        userId,
        topic: request.parameters.topic,
        platform: request.parameters.platform,
        tone: request.parameters.tone,
      });
      return { success: true, data: result };

    case 'schedule_post':
      // ...
      break;

    default:
      const _exhaustive: never = request.tool;
      return { success: false, error: 'Unknown tool' };
  }
}
```

---

## Team 10 ↔ All: Billing Contracts

### Feature Gate Contract

```typescript
// lib/billing/gates.ts (Team 10)

export interface FeatureAccessRequest {
  userId: UserId;
  feature: Feature;
}

export interface FeatureAccessResponse {
  allowed: boolean;
  reason?: string;
  upgradeUrl?: string;
}

export async function canAccessFeature(request: FeatureAccessRequest): Promise<FeatureAccessResponse> {
  const subscription = await db.subscription.findUnique({
    where: { userId: request.userId },
  });

  if (!subscription) {
    return {
      allowed: false,
      reason: 'No subscription found',
      upgradeUrl: '/pricing',
    };
  }

  const tier: SubscriptionTier =
    subscription.tier === 'FREE'
      ? { type: 'free', postsRemaining: 2 - subscription.postsThisMonth, maxPosts: 2 }
      : subscription.tier === 'STANDARD'
      ? { type: 'standard', coachSessionsRemaining: 2 - subscription.coachSessionsThisMonth, maxSessions: 2 }
      : { type: 'premium', internEnabled: true, analyticsEnabled: true };

  const hasAccess = canAccessFeatureInternal(tier, request.feature);

  if (!hasAccess) {
    const requiredTier = getRequiredTier(request.feature);
    return {
      allowed: false,
      reason: `Requires ${requiredTier} tier`,
      upgradeUrl: `/pricing?upgrade=${requiredTier}`,
    };
  }

  return { allowed: true };
}

function getRequiredTier(feature: Feature): 'Standard' | 'Premium' {
  switch (feature) {
    case Feature.UNLIMITED_POSTS:
    case Feature.AI_COACH:
      return 'Standard';
    case Feature.AI_INTERN:
    case Feature.ADVANCED_ANALYTICS:
      return 'Premium';
    default:
      const _exhaustive: never = feature;
      return 'Standard';
  }
}
```

### Stripe Webhook Contract

```typescript
// lib/billing/webhooks.ts (Team 10)

export interface StripeWebhookEvent {
  type: 'checkout.session.completed' | 'customer.subscription.updated' | 'customer.subscription.deleted';
  data: {
    object: any; // Stripe object (typed based on event type)
  };
}

export async function handleStripeWebhook(event: StripeWebhookEvent): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await db.subscription.update({
        where: { userId: session.metadata!.userId },
        data: {
          tier: session.metadata!.tier.toUpperCase(),
          status: SubscriptionStatus.ACTIVE,
          stripeCustomerId: session.customer as string,
          stripePriceId: session.line_items?.data[0].price.id,
          currentPeriodEnd: new Date(session.expires_at! * 1000),
        },
      });
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await db.subscription.update({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
          status: subscription.status === 'active' ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PAST_DUE,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await db.subscription.update({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
          tier: 'FREE',
          status: SubscriptionStatus.CANCELED,
          postsThisMonth: 0,
        },
      });
      break;
    }

    default:
      const _exhaustive: never = event.type;
  }
}
```

---

## Team 11 ↔ Team 3: Analytics → Social

### Analytics Collection Contract

```typescript
// lib/analytics/types.ts (Team 11)

export interface CollectAnalyticsRequest {
  postId: PostId;
  platform: Platform;
  publishedUrl: string;
}

export interface AnalyticsData {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

export interface CollectAnalyticsResponse {
  success: boolean;
  data?: AnalyticsData;
  error?: string;
}

// Team 11 calls Team 3's OAuth tokens to fetch analytics
export async function collectAnalytics(request: CollectAnalyticsRequest): Promise<CollectAnalyticsResponse> {
  const post = await db.post.findUnique({
    where: { id: request.postId },
    include: { user: true },
  });

  if (!post) {
    return { success: false, error: 'Post not found' };
  }

  // Team 3 provides decryptToken utility
  const token = decryptToken(
    request.platform === Platform.LINKEDIN
      ? post.user.linkedinTokenEncrypted!
      : post.user.twitterTokenEncrypted!
  );

  // Team 11 fetches analytics from platform API
  const stats = await fetchPlatformStats(request.publishedUrl, token, request.platform);

  return {
    success: true,
    data: stats,
  };
}
```

---

## Cross-Cutting Contracts

### API Error Responses

**All API routes must use standardized error format:**

```typescript
// lib/errors/types.ts

export interface APIError {
  error: string; // User-friendly message
  code: string; // Machine-readable code (e.g., "ERR_POST_PUBLISH_001")
  details?: Record<string, any>; // Additional context
}

export function createAPIError(
  message: string,
  code: string,
  details?: Record<string, any>
): Response {
  const error: APIError = { error: message, code, details };
  return Response.json(error, { status: 400 });
}

// Usage in API routes
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = PostSchema.parse(body);
    // ...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createAPIError(
        'Validation failed',
        'ERR_VALIDATION',
        { errors: error.errors }
      );
    }

    return createAPIError(
      'Internal server error',
      'ERR_INTERNAL',
      { message: error.message }
    );
  }
}
```

### Audit Logging Contract

**All sensitive actions must be logged:**

```typescript
// lib/audit/types.ts

export interface AuditLogEntry {
  userId: UserId;
  action: string; // 'post.publish', 'subscription.upgrade', 'content.moderation.blocked'
  metadata: Record<string, any>;
  ipAddress?: string;
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      metadata: entry.metadata,
      ipAddress: entry.ipAddress,
    },
  });
}

// Usage
await logAuditEvent({
  userId: user.id,
  action: 'post.publish',
  metadata: { postId: post.id, platform: 'LINKEDIN' },
  ipAddress: request.headers.get('x-forwarded-for'),
});
```

---

## Contract Testing

### Example: Test Brand Profile Contract

```typescript
// tests/contracts/brand-profile.test.ts
import { describe, test, expect } from '@jest/globals';
import { BrandProfileSchema } from '@/lib/contracts/brand-profile';

describe('BrandProfile contract', () => {
  test('validates correct brand profile', () => {
    const validProfile = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      tone: 'professional' as const,
      expertise: ['AI', 'Web Development'],
      platforms: ['linkedin' as const],
    };

    expect(() => BrandProfileSchema.parse(validProfile)).not.toThrow();
  });

  test('rejects invalid tone', () => {
    const invalidProfile = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      tone: 'invalid_tone',
      expertise: ['AI'],
      platforms: ['linkedin' as const],
    };

    expect(() => BrandProfileSchema.parse(invalidProfile)).toThrow();
  });

  test('rejects too many expertise tags', () => {
    const invalidProfile = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      expertise: Array.from({ length: 11 }, (_, i) => `Skill ${i}`),
      platforms: ['linkedin' as const],
    };

    expect(() => BrandProfileSchema.parse(invalidProfile)).toThrow();
  });
});
```

---

## Summary

### Total Contracts: 37

| Category | Contracts | Teams Involved |
|----------|-----------|----------------|
| **Brand Profile** | 3 | Team 1, 2, 4 |
| **Post Content** | 5 | Team 2, 3, 4 |
| **OAuth Tokens** | 4 | Team 3, 4, 6 |
| **Security** | 3 | Team 6, All |
| **MCP Tools** | 6 | Team 9, 2 |
| **Billing** | 4 | Team 10, All |
| **Analytics** | 3 | Team 11, 3 |
| **Database** | 5 | Team 4, All |
| **Errors** | 2 | All |
| **Audit Logs** | 2 | All |

### Success Criteria

- **Zero integration failures** (type contracts enforced via TypeScript)
- **100% contract test coverage** (Jest + Zod validation)
- **Runtime validation** (Zod schemas at API boundaries)

### Enforcement

1. **Pre-commit hook:** Runs `tsc --noEmit` (fails on type errors)
2. **CI/CD:** Runs contract tests (`npm run test:contracts`)
3. **Code review:** All teams verify contracts before merge

---

**Last Updated:** Day 0 (Pre-execution)
**Next Review:** Day 4, Day 8 (Integration testing)
**Owner:** Team 8 (Orchestration) coordinates, all teams implement
