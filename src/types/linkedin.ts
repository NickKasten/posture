// TypeScript types for LinkedIn OAuth 2.1 and Posts API
// Supporting PKCE flow with modern LinkedIn API v2

// ============================================================================
// OAUTH 2.1 TYPES
// ============================================================================

/**
 * LinkedIn OAuth 2.1 authorization parameters
 * Used to construct the authorization URL with PKCE
 */
export interface LinkedInAuthParams {
  client_id: string;
  redirect_uri: string;
  response_type: 'code';
  scope: string; // Space-separated: "w_member_social email openid profile"
  state: string; // CSRF protection token
  code_challenge: string; // PKCE challenge
  code_challenge_method: 'S256'; // SHA-256 hash
}

/**
 * LinkedIn OAuth 2.1 token exchange response
 * Returned when exchanging authorization code for access token
 */
export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number; // Seconds until expiration (typically 5184000 = 60 days)
  scope: string; // Space-separated granted scopes
  token_type: 'Bearer';
  refresh_token?: string; // Not provided for member tokens
}

/**
 * LinkedIn OpenID Connect UserInfo response
 * Retrieved from /v2/userinfo endpoint after authentication
 */
export interface LinkedInUserInfo {
  sub: string; // LinkedIn member ID (unique identifier)
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  locale?: string | {
    country: string;
    language: string;
  };
}

/**
 * LinkedIn OAuth error response
 * Returned on authorization or token exchange failure
 */
export interface LinkedInOAuthError {
  error: string;
  error_description?: string;
}

// ============================================================================
// POSTS API TYPES (LinkedIn v2 REST API)
// ============================================================================

/**
 * LinkedIn Posts API request payload
 * POST /rest/posts
 * Headers: LinkedIn-Version: 202511, X-Restli-Protocol-Version: 2.0.0
 */
export interface LinkedInPostRequest {
  author: string; // URN format: "urn:li:person:{member_id}"
  commentary: string; // Post text content
  visibility: 'PUBLIC' | 'CONNECTIONS';
  distribution: {
    feedDistribution: 'MAIN_FEED' | 'NONE';
    targetEntities?: string[]; // Optional: target specific audiences
    thirdPartyDistributionChannels?: string[];
  };
  lifecycleState?: 'PUBLISHED' | 'DRAFT';
  isReshareDisabledByAuthor?: boolean;
}

/**
 * LinkedIn Posts API response
 * Returns created post ID and status
 */
export interface LinkedInPostResponse {
  id: string; // Post URN: "urn:li:share:{share_id}"
  author: string;
  commentary: string;
  visibility: string;
  distribution: {
    feedDistribution: string;
  };
  lifecycleState: string;
  created: {
    actor: string;
    time: number; // Unix timestamp in milliseconds
  };
  lastModified: {
    actor: string;
    time: number;
  };
}

/**
 * LinkedIn API error response
 * Standard error format for LinkedIn REST API
 */
export interface LinkedInAPIError {
  status: number;
  code?: string;
  message: string;
  serviceErrorCode?: number;
}

// ============================================================================
// INTERNAL APPLICATION TYPES
// ============================================================================

/**
 * Stored LinkedIn account data in database
 * Maps to social_accounts table with platform='linkedin'
 */
export interface LinkedInAccountData {
  user_id: string; // Supabase auth.uid()
  platform: 'linkedin';
  linkedin_member_id: string; // From UserInfo.sub
  encrypted_access_token: string; // AES-256 encrypted
  token_expires_at: string; // ISO 8601 timestamp
  created_at: string;
  updated_at: string;
}

/**
 * LinkedIn OAuth state parameter payload
 * Encoded as JWT or encrypted JSON for CSRF protection
 */
export interface LinkedInOAuthState {
  nonce: string; // Random string for CSRF validation
  timestamp: number; // Creation time for expiry check
  redirect_url?: string; // Optional post-auth redirect destination
}

/**
 * Post publishing request to LinkedIn
 * Simplified interface for application use
 */
export interface PublishLinkedInPostRequest {
  content: string;
  visibility?: 'PUBLIC' | 'CONNECTIONS';
  disableReshare?: boolean;
}

/**
 * Post publishing result
 * Returned from internal post publishing service
 */
export interface PublishLinkedInPostResult {
  success: boolean;
  post_id?: string; // LinkedIn post URN
  platform_post_id?: string; // Extracted ID (without URN prefix)
  error?: string;
  error_details?: LinkedInAPIError;
}

// Backward compatibility aliases
export type PublishResult = PublishLinkedInPostResult;
export type LinkedInError = LinkedInAPIError;
export type LinkedInUserInfoResponse = LinkedInUserInfo;
export interface LinkedInPostPayload {
  author: string;
  commentary: {
    text: string;
  };
  visibility: string;
  distribution: {
    feedDistribution: string;
    targetEntities: string[];
    thirdPartyDistributionChannels: string[];
  };
  lifecycleState: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if response is a LinkedIn OAuth error
 */
export function isLinkedInOAuthError(
  response: unknown
): response is LinkedInOAuthError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as LinkedInOAuthError).error === 'string'
  );
}

/**
 * Type guard to check if response is a LinkedIn API error
 */
export function isLinkedInAPIError(
  response: unknown
): response is LinkedInAPIError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    'message' in response &&
    typeof (response as LinkedInAPIError).status === 'number'
  );
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * LinkedIn OAuth 2.1 endpoints
 */
export const LINKEDIN_OAUTH_ENDPOINTS = {
  AUTHORIZATION: 'https://www.linkedin.com/oauth/v2/authorization',
  TOKEN: 'https://www.linkedin.com/oauth/v2/accessToken',
  USERINFO: 'https://api.linkedin.com/v2/userinfo',
} as const;

/**
 * LinkedIn Posts API endpoints
 */
export const LINKEDIN_API_ENDPOINTS = {
  POSTS: 'https://api.linkedin.com/rest/posts',
  MEMBER: 'https://api.linkedin.com/v2/me',
} as const;

/**
 * Required LinkedIn API headers
 */
export const LINKEDIN_API_HEADERS = {
  LINKEDIN_VERSION: '202511',
  RESTLI_PROTOCOL_VERSION: '2.0.0',
} as const;

/**
 * LinkedIn OAuth scopes
 */
export const LINKEDIN_SCOPES = {
  // Core posting scope (OPEN - no Partner Program approval needed)
  POST: 'w_member_social',
  // OpenID Connect scopes for user identity
  EMAIL: 'email',
  OPENID: 'openid',
  PROFILE: 'profile',
} as const;

/**
 * Default scope string for LinkedIn OAuth
 */
export const LINKEDIN_DEFAULT_SCOPES = [
  LINKEDIN_SCOPES.POST,
  LINKEDIN_SCOPES.EMAIL,
  LINKEDIN_SCOPES.OPENID,
  LINKEDIN_SCOPES.PROFILE,
].join(' ');

/**
 * LinkedIn token lifespan (60 days in seconds)
 */
export const LINKEDIN_TOKEN_LIFESPAN_SECONDS = 5184000; // 60 days

/**
 * PKCE code verifier length constraints
 * Must be between 43-128 characters
 */
export const PKCE_CODE_VERIFIER_LENGTH = 64; // Safe middle ground
