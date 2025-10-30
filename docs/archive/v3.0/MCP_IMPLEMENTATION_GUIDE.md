# MCP Implementation Guide

**Version:** 3.0
**Target:** OpenAI Apps SDK Integration
**Protocol:** Model Context Protocol (MCP)
**Timeline:** Days 1-4 (Team 9)

---

## Table of Contents

1. [Overview](#overview)
2. [MCP Architecture](#mcp-architecture)
3. [OAuth 2.1 with PKCE/DCR](#oauth-21-with-pkcedcr)
4. [Tool Definitions](#tool-definitions)
5. [Type-Safe Implementation](#type-safe-implementation)
6. [Security & Compliance](#security--compliance)
7. [Testing Strategy](#testing-strategy)
8. [Deployment](#deployment)

---

## Overview

The **Model Context Protocol (MCP)** enables integration between Vibe Posts and OpenAI's ChatGPT, allowing users to generate, schedule, and manage social media posts directly from ChatGPT conversations.

**Key Features:**
- **4 MCP Tools:** `/generate_post`, `/schedule_post`, `/list_posts`, `/brand_profile`
- **OAuth 2.1:** Secure authorization with PKCE (Proof Key for Code Exchange) and DCR (Dynamic Client Registration)
- **Type-Safe:** TypeBox schemas for tool parameters, branded types for security
- **Consent Flows:** Preview → Confirm → Undo (OpenAI Apps SDK requirement)
- **Rate Limiting:** Upstash Redis-based limits (100 requests/hour per user)

**User Flow:**
```
ChatGPT User: "Generate a LinkedIn post about AI ethics"
    ↓
OpenAI calls /mcp/tools/generate_post with OAuth token
    ↓
Vibe Posts generates post via GPT-4
    ↓
ChatGPT displays preview + "Confirm?" button
    ↓
User confirms → Post saved as draft in Vibe Posts
```

---

## MCP Architecture

### System Diagram

```
┌─────────────────┐
│  ChatGPT User   │
└────────┬────────┘
         │ "Generate a post about..."
         ▼
┌─────────────────────────┐
│   OpenAI ChatGPT        │
│   (MCP Client)          │
└────────┬────────────────┘
         │ OAuth 2.1 Token
         │ POST /mcp/tools/generate_post
         ▼
┌──────────────────────────────────┐
│   Vibe Posts MCP Server          │
│   (Next.js API Routes)           │
│                                  │
│   ┌──────────────────────┐      │
│   │ Tool Registry        │      │
│   │ - generate_post      │      │
│   │ - schedule_post      │      │
│   │ - list_posts         │      │
│   │ - brand_profile      │      │
│   └──────────────────────┘      │
│                                  │
│   ┌──────────────────────┐      │
│   │ OAuth Handler        │      │
│   │ - PKCE validation    │      │
│   │ - Token refresh      │      │
│   └──────────────────────┘      │
│                                  │
│   ┌──────────────────────┐      │
│   │ Rate Limiter         │      │
│   │ - Upstash Redis      │      │
│   └──────────────────────┘      │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│   Core Services                  │
│   - GPT-4 (post generation)      │
│   - Prisma (database)            │
│   - Moderation API (safety)      │
└──────────────────────────────────┘
```

### File Structure

```
app/
├── mcp/
│   ├── server.ts              # MCP server initialization
│   ├── tools/
│   │   ├── generate-post.ts   # Tool: generate_post
│   │   ├── schedule-post.ts   # Tool: schedule_post
│   │   ├── list-posts.ts      # Tool: list_posts
│   │   └── brand-profile.ts   # Tool: brand_profile
│   └── oauth/
│       ├── authorize.ts       # OAuth authorization endpoint
│       ├── token.ts           # Token exchange endpoint
│       └── pkce.ts            # PKCE utilities
├── api/
│   └── mcp/
│       ├── tools/route.ts     # GET /api/mcp/tools (discovery)
│       ├── execute/route.ts   # POST /api/mcp/execute (tool execution)
│       └── oauth/
│           ├── authorize/route.ts
│           └── token/route.ts
lib/
├── mcp/
│   ├── schemas.ts             # TypeBox schemas for tools
│   ├── types.ts               # TypeScript types (branded)
│   └── rate-limit.ts          # Rate limiting logic
```

---

## OAuth 2.1 with PKCE/DCR

### Why OAuth 2.1 + PKCE?

**OAuth 2.1** is the modern OAuth standard that:
- Requires PKCE for all clients (prevents authorization code interception)
- Deprecates implicit grant (security vulnerability)
- Mandates exact redirect URI matching

**PKCE (Proof Key for Code Exchange):**
- Client generates random `code_verifier` (43-128 chars)
- Client sends `code_challenge = BASE64URL(SHA256(code_verifier))` in authorization request
- Server validates `code_verifier` during token exchange (prevents MITM attacks)

### OAuth Flow

```typescript
// Step 1: Authorization Request (from ChatGPT)
// ChatGPT redirects user to:
GET https://vibe-posts.com/api/mcp/oauth/authorize?
  response_type=code
  &client_id=chatgpt-mcp
  &redirect_uri=https://chat.openai.com/aip/callback
  &scope=posts.read posts.write brand.read
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
  &state=random_state_string

// Step 2: User Consent (Vibe Posts)
// User sees: "ChatGPT wants to access your Vibe Posts account"
// User clicks "Allow"

// Step 3: Authorization Code (Vibe Posts → ChatGPT)
// Redirect to:
https://chat.openai.com/aip/callback?
  code=AUTH_CODE_HERE
  &state=random_state_string

// Step 4: Token Exchange (ChatGPT → Vibe Posts)
POST https://vibe-posts.com/api/mcp/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTH_CODE_HERE
&redirect_uri=https://chat.openai.com/aip/callback
&client_id=chatgpt-mcp
&code_verifier=ORIGINAL_CODE_VERIFIER

// Step 5: Access Token Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here",
  "scope": "posts.read posts.write brand.read"
}
```

### Type-Safe Implementation

```typescript
// lib/mcp/types.ts
export type AuthCode = string & { readonly __brand: 'AuthCode' };
export type AccessToken = string & { readonly __brand: 'AccessToken' };
export type RefreshToken = string & { readonly __brand: 'RefreshToken' };
export type PKCEVerifier = string & { readonly __brand: 'PKCEVerifier' };
export type PKCEChallenge = string & { readonly __brand: 'PKCEChallenge' };

export type OAuthScope = 'posts.read' | 'posts.write' | 'brand.read' | 'brand.write';

export interface OAuthAuthorizationRequest {
  responseType: 'code';
  clientId: string;
  redirectUri: string;
  scope: OAuthScope[];
  codeChallenge: PKCEChallenge;
  codeChallengeMethod: 'S256';
  state: string;
}

export interface OAuthTokenRequest {
  grantType: 'authorization_code' | 'refresh_token';
  code?: AuthCode;
  redirectUri?: string;
  clientId: string;
  codeVerifier?: PKCEVerifier;
  refreshToken?: RefreshToken;
}

export interface OAuthTokenResponse {
  accessToken: AccessToken;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshToken: RefreshToken;
  scope: OAuthScope[];
}

// lib/mcp/oauth/pkce.ts
import crypto from 'crypto';

export function generateCodeVerifier(): PKCEVerifier {
  return crypto.randomBytes(32).toString('base64url') as PKCEVerifier;
}

export function generateCodeChallenge(verifier: PKCEVerifier): PKCEChallenge {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url') as PKCEChallenge;
}

export function validateCodeChallenge(
  verifier: PKCEVerifier,
  challenge: PKCEChallenge
): boolean {
  const computedChallenge = generateCodeChallenge(verifier);
  return computedChallenge === challenge;
}

// app/api/mcp/oauth/authorize/route.ts
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { generateAuthCode } from '@/lib/mcp/oauth/codes';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const authRequest: OAuthAuthorizationRequest = {
    responseType: params.get('response_type') as 'code',
    clientId: params.get('client_id')!,
    redirectUri: params.get('redirect_uri')!,
    scope: params.get('scope')!.split(' ') as OAuthScope[],
    codeChallenge: params.get('code_challenge') as PKCEChallenge,
    codeChallengeMethod: params.get('code_challenge_method') as 'S256',
    state: params.get('state')!,
  };

  // Validate client
  const client = await db.oAuthClient.findUnique({
    where: { clientId: authRequest.clientId },
  });

  if (!client) {
    return Response.json({ error: 'invalid_client' }, { status: 401 });
  }

  // Show consent screen
  return new Response(renderConsentScreen(authRequest), {
    headers: { 'Content-Type': 'text/html' },
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const body = await request.json();

  const { clientId, redirectUri, scope, codeChallenge, state, approved } = body;

  if (!approved) {
    return Response.redirect(`${redirectUri}?error=access_denied&state=${state}`);
  }

  // Generate authorization code
  const authCode = generateAuthCode();

  // Store auth code with PKCE challenge
  await db.oAuthAuthorizationCode.create({
    data: {
      code: authCode,
      userId: user.id,
      clientId,
      redirectUri,
      scope,
      codeChallenge,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    },
  });

  return Response.redirect(`${redirectUri}?code=${authCode}&state=${state}`);
}

// app/api/mcp/oauth/token/route.ts
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  const body = await request.json();

  const tokenRequest: OAuthTokenRequest = {
    grantType: body.grant_type,
    code: body.code as AuthCode,
    redirectUri: body.redirect_uri,
    clientId: body.client_id,
    codeVerifier: body.code_verifier as PKCEVerifier,
  };

  if (tokenRequest.grantType === 'authorization_code') {
    // Fetch auth code
    const authCode = await db.oAuthAuthorizationCode.findUnique({
      where: { code: tokenRequest.code },
      include: { user: true },
    });

    if (!authCode || authCode.expiresAt < new Date()) {
      return Response.json({ error: 'invalid_grant' }, { status: 400 });
    }

    // Validate PKCE
    const isValid = validateCodeChallenge(
      tokenRequest.codeVerifier!,
      authCode.codeChallenge as PKCEChallenge
    );

    if (!isValid) {
      return Response.json({ error: 'invalid_grant' }, { status: 400 });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: authCode.userId, scope: authCode.scope },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    ) as AccessToken;

    const refreshToken = jwt.sign(
      { userId: authCode.userId },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    ) as RefreshToken;

    // Delete used auth code
    await db.oAuthAuthorizationCode.delete({ where: { code: tokenRequest.code } });

    // Return tokens
    const response: OAuthTokenResponse = {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      refreshToken,
      scope: authCode.scope as OAuthScope[],
    };

    return Response.json(response);
  }

  // Handle refresh_token grant type
  // ...
}
```

### Prisma Schema

```typescript
model OAuthClient {
  id          String   @id @default(uuid())
  clientId    String   @unique
  clientSecret String
  name        String   // "ChatGPT"
  redirectUris String[] // Allowed redirect URIs
  createdAt   DateTime @default(now())
}

model OAuthAuthorizationCode {
  id            String    @id @default(uuid())
  code          String    @unique
  userId        String
  clientId      String
  redirectUri   String
  scope         String[]
  codeChallenge String
  expiresAt     DateTime
  createdAt     DateTime  @default(now())
  user          User      @relation(fields: [userId], references: [id])
}
```

---

## Tool Definitions

### Tool 1: `/generate_post`

**Purpose:** Generate a social media post based on a topic.

**Parameters:**
```typescript
// lib/mcp/schemas.ts
import { Type, Static } from '@sinclair/typebox';

export const GeneratePostSchema = Type.Object({
  topic: Type.String({
    description: 'What the post should be about',
    minLength: 3,
    maxLength: 200,
  }),
  platform: Type.Union([
    Type.Literal('linkedin'),
    Type.Literal('twitter'),
    Type.Literal('both'),
  ], {
    description: 'Target platform(s)',
  }),
  tone: Type.Optional(Type.Union([
    Type.Literal('professional'),
    Type.Literal('casual'),
    Type.Literal('inspiring'),
    Type.Literal('technical'),
  ], {
    description: 'Tone of the post',
  })),
  includeHashtags: Type.Optional(Type.Boolean({
    description: 'Whether to include hashtags',
    default: true,
  })),
});

export type GeneratePostParams = Static<typeof GeneratePostSchema>;

export const GeneratePostResultSchema = Type.Object({
  content: Type.String(),
  platform: Type.Union([Type.Literal('linkedin'), Type.Literal('twitter')]),
  hashtags: Type.Optional(Type.Array(Type.String())),
  estimatedEngagement: Type.Optional(Type.Number({ description: 'Predicted engagement score 0-100' })),
});

export type GeneratePostResult = Static<typeof GeneratePostResultSchema>;
```

**Implementation:**
```typescript
// app/mcp/tools/generate-post.ts
import { db } from '@/lib/db';
import { moderateContent } from '@/lib/security/moderation';
import OpenAI from 'openai';

const openai = new OpenAI();

export async function executeGeneratePost(
  userId: string,
  params: GeneratePostParams
): Promise<GeneratePostResult> {
  // Fetch brand profile
  const profile = await db.brandProfile.findUnique({
    where: { userId },
  });

  const tone = params.tone || profile?.tone || 'professional';
  const platform = params.platform === 'both' ? 'linkedin' : params.platform;

  // Construct prompt
  const maxLength = platform === 'linkedin' ? 1300 : 280;
  const prompt = `Write a ${tone} ${platform} post about: ${params.topic}.
Max ${maxLength} characters.
${params.includeHashtags ? 'Include 3-5 relevant hashtags.' : 'No hashtags.'}
${profile?.expertise ? `Author expertise: ${profile.expertise.join(', ')}` : ''}`;

  // Generate content
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a professional social media content creator specializing in ${platform} posts.`,
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content!;

  // Moderate content
  const moderation = await moderateContent(content);
  if (!moderation.safe) {
    throw new Error(`Content flagged for: ${moderation.reason}`);
  }

  // Extract hashtags
  const hashtags = params.includeHashtags
    ? content.match(/#\w+/g)?.map(tag => tag.slice(1))
    : undefined;

  return {
    content,
    platform,
    hashtags,
    estimatedEngagement: predictEngagement(content), // ML model (optional)
  };
}
```

**API Route:**
```typescript
// app/api/mcp/execute/route.ts
import { verifyAccessToken } from '@/lib/mcp/oauth/verify';
import { checkRateLimit } from '@/lib/mcp/rate-limit';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7) as AccessToken;
  const { userId, scope } = await verifyAccessToken(token);

  const body = await request.json();
  const { tool, parameters } = body;

  // Check rate limit
  const allowed = await checkRateLimit(userId, tool);
  if (!allowed) {
    return Response.json(
      { error: 'Rate limit exceeded (100 requests/hour)' },
      { status: 429 }
    );
  }

  switch (tool) {
    case 'generate_post': {
      if (!scope.includes('posts.write')) {
        return Response.json({ error: 'Insufficient scope' }, { status: 403 });
      }

      const validatedParams = GeneratePostSchema.parse(parameters);
      const result = await executeGeneratePost(userId, validatedParams);
      return Response.json(result);
    }

    // Handle other tools...
    default:
      return Response.json({ error: 'Unknown tool' }, { status: 400 });
  }
}
```

---

### Tool 2: `/schedule_post`

**Purpose:** Schedule a post for future publication.

**Parameters:**
```typescript
export const SchedulePostSchema = Type.Object({
  content: Type.String({ minLength: 1, maxLength: 1300 }),
  platform: Type.Union([Type.Literal('linkedin'), Type.Literal('twitter')]),
  scheduledFor: Type.String({ format: 'date-time', description: 'ISO 8601 datetime' }),
});

export type SchedulePostParams = Static<typeof SchedulePostSchema>;

export const SchedulePostResultSchema = Type.Object({
  postId: Type.String(),
  status: Type.Literal('scheduled'),
  scheduledFor: Type.String({ format: 'date-time' }),
});

export type SchedulePostResult = Static<typeof SchedulePostResultSchema>;
```

**Implementation:**
```typescript
export async function executeSchedulePost(
  userId: string,
  params: SchedulePostParams
): Promise<SchedulePostResult> {
  // Check subscription limits
  const { allowed, reason } = await canPublishPost(userId);
  if (!allowed) {
    throw new Error(reason);
  }

  // Moderate content
  const moderation = await moderateContent(params.content);
  if (!moderation.safe) {
    throw new Error(`Content flagged for: ${moderation.reason}`);
  }

  // Create scheduled post
  const post = await db.post.create({
    data: {
      userId,
      content: params.content,
      platform: params.platform.toUpperCase() as Platform,
      status: 'SCHEDULED',
      scheduledFor: new Date(params.scheduledFor),
    },
  });

  return {
    postId: post.id,
    status: 'scheduled',
    scheduledFor: post.scheduledFor!.toISOString(),
  };
}
```

---

### Tool 3: `/list_posts`

**Purpose:** List user's recent posts.

**Parameters:**
```typescript
export const ListPostsSchema = Type.Object({
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 10 })),
  status: Type.Optional(Type.Union([
    Type.Literal('draft'),
    Type.Literal('scheduled'),
    Type.Literal('published'),
  ])),
  platform: Type.Optional(Type.Union([
    Type.Literal('linkedin'),
    Type.Literal('twitter'),
  ])),
});

export type ListPostsParams = Static<typeof ListPostsSchema>;

export const ListPostsResultSchema = Type.Object({
  posts: Type.Array(Type.Object({
    id: Type.String(),
    content: Type.String(),
    platform: Type.Union([Type.Literal('linkedin'), Type.Literal('twitter')]),
    status: Type.Union([
      Type.Literal('draft'),
      Type.Literal('scheduled'),
      Type.Literal('published'),
    ]),
    scheduledFor: Type.Optional(Type.String({ format: 'date-time' })),
    publishedAt: Type.Optional(Type.String({ format: 'date-time' })),
    publishedUrl: Type.Optional(Type.String({ format: 'uri' })),
    analytics: Type.Optional(Type.Object({
      views: Type.Number(),
      likes: Type.Number(),
      comments: Type.Number(),
      shares: Type.Number(),
      engagementRate: Type.Number(),
    })),
  })),
  total: Type.Number(),
});

export type ListPostsResult = Static<typeof ListPostsResultSchema>;
```

**Implementation:**
```typescript
export async function executeListPosts(
  userId: string,
  params: ListPostsParams
): Promise<ListPostsResult> {
  const where: any = { userId };

  if (params.status) {
    where.status = params.status.toUpperCase();
  }

  if (params.platform) {
    where.platform = params.platform.toUpperCase();
  }

  const posts = await db.post.findMany({
    where,
    include: { analytics: true },
    orderBy: { createdAt: 'desc' },
    take: params.limit || 10,
  });

  const total = await db.post.count({ where });

  return {
    posts: posts.map(post => ({
      id: post.id,
      content: post.content,
      platform: post.platform.toLowerCase() as 'linkedin' | 'twitter',
      status: post.status.toLowerCase() as any,
      scheduledFor: post.scheduledFor?.toISOString(),
      publishedAt: post.publishedAt?.toISOString(),
      publishedUrl: post.publishedUrl || undefined,
      analytics: post.analytics ? {
        views: post.analytics.views,
        likes: post.analytics.likes,
        comments: post.analytics.comments,
        shares: post.analytics.shares,
        engagementRate: post.analytics.engagementRate,
      } : undefined,
    })),
    total,
  };
}
```

---

### Tool 4: `/brand_profile`

**Purpose:** Get or update user's brand profile.

**Parameters:**
```typescript
export const BrandProfileSchema = Type.Object({
  action: Type.Union([Type.Literal('get'), Type.Literal('update')]),
  data: Type.Optional(Type.Object({
    tone: Type.Optional(Type.String()),
    expertise: Type.Optional(Type.Array(Type.String())),
    targetAudience: Type.Optional(Type.String()),
  })),
});

export type BrandProfileParams = Static<typeof BrandProfileSchema>;

export const BrandProfileResultSchema = Type.Object({
  tone: Type.Optional(Type.String()),
  expertise: Type.Optional(Type.Array(Type.String())),
  targetAudience: Type.Optional(Type.String()),
  updatedAt: Type.String({ format: 'date-time' }),
});

export type BrandProfileResult = Static<typeof BrandProfileResultSchema>;
```

**Implementation:**
```typescript
export async function executeBrandProfile(
  userId: string,
  params: BrandProfileParams
): Promise<BrandProfileResult> {
  if (params.action === 'get') {
    const profile = await db.brandProfile.findUnique({
      where: { userId },
    });

    return {
      tone: profile?.tone || undefined,
      expertise: profile?.expertise || undefined,
      targetAudience: profile?.targetAudience || undefined,
      updatedAt: profile?.updatedAt.toISOString() || new Date().toISOString(),
    };
  }

  if (params.action === 'update') {
    const profile = await db.brandProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...params.data,
      },
      update: params.data,
    });

    return {
      tone: profile.tone || undefined,
      expertise: profile.expertise,
      targetAudience: profile.targetAudience || undefined,
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  throw new Error('Invalid action');
}
```

---

## Type-Safe Implementation

### TypeBox vs. Zod

**Why TypeBox?**
- **JSON Schema native:** Direct serialization to JSON Schema (required for MCP tool discovery)
- **Faster runtime validation:** 10-20x faster than Zod
- **OpenAPI compatibility:** Auto-generate OpenAPI specs

**Trade-offs:**
- Less ergonomic than Zod (more verbose)
- Smaller community/ecosystem

**Decision:** Use TypeBox for MCP tool schemas, Zod everywhere else.

### Tool Registry

```typescript
// lib/mcp/registry.ts
import { TSchema } from '@sinclair/typebox';

export interface MCPTool<TParams = any, TResult = any> {
  name: string;
  description: string;
  parametersSchema: TSchema;
  resultSchema: TSchema;
  execute: (userId: string, params: TParams) => Promise<TResult>;
  requiredScopes: OAuthScope[];
}

export const MCP_TOOLS: Record<string, MCPTool> = {
  generate_post: {
    name: 'generate_post',
    description: 'Generate a LinkedIn or Twitter post based on a topic',
    parametersSchema: GeneratePostSchema,
    resultSchema: GeneratePostResultSchema,
    execute: executeGeneratePost,
    requiredScopes: ['posts.write'],
  },
  schedule_post: {
    name: 'schedule_post',
    description: 'Schedule a post for future publication',
    parametersSchema: SchedulePostSchema,
    resultSchema: SchedulePostResultSchema,
    execute: executeSchedulePost,
    requiredScopes: ['posts.write'],
  },
  list_posts: {
    name: 'list_posts',
    description: 'List recent posts',
    parametersSchema: ListPostsSchema,
    resultSchema: ListPostsResultSchema,
    execute: executeListPosts,
    requiredScopes: ['posts.read'],
  },
  brand_profile: {
    name: 'brand_profile',
    description: 'Get or update brand profile',
    parametersSchema: BrandProfileSchema,
    resultSchema: BrandProfileResultSchema,
    execute: executeBrandProfile,
    requiredScopes: ['brand.read', 'brand.write'],
  },
};

// app/api/mcp/tools/route.ts (Tool Discovery)
export async function GET() {
  const tools = Object.values(MCP_TOOLS).map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parametersSchema,
    result: tool.resultSchema,
  }));

  return Response.json({ tools });
}
```

---

## Security & Compliance

### Rate Limiting

```typescript
// lib/mcp/rate-limit.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function checkRateLimit(userId: string, tool: string): Promise<boolean> {
  const key = `rate_limit:${userId}:${tool}`;
  const limit = 100; // 100 requests per hour
  const window = 3600; // 1 hour in seconds

  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, window);
  }

  return current <= limit;
}

