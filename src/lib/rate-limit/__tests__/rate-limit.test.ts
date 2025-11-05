/**
 * Rate Limiting Tests
 *
 * Tests for Upstash Redis rate limiting infrastructure
 */

import { NextResponse } from 'next/server';
import { addRateLimitHeaders } from '../middleware';
import { RATE_LIMITS } from '../config';
import type { Ratelimit } from '@upstash/ratelimit';

// Mock Upstash ratelimit
jest.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: jest.fn().mockImplementation(() => ({
      limit: jest.fn(),
      slidingWindow: jest.fn(),
    })),
  };
});

jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({})),
  };
});

// Helper to create mock rate limiter
function createMockRateLimiter(mockResponse: {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}) {
  return {
    limit: jest.fn().mockResolvedValue(mockResponse),
  } as unknown as Ratelimit;
}

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addRateLimitHeaders', () => {
    it('should add rate limit headers to response', () => {
      // Create a basic Response object (no NextResponse.json in test environment)
      const response = new NextResponse(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      const metadata = {
        limit: 10,
        remaining: 5,
        reset: Date.now() + 60000,
        resetDate: new Date(Date.now() + 60000).toISOString(),
      };

      const result = addRateLimitHeaders(response, metadata);

      expect(result.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(result.headers.get('X-RateLimit-Remaining')).toBe('5');
      expect(result.headers.get('X-RateLimit-Reset')).toBe(metadata.reset.toString());
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should have correct configuration for auth endpoints', () => {
      const { RATE_LIMITS } = require('../config');

      expect(RATE_LIMITS.AUTH.requests).toBe(5);
      expect(RATE_LIMITS.AUTH.window).toBe('1 m');
      expect(RATE_LIMITS.AUTH.prefix).toBe('ratelimit:auth');
    });

    it('should have correct configuration for AI endpoints', () => {
      const { RATE_LIMITS } = require('../config');

      expect(RATE_LIMITS.AI.requests).toBe(10);
      expect(RATE_LIMITS.AI.window).toBe('1 h');
      expect(RATE_LIMITS.AI.prefix).toBe('ratelimit:ai');
    });

    it('should have correct configuration for publish endpoints', () => {
      const { RATE_LIMITS } = require('../config');

      expect(RATE_LIMITS.PUBLISH.requests).toBe(20);
      expect(RATE_LIMITS.PUBLISH.window).toBe('1 h');
      expect(RATE_LIMITS.PUBLISH.prefix).toBe('ratelimit:publish');
    });

    it('should have correct configuration for general API endpoints', () => {
      const { RATE_LIMITS } = require('../config');

      expect(RATE_LIMITS.API_GENERAL.requests).toBe(100);
      expect(RATE_LIMITS.API_GENERAL.window).toBe('1 h');
      expect(RATE_LIMITS.API_GENERAL.prefix).toBe('ratelimit:general');
    });

    it('should have correct configuration for GitHub endpoints', () => {
      const { RATE_LIMITS } = require('../config');

      expect(RATE_LIMITS.GITHUB_ACTIVITY.requests).toBe(30);
      expect(RATE_LIMITS.GITHUB_ACTIVITY.window).toBe('1 h');
      expect(RATE_LIMITS.GITHUB_ACTIVITY.prefix).toBe('ratelimit:github');
    });
  });

  describe('Mock Rate Limiter', () => {
    it('should create mock rate limiter correctly', () => {
      const mockResponse = {
        success: true,
        limit: 10,
        remaining: 5,
        reset: Date.now() + 60000,
      };

      const mockRateLimiter = createMockRateLimiter(mockResponse);

      expect(mockRateLimiter.limit).toBeDefined();
      expect(typeof mockRateLimiter.limit).toBe('function');
    });
  });

  describe('Environment Validation', () => {
    it('should validate required environment variables', () => {
      const originalEnv = process.env;

      // Test missing URL
      process.env = { ...originalEnv };
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const { validateRateLimitEnv } = require('../config');

      expect(() => validateRateLimitEnv()).toThrow(
        /Missing required environment variables/
      );

      // Restore
      process.env = originalEnv;
    });
  });
});
