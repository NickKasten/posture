// TypeScript types for social media account and post management database schema
// Branded types for type-safe ID references and discriminated unions for enums

// ============================================================================
// BRANDED TYPE DEFINITIONS
// ============================================================================
// These create distinct types for different ID types to prevent accidental mixing

/** Branded type for social account ID */
export type AccountId = string & { readonly __accountId: unique symbol };

/** Branded type for post draft ID */
export type PostDraftId = string & { readonly __postDraftId: unique symbol };

/** Branded type for published post ID */
export type PublishedPostId = string & { readonly __publishedPostId: unique symbol };

/** Branded type for user ID (from Supabase auth.users) */
export type UserId = string & { readonly __userId: unique symbol };

// Helper functions to safely create branded types
export const createAccountId = (id: string): AccountId => id as AccountId;
export const createPostDraftId = (id: string): PostDraftId => id as PostDraftId;
export const createPublishedPostId = (id: string): PublishedPostId => id as PublishedPostId;
export const createUserId = (id: string): UserId => id as UserId;

// ============================================================================
// ENUM-LIKE DISCRIMINATED UNIONS
// ============================================================================
// These provide better type safety than string literals

export type Platform = 'linkedin' | 'twitter';
export type PlatformTarget = 'linkedin' | 'twitter' | 'both';
export type PostTone = 'technical' | 'casual' | 'inspiring';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

// ============================================================================
// SOCIAL_ACCOUNTS TABLE TYPES
// ============================================================================

/**
 * Represents a connected social media account with encrypted OAuth credentials
 * Stores one account per platform per user
 */
export interface SocialAccount {
  id: AccountId;
  user_id: UserId;
  platform: Platform;
  encrypted_access_token: string;
  encrypted_refresh_token: string | null;
  token_expires_at: string | null; // ISO 8601 timestamp
  linkedin_member_id: string | null; // LinkedIn member ID (from OpenID Connect sub claim)
  twitter_user_id: string | null; // Twitter user ID (from Twitter API v2 users/me endpoint)
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Input type for creating a new social account
 * Excludes computed fields (id, created_at, updated_at)
 */
export interface CreateSocialAccountInput {
  user_id: UserId;
  platform: Platform;
  encrypted_access_token: string;
  encrypted_refresh_token?: string;
  token_expires_at?: string;
  linkedin_member_id?: string;
  twitter_user_id?: string;
}

/**
 * Input type for updating a social account
 * All fields optional (PATCH semantics)
 */
export interface UpdateSocialAccountInput {
  encrypted_access_token?: string;
  encrypted_refresh_token?: string;
  token_expires_at?: string;
}

// ============================================================================
// POST_DRAFTS TABLE TYPES
// ============================================================================

/**
 * Represents a draft post with content, platform targeting, and status
 * Supports multi-platform publishing and AI-generated tone hints
 */
export interface PostDraft {
  id: PostDraftId;
  user_id: UserId;
  content: string;
  platform: PlatformTarget;
  tone: PostTone | null;
  hashtags: string[] | null;
  status: PostStatus;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Input type for creating a new post draft
 * Excludes computed fields (id, created_at, updated_at)
 */
export interface CreatePostDraftInput {
  user_id: UserId;
  content: string;
  platform: PlatformTarget;
  tone?: PostTone;
  hashtags?: string[];
  status?: PostStatus;
}

/**
 * Input type for updating a post draft
 * All fields optional (PATCH semantics)
 */
export interface UpdatePostDraftInput {
  content?: string;
  platform?: PlatformTarget;
  tone?: PostTone | null;
  hashtags?: string[] | null;
  status?: PostStatus;
}

// ============================================================================
// PUBLISHED_POSTS TABLE TYPES
// ============================================================================

/**
 * Engagement metrics for a published post
 * Stores platform-agnostic metrics in JSONB format
 */
export interface EngagementMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
  reposts?: number;
  impressions?: number;
  clicks?: number;
  [key: string]: number | undefined;
}

/**
 * Represents a published post with engagement tracking
 * Links to source draft if available, stores platform-specific post ID
 */
export interface PublishedPost {
  id: PublishedPostId;
  draft_id: PostDraftId | null;
  user_id: UserId;
  platform: Platform;
  platform_post_id: string;
  content: string;
  published_at: string; // ISO 8601 timestamp
  engagement_metrics: EngagementMetrics | null;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Input type for creating a new published post record
 * Excludes computed fields (id, created_at, updated_at)
 */
export interface CreatePublishedPostInput {
  draft_id?: PostDraftId;
  user_id: UserId;
  platform: Platform;
  platform_post_id: string;
  content: string;
  published_at?: string;
  engagement_metrics?: EngagementMetrics;
}

/**
 * Input type for updating a published post
 * All fields optional (PATCH semantics)
 */
export interface UpdatePublishedPostInput {
  engagement_metrics?: EngagementMetrics;
}

// ============================================================================
// COMPOSITE/AGGREGATE TYPES
// ============================================================================

/**
 * Combined view of a user's social account and published posts
 * Useful for displaying account-specific analytics
 */
export interface SocialAccountWithPosts {
  account: SocialAccount;
  published_posts: PublishedPost[];
  post_count: number;
  total_engagement: number;
}

/**
 * Combined view of a draft with its published versions (if any)
 * Useful for tracking post lifecycle across platforms
 */
export interface PostDraftWithPublished {
  draft: PostDraft;
  published_posts: PublishedPost[];
  published_count: number;
}

/**
 * User's complete social media presence
 * Aggregates all accounts, drafts, and published posts
 */
export interface UserSocialPresence {
  user_id: UserId;
  accounts: SocialAccount[];
  drafts: PostDraft[];
  published_posts: PublishedPost[];
  stats: {
    connected_platforms: Platform[];
    total_drafts: number;
    published_count: number;
    total_engagement: number;
  };
}

// ============================================================================
// DATABASE QUERY FILTER TYPES
// ============================================================================

/**
 * Filter options for querying post drafts
 */
export interface PostDraftFilters {
  user_id?: UserId;
  platform?: PlatformTarget;
  tone?: PostTone;
  status?: PostStatus;
  created_after?: string;
  created_before?: string;
}

/**
 * Filter options for querying published posts
 */
export interface PublishedPostFilters {
  user_id?: UserId;
  platform?: Platform;
  published_after?: string;
  published_before?: string;
  limit?: number;
  offset?: number;
}

/**
 * Filter options for querying social accounts
 */
export interface SocialAccountFilters {
  user_id?: UserId;
  platform?: Platform;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Standard pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Database operation errors
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Token encryption/decryption errors
 */
export class TokenError extends DatabaseError {
  constructor(message: string, details?: unknown) {
    super(message, 'TOKEN_ERROR', details);
    this.name = 'TokenError';
  }
}

/**
 * Post validation errors
 */
export class PostValidationError extends DatabaseError {
  constructor(message: string, details?: unknown) {
    super(message, 'POST_VALIDATION_ERROR', details);
    this.name = 'PostValidationError';
  }
}
