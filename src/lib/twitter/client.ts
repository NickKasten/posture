// Twitter API v2 Client
// Implements tweet publishing with thread support, retry logic, and comprehensive error handling

import type {
  TwitterPublishResult,
  ThreadPublishResult,
  TwitterAPIError,
  TwitterAPIResponse,
  TwitterTweetData,
} from '@/types/twitter';

// API Configuration
export const TWITTER_API_BASE_URL = 'https://api.twitter.com';
export const MAX_TWEET_LENGTH = 280;
export const MAX_THREAD_LENGTH = 25; // Twitter's max thread length
export const MAX_RETRIES = 3;
export const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff in ms
export const RATE_LIMIT_WINDOW = 3 * 60 * 60 * 1000; // 3 hours in ms
export const RATE_LIMIT_MAX_TWEETS = 300; // 300 tweets per 3 hours

/**
 * Twitter API v2 Client
 *
 * Features:
 * - Single tweet publishing
 * - Thread publishing with auto-generation
 * - Automatic retry with exponential backoff
 * - Rate limit handling (429 errors)
 * - Token expiration handling (401 errors)
 * - Intelligent content splitting at sentence/word boundaries
 * - Thread numbering (1/5, 2/5, etc.)
 */
export class TwitterClient {
  private accessToken: string;
  private userId: string;

