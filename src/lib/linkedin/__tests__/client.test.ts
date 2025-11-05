// LinkedIn Client Unit Tests

import {
  LinkedInClient,
  buildPostPayload,
  validatePostContent,
  parseLinkedInError,
  MAX_POST_LENGTH,
  LINKEDIN_API_BASE_URL,
  LINKEDIN_API_VERSION,
} from '../client';

// Mock fetch globally
global.fetch = jest.fn();

describe('LinkedInClient', () => {
  let client: LinkedInClient;
  const mockAccessToken = 'mock-access-token';
  const mockPersonId = 'ABC123';

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    client = new LinkedInClient(mockAccessToken, mockPersonId);
  });

  describe('constructor', () => {
    it('should throw error if access token is not provided', () => {
      expect(() => new LinkedInClient('')).toThrow('Access token is required');
    });

    it('should create client with access token and person ID', () => {
      const client = new LinkedInClient(mockAccessToken, mockPersonId);
      expect(client).toBeInstanceOf(LinkedInClient);
    });

    it('should create client with only access token', () => {
      const client = new LinkedInClient(mockAccessToken);
      expect(client).toBeInstanceOf(LinkedInClient);
    });
  });

  describe('publishPost', () => {
    it('should successfully publish a post', async () => {
      const mockContent = 'This is a test LinkedIn post! #testing #linkedin';
      const mockPostId = 'urn:li:share:123456789';

      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: mockPostId }),
      });

      const result = await client.publishPost(mockContent);

      expect(result.success).toBe(true);
      expect(result.post_id).toBe(mockPostId);
      expect(result.error).toBeUndefined();

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `${LINKEDIN_API_BASE_URL}/rest/posts`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': LINKEDIN_API_VERSION,
            'X-Restli-Protocol-Version': '2.0.0',
          }),
          body: expect.any(String),
        })
      );
    });

    it('should handle content length validation error', async () => {
      const longContent = 'a'.repeat(MAX_POST_LENGTH + 1);

      const result = await client.publishPost(longContent);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('exceeds maximum length');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle empty content validation error', async () => {
      const result = await client.publishPost('   ');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('cannot be empty');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch person ID if not provided', async () => {
      const clientWithoutPersonId = new LinkedInClient(mockAccessToken);
      const mockContent = 'Test post';
      const mockPostId = 'urn:li:share:123456789';

      // Mock userinfo endpoint
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ sub: `urn:li:person:${mockPersonId}` }),
      });

      // Mock post publish endpoint
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: mockPostId }),
      });

      const result = await clientWithoutPersonId.publishPost(mockContent);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2); // Once for userinfo, once for post
    });
  });

  describe('error handling', () => {
    it('should handle 401 unauthorized error', async () => {
      const mockContent = 'Test post';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'invalid_token', error_description: 'Token expired' }),
      });

      const result = await client.publishPost(mockContent);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.status).toBe(401);
      expect(result.error?.code).toBe('TOKEN_EXPIRED');
      expect(result.error?.message).toContain('expired or invalid');
    });

    it('should handle 403 forbidden error', async () => {
      const mockContent = 'Test post';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'insufficient_permissions' }),
      });

      const result = await client.publishPost(mockContent);

      expect(result.success).toBe(false);
      expect(result.error?.status).toBe(403);
      expect(result.error?.code).toBe('FORBIDDEN');
    });

    it('should handle 400 bad request error', async () => {
      const mockContent = 'Test post';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Invalid post format' }),
      });

      const result = await client.publishPost(mockContent);

      expect(result.success).toBe(false);
      expect(result.error?.status).toBe(400);
      expect(result.error?.code).toBe('BAD_REQUEST');
    });

    it('should handle 500 server error', async () => {
      const mockContent = 'Test post';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      const result = await client.publishPost(mockContent);

      expect(result.success).toBe(false);
      expect(result.error?.status).toBe(500);
      expect(result.error?.code).toBe('SERVER_ERROR');
    });
  });

  describe('rate limit handling with retry', () => {
    it('should retry on 429 rate limit and eventually succeed', async () => {
      const mockContent = 'Test post';
      const mockPostId = 'urn:li:share:123456789';

      // Mock 429 error twice, then success
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: async () => ({ error: 'rate_limit_exceeded' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: async () => ({ error: 'rate_limit_exceeded' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({ id: mockPostId }),
        });

      // Speed up the test by reducing wait time
      jest.useFakeTimers();

      const resultPromise = client.publishPost(mockContent);

      // Fast-forward through retry delays
      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.post_id).toBe(mockPostId);
      expect(global.fetch).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });

    it('should fail after max retries on 429 rate limit', async () => {
      const mockContent = 'Test post';

      // Mock 429 error for all retries
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'rate_limit_exceeded' }),
      });

      jest.useFakeTimers();

      const resultPromise = client.publishPost(mockContent);

      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error?.status).toBe(429);
      expect(result.error?.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries

      jest.useRealTimers();
    });
  });

  describe('getPersonId', () => {
    it('should fetch and return person ID', async () => {
      const client = new LinkedInClient(mockAccessToken);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          sub: `urn:li:person:${mockPersonId}`,
          name: 'Test User',
          given_name: 'Test',
          family_name: 'User',
        }),
      });

      const personId = await client.getPersonId();

      expect(personId).toBe(mockPersonId);
      expect(global.fetch).toHaveBeenCalledWith(
        `${LINKEDIN_API_BASE_URL}/v2/userinfo`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
          }),
        })
      );
    });

    it('should throw error on failed userinfo request', async () => {
      const client = new LinkedInClient(mockAccessToken);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(client.getPersonId()).rejects.toThrow('Unable to get LinkedIn person ID');
    });
  });
});

