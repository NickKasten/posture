// Comprehensive tests for error framework and handler

import { NextRequest, NextResponse } from 'next/server';
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  RateLimitError,
  TokenError,
  ExternalAPIError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  CSRFError,
  PKCEError,
  ConfigurationError,
} from '../framework';
import { handleAPIError, handleRedirectError } from '../handler';

// Mock NextResponse.json to work in test environment
jest.mock('next/server', () => {
  const actualNext = jest.requireActual('next/server');
  return {
    ...actualNext,
    NextResponse: {
      ...actualNext.NextResponse,
      json: jest.fn((body: any, init: any) => {
        const headersMap = new Map<string, string>();
        const response = {
          status: init?.status || 200,
          headers: {
            set: (key: string, value: string) => headersMap.set(key, value),
            get: (key: string) => headersMap.get(key) || null,
          },
          json: async () => body,
        } as any;
        return response;
      }),
      redirect: jest.fn((url: string | URL) => {
        const urlString = typeof url === 'string' ? url : url.toString();
        const response = {
          status: 307,
          headers: {
            get: (key: string) => (key === 'location' ? urlString : null),
          },
        } as any;
        return response;
      }),
    },
  };
});

// Mock console methods to avoid noise in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe('Error Framework', () => {
  describe('AppError Base Class', () => {
    it('creates error with all properties', () => {
      const error = new AppError(
        'Test error message',
        'TEST_ERROR_CODE',
        400,
        { field: 'value' }
      );

      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('TEST_ERROR_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'value' });
      expect(error.timestamp).toBeTruthy();
      expect(error.name).toBe('AppError');
    });

    it('captures stack trace', () => {
      const error = new AppError('Test', 'TEST', 400);
      expect(error.stack).toBeTruthy();
      expect(error.stack).toContain('AppError');
    });

    it('converts to JSON in production mode (no details)', () => {
      const error = new AppError('Test error', 'TEST_CODE', 400, {
        sensitive: 'data',
      });

      const json = error.toJSON(false);

      expect(json.error).toBe('Test error');
      expect(json.code).toBe('TEST_CODE');
      expect(json.statusCode).toBe(400);
      expect(json.timestamp).toBeTruthy();
      expect(json.details).toBeUndefined();
    });

    it('converts to JSON in development mode (with details)', () => {
      const error = new AppError('Test error', 'TEST_CODE', 400, {
        field: 'value',
      });

      const json = error.toJSON(true);

      expect(json.error).toBe('Test error');
      expect(json.code).toBe('TEST_CODE');
      expect(json.statusCode).toBe(400);
      expect(json.timestamp).toBeTruthy();
      expect(json.details).toEqual({ field: 'value' });
    });

    it('sanitizes sensitive fields in details', () => {
      const error = new AppError('Test error', 'TEST_CODE', 400, {
        username: 'john',
        access_token: 'secret_token_123',
        password: 'secret_password',
        api_key: 'secret_key',
        normal_field: 'normal_value',
      });

      const json = error.toJSON(true);
      const details = json.details as Record<string, string>;

      expect(details.username).toBe('john');
      expect(details.access_token).toBe('[REDACTED]');
      expect(details.password).toBe('[REDACTED]');
      expect(details.api_key).toBe('[REDACTED]');
      expect(details.normal_field).toBe('normal_value');
    });

    it('sanitizes refresh_token field', () => {
      const error = new AppError('Test', 'TEST', 400, {
        refresh_token: 'secret_refresh_token',
      });

      const json = error.toJSON(true);
      const details = json.details as Record<string, string>;

      expect(details.refresh_token).toBe('[REDACTED]');
    });

    it('sanitizes code_verifier and code_challenge', () => {
      const error = new AppError('Test', 'TEST', 400, {
        code_verifier: 'secret_verifier',
        code_challenge: 'secret_challenge',
      });

      const json = error.toJSON(true);
      const details = json.details as Record<string, string>;

      expect(details.code_verifier).toBe('[REDACTED]');
      expect(details.code_challenge).toBe('[REDACTED]');
    });

    it('handles non-object details', () => {
      const error1 = new AppError('Test', 'TEST', 400, 'string details');
      const json1 = error1.toJSON(true);
      expect(json1.details).toBe('string details');

      const error2 = new AppError('Test', 'TEST', 400, 123);
      const json2 = error2.toJSON(true);
      expect(json2.details).toBe(123);

      const error3 = new AppError('Test', 'TEST', 400, null);
      const json3 = error3.toJSON(true);
      expect(json3.details).toBeNull();
    });
  });

  describe('AuthenticationError', () => {
    it('creates error with default message', () => {
      const error = new AuthenticationError();

      expect(error.message).toBe('Authentication required');
      expect(error.code).toBe('AUTHENTICATION_REQUIRED');
      expect(error.statusCode).toBe(401);
    });

    it('creates error with custom message', () => {
      const error = new AuthenticationError('Please log in');

      expect(error.message).toBe('Please log in');
      expect(error.code).toBe('AUTHENTICATION_REQUIRED');
      expect(error.statusCode).toBe(401);
    });

    it('includes details', () => {
      const error = new AuthenticationError('Auth failed', {
        reason: 'expired_session',
      });

      expect(error.details).toEqual({ reason: 'expired_session' });
    });
  });

  describe('AuthorizationError', () => {
    it('creates error with default message', () => {
      const error = new AuthorizationError();

      expect(error.message).toBe('Access forbidden');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
    });

    it('creates error with custom message', () => {
      const error = new AuthorizationError('Insufficient permissions');

      expect(error.message).toBe('Insufficient permissions');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('ValidationError', () => {
    it('creates error with default message', () => {
      const error = new ValidationError();

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
    });

    it('creates error with validation details', () => {
      const error = new ValidationError('Invalid input', {
        fields: ['email', 'password'],
        errors: ['Email is required', 'Password too short'],
      });

      expect(error.details).toEqual({
        fields: ['email', 'password'],
        errors: ['Email is required', 'Password too short'],
      });
    });
  });

  describe('RateLimitError', () => {
    it('creates error with default message', () => {
      const error = new RateLimitError();

      expect(error.message).toBe('Too many requests');
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.statusCode).toBe(429);
    });

    it('creates error with retry after', () => {
      const error = new RateLimitError('Rate limit exceeded', {
        retryAfter: 60,
        limit: 100,
      });

      expect(error.details).toEqual({
        retryAfter: 60,
        limit: 100,
      });
    });
  });

  describe('TokenError', () => {
    it('creates error with default message', () => {
      const error = new TokenError();

      expect(error.message).toBe('Invalid or expired token');
      expect(error.code).toBe('TOKEN_ERROR');
      expect(error.statusCode).toBe(401);
    });

    it('creates error with token details', () => {
      const error = new TokenError('Token expired', {
        expiredAt: '2024-01-01T00:00:00Z',
      });

      expect(error.message).toBe('Token expired');
      expect(error.details).toEqual({
        expiredAt: '2024-01-01T00:00:00Z',
      });
    });
  });

  describe('ExternalAPIError', () => {
    it('creates error with service name', () => {
      const error = new ExternalAPIError('LinkedIn', 'LinkedIn API error');

      expect(error.message).toBe('LinkedIn API error');
      expect(error.code).toBe('EXTERNAL_API_ERROR');
      expect(error.statusCode).toBe(502);
      expect(error.service).toBe('LinkedIn');
    });

    it('creates error with default message', () => {
      const error = new ExternalAPIError('Twitter');

      expect(error.message).toBe('External service error');
      expect(error.service).toBe('Twitter');
    });

    it('includes service in JSON output', () => {
      const error = new ExternalAPIError('GitHub', 'API failed', {
        status: 503,
      });

      const json = error.toJSON(true);

      expect(json.service).toBe('GitHub');
      expect(json.details).toEqual({ status: 503 });
    });
  });

  describe('NotFoundError', () => {
    it('creates error with resource name', () => {
      const error = new NotFoundError('User');

      expect(error.message).toBe('User not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });

    it('creates error with custom message', () => {
      const error = new NotFoundError('Post', 'The requested post does not exist');

      expect(error.message).toBe('The requested post does not exist');
      expect(error.statusCode).toBe(404);
    });

    it('creates error with default resource', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Resource not found');
    });
  });

  describe('ConflictError', () => {
    it('creates error with default message', () => {
      const error = new ConflictError();

      expect(error.message).toBe('Resource conflict');
      expect(error.code).toBe('CONFLICT');
      expect(error.statusCode).toBe(409);
    });

    it('creates error with custom message', () => {
      const error = new ConflictError('User already exists');

      expect(error.message).toBe('User already exists');
    });
  });

  describe('DatabaseError', () => {
    it('creates error with default message', () => {
      const error = new DatabaseError();

      expect(error.message).toBe('Database operation failed');
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.statusCode).toBe(500);
    });

    it('creates error with details', () => {
      const error = new DatabaseError('Query timeout', {
        query: 'SELECT * FROM users',
        timeout: 5000,
      });

      expect(error.message).toBe('Query timeout');
      expect(error.details).toEqual({
        query: 'SELECT * FROM users',
        timeout: 5000,
      });
    });
  });

  describe('CSRFError', () => {
    it('creates error with default message', () => {
      const error = new CSRFError();

      expect(error.message).toBe('CSRF validation failed');
      expect(error.code).toBe('CSRF_VALIDATION_FAILED');
      expect(error.statusCode).toBe(400);
    });

    it('creates error with custom message', () => {
      const error = new CSRFError('Invalid state parameter');

      expect(error.message).toBe('Invalid state parameter');
    });
  });

  describe('PKCEError', () => {
    it('creates error with default message', () => {
      const error = new PKCEError();

      expect(error.message).toBe('PKCE validation failed');
      expect(error.code).toBe('PKCE_VALIDATION_FAILED');
      expect(error.statusCode).toBe(400);
    });

    it('creates error with custom message', () => {
      const error = new PKCEError('Missing code verifier');

      expect(error.message).toBe('Missing code verifier');
    });
  });

  describe('ConfigurationError', () => {
    it('creates error with default message', () => {
      const error = new ConfigurationError();

      expect(error.message).toBe('Server configuration error');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.statusCode).toBe(500);
    });

    it('creates error with custom message', () => {
      const error = new ConfigurationError('Missing API key', {
        variable: 'LINKEDIN_CLIENT_ID',
      });

      expect(error.message).toBe('Missing API key');
      expect(error.details).toEqual({ variable: 'LINKEDIN_CLIENT_ID' });
    });
  });
});

describe('Error Handler', () => {
  // Store original NODE_ENV
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('handleAPIError', () => {
    it('handles AppError with correct status code', async () => {
      const error = new ValidationError('Invalid email');
      const response = handleAPIError(error);

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe('Invalid email');
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.statusCode).toBe(400);
      expect(body.timestamp).toBeTruthy();
      expect(body.requestId).toBeTruthy();
    });

    it('handles standard Error with 500 status', async () => {
      const error = new Error('Unexpected error');
      const response = handleAPIError(error);

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.code).toBe('INTERNAL_SERVER_ERROR');
      expect(body.statusCode).toBe(500);
    });

    it('handles unknown error with 500 status', async () => {
      const error = 'String error';
      const response = handleAPIError(error);

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('includes X-Request-ID header', async () => {
      const error = new ValidationError('Test');
      const response = handleAPIError(error);

      const requestId = response.headers.get('X-Request-ID');
      expect(requestId).toBeTruthy();
      expect(requestId?.length).toBe(16); // 8 bytes hex = 16 chars
    });

    it('includes Retry-After header for rate limit errors', async () => {
      const error = new RateLimitError('Too many requests', {
        retryAfter: 120,
      });
      const response = handleAPIError(error);

      const retryAfter = response.headers.get('Retry-After');
      expect(retryAfter).toBe('120');
    });

    it('uses default retry-after if not provided', async () => {
      const error = new RateLimitError('Too many requests');
      const response = handleAPIError(error);

      const retryAfter = response.headers.get('Retry-After');
      expect(retryAfter).toBe('60');
    });

    it('includes details in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Need to reload modules to pick up new NODE_ENV
      jest.resetModules();
      const { ValidationError: ValidationErrorDev } = require('../framework');
      const { handleAPIError: handleAPIErrorDev } = require('../handler');

      const error = new ValidationErrorDev('Invalid input', {
        fields: ['email'],
      });
      const response = handleAPIErrorDev(error);

      const body = await response.json();
      expect(body.details).toEqual({ fields: ['email'] });

      process.env.NODE_ENV = originalEnv;
      jest.resetModules();
    });

    it('excludes details in production mode', async () => {
      process.env.NODE_ENV = 'production';

      const error = new ValidationError('Invalid input', {
        fields: ['email'],
      });
      const response = handleAPIError(error);

      const body = await response.json();
      expect(body.details).toBeUndefined();
    });

    it('shows error message in development for standard Error', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Need to reload modules to pick up new NODE_ENV
      jest.resetModules();
      const { handleAPIError: handleAPIErrorDev } = require('../handler');

      const error = new Error('Database connection failed');
      const response = handleAPIErrorDev(error);

      const body = await response.json();
      expect(body.error).toBe('Database connection failed');

      process.env.NODE_ENV = originalEnv;
      jest.resetModules();
    });

    it('shows generic message in production for standard Error', async () => {
      process.env.NODE_ENV = 'production';

      const error = new Error('Database connection failed');
      const response = handleAPIError(error);

      const body = await response.json();
      expect(body.error).toBe('An unexpected error occurred. Please try again later.');
    });

    it('logs error context when provided', async () => {
      const error = new ValidationError('Test');
      const mockWarn = jest.fn();
      console.warn = mockWarn;

      handleAPIError(error, {
        endpoint: '/api/test',
        userId: 'user-123-456-789',
        platform: 'linkedin',
      });

      expect(mockWarn).toHaveBeenCalledWith(
        'Error context:',
        expect.objectContaining({
          endpoint: '/api/test',
          userId: 'user_user-123...',
          platform: 'linkedin',
        })
      );
    });
  });

  describe('handleRedirectError', () => {
    it('redirects with error params for AppError', async () => {
      const error = new AuthenticationError('Please log in');
      const response = handleRedirectError(error, 'http://localhost:3000/login');

      expect(response.status).toBe(307); // Redirect status

      const location = response.headers.get('location');
      expect(location).toBeTruthy();

      const url = new URL(location!);
      expect(url.searchParams.get('error')).toBe('AUTHENTICATION_REQUIRED');
      expect(url.searchParams.get('error_message')).toBe('Please log in');
      expect(url.searchParams.get('request_id')).toBeTruthy();
    });

    it('redirects with error params for standard Error', async () => {
      const error = new Error('Something went wrong');
      const response = handleRedirectError(error, 'http://localhost:3000/error');

      const location = response.headers.get('location');
      const url = new URL(location!);

      expect(url.searchParams.get('error')).toBe('INTERNAL_ERROR');
      expect(url.searchParams.get('request_id')).toBeTruthy();
    });

    it('redirects with error params for unknown error', async () => {
      const error = { unknown: 'error' };
      const response = handleRedirectError(error, 'http://localhost:3000/error');

      const location = response.headers.get('location');
      const url = new URL(location!);

      expect(url.searchParams.get('error')).toBe('UNKNOWN_ERROR');
      expect(url.searchParams.get('error_message')).toBe('An unexpected error occurred');
    });

    it('preserves existing URL params', async () => {
      const error = new ValidationError('Invalid data');
      const baseUrl = 'http://localhost:3000/callback?code=123&state=abc';
      const response = handleRedirectError(error, baseUrl);

      const location = response.headers.get('location');
      const url = new URL(location!);

      expect(url.searchParams.get('code')).toBe('123');
      expect(url.searchParams.get('state')).toBe('abc');
      expect(url.searchParams.get('error')).toBe('VALIDATION_ERROR');
    });
  });
});
