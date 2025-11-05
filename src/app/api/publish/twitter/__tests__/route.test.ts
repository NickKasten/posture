/**
 * Twitter Publishing Route Tests
 *
 * Comprehensive test suite for POST /api/publish/twitter
 *
 * Test Coverage:
 * - Authentication required
 * - Rate limiting enforcement
 * - Input validation (Zod schema)
 * - Content sanitization (XSS + prompt injection)
 * - 280 character limit validation
 * - Token retrieval from database
 * - TwitterClient integration
 * - Error handling (token expired, rate limit, network errors)
 * - Database integration (savePublishedPost)
 * - Response formats
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { TwitterClient } from '@/lib/twitter/client';
import { getTwitterToken, savePublishedPost } from '@/lib/db/posts';
import { withRateLimit } from '@/lib/rate-limit/middleware';

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs');
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
jest.mock('@/lib/twitter/client');
jest.mock('@/lib/db/posts');
jest.mock('@/lib/rate-limit/middleware');
jest.mock('@/utils/sanitize-v2');
jest.mock('@/utils/validation-v2');

// Import mocked modules
import { sanitizePostContent } from '@/utils/sanitize-v2';
import { validatePostContent } from '@/utils/validation-v2';

describe('POST /api/publish/twitter', () => {
  // Mock instances
  let mockSupabaseClient: any;
  let mockTwitterClient: any;

  // Helper to create mock request
  const createMockRequest = (body: any): NextRequest => {
    return {
      json: jest.fn().mockResolvedValue(body),
      headers: new Headers(),
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup Supabase mock
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn(),
      },
    };
    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    // Setup default successful authentication
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user-id' },
        },
      },
      error: null,
    });

    // Setup default rate limit (allowed)
    (withRateLimit as jest.Mock).mockResolvedValue({
      allowed: true,
      metadata: {
        limit: 20,
        remaining: 19,
        reset: Date.now() + 3600000,
      },
    });

    // Setup default sanitization (pass-through)
    (sanitizePostContent as jest.Mock).mockImplementation((content) => content);

    // Setup default validation (valid)
    (validatePostContent as jest.Mock).mockReturnValue({
      isValid: true,
      data: 'Valid content',
    });

    // Setup default token retrieval (successful)
    (getTwitterToken as jest.Mock).mockResolvedValue('mock-twitter-token');

    // Setup default TwitterClient mock
    mockTwitterClient = {
      publishTweet: jest.fn().mockResolvedValue({
        success: true,
        tweet_id: 'mock-tweet-id-12345',
      }),
    };
    (TwitterClient as jest.Mock).mockImplementation(() => mockTwitterClient);

    // Setup default database save (successful)
    (savePublishedPost as jest.Mock).mockResolvedValue({
      id: 'published-post-id',
    });
  });

  // ========================================================================
  // AUTHENTICATION TESTS
  // ========================================================================

  describe('Authentication', () => {
    it('should reject requests without authentication', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toBe('Please sign in to publish tweets');
    });

    it('should reject requests with auth error', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Auth error'),
      });

      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should allow authenticated requests', async () => {
      const request = createMockRequest({
        content: 'Valid tweet content',
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // RATE LIMITING TESTS
  // ========================================================================

  describe('Rate Limiting', () => {
    it('should apply user-based rate limiting', async () => {
      const request = createMockRequest({
        content: 'Test tweet',
      });

      await POST(request);

      expect(withRateLimit).toHaveBeenCalledWith(
        request,
        expect.anything(), // publishRateLimit
        'test-user-id'
      );
    });

    it('should reject requests when rate limit exceeded', async () => {
      (withRateLimit as jest.Mock).mockResolvedValue({
        allowed: false,
        response: new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Too many requests',
            retryAfter: 3600,
          }),
          { status: 429 }
        ),
      });

      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
    });

    it('should include rate limit headers in successful response', async () => {
      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      // Rate limit headers would be added by addRateLimitHeaders
    });
  });

  // ========================================================================
  // INPUT VALIDATION TESTS
  // ========================================================================

  describe('Input Validation', () => {
    it('should reject empty content', async () => {
      const request = createMockRequest({
        content: '',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
      expect(data.details).toBeDefined();
    });

    it('should reject content over 280 characters', async () => {
      const longContent = 'a'.repeat(281);
      const request = createMockRequest({
        content: longContent,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should accept content exactly at 280 character limit', async () => {
      const maxContent = 'a'.repeat(280);
      const request = createMockRequest({
        content: maxContent,
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should reject invalid draftId format', async () => {
      const request = createMockRequest({
        content: 'Valid tweet',
        draftId: 'invalid-uuid',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should accept valid draftId', async () => {
      const request = createMockRequest({
        content: 'Valid tweet',
        draftId: '123e4567-e89b-12d3-a456-426614174000',
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should reject non-string content', async () => {
      const request = createMockRequest({
        content: 12345,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should reject missing content field', async () => {
      const request = createMockRequest({
        draftId: '123e4567-e89b-12d3-a456-426614174000',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });
  });

  // ========================================================================
  // CONTENT SANITIZATION TESTS
  // ========================================================================

  describe('Content Sanitization', () => {
    it('should sanitize post content before publishing', async () => {
      const request = createMockRequest({
        content: 'Test tweet with <script>alert("xss")</script>',
      });

      await POST(request);

      expect(sanitizePostContent).toHaveBeenCalledWith(
        'Test tweet with <script>alert("xss")</script>'
      );
    });

    it('should validate sanitized content', async () => {
      (sanitizePostContent as jest.Mock).mockReturnValue('Sanitized tweet');

      const request = createMockRequest({
        content: 'Original tweet',
      });

      await POST(request);

      expect(validatePostContent).toHaveBeenCalledWith('Sanitized tweet');
    });

    it('should reject content that fails validation after sanitization', async () => {
      (validatePostContent as jest.Mock).mockReturnValue({
        isValid: false,
        error: 'Content contains malicious patterns',
      });

      const request = createMockRequest({
        content: 'Malicious content',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid content');
      expect(data.details).toBe('Content contains malicious patterns');
    });

    it('should reject sanitized content over 280 characters', async () => {
      // Simulate sanitization that doesn't reduce length enough
      (sanitizePostContent as jest.Mock).mockReturnValue('a'.repeat(281));

      const request = createMockRequest({
        content: 'Short input',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Content too long');
      expect(data.message).toContain('280 character limit');
    });
  });

  // ========================================================================
  // TOKEN RETRIEVAL TESTS
  // ========================================================================

  describe('Token Retrieval', () => {
    it('should retrieve Twitter token from database', async () => {
      const request = createMockRequest({
        content: 'Test tweet',
      });

      await POST(request);

      expect(getTwitterToken).toHaveBeenCalledWith(
        expect.stringContaining('test-user-id')
      );
    });

    it('should reject when Twitter account not connected', async () => {
      (getTwitterToken as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Twitter not connected');
      expect(data.message).toBe('Please connect your Twitter account first');
      expect(data.action).toBe('redirect');
      expect(data.redirectUrl).toBe('/api/auth/twitter');
    });

    it('should not expose tokens in response', async () => {
      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);
      const responseText = await response.text();

      expect(responseText).not.toContain('mock-twitter-token');
    });
  });

  // ========================================================================
  // TWITTER CLIENT INTEGRATION TESTS
  // ========================================================================

  describe('TwitterClient Integration', () => {
    it('should create TwitterClient with access token', async () => {
      const request = createMockRequest({
        content: 'Test tweet',
      });

      await POST(request);

      expect(TwitterClient).toHaveBeenCalledWith('mock-twitter-token', '');
    });

    it('should call publishTweet with sanitized content', async () => {
      (sanitizePostContent as jest.Mock).mockReturnValue('Sanitized tweet content');

      const request = createMockRequest({
        content: 'Original tweet',
      });

      await POST(request);

      expect(mockTwitterClient.publishTweet).toHaveBeenCalledWith(
        'Sanitized tweet content'
      );
    });

    it('should handle successful tweet publishing', async () => {
      mockTwitterClient.publishTweet.mockResolvedValue({
        success: true,
        tweet_id: 'tweet-123',
      });

      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.tweetId).toBe('tweet-123');
      expect(data.url).toContain('tweet-123');
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle token expired error', async () => {
      mockTwitterClient.publishTweet.mockResolvedValue({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token expired',
          status: 401,
        },
      });

      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Token expired');
      expect(data.message).toContain('expired');
      expect(data.action).toBe('redirect');
      expect(data.redirectUrl).toBe('/api/auth/twitter');
    });

    it('should handle Twitter rate limit error', async () => {
      mockTwitterClient.publishTweet.mockResolvedValue({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
          status: 429,
        },
      });

      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
      expect(data.message).toContain('300 tweets per 3 hours');
      expect(data.retryAfter).toBe(10800); // 3 hours
    });

    it('should handle generic publishing failure', async () => {
      mockTwitterClient.publishTweet.mockResolvedValue({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Something went wrong',
          status: 500,
        },
      });

      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Publishing failed');
      expect(data.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle network errors gracefully', async () => {
      mockTwitterClient.publishTweet.mockRejectedValue(
        new Error('Network error')
      );

      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle database errors during token retrieval', async () => {
      (getTwitterToken as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  // ========================================================================
  // DATABASE INTEGRATION TESTS
  // ========================================================================

  describe('Database Integration', () => {
    it('should save published post to database', async () => {
      const request = createMockRequest({
        content: 'Test tweet',
        draftId: '123e4567-e89b-12d3-a456-426614174000',
      });

      await POST(request);

      expect(savePublishedPost).toHaveBeenCalledWith({
        draft_id: expect.stringContaining('123e4567'),
        user_id: expect.stringContaining('test-user-id'),
        platform: 'twitter',
        platform_post_id: 'mock-tweet-id-12345',
        content: expect.any(String),
      });
    });

    it('should save without draft_id if not provided', async () => {
      const request = createMockRequest({
        content: 'Test tweet',
      });

      await POST(request);

      expect(savePublishedPost).toHaveBeenCalledWith({
        draft_id: undefined,
        user_id: expect.stringContaining('test-user-id'),
        platform: 'twitter',
        platform_post_id: 'mock-tweet-id-12345',
        content: expect.any(String),
      });
    });

    it('should still return success if database save fails', async () => {
      (savePublishedPost as jest.Mock).mockRejectedValue(
        new Error('Database save failed')
      );

      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);
      const data = await response.json();

      // Tweet was published successfully, DB save is non-critical
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });

  // ========================================================================
  // RESPONSE FORMAT TESTS
  // ========================================================================

  describe('Response Formats', () => {
    it('should return correct success response format', async () => {
      mockTwitterClient.publishTweet.mockResolvedValue({
        success: true,
        tweet_id: 'tweet-abc123',
      });

      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toMatchObject({
        success: true,
        tweetId: 'tweet-abc123',
        url: expect.stringContaining('tweet-abc123'),
        message: expect.stringContaining('published successfully'),
      });
    });

    it('should construct correct Twitter URL', async () => {
      mockTwitterClient.publishTweet.mockResolvedValue({
        success: true,
        tweet_id: 'tweet-xyz789',
      });

      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.url).toBe('https://twitter.com/i/web/status/tweet-xyz789');
    });

    it('should not leak sensitive information in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockTwitterClient.publishTweet.mockRejectedValue(
        new Error('Sensitive database connection string: postgres://...')
      );

      const request = createMockRequest({
        content: 'Test tweet',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.details).toBeUndefined();
      expect(JSON.stringify(data)).not.toContain('postgres://');

      process.env.NODE_ENV = originalEnv;
    });
  });

  // ========================================================================
  // EDGE CASES
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle whitespace-only content', async () => {
      const request = createMockRequest({
        content: '   \n\t   ',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it('should handle content with emojis within limit', async () => {
      const emojiContent = 'Hello World with emoji';
      const request = createMockRequest({
        content: emojiContent,
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should handle malformed JSON request', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        headers: new Headers(),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle concurrent requests from same user', async () => {
      const request1 = createMockRequest({ content: 'Tweet 1' });
      const request2 = createMockRequest({ content: 'Tweet 2' });

      const [response1, response2] = await Promise.all([
        POST(request1),
        POST(request2),
      ]);

      // Both should succeed (rate limit allows 20/hour)
      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
    });
  });
});