describe('buildPostPayload', () => {
  it('should build correct post payload', () => {
    const content = 'Test post content';
    const personId = 'ABC123';

    const payload = buildPostPayload(content, personId);

    expect(payload).toEqual({
      author: 'urn:li:person:ABC123',
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
    });
  });
});

describe('validatePostContent', () => {
  it('should validate correct content', () => {
    expect(() => validatePostContent('Valid post content')).not.toThrow();
  });

  it('should throw error for empty content', () => {
    expect(() => validatePostContent('')).toThrow('must be a non-empty string');
  });

  it('should throw error for whitespace-only content', () => {
    expect(() => validatePostContent('   ')).toThrow('cannot be empty');
  });

  it('should throw error for non-string content', () => {
    expect(() => validatePostContent(null as any)).toThrow('must be a non-empty string');
    expect(() => validatePostContent(undefined as any)).toThrow('must be a non-empty string');
    expect(() => validatePostContent(123 as any)).toThrow('must be a non-empty string');
  });

  it('should throw error for content exceeding max length', () => {
    const longContent = 'a'.repeat(MAX_POST_LENGTH + 1);
    expect(() => validatePostContent(longContent)).toThrow('exceeds maximum length');
  });

  it('should accept content at exactly max length', () => {
    const maxContent = 'a'.repeat(MAX_POST_LENGTH);
    expect(() => validatePostContent(maxContent)).not.toThrow();
  });
});

describe('parseLinkedInError', () => {
  it('should parse error with all fields', () => {
    const error = {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded',
      statusCode: 429,
    };

    const parsed = parseLinkedInError(error);

    expect(parsed.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(parsed.message).toBe('Rate limit exceeded');
    expect(parsed.status).toBe(429);
  });

  it('should handle error with missing fields', () => {
    const error = {
      message: 'Something went wrong',
    };

    const parsed = parseLinkedInError(error);

    expect(parsed.message).toBe('Something went wrong');
    expect(parsed.code).toBe('UNKNOWN_ERROR');
    expect(parsed.status).toBe(500);
  });

  it('should handle null or undefined error', () => {
    const parsedNull = parseLinkedInError(null);
    expect(parsedNull.code).toBe('UNKNOWN_ERROR');
    expect(parsedNull.status).toBe(500);

    const parsedUndefined = parseLinkedInError(undefined);
    expect(parsedUndefined.code).toBe('UNKNOWN_ERROR');
    expect(parsedUndefined.status).toBe(500);
  });

  it('should handle Error object', () => {
    const error = new Error('Network error');
    (error as any).statusCode = 503;

    const parsed = parseLinkedInError(error);

    expect(parsed.message).toBe('Network error');
    expect(parsed.status).toBe(503);
  });
});