export async function getRateLimitStatus(userId: string, tool: string) {
  const key = `rate_limit:${userId}:${tool}`;
  const current = await redis.get<number>(key) || 0;
  const ttl = await redis.ttl(key);

  return {
    limit: 100,
    remaining: Math.max(0, 100 - current),
    resetAt: new Date(Date.now() + ttl * 1000),
  };
}
```

### Content Moderation

```typescript
// All user-generated content MUST pass moderation before storage
export async function executeGeneratePost(userId: string, params: GeneratePostParams) {
  const content = await generateContent(params);

  // CRITICAL: Moderate before returning
  const moderation = await moderateContent(content.content);
  if (!moderation.safe) {
    // Log incident
    await db.auditLog.create({
      data: {
        userId,
        action: 'content.moderation.blocked',
        metadata: { reason: moderation.reason, tool: 'generate_post' },
      },
    });

    throw new Error(`Content moderated: ${moderation.reason}`);
  }

  return content;
}
```

### Consent & Undo

**OpenAI Apps SDK Requirement:** All actions must support undo.

```typescript
// app/api/posts/[id]/route.ts
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const post = await db.post.findUnique({ where: { id: params.id } });

  if (!post || post.userId !== user.id) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  // If published, attempt to delete from platform
  if (post.status === 'PUBLISHED' && post.publishedUrl) {
    if (post.platform === 'LINKEDIN') {
      await deleteLinkedInPost(post.publishedUrl, user.id);
    } else if (post.platform === 'TWITTER') {
      await deleteTwitterPost(post.publishedUrl, user.id);
    }
  }

  // Delete from database
  await db.post.delete({ where: { id: params.id } });

  return Response.json({ success: true });
}
```

**Consent Screen UI:**
```typescript
// app/mcp/oauth/consent/page.tsx
export default function ConsentPage({ searchParams }: { searchParams: any }) {
  const { clientName, scope } = searchParams;

  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-2xl mb-4">Authorize {clientName}</h1>
      <p className="mb-4">{clientName} is requesting access to:</p>
      <ul className="list-disc ml-6 mb-6">
        {scope.split(' ').map((s: string) => (
          <li key={s}>{formatScope(s)}</li>
        ))}
      </ul>
      <div className="flex gap-4">
        <button
          onClick={() => approveConsent()}
          className="bg-primary text-white px-6 py-2 rounded"
        >
          Allow
        </button>
        <button
          onClick={() => denyConsent()}
          className="bg-gray-300 px-6 py-2 rounded"
        >
          Deny
        </button>
      </div>
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/mcp/tools/generate-post.test.ts
import { describe, test, expect } from '@jest/globals';
import { executeGeneratePost } from '@/app/mcp/tools/generate-post';

describe('generate_post tool', () => {
  test('generates LinkedIn post', async () => {
    const result = await executeGeneratePost('user123', {
      topic: 'AI ethics',
      platform: 'linkedin',
      tone: 'professional',
    });

    expect(result.content).toBeTruthy();
    expect(result.content.length).toBeLessThanOrEqual(1300);
    expect(result.platform).toBe('linkedin');
  });

  test('blocks toxic content', async () => {
    await expect(
      executeGeneratePost('user123', {
        topic: 'Hate speech example',
        platform: 'linkedin',
      })
    ).rejects.toThrow('Content moderated');
  });

  test('respects brand profile', async () => {
    // User has "casual" tone in profile
    const result = await executeGeneratePost('user_casual', {
      topic: 'JavaScript tips',
      platform: 'linkedin',
    });

    // Verify casual tone (heuristic)
    expect(result.content).toMatch(/\b(cool|awesome|fun)\b/i);
  });
});
```

### Integration Tests

```typescript
// tests/mcp/oauth/flow.test.ts
import { test, expect } from '@playwright/test';

test('OAuth flow with PKCE', async ({ page, context }) => {
  // Step 1: Generate PKCE verifier/challenge
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  // Step 2: Authorization request
  await page.goto(
    `/api/mcp/oauth/authorize?response_type=code&client_id=test&redirect_uri=http://localhost:3000/callback&scope=posts.write&code_challenge=${challenge}&code_challenge_method=S256&state=test`
  );

  // Step 3: User consents
  await page.click('text=Allow');

  // Step 4: Extract auth code from redirect
  await page.waitForURL(/callback\?code=/);
  const url = new URL(page.url());
  const code = url.searchParams.get('code');

  // Step 5: Exchange code for token
  const tokenResponse = await fetch('/api/mcp/oauth/token', {
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'http://localhost:3000/callback',
      client_id: 'test',
      code_verifier: verifier,
    }),
  });

  const { access_token } = await tokenResponse.json();
  expect(access_token).toBeTruthy();

  // Step 6: Use token to call MCP tool
  const toolResponse = await fetch('/api/mcp/execute', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${access_token}` },
    body: JSON.stringify({
      tool: 'generate_post',
      parameters: { topic: 'Test', platform: 'linkedin' },
    }),
  });

  expect(toolResponse.status).toBe(200);
});
```

### Load Testing

```typescript
// tests/mcp/load/rate-limit.test.ts
import { describe, test, expect } from '@jest/globals';

test('rate limiting enforced', async () => {
  const token = await getTestAccessToken();

  // Send 101 requests (limit is 100/hour)
  const requests = Array.from({ length: 101 }, () =>
    fetch('/api/mcp/execute', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        tool: 'generate_post',
        parameters: { topic: 'Test', platform: 'linkedin' },
      }),
    })
  );

  const responses = await Promise.all(requests);

  // First 100 should succeed
  expect(responses.slice(0, 100).every(r => r.status === 200)).toBe(true);

  // 101st should be rate limited
  expect(responses[100].status).toBe(429);
});
```

---

## Deployment

### Environment Variables

```bash
# .env.production
# MCP OAuth
MCP_CLIENT_ID=chatgpt-mcp
MCP_CLIENT_SECRET=<generate-secure-secret>
JWT_SECRET=<generate-secure-secret>

# Upstash Redis (rate limiting)
UPSTASH_REDIS_URL=https://your-redis.upstash.io
UPSTASH_REDIS_TOKEN=<your-token>

# OpenAI
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://...

# Encryption
ENCRYPTION_KEY=<32-byte-hex-string>
```

### OpenAI Apps Submission

**Pre-submission checklist:**
1. [ ] OAuth 2.1 with PKCE implemented
2. [ ] All 4 MCP tools functional
3. [ ] Rate limiting active (100/hour)
4. [ ] Content moderation enforced
5. [ ] Consent screen UI polished
6. [ ] Undo functionality tested
7. [ ] Audit logging enabled
8. [ ] Data export/deletion working (GDPR)
9. [ ] Security audit passed (no high/critical vulnerabilities)
10. [ ] Load testing passed (1000 concurrent users)

**Submission URL:** https://platform.openai.com/apps/submit

**Required materials:**
- App name: "Vibe Posts"
- Description: "AI-powered social media content creation and scheduling"
- Privacy policy: https://vibe-posts.com/privacy
- Terms of service: https://vibe-posts.com/terms
- Support email: support@vibe-posts.com
- OAuth authorize URL: https://vibe-posts.com/api/mcp/oauth/authorize
- OAuth token URL: https://vibe-posts.com/api/mcp/oauth/token
- MCP tools discovery URL: https://vibe-posts.com/api/mcp/tools

---

## Monitoring

### Key Metrics

```typescript
// lib/monitoring/mcp.ts
export interface MCPMetrics {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  rateLimitHits: number;
  moderationBlocks: number;
  errorRate: number;
}

export async function trackMCPRequest(
  tool: string,
  userId: string,
  success: boolean,
  duration: number
) {
  await db.mcpMetrics.create({
    data: {
      tool,
      userId,
      success,
      duration,
      timestamp: new Date(),
    },
  });

  // Send to Vercel Analytics
  await fetch('https://vitals.vercel-analytics.com/v1/track', {
    method: 'POST',
    body: JSON.stringify({
      event: 'mcp_request',
      properties: { tool, success, duration },
    }),
  });
}
```

### Alerts

```typescript
// Monitor error rate, send alert if >5%
// Monitor avg response time, alert if >500ms
// Monitor rate limit hits, alert if >10/min (potential abuse)
```

---

## Conclusion

This MCP implementation provides:
- **4 type-safe tools** for ChatGPT integration
- **OAuth 2.1 + PKCE** for secure authorization
- **Rate limiting** to prevent abuse
- **Content moderation** for safety
- **Comprehensive testing** (unit, integration, load)

**Timeline:** Days 1-4 (Team 9)
**Dependencies:** None (can start immediately)
**Success Criteria:** All 4 tools functional, OAuth flow tested, compliance checklist 100% complete

**Ready for implementation.** ✅