  constructor(accessToken: string, userId: string) {
    if (!accessToken) {
      throw new Error('Access token is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }
    this.accessToken = accessToken;
    this.userId = userId;
  }

  /**
   * Publish a single tweet to Twitter
   *
   * @param content - Tweet content (max 280 characters)
   * @returns TwitterPublishResult with tweet ID or error details
   */
  async publishTweet(content: string): Promise<TwitterPublishResult> {
    try {
      // 1. Validate content
      validateTweetContent(content);

      // 2. If content exceeds 280 chars, auto-generate thread
      if (content.length > MAX_TWEET_LENGTH) {
        const threadResult = await this.publishThread([content]);
        return {
          success: threadResult.success,
          tweet_id: threadResult.tweet_ids?.[0],
          error: threadResult.error,
          error_details: threadResult.error_details,
        };
      }

      // 3. Build request payload
      const payload = {
        text: content,
      };

      // 4. Make API request with retry logic
      const response = await this.retryWithBackoff(async () => {
        return await this.makeTwitterRequest('/2/tweets', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      });

      // 5. Parse response
      const data = (await response.json()) as TwitterAPIResponse;

      return {
        success: true,
        tweet_id: data.data.id,
      };
    } catch (error) {
      const twitterError = parseTwitterError(error);

      // Security: Never log tokens or user IDs
      console.error('Twitter tweet publish failed:', {
        code: twitterError.code,
        message: twitterError.message,
        status: twitterError.status,
      });

      return {
        success: false,
        error: twitterError,
      };
    }
  }

  /**
   * Publish a thread of tweets to Twitter
   *
   * @param contents - Array of tweet contents or single long content to split
   * @returns ThreadPublishResult with all tweet IDs or error details
   */
  async publishThread(contents: string[]): Promise<ThreadPublishResult> {
    try {
      // 1. Validate and process contents
      if (!contents || contents.length === 0) {
        throw new Error('Thread content cannot be empty');
      }

      // 2. Auto-split if single long content
      let tweetContents: string[];
      if (contents.length === 1 && contents[0].length > MAX_TWEET_LENGTH) {
        tweetContents = generateThreadFromContent(contents[0]);
      } else {
        tweetContents = contents;
      }

      // 3. Validate thread length
      if (tweetContents.length > MAX_THREAD_LENGTH) {
        throw new Error(
          `Thread exceeds maximum length of ${MAX_THREAD_LENGTH} tweets (current: ${tweetContents.length})`
        );
      }

      // 4. Validate each tweet
      tweetContents.forEach((content, index) => {
        validateTweetContent(content, `Tweet ${index + 1}`);
      });

      // 5. Add thread numbering if more than one tweet
      if (tweetContents.length > 1) {
        tweetContents = addThreadNumbering(tweetContents);
      }

      // 6. Publish tweets sequentially with reply chaining
      const tweetIds: string[] = [];
      let replyToId: string | undefined;

      for (let i = 0; i < tweetContents.length; i++) {
        const content = tweetContents[i];

        const payload: { text: string; reply?: { in_reply_to_tweet_id: string } } = {
          text: content,
        };

        // Chain to previous tweet if not the first one
        if (replyToId) {
          payload.reply = {
            in_reply_to_tweet_id: replyToId,
          };
        }

        // Make API request with retry logic
        const response = await this.retryWithBackoff(async () => {
          return await this.makeTwitterRequest('/2/tweets', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
        });

        const data = (await response.json()) as TwitterAPIResponse;
        const tweetId = data.data.id;

        tweetIds.push(tweetId);
        replyToId = tweetId; // Set for next tweet in thread

        // Small delay between tweets to avoid rate limiting
        if (i < tweetContents.length - 1) {
          await this.sleep(500);
        }
      }

      return {
        success: true,
        tweet_ids: tweetIds,
        thread_length: tweetIds.length,
      };
    } catch (error) {
      const twitterError = parseTwitterError(error);

      console.error('Twitter thread publish failed:', {
        code: twitterError.code,
        message: twitterError.message,
        status: twitterError.status,
      });

      return {
        success: false,
        error: twitterError,
      };
    }
  }

  /**
   * Make a request to Twitter API v2 with proper headers
   *
   * @param endpoint - API endpoint (e.g., '/2/tweets')
   * @param options - Fetch options
   * @returns Response object
   */
  private async makeTwitterRequest(
    endpoint: string,
    options: RequestInit
  ): Promise<Response> {
    const url = `${TWITTER_API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle HTTP errors
    if (!response.ok) {
      await this.handleHttpError(response);
    }

    return response;
  }

  /**
   * Handle HTTP errors from Twitter API
   */
  private async handleHttpError(response: Response): Promise<never> {
    const statusCode = response.status;
    let errorMessage = response.statusText;
    let errorCode = `HTTP_${statusCode}`;
    let errorType = 'about:blank';

    try {
      const errorData = await response.json();
      if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        errorMessage = errorData.errors[0].message || errorMessage;
        errorCode = errorData.errors[0].code || errorCode;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
        errorType = errorData.type || errorType;
        errorCode = errorData.title || errorCode;
      }
    } catch {
      // Failed to parse error response, use default message
    }

    const error: any = new Error(errorMessage);
    error.statusCode = statusCode;
    error.code = errorCode;
    error.type = errorType;

    // Handle specific error codes
    switch (statusCode) {
      case 401:
        error.message = 'Access token expired or invalid. Please re-authenticate.';
        error.code = 'TOKEN_EXPIRED';
        break;
      case 403:
        error.message = 'Forbidden. Check your Twitter API permissions and access level.';
        error.code = 'FORBIDDEN';
        break;
      case 429:
        // Extract retry-after header if available
        const retryAfter = response.headers.get('x-rate-limit-reset');
        error.message = retryAfter
          ? `Rate limit exceeded. Retry after ${new Date(parseInt(retryAfter) * 1000).toISOString()}`
          : 'Rate limit exceeded (300 tweets per 3 hours). Please try again later.';
        error.code = 'RATE_LIMIT_EXCEEDED';
        error.retryAfter = retryAfter;
        break;
      case 400:
        error.message = `Bad request: ${errorMessage}`;
        error.code = 'BAD_REQUEST';
        break;
      case 413:
        error.message = 'Tweet content too long. Maximum 280 characters.';
        error.code = 'CONTENT_TOO_LONG';
        break;
      case 422:
        error.message = `Unprocessable content: ${errorMessage}`;
        error.code = 'UNPROCESSABLE_CONTENT';
        break;
      case 500:
      case 502:
      case 503:
        error.message = 'Twitter API server error. Please try again later.';
        error.code = 'SERVER_ERROR';
        break;
    }

    throw error;
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

        // Check if it's a retryable error
        const err = error as any;
        const isRateLimitError = err.statusCode === 429;
        const isServerError = err.statusCode >= 500 && err.statusCode < 600;
        const isNetworkError = err.name === 'TypeError' || err.code === 'ECONNRESET';

        const isRetryable = isRateLimitError || isServerError || isNetworkError;

        if (!isRetryable || attempt === maxRetries - 1) {
          // Not retryable or final attempt - throw error
          throw error;
        }

        // Wait before retrying
        const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        console.warn(
          `Retryable error (${err.statusCode || 'network'}), retrying in ${delay}ms (attempt ${
            attempt + 1
          }/${maxRetries})`
        );

        await this.sleep(delay);
      }
    }

    // All retries exhausted
    throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Generate a thread from long content by splitting intelligently
 *
 * @param content - Long content to split into tweets
 * @returns Array of tweet contents
 */
export function generateThreadFromContent(content: string): string[] {
  if (content.length <= MAX_TWEET_LENGTH) {
    return [content];
  }

  const tweets: string[] = [];
  let remainingContent = content.trim();

  // Reserve space for thread numbering (e.g., " 1/10" = 5 chars)
  const maxTweetLen = MAX_TWEET_LENGTH - 6;

  while (remainingContent.length > 0) {
    if (remainingContent.length <= maxTweetLen) {
      tweets.push(remainingContent);
      break;
    }

    // Find optimal split point
    let splitPoint = maxTweetLen;

    // Try to split at sentence boundary (. ! ?)
    const sentenceEnd = findLastSentenceEnd(remainingContent, splitPoint);
    if (sentenceEnd !== -1 && sentenceEnd > maxTweetLen * 0.6) {
      splitPoint = sentenceEnd + 1;
    } else {
      // Try to split at word boundary
      const wordEnd = findLastWordBoundary(remainingContent, splitPoint);
      if (wordEnd !== -1 && wordEnd > maxTweetLen * 0.6) {
        splitPoint = wordEnd;
      }
    }

    // Extract tweet and update remaining content
    const tweetContent = remainingContent.substring(0, splitPoint).trim();
    tweets.push(tweetContent);
    remainingContent = remainingContent.substring(splitPoint).trim();
  }

  return tweets;
}

/**
 * Find the last sentence ending before a given position
 */
function findLastSentenceEnd(text: string, maxPos: number): number {
  const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
  let lastPos = -1;

  for (const ender of sentenceEnders) {
    const pos = text.lastIndexOf(ender, maxPos);
    if (pos > lastPos) {
      lastPos = pos + ender.length - 1;
    }
  }

  return lastPos;
}

/**
 * Find the last word boundary before a given position
 */
function findLastWordBoundary(text: string, maxPos: number): number {
  // Look for space, newline, or hyphen
  for (let i = maxPos - 1; i >= 0; i--) {
    const char = text[i];
    if (char === ' ' || char === '\n' || char === '-') {
      return i + 1;
    }
  }
  return -1;
}

/**
 * Add thread numbering to tweets (1/5, 2/5, etc.)
 *
 * @param tweets - Array of tweet contents
 * @returns Array of tweets with numbering added
 */
export function addThreadNumbering(tweets: string[]): string[] {
  if (tweets.length <= 1) {
    return tweets;
  }

  const total = tweets.length;
  return tweets.map((tweet, index) => {
    const number = `${index + 1}/${total}`;
    return `${tweet}\n\n${number}`;
  });
}

/**
 * Validate tweet content
 *
 * @param content - Tweet content to validate
 * @param label - Optional label for error messages
 * @throws Error if content is invalid
 */
export function validateTweetContent(content: string, label: string = 'Tweet'): void {
  if (!content || typeof content !== 'string') {
    throw new Error(`${label} content must be a non-empty string`);
  }

  if (content.trim().length === 0) {
    throw new Error(`${label} content cannot be empty or whitespace only`);
  }

  // Check length without thread numbering
  const contentWithoutNumbering = content.replace(/\n\n\d+\/\d+$/, '');
  if (contentWithoutNumbering.length > MAX_TWEET_LENGTH) {
    throw new Error(
      `${label} content exceeds maximum length of ${MAX_TWEET_LENGTH} characters (current: ${contentWithoutNumbering.length})`
    );
  }
}

/**
 * Parse Twitter API error into structured format
 *
 * @param error - Raw error object
 * @returns Structured Twitter error
 */
export function parseTwitterError(error: unknown): TwitterAPIError {
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
    message: err.message || 'An error occurred while publishing to Twitter',
    status: err.statusCode || err.status || 500,
    type: err.type,
    retryAfter: err.retryAfter,
  };
}
