// TypeScript types for Twitter/X OAuth 2.0 with PKCE and Posts API
// Supporting OAuth 2.0 + PKCE flow with Twitter API v2

// ============================================================================
// OAUTH 2.0 TYPES
// ============================================================================

/**
 * Twitter OAuth 2.0 authorization parameters
 * Used to construct the authorization URL with PKCE
 */
export interface TwitterAuthParams {
  response_type: 'code';
  client_id: string;
  redirect_uri: string;
  scope: string; // Space-separated: "tweet.read tweet.write users.read"
  state: string; // CSRF protection token
  code_challenge: string; // PKCE challenge
  code_challenge_method: 'S256'; // SHA-256 hash
}

/**
 * Twitter OAuth 2.0 token exchange response
 * Returned when exchanging authorization code for access token
 */
export interface TwitterTokenResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number; // Seconds until expiration (typically 7200 = 2 hours)
  scope: string; // Space-separated granted scopes
  refresh_token: string; // Used to refresh expired access tokens
}

/**
 * Twitter API v2 User response
 * Retrieved from /2/users/me endpoint after authentication
 */
export interface TwitterUser {
  id: string; // Twitter user ID (unique identifier)
  name: string; // Display name
  username: string; // Twitter handle (@username)
  created_at?: string;
  description?: string;
  profile_image_url?: string;
  verified?: boolean;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
}

/**
 * Twitter OAuth error response
 * Returned on authorization or token exchange failure
 */
export interface TwitterOAuthError {
  error: string;
  error_description?: string;
}

/**
 * Twitter API v2 error response
 * Standard error format for Twitter API v2
 */
export interface TwitterAPIErrorResponse {
  title: string;
  detail: string;
  type: string;
  status: number;
}

// ============================================================================
// PKCE TYPES
// ============================================================================

/**
 * PKCE challenge pair
 * Code verifier and its SHA-256 hashed challenge
 */
export interface PKCEChallenge {
  codeVerifier: string; // Random string (43-128 chars)
  codeChallenge: string; // Base64URL-encoded SHA-256 hash of verifier
}

// ============================================================================
// INTERNAL APPLICATION TYPES
// ============================================================================

/**
 * Stored Twitter account data in database
 * Maps to social_accounts table with platform='twitter'
 */
export interface TwitterAccountData {
  user_id: string; // Supabase auth.uid()
  platform: 'twitter';
  twitter_user_id: string; // From TwitterUser.id
  encrypted_access_token: string; // AES-256 encrypted
  encrypted_refresh_token: string; // AES-256 encrypted
  token_expires_at: string; // ISO 8601 timestamp
  created_at: string;
  updated_at: string;
}

/**
 * Twitter OAuth state parameter payload
 * Encoded as secure random string for CSRF protection
 */
export interface TwitterOAuthState {
  nonce: string; // Random string for CSRF validation
  timestamp: number; // Creation time for expiry check
  redirect_url?: string; // Optional post-auth redirect destination
}

/**
 * Tweet publishing request
 * Simplified interface for application use
 */
export interface PublishTweetRequest {
  text: string; // Tweet content (max 280 chars for non-premium)
  reply_settings?: 'everyone' | 'mentionedUsers' | 'following';
}

/**
 * Tweet publishing result
 * Returned from internal tweet publishing service
 */
export interface PublishTweetResult {
  success: boolean;
  tweet_id?: string; // Twitter tweet ID
  error?: string;
  error_details?: TwitterAPIError;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if response is a Twitter OAuth error
 */
export function isTwitterOAuthError(
  response: unknown
): response is TwitterOAuthError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as TwitterOAuthError).error === 'string'
  );
}

/**
 * Type guard to check if response is a Twitter API error
 */
export function isTwitterAPIError(
  response: unknown
): response is TwitterAPIError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    'title' in response &&
    typeof (response as TwitterAPIError).status === 'number'
  );
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Twitter OAuth 2.0 endpoints
 */
