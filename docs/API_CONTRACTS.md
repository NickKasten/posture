# API Contracts - Vibe Posts

**Last Updated:** 2025-10-30
**Status:** MVP Phase - Core contracts defined

This document defines type-safe contracts for all APIs, database models, and inter-module communication.

---

## Table of Contents

1. [Core Types](#core-types)
2. [Database Models](#database-models)
3. [API Endpoints](#api-endpoints)
4. [MCP Tools](#mcp-tools)
5. [Frontend-Backend Contracts](#frontend-backend-contracts)

---

## Core Types

### Branded Types

Security-critical data wrapped in branded types for compile-time safety.

```typescript
// lib/types/branded.ts

// User identifiers
export type UserId = string & { readonly __brand: 'UserId' };
export type Email = string & { readonly __brand: 'Email' };

// OAuth tokens
export type GitHubToken = string & { readonly __brand: 'GitHubToken' };
export type LinkedInToken = string & { readonly __brand: 'LinkedInToken' };
export type TwitterToken = string & { readonly __brand: 'TwitterToken' };
export type EncryptedToken = string & { readonly __brand: 'EncryptedToken' };

// MCP OAuth
export type AuthCode = string & { readonly __brand: 'AuthCode' };
export type PKCEVerifier = string & { readonly __brand: 'PKCEVerifier' };
export type PKCEChallenge = string & { readonly __brand: 'PKCEChallenge' };

// Stripe
export type StripeCustomerId = string & { readonly __brand: 'StripeCustomerId' };
export type StripePriceId = string & { readonly __brand: 'StripePriceId' };
export type StripeSubscriptionId = string & { readonly __brand: 'StripeSubscriptionId' };

// Entities
export type PostId = string & { readonly __brand: 'PostId' };
export type ProfileId = string & { readonly __brand: 'ProfileId' };

// Constructor functions with validation
export function UserId(id: string): UserId {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Invalid UserId format');
  return id as UserId;
}

export function GitHubToken(token: string): GitHubToken {
  if (!token.startsWith('ghp_') && !token.startsWith('gho_')) {
    throw new Error('Invalid GitHub token format');
  }
  return token as GitHubToken;
}
```

### Platform Enum

```typescript
// lib/types/platform.ts
export enum Platform {
  LINKEDIN = 'LINKEDIN',
  TWITTER = 'TWITTER',
}

export type PlatformString = 'linkedin' | 'twitter';

export function toPlatformEnum(platform: PlatformString): Platform {
  return platform === 'linkedin' ? Platform.LINKEDIN : Platform.TWITTER;
}
```

### Post State (Discriminated Union)

```typescript
// lib/types/post.ts
export type PostState =
  | { status: 'draft'; savedAt: Date }
  | { status: 'scheduled'; scheduledFor: Date }
  | { status: 'published'; platformUrl: string; publishedAt: Date }
  | { status: 'failed'; error: string; attemptedAt: Date };

export type PostStyle = 'professional' | 'casual' | 'technical' | 'inspiring';

export interface Post {
  id: PostId;
  userId: UserId;
  content: string;
  hashtags: string[];
  platform: Platform;
  state: PostState;
  style?: PostStyle;
  createdAt: Date;
  updatedAt: Date;
}
```

### Subscription Tiers (Discriminated Union)

```typescript
// lib/types/subscription.ts
export type SubscriptionTier =
  | { type: 'free'; postsRemaining: number; maxPosts: 2 }
  | { type: 'standard'; coachSessionsRemaining: number; maxSessions: 2 }
  | { type: 'premium'; internEnabled: boolean; analyticsEnabled: true };

export type SubscriptionStatus = 'active' | 'trial' | 'canceled' | 'past_due';

export interface Subscription {
  id: string;
  userId: UserId;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: StripeCustomerId;
  stripeSubscriptionId?: StripeSubscriptionId;
  currentPeriodEnd?: Date;
  createdAt: Date;
}
```

---

## Database Models

### Current Schema (Supabase)

#### `user_tokens`

```typescript
// lib/types/database.ts
export interface UserToken {
  id: string;                          // UUID
  user_id: string;                     // GitHub user ID
  provider: 'github' | 'linkedin' | 'twitter' | 'openai';
  encrypted_token: string;             // AES-256-CBC encrypted
  refresh_token?: string | null;       // Encrypted refresh token
  github_user_id?: number | null;      // Original GitHub numeric ID
  expires_at?: Date | null;            // Token expiration
  scopes?: string[] | null;            // OAuth scopes
  created_at: Date;
  updated_at: Date;
}

// Zod schema for runtime validation
import { z } from 'zod';

export const UserTokenSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  provider: z.enum(['github', 'linkedin', 'twitter', 'openai']),
  encrypted_token: z.string(),
  refresh_token: z.string().optional().nullable(),
  github_user_id: z.number().optional().nullable(),
  expires_at: z.date().optional().nullable(),
  scopes: z.array(z.string()).optional().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});
```

#### `posts`

```typescript
export interface PostRow {
  id: string;                          // UUID
  user_id: string;                     // References user_tokens.user_id
  title?: string | null;
  content: string;                     // Post content
  hashtags?: string[] | null;          // Hashtags array
  github_activity_summary?: string | null;
  ai_provider?: string | null;         // 'openai', 'anthropic', etc.
  style?: string | null;               // 'professional', 'casual', etc.
  created_at: Date;
  updated_at: Date;
}

export const PostRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  title: z.string().optional().nullable(),
  content: z.string().min(1),
  hashtags: z.array(z.string()).optional().nullable(),
  github_activity_summary: z.string().optional().nullable(),
  ai_provider: z.string().optional().nullable(),
  style: z.enum(['professional', 'casual', 'technical', 'inspiring']).optional().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});
```

### Planned Schema (Phase 2+)

#### `user_profiles`

```typescript
export interface UserProfile {
  id: ProfileId;
  user_id: UserId;
  email?: Email;
  display_name?: string;
  brand_tone: string[];                // ['technical', 'approachable']
  brand_topics: string[];              // ['GraphQL', 'APIs']
  career_goals?: string;
  tone_embedding?: number[];           // GPT embeddings
  last_review?: Date;
  created_at: Date;
}
```

#### `subscriptions`

```typescript
export interface SubscriptionRow {
  id: string;
  user_id: UserId;
  tier: 'free' | 'standard' | 'premium';
  status: SubscriptionStatus;
  stripe_customer_id?: StripeCustomerId;
  stripe_subscription_id?: StripeSubscriptionId;
  current_period_end?: Date;
  posts_this_month: number;
  coach_sessions_this_month: number;
  created_at: Date;
  updated_at: Date;
}
```

#### `post_analytics`

```typescript
export interface PostAnalytics {
  id: string;
  post_id: PostId;
  platform: Platform;
  platform_post_id?: string;           // External ID
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  sentiment_score?: number;            // -1 to +1
  last_synced: Date;
}
```

---

## API Endpoints

### Current Endpoints

#### `GET /api/auth/github`

**Purpose:** GitHub OAuth callback handler

**Query Parameters:**
```typescript
interface GitHubOAuthQuery {
  code: string;                        // OAuth authorization code
  state?: string;                      // CSRF protection token
}
```

**Response:** Redirect to dashboard

**Errors:**
- `400` - Missing code parameter
- `401` - Invalid code or expired
- `500` - Token storage failed

---

#### `GET /api/github/activity`

**Purpose:** Fetch user's recent GitHub activity

**Query Parameters:**
```typescript
interface GitHubActivityQuery {
  userId: string;                      // GitHub user ID
  limit?: number;                      // Max commits (default: 10)
}
```

**Response:**
```typescript
interface GitHubActivityResponse {
  commits: Array<{
    sha: string;
    message: string;
    repo: string;
    date: string;                      // ISO 8601
  }>;
  repos: string[];                     // Unique repo names
}
```

**Errors:**
- `400` - Missing or invalid userId
- `401` - Token not found or expired
- `403` - GitHub API rate limit exceeded
- `500` - GitHub API error

---

### Planned Endpoints (Phase 1)

#### `POST /api/ai/generate`

**Purpose:** Generate post from user input

**Request Body:**
```typescript
interface GeneratePostRequest {
  topic: string;                       // What the post is about
  platform: 'linkedin' | 'twitter' | 'both';
  tone?: 'technical' | 'casual' | 'inspiring';
  githubActivity?: object;             // Optional context
  maxLength?: number;                  // Character limit override
}

const GeneratePostRequestSchema = z.object({
  topic: z.string().min(10).max(500),
  platform: z.enum(['linkedin', 'twitter', 'both']),
  tone: z.enum(['technical', 'casual', 'inspiring']).optional(),
  githubActivity: z.object({}).optional(),
  maxLength: z.number().min(50).max(2000).optional(),
});
```

**Response:**
```typescript
interface GeneratePostResponse {
  content: string;
  hashtags: string[];
  characterCount: number;
  platform: 'linkedin' | 'twitter';
  suggestions?: string[];              // Alternative phrasings
}
```

**Errors:**
- `400` - Invalid request body
- `401` - Unauthorized (no valid session)
- `429` - Rate limit exceeded (20 requests/hour)
- `500` - OpenAI API error

---

#### `POST /api/posts`

**Purpose:** Create/publish post

**Request Body:**
```typescript
interface CreatePostRequest {
  content: string;
  platform: 'linkedin' | 'twitter' | 'both';
  hashtags?: string[];
  scheduledFor?: string;               // ISO 8601 datetime
  publish?: boolean;                   // If false, save as draft
}

const CreatePostRequestSchema = z.object({
  content: z.string().min(10).max(1300),
  platform: z.enum(['linkedin', 'twitter', 'both']),
  hashtags: z.array(z.string()).max(30).optional(),
  scheduledFor: z.string().datetime().optional(),
  publish: z.boolean().default(false),
});
```

**Response:**
```typescript
interface CreatePostResponse {
  post: {
    id: PostId;
    status: 'draft' | 'scheduled' | 'published';
    platformUrl?: string;              // If published
    undoAvailableUntil?: string;       // ISO 8601 (5 min window)
  };
}
```

**Errors:**
- `400` - Invalid request body
- `401` - Unauthorized
- `402` - Payment required (exceeded tier limit)
- `403` - Content flagged by moderation
- `500` - Publishing failed

---

#### `GET /api/posts`

**Purpose:** List user's posts

**Query Parameters:**
```typescript
interface ListPostsQuery {
  status?: 'draft' | 'scheduled' | 'published' | 'failed' | 'all';
  platform?: 'linkedin' | 'twitter' | 'all';
  limit?: number;                      // Default: 20, max: 100
  offset?: number;                     // For pagination
}
```

**Response:**
```typescript
interface ListPostsResponse {
  posts: Array<{
    id: PostId;
    content: string;
    platform: Platform;
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    publishedAt?: string;              // ISO 8601
    analytics?: {
      views: number;
      likes: number;
      comments: number;
      engagement_rate: number;
    };
  }>;
  total: number;
  hasMore: boolean;
}
```

---

## MCP Tools

### Tool 1: `generate_post`

**JSON Schema:**
```json
{
  "name": "generate_post",
  "description": "Generate a LinkedIn or Twitter post based on user's input",
  "parameters": {
    "type": "object",
    "properties": {
      "topic": {
        "type": "string",
        "description": "What the post should be about"
      },
      "platform": {
        "type": "string",
        "enum": ["linkedin", "twitter", "both"]
      },
      "tone": {
        "type": "string",
        "enum": ["technical", "casual", "inspiring"],
        "description": "Defaults to user's brand profile"
      }
    },
    "required": ["topic", "platform"]
  }
}
```

**TypeScript Contract:**
```typescript
export interface GeneratePostMCPRequest {
  topic: string;
  platform: 'linkedin' | 'twitter' | 'both';
  tone?: 'technical' | 'casual' | 'inspiring';
}

export interface GeneratePostMCPResponse {
  post: {
    content: string;
    hashtags: string[];
    characterCount: number;
    platform: 'linkedin' | 'twitter';
  };
  preview_url: string;
}
```

---

### Tool 2: `schedule_post`

**JSON Schema:**
```json
{
  "name": "schedule_post",
  "description": "Schedule a post for publishing. Requires user confirmation.",
  "parameters": {
    "type": "object",
    "properties": {
      "content": {
        "type": "string",
        "description": "Post content"
      },
      "platform": {
        "type": "string",
        "enum": ["linkedin", "twitter", "both"]
      },
      "scheduledFor": {
        "type": "string",
        "format": "date-time",
        "description": "When to publish (ISO 8601). Omit for immediate."
      },
      "hashtags": {
        "type": "array",
        "items": { "type": "string" },
        "maxItems": 30
      }
    },
    "required": ["content", "platform"]
  }
}
```

**TypeScript Contract:**
```typescript
export interface SchedulePostMCPRequest {
  content: string;
  platform: 'linkedin' | 'twitter' | 'both';
  scheduledFor?: string;               // ISO 8601
  hashtags?: string[];
  consent?: boolean;                   // Set to true after user confirms
}

export type SchedulePostMCPResponse =
  | { status: 'pending_consent'; preview: string }
  | { status: 'published'; post_id: PostId; platform_url: string; undo_available_until: string }
  | { status: 'scheduled'; post_id: PostId; scheduled_for: string };
```

---

### Tool 3: `list_posts`

**JSON Schema:**
```json
{
  "name": "list_posts",
  "description": "List user's posts with optional filtering",
  "parameters": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": ["draft", "scheduled", "published", "failed", "all"]
      },
      "platform": {
        "type": "string",
        "enum": ["linkedin", "twitter", "all"]
      },
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 50,
        "default": 10
      }
    }
  }
}
```

**TypeScript Contract:**
```typescript
export interface ListPostsMCPRequest {
  status?: 'draft' | 'scheduled' | 'published' | 'failed' | 'all';
  platform?: 'linkedin' | 'twitter' | 'all';
  limit?: number;
}

export interface ListPostsMCPResponse {
  posts: Array<{
    id: PostId;
    content: string;
    platform: Platform;
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    published_at?: string;
    analytics?: {
      views: number;
      likes: number;
      comments: number;
      engagement_rate: number;
    };
  }>;
  total: number;
  has_more: boolean;
}
```

---

### Tool 4: `brand_profile`

**JSON Schema:**
```json
{
  "name": "brand_profile",
  "description": "Get user's professional brand profile",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["read"]
      }
    },
    "required": ["action"]
  }
}
```

**TypeScript Contract:**
```typescript
export interface BrandProfileMCPRequest {
  action: 'read';                      // 'write' in Phase 2
}

export interface BrandProfileMCPResponse {
  brand: {
    tone: string[];                    // ['technical', 'approachable']
    topics: string[];                  // ['GraphQL', 'APIs']
    career_goals?: string;
    preferred_style: string;
    last_review?: string;              // ISO 8601
  };
}
```

---

## Frontend-Backend Contracts

### React Component Props

```typescript
// components/post/PostEditor.tsx
export interface PostEditorProps {
  initialContent?: string;
  platform: 'linkedin' | 'twitter';
  onSave: (content: string, hashtags: string[]) => Promise<void>;
  onPublish: (content: string, hashtags: string[]) => Promise<void>;
  maxLength: number;
}

// components/auth/OAuthButton.tsx
export interface OAuthButtonProps {
  provider: 'github' | 'linkedin' | 'twitter';
  onSuccess: (userId: UserId) => void;
  onError: (error: Error) => void;
}
```

### API Client

```typescript
// lib/api/client.ts
export interface ApiClient {
  generatePost(request: GeneratePostRequest): Promise<GeneratePostResponse>;
  createPost(request: CreatePostRequest): Promise<CreatePostResponse>;
  listPosts(query?: ListPostsQuery): Promise<ListPostsResponse>;
  getGitHubActivity(userId: string): Promise<GitHubActivityResponse>;
}
```

---

## Type-Safety Enforcement

### Runtime Validation Example

```typescript
// api/ai/generate/route.ts
import { GeneratePostRequestSchema } from '@/lib/types/api';

export async function POST(request: Request) {
  const body = await request.json();

  // Runtime validation with Zod
  const result = GeneratePostRequestSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: 'Invalid request', details: result.error.issues },
      { status: 400 }
    );
  }

  // result.data is fully typed
  const { topic, platform, tone } = result.data;

  // ... implementation
}
```

### Branded Type Usage

```typescript
// ✅ Correct: Use constructor functions
const userId = UserId('github_user_123');
const token = GitHubToken('ghp_abc123xyz');

storeToken(userId, token);

// ❌ Compiler error: can't pass raw strings
storeToken('user_123', 'ghp_token');
```

---

**Next Steps:** See `ARCHITECTURE.md` for implementation details and `SECURITY.md` for token handling best practices.
