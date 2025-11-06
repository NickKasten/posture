// LinkedIn API Client Wrapper
// Implements modern Posts API with retry logic and comprehensive error handling

import type {
  PublishResult,
  LinkedInError,
  LinkedInPostResponse,
  LinkedInUserInfo,
  LinkedInPostPayload,
} from '@/types/linkedin';

// API Configuration
export const LINKEDIN_API_BASE_URL = 'https://api.linkedin.com';
export const LINKEDIN_API_VERSION = '202511';
export const MAX_POST_LENGTH = 3000;
export const MAX_RETRIES = 3;
export const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff in ms

/**
 * LinkedIn API Client
 *
 * Features:
 * - Post publishing with modern REST API
 * - Automatic retry with exponential backoff
 * - Rate limit handling (429 errors)
 * - Token expiration handling (401 errors)
 * - Comprehensive error handling
 */
export class LinkedInClient {
  private accessToken: string;
  private personId: string | null = null;

  constructor(accessToken: string, personId?: string) {
    if (!accessToken) {
      throw new Error('Access token is required');
    }
    this.accessToken = accessToken;
    this.personId = personId || null;
  }

  /**
   * Publish a post to LinkedIn
   *
   * @param content - Post content (max 3,000 characters)
   * @returns PublishResult with post ID or error details
   */
  async publishPost(content: string): Promise<PublishResult> {
    try {
      // 1. Validate content
      validatePostContent(content);

      // 2. Get person ID if not cached
      if (!this.personId) {
        this.personId = await this.getPersonId();
      }

      // 3. Build request payload
      const payload = buildPostPayload(content, this.personId);

      // 4. Make API request with retry logic
      const response = await this.retryWithBackoff(async () => {
        const res = await fetch(`${LINKEDIN_API_BASE_URL}/rest/posts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': LINKEDIN_API_VERSION,
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify(payload),
        });

        // Handle HTTP errors
        if (!res.ok) {
          await this.handleHttpError(res);
        }

        return res;
      });

      // 5. Parse response
      const data: LinkedInPostResponse = await response.json();

      return {
        success: true,
        post_id: data.id,
      };

    } catch (error) {
      const linkedInError = parseLinkedInError(error);

      console.error('LinkedIn post publish failed:', linkedInError);

      return {
        success: false,
        error: linkedInError.message,
        error_details: linkedInError,
      };
    }
  }

  /**
   * Get the authenticated user's person ID
   *
   * @returns Person ID in URN format (e.g., "ABC123")
   */
  async getPersonId(): Promise<string> {
    try {
      const response = await fetch(`${LINKEDIN_API_BASE_URL}/v2/userinfo`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get person ID: ${response.status} ${response.statusText}`);
      }

      const data: LinkedInUserInfo = await response.json();

      // Extract person ID from URN (e.g., "urn:li:person:ABC123" -> "ABC123")
      const personId = data.sub.replace('urn:li:person:', '');

      // Cache for future use
      this.personId = personId;

      return personId;

    } catch (error) {
      console.error('Failed to fetch person ID:', error);
      throw new Error(`Unable to get LinkedIn person ID: ${(error as Error).message}`);
    }
  }

  /**
   * Retry a function with exponential backoff
   *
   * @param fn - Async function to retry
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @returns Result from the function
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Check if it's a retryable error (429 rate limit)
        const isRateLimitError = (error as any).statusCode === 429;

        if (!isRateLimitError || attempt === maxRetries - 1) {
          // Not retryable or final attempt - throw error
          throw error;
        }

        // Wait before retrying
        const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        console.warn(
          `Rate limit hit (429), retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
        );

        await this.sleep(delay);
      }
    }

    // All retries exhausted
    throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Handle HTTP errors from LinkedIn API
   */
  private async handleHttpError(response: Response): Promise<never> {
    const statusCode = response.status;
    let errorMessage = response.statusText;
    let errorCode = `HTTP_${statusCode}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error_description || errorMessage;
      errorCode = errorData.code || errorData.error || errorCode;
    } catch {
      // Failed to parse error response, use default message
    }

    const error: any = new Error(errorMessage);
    error.statusCode = statusCode;
    error.code = errorCode;

    // Handle specific error codes
    switch (statusCode) {
      case 401:
        error.message = 'Access token expired or invalid. Please re-authenticate.';
        error.code = 'TOKEN_EXPIRED';
        break;
      case 403:
        error.message = 'Forbidden. Check your LinkedIn API permissions.';
        error.code = 'FORBIDDEN';
        break;
      case 429:
        error.message = 'Rate limit exceeded. Please try again later.';
        error.code = 'RATE_LIMIT_EXCEEDED';
        break;
      case 400:
        error.message = `Bad request: ${errorMessage}`;
        error.code = 'BAD_REQUEST';
        break;
      case 500:
      case 502:
      case 503:
        error.message = 'LinkedIn API server error. Please try again later.';
        error.code = 'SERVER_ERROR';
        break;
    }

    throw error;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Build LinkedIn post payload
 *
 * @param content - Post content text
 * @param personId - LinkedIn person ID (without URN prefix)
 * @returns Properly formatted post payload
 */
export function buildPostPayload(content: string, personId: string): LinkedInPostPayload {
  return {
    author: `urn:li:person:${personId}`,
    commentary: {
      text: content,
    },
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
  };
}

/**
 * Validate post content
 *
 * @param content - Post content to validate
 * @throws Error if content is invalid
 */
export function validatePostContent(content: string): void {
  if (!content || typeof content !== 'string') {
    throw new Error('Post content must be a non-empty string');
  }

  if (content.trim().length === 0) {
    throw new Error('Post content cannot be empty or whitespace only');
  }

  if (content.length > MAX_POST_LENGTH) {
    throw new Error(
      `Post content exceeds maximum length of ${MAX_POST_LENGTH} characters (current: ${content.length})`
    );
  }
}

/**
 * Parse LinkedIn API error into structured format
 *
 * @param error - Raw error object
 * @returns Structured LinkedIn error
 */
export function parseLinkedInError(error: unknown): LinkedInError {
  if (!error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      status: 500,
    };
  }

  const err = error as any;

  return {
    code: err.code || 'UNKNOWN_ERROR',
    message: err.message || 'An error occurred while publishing to LinkedIn',
    status: err.statusCode || err.status || 500,
  };
}