export const TWITTER_OAUTH_ENDPOINTS = {
  AUTHORIZATION: 'https://twitter.com/i/oauth2/authorize',
  TOKEN: 'https://api.twitter.com/2/oauth2/token',
  REVOKE: 'https://api.twitter.com/2/oauth2/revoke',
} as const;

/**
 * Twitter API v2 endpoints
 */
export const TWITTER_API_ENDPOINTS = {
  USERS_ME: 'https://api.twitter.com/2/users/me',
  TWEETS: 'https://api.twitter.com/2/tweets',
} as const;

/**
 * Twitter OAuth scopes
 * See: https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code
 */
export const TWITTER_SCOPES = {
  // Read user profile and tweets
  TWEET_READ: 'tweet.read',
  // Create and manage tweets
  TWEET_WRITE: 'tweet.write',
  // Read user information
  USERS_READ: 'users.read',
  // Access to read tweet metrics (requires approval)
  TWEET_MODERATE_WRITE: 'tweet.moderate.write',
  // Offline access (long-lived refresh tokens)
  OFFLINE_ACCESS: 'offline.access',
} as const;

/**
 * Default scope string for Twitter OAuth
 */
export const TWITTER_DEFAULT_SCOPES = [
  TWITTER_SCOPES.TWEET_READ,
  TWITTER_SCOPES.TWEET_WRITE,
  TWITTER_SCOPES.USERS_READ,
  TWITTER_SCOPES.OFFLINE_ACCESS, // Important: enables refresh tokens
].join(' ');

/**
 * Twitter token lifespan (2 hours in seconds)
 */
export const TWITTER_TOKEN_LIFESPAN_SECONDS = 7200; // 2 hours

/**
 * PKCE code verifier length constraints
 * Must be between 43-128 characters
 */
export const PKCE_CODE_VERIFIER_LENGTH = 64; // Safe middle ground

// ============================================================================
// TWITTER CLIENT TYPES (Publishing & Threads)
// ============================================================================

/**
 * Twitter API v2 tweet response
 * Returned when creating a tweet
 */
export interface TwitterAPIResponse {
  data: TwitterTweetData;
}

/**
 * Twitter tweet data
 */
export interface TwitterTweetData {
  id: string; // Tweet ID
  text: string; // Tweet content
  edit_history_tweet_ids?: string[];
}

/**
 * Twitter API error response (extended)
 * Includes additional fields for client error handling
 */
export interface TwitterAPIError {
  code: string;
  message: string;
  status: number;
  type?: string;
  retryAfter?: string; // Unix timestamp for rate limit reset
}

/**
 * Single tweet publish result
 * Returned from TwitterClient.publishTweet()
 */
export interface TwitterPublishResult {
  success: boolean;
  tweet_id?: string;
  error?: TwitterAPIError;
  error_details?: TwitterAPIError; // Backward compatibility
}

/**
 * Thread publish result
 * Returned from TwitterClient.publishThread()
 */
export interface ThreadPublishResult {
  success: boolean;
  tweet_ids?: string[]; // Array of tweet IDs in thread order
  thread_length?: number; // Number of tweets in thread
  error?: TwitterAPIError;
  error_details?: TwitterAPIError; // Backward compatibility
}

/**
 * Twitter rate limit info
 * Extracted from response headers
 */
export interface TwitterRateLimitInfo {
  limit: number; // Total requests allowed in window
  remaining: number; // Requests remaining
  reset: number; // Unix timestamp when limit resets
}

// ============================================================================
// TWITTER ERROR CODES
// ============================================================================

/**
 * Twitter API error codes used by client
 */
export const TWITTER_ERROR_CODES = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CONTENT_TOO_LONG: 'CONTENT_TOO_LONG',
  FORBIDDEN: 'FORBIDDEN',
  BAD_REQUEST: 'BAD_REQUEST',
  SERVER_ERROR: 'SERVER_ERROR',
  UNPROCESSABLE_CONTENT: 'UNPROCESSABLE_CONTENT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type TwitterErrorCode = (typeof TWITTER_ERROR_CODES)[keyof typeof TWITTER_ERROR_CODES];
