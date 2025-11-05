/**
 * Twitter Client Tests
 * Comprehensive test suite for TwitterClient with thread support
 */

import {
  TwitterClient,
  generateThreadFromContent,
  addThreadNumbering,
  validateTweetContent,
  parseTwitterError,
  MAX_TWEET_LENGTH,
  MAX_THREAD_LENGTH,
} from '../client';
import type { TwitterAPIResponse } from '@/types/twitter';

// Mock fetch globally
global.fetch = jest.fn();

describe('TwitterClient', () => {
  let client: TwitterClient;
  const mockAccessToken = 'mock_access_token_12345';
  const mockUserId = 'mock_user_id_67890';

  beforeEach(() => {
    client = new TwitterClient(mockAccessToken, mockUserId);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with valid credentials', () => {
      expect(() => new TwitterClient(mockAccessToken, mockUserId)).not.toThrow();
    });

    it('should throw error if access token is missing', () => {
      expect(() => new TwitterClient('', mockUserId)).toThrow('Access token is required');
    });

    it('should throw error if user ID is missing', () => {
      expect(() => new TwitterClient(mockAccessToken, '')).toThrow('User ID is required');
    });
  });

  describe('publishTweet', () => {
    it('should publish a single tweet successfully', async () => {
      const mockResponse: TwitterAPIResponse = {
        data: {
          id: '1234567890',
          text: 'Hello Twitter!',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.publishTweet('Hello Twitter!');

      expect(result.success).toBe(true);
      expect(result.tweet_id).toBe('1234567890');
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.twitter.com/2/tweets',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ text: 'Hello Twitter!' }),
        })
      );
    });

    it('should auto-generate thread for content exceeding 280 characters', async () => {
      const longContent = 'A'.repeat(500);

      // Mock multiple responses for thread
      const mockTweetIds = Array.from({ length: 3 }, (_, i) => `tweet_${i + 1}`);
      mockTweetIds.forEach((id) => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id, text: 'Part of thread' } }),
        });
      });

      const result = await client.publishTweet(longContent);

      expect(result.success).toBe(true);
      expect(result.tweet_id).toBe('tweet_1'); // Returns first tweet ID
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle empty content error', async () => {
      const result = await client.publishTweet('');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.error?.message).toContain('empty');
    });

    it('should handle whitespace-only content error', async () => {
      const result = await client.publishTweet('   \n  ');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.error?.message).toContain('whitespace');
    });

    it('should handle 401 token expired error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: {
          get: () => null,
        },
        json: async () => ({
          errors: [{ message: 'Invalid token', code: 'invalid_token' }],
        }),
      });

      const result = await client.publishTweet('Test tweet');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TOKEN_EXPIRED');
      expect(result.error?.message).toContain('expired or invalid');
      expect(result.error?.status).toBe(401);
    });

    it('should handle 429 rate limit error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          get: (name: string) => (name === 'x-rate-limit-reset' ? '1704067200' : null),
        },
        json: async () => ({
          errors: [{ message: 'Rate limit exceeded', code: 'rate_limit' }],
        }),
      });

      const result = await client.publishTweet('Test tweet');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.error?.message).toContain('Rate limit exceeded');
      expect(result.error?.status).toBe(429);
    });

    it('should handle 403 forbidden error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: {
          get: () => null,
        },
        json: async () => ({
          errors: [{ message: 'Forbidden', code: 'forbidden' }],
        }),
      });

      const result = await client.publishTweet('Test tweet');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FORBIDDEN');
      expect(result.error?.status).toBe(403);
    });

    it('should handle 500 server error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: () => null,
        },
        json: async () => ({}),
      });

      const result = await client.publishTweet('Test tweet');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVER_ERROR');
      expect(result.error?.status).toBe(500);
    });

    it('should retry on 429 rate limit error', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: { get: () => null },
          json: async () => ({ errors: [{ message: 'Rate limit', code: 'rate_limit' }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: { get: () => null },
          json: async () => ({ errors: [{ message: 'Rate limit', code: 'rate_limit' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: '999', text: 'Success!' } }),
        });

      const result = await client.publishTweet('Test tweet');

      expect(result.success).toBe(true);
      expect(result.tweet_id).toBe('999');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      // Mock all 3 retry attempts with rate limit errors
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: { get: () => null },
          json: async () => ({ errors: [{ message: 'Rate limit', code: 'rate_limit' }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: { get: () => null },
          json: async () => ({ errors: [{ message: 'Rate limit', code: 'rate_limit' }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: { get: () => null },
          json: async () => ({ errors: [{ message: 'Rate limit', code: 'rate_limit' }] }),
        });

      const result = await client.publishTweet('Test tweet');

      expect(result.success).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(3); // All 3 retries
    });

    it('should retry on 502 server error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 502,
          statusText: 'Bad Gateway',
          headers: {
            get: () => null,
          },
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: '888', text: 'Success after retry!' } }),
        });

      const result = await client.publishTweet('Test tweet');

      expect(result.success).toBe(true);
      expect(result.tweet_id).toBe('888');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('publishThread', () => {
    it('should publish a thread successfully', async () => {
      const tweets = ['Tweet 1', 'Tweet 2', 'Tweet 3'];

      const mockResponses = [
        { ok: true, json: async () => ({ data: { id: '111', text: 'Tweet 1\n\n1/3' } }) },
        { ok: true, json: async () => ({ data: { id: '222', text: 'Tweet 2\n\n2/3' } }) },
        { ok: true, json: async () => ({ data: { id: '333', text: 'Tweet 3\n\n3/3' } }) },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1])
        .mockResolvedValueOnce(mockResponses[2]);

      const result = await client.publishThread(tweets);

      expect(result.success).toBe(true);
      expect(result.tweet_ids).toEqual(['111', '222', '333']);
      expect(result.thread_length).toBe(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);

      // Verify reply chaining
      const calls = (global.fetch as jest.Mock).mock.calls;
      expect(JSON.parse(calls[0][1].body)).not.toHaveProperty('reply');
      expect(JSON.parse(calls[1][1].body)).toHaveProperty('reply', {
        in_reply_to_tweet_id: '111',
      });
      expect(JSON.parse(calls[2][1].body)).toHaveProperty('reply', {
        in_reply_to_tweet_id: '222',
      });
    });

    it('should auto-split long content into thread', async () => {
      const longContent = 'A'.repeat(500);

      const mockResponses = [
        { ok: true, json: async () => ({ data: { id: '111', text: 'Part 1' } }) },
        { ok: true, json: async () => ({ data: { id: '222', text: 'Part 2' } }) },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);

      const result = await client.publishThread([longContent]);

      expect(result.success).toBe(true);
      expect(result.tweet_ids).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle single short content as single tweet', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: '999', text: 'Short tweet' } }),
      });

      const result = await client.publishThread(['Short tweet']);

      expect(result.success).toBe(true);
      expect(result.tweet_ids).toEqual(['999']);
      expect(result.thread_length).toBe(1);
    });

    it('should add thread numbering for multiple tweets', async () => {
      const tweets = ['First', 'Second'];

      const mockResponses = [
        { ok: true, json: async () => ({ data: { id: '111', text: 'First\n\n1/2' } }) },
        { ok: true, json: async () => ({ data: { id: '222', text: 'Second\n\n2/2' } }) },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);

      const result = await client.publishThread(tweets);

      expect(result.success).toBe(true);

      // Check that numbering was added to request bodies
      const calls = (global.fetch as jest.Mock).mock.calls;
      expect(JSON.parse(calls[0][1].body).text).toContain('1/2');
      expect(JSON.parse(calls[1][1].body).text).toContain('2/2');
    });

    it('should handle empty array error', async () => {
      const result = await client.publishThread([]);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('empty');
    });

    it('should handle thread exceeding max length', async () => {
      const tweets = Array(30).fill('Tweet');

      const result = await client.publishThread(tweets);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('maximum length of 25');
    });

    it('should handle partial thread failure', async () => {
      const tweets = ['Tweet 1', 'Tweet 2'];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: '111', text: 'Tweet 1' } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Rate limit',
          headers: {
            get: () => null,
          },
          json: async () => ({ errors: [{ message: 'Rate limit', code: 'rate_limit' }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Rate limit',
          headers: {
            get: () => null,
          },
          json: async () => ({ errors: [{ message: 'Rate limit', code: 'rate_limit' }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Rate limit',
          headers: {
            get: () => null,
          },
          json: async () => ({ errors: [{ message: 'Rate limit', code: 'rate_limit' }] }),
        });

      const result = await client.publishThread(tweets);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should add delays between thread tweets', async () => {
      const tweets = ['Tweet 1', 'Tweet 2'];
      const sleepSpy = jest.spyOn(client as any, 'sleep');

      const mockResponses = [
        { ok: true, json: async () => ({ data: { id: '111', text: 'Tweet 1' } }) },
        { ok: true, json: async () => ({ data: { id: '222', text: 'Tweet 2' } }) },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);

      await client.publishThread(tweets);

      expect(sleepSpy).toHaveBeenCalledWith(500);
      expect(sleepSpy).toHaveBeenCalledTimes(1); // Only between tweets, not after last one
    });
  });

  describe('generateThreadFromContent', () => {
    it('should return single tweet for short content', () => {
      const content = 'Short tweet';
      const result = generateThreadFromContent(content);

      expect(result).toEqual([content]);
    });

    it('should split long content into multiple tweets', () => {
      const content = 'A'.repeat(500);
      const result = generateThreadFromContent(content);

      expect(result.length).toBeGreaterThan(1);
      result.forEach((tweet) => {
        expect(tweet.length).toBeLessThanOrEqual(MAX_TWEET_LENGTH - 6); // Reserve for numbering
      });
    });

    it('should split at sentence boundaries', () => {
      const content =
        'First sentence is here. Second sentence goes on for a while and contains lots of words to make it longer and exceed the limit. Third sentence is short but the previous one should have already exceeded our maximum tweet length allowed by the platform which is 280 characters. So this content definitely needs to be split up into multiple tweets for the thread.';
      const result = generateThreadFromContent(content);

      expect(result.length).toBeGreaterThan(1);
      // Each tweet should be under the limit
      result.forEach((tweet) => {
        expect(tweet.length).toBeLessThanOrEqual(MAX_TWEET_LENGTH - 6);
      });
    });

    it('should split at word boundaries when no sentence end available', () => {
      const longWord = 'A'.repeat(150);
      const content = `${longWord} ${longWord} ${longWord}`;
      const result = generateThreadFromContent(content);

      expect(result.length).toBeGreaterThan(1);
      result.forEach((tweet) => {
        expect(tweet.length).toBeLessThanOrEqual(MAX_TWEET_LENGTH - 6);
      });
    });

    it('should preserve all content when splitting', () => {
      const content =
        'This is a very long piece of content that needs to be split into multiple tweets because it exceeds the maximum tweet length of 280 characters. It should be split intelligently at sentence or word boundaries to maintain readability. The content should be preserved exactly without any loss of information.';
      const result = generateThreadFromContent(content);

      const reconstructed = result.join(' ').replace(/\s+/g, ' ').trim();
      const original = content.replace(/\s+/g, ' ').trim();

      expect(reconstructed).toBe(original);
    });

    it('should handle content with newlines', () => {
      const content = 'Line 1\nLine 2\n' + 'A'.repeat(300);
      const result = generateThreadFromContent(content);

      expect(result.length).toBeGreaterThan(1);
      expect(result[0]).toContain('Line 1');
    });
  });

  describe('addThreadNumbering', () => {
    it('should add numbering to multiple tweets', () => {
      const tweets = ['First', 'Second', 'Third'];
      const result = addThreadNumbering(tweets);

      expect(result).toEqual(['First\n\n1/3', 'Second\n\n2/3', 'Third\n\n3/3']);
    });

    it('should not add numbering to single tweet', () => {
      const tweets = ['Single tweet'];
      const result = addThreadNumbering(tweets);

      expect(result).toEqual(tweets);
    });

    it('should handle empty array', () => {
      const result = addThreadNumbering([]);

      expect(result).toEqual([]);
    });

    it('should add correct numbering for long threads', () => {
      const tweets = Array(10).fill('Tweet');
      const result = addThreadNumbering(tweets);

      expect(result[0]).toContain('1/10');
      expect(result[9]).toContain('10/10');
    });
  });

  describe('validateTweetContent', () => {
    it('should pass for valid content', () => {
      expect(() => validateTweetContent('Valid tweet')).not.toThrow();
    });

    it('should throw for empty string', () => {
      expect(() => validateTweetContent('')).toThrow('non-empty string');
    });

    it('should throw for whitespace only', () => {
      expect(() => validateTweetContent('   \n  ')).toThrow('whitespace only');
    });

    it('should throw for non-string content', () => {
      expect(() => validateTweetContent(123 as any)).toThrow('non-empty string');
    });

    it('should throw for content exceeding 280 characters', () => {
      const longContent = 'A'.repeat(300);
      expect(() => validateTweetContent(longContent)).toThrow('maximum length');
    });

    it('should use custom label in error messages', () => {
      try {
        validateTweetContent('', 'Custom Label');
      } catch (error: any) {
        expect(error.message).toContain('Custom Label');
      }
    });

    it('should ignore thread numbering when validating length', () => {
      const content = 'A'.repeat(270) + '\n\n1/5';
      expect(() => validateTweetContent(content)).not.toThrow();
    });
  });

  describe('parseTwitterError', () => {
    it('should parse error with all fields', () => {
      const error = {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
        statusCode: 429,
        type: 'about:rate-limit',
        retryAfter: '1704067200',
      };

      const result = parseTwitterError(error);

      expect(result).toEqual({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
        status: 429,
        type: 'about:rate-limit',
        retryAfter: '1704067200',
      });
    });

    it('should handle error with minimal fields', () => {
      const error = {
        message: 'Something went wrong',
      };

      const result = parseTwitterError(error);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('Something went wrong');
      expect(result.status).toBe(500);
    });

    it('should handle null/undefined error', () => {
      const result = parseTwitterError(null);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.status).toBe(500);
    });

    it('should use status field if statusCode not available', () => {
      const error = {
        status: 404,
        message: 'Not found',
      };

      const result = parseTwitterError(error);

      expect(result.status).toBe(404);
    });
  });

  describe('edge cases', () => {
    it('should handle network errors', async () => {
      // Mock all 3 retry attempts with network errors
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'));

      const result = await client.publishTweet('Test tweet');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Network error');
    });

    it('should handle malformed JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await client.publishTweet('Test tweet');

      expect(result.success).toBe(false);
    });

    it('should handle very long thread', async () => {
      const content = 'A'.repeat(5000);

      const mockTweetIds = Array.from({ length: 20 }, (_, i) => `${i + 1}`);
      mockTweetIds.forEach((id) => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id, text: 'Tweet' } }),
        });
      });

      const result = await client.publishThread([content]);

      expect(result.success).toBe(true);
      expect(result.tweet_ids?.length).toBeGreaterThan(10);
    }, 15000); // 15 second timeout for long thread

    it('should handle special characters in content', async () => {
      const specialContent = 'Hello 👋 World! #test @user https://example.com 🚀';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: '123', text: specialContent } }),
      });

      const result = await client.publishTweet(specialContent);

      expect(result.success).toBe(true);
    });

    it('should handle content with only emojis', async () => {
      const emojiContent = '🚀🌟✨🎉🎊';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: '456', text: emojiContent } }),
      });

      const result = await client.publishTweet(emojiContent);

      expect(result.success).toBe(true);
    });
  });
});
