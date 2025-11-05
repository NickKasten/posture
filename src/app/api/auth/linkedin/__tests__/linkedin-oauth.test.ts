// Integration tests for LinkedIn OAuth 2.1 flow

// Mock rate limiting before imports
jest.mock('@/lib/rate-limit/client', () => ({
  authRateLimit: {},
}));

jest.mock('@/lib/rate-limit/middleware', () => ({
  withRateLimit: jest.fn(async () => ({ allowed: true })),
  addRateLimitHeaders: jest.fn((response: any) => response),
}));

// Mock error framework
jest.mock('@/lib/errors/handler', () => ({
  handleAPIError: jest.fn((error: any) => {
    const statusCode = error.statusCode || 500;
    return {
      status: statusCode,
      json: async () => ({
        error: error.message,
        code: error.code || 'INTERNAL_SERVER_ERROR',
        statusCode,
      }),
    };
  }),
  handleRedirectError: jest.fn((error: any, url: string) => {
    return {
      status: 307,
      headers: { get: () => url },
    };
  }),
}));

// Mock Supabase Auth
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: 'test_user_id' },
          },
        },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      upsert: jest.fn(),
    })),
  })),
}));

import { GET as authGET } from '../route';
import { GET as callbackGET } from '../callback/route';
import { LINKEDIN_OAUTH_ENDPOINTS, LINKEDIN_DEFAULT_SCOPES } from '../../../../../types/linkedin';

// Mock environment variables
process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID = 'test_client_id';
process.env.LINKEDIN_CLIENT_SECRET = 'test_client_secret';
process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI = 'http://localhost:3000/api/auth/linkedin/callback';

// Mock fetch and supabaseClient
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockUpsert = jest.fn();
jest.mock('../../../../../lib/storage/supabase', () => ({
  supabaseClient: {
    from: () => ({
      upsert: mockUpsert,
    }),
  },
  encrypt: (token: string) => `encrypted:${token}`,
}));

// Mock console to reduce test noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});
afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Helper to create Request with cookies
function createRequest(url: string, cookies: Record<string, string> = {}): any {
  const req = {
    url,
    cookies: {
      get: (name: string) => (cookies[name] ? { value: cookies[name] } : undefined),
      set: jest.fn(),
    },
  };
  return req;
}

describe('LinkedIn OAuth 2.1 Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockUpsert.mockReset();
  });

  describe('Authorization Flow (GET /api/auth/linkedin)', () => {
    it('redirects to LinkedIn authorization URL with correct parameters including PKCE', async () => {
      const req = createRequest('http://localhost:3000/api/auth/linkedin');
      const res = await authGET(req);

      expect(res.status).toBe(307); // NextResponse.redirect status
      const location = res.headers.get('location');
      expect(location).toContain(LINKEDIN_OAUTH_ENDPOINTS.AUTHORIZATION);

      const locationUrl = new URL(location!);
      expect(locationUrl.searchParams.get('client_id')).toBe('test_client_id');
      expect(locationUrl.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/auth/linkedin/callback');
      expect(locationUrl.searchParams.get('response_type')).toBe('code');
      expect(locationUrl.searchParams.get('scope')).toBe(LINKEDIN_DEFAULT_SCOPES);
      expect(locationUrl.searchParams.get('state')).toBeTruthy();
      expect(locationUrl.searchParams.get('state')!.length).toBeGreaterThan(32);

      // PKCE parameters
      expect(locationUrl.searchParams.get('code_challenge')).toBeTruthy();
      expect(locationUrl.searchParams.get('code_challenge_method')).toBe('S256');
      expect(locationUrl.searchParams.get('code_challenge')!.length).toBeGreaterThan(32);
    });

    it('sets secure state cookie for CSRF protection', async () => {
      const req = createRequest('http://localhost:3000/api/auth/linkedin');
      const res = await authGET(req);

      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toContain('linkedin_oauth_state=');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite=Lax');
      expect(setCookieHeader).toContain('Path=/');
      expect(setCookieHeader).toContain('Max-Age=600'); // 10 minutes
    });

    it('sets secure code_verifier cookie for PKCE', async () => {
      const req = createRequest('http://localhost:3000/api/auth/linkedin');
      const res = await authGET(req);

      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toContain('linkedin_code_verifier=');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite=Lax');
      expect(setCookieHeader).toContain('Path=/');
      expect(setCookieHeader).toContain('Max-Age=600'); // 10 minutes
    });

    it('returns 500 if CLIENT_ID is missing', async () => {
      const originalClientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
      delete process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;

      const req = createRequest('http://localhost:3000/api/auth/linkedin');
      const res = await authGET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toMatch(/LinkedIn OAuth not configured/);
      expect(body.details).toContain('NEXT_PUBLIC_LINKEDIN_CLIENT_ID');

      process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID = originalClientId;
    });

    it('returns 500 if REDIRECT_URI is missing', async () => {
      const originalRedirectUri = process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI;
      delete process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI;

      const req = createRequest('http://localhost:3000/api/auth/linkedin');
      const res = await authGET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toMatch(/LinkedIn OAuth not configured/);
      expect(body.details).toContain('NEXT_PUBLIC_LINKEDIN_REDIRECT_URI');

      process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI = originalRedirectUri;
    });
  });

  describe('Callback Flow (GET /api/auth/linkedin/callback)', () => {
    describe('CSRF Protection', () => {
      it('returns 400 if state parameter is missing', async () => {
        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=test_code'
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toMatch(/Missing state parameter/);
      });

      it('returns 400 if state cookie is missing', async () => {
        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=test_code&state=test_state'
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toMatch(/Invalid state parameter/);
        expect(body.details).toContain('CSRF validation failed');
      });

      it('returns 400 if state does not match cookie', async () => {
        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=test_code&state=test_state',
          { linkedin_oauth_state: 'different_state' }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toMatch(/Invalid state parameter/);
      });
    });

    describe('PKCE Validation', () => {
      it('returns 400 if code_verifier cookie is missing', async () => {
        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=test_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toMatch(/Missing code verifier/);
        expect(body.details).toContain('PKCE validation failed');
      });

      it('includes code_verifier in token exchange request', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'AQV8...',
            expires_in: 5184000,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: 'abc123def',
            email: 'test@example.com',
          }),
        });

        mockUpsert.mockResolvedValueOnce({ error: null });

        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=valid_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_code_verifier_123',
          }
        );
        await callbackGET(req);

        expect(mockFetch).toHaveBeenCalledWith(
          LINKEDIN_OAUTH_ENDPOINTS.TOKEN,
          expect.objectContaining({
            method: 'POST',
          })
        );

        const callArgs = mockFetch.mock.calls[0][1];
        const body = new URLSearchParams(callArgs.body);
        expect(body.get('code_verifier')).toBe('test_code_verifier_123');
      });
    });

    describe('Input Validation', () => {
      it('returns 400 if authorization code is missing', async () => {
        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toMatch(/Missing authorization code/);
      });

      it('handles OAuth error response from LinkedIn', async () => {
        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?error=access_denied&error_description=User+cancelled',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(307); // Redirect
        const location = res.headers.get('location');
        expect(location).toContain('auth_error=access_denied');
        expect(location).toContain('auth_error_description=User+cancelled');
      });
    });

    describe('Token Exchange', () => {
      it('returns 500 if token exchange fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            error: 'invalid_grant',
            error_description: 'Authorization code expired',
          }),
        });

        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=expired_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/Failed to exchange authorization code/);
        expect(body.details).toContain('Authorization code expired');
        expect(body.statusCode).toBe(400);
      });

      it('returns 500 if token response has no access_token', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            error: 'invalid_request',
          }),
        });

        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=bad_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/No access token received/);
      });

      it('calls token endpoint with correct parameters including code_verifier', async () => {
        // Mock token exchange
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'AQV8...',
            expires_in: 5184000,
            scope: 'w_member_social email openid profile',
            token_type: 'Bearer',
          }),
        });

        // Mock userinfo
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: 'abc123def',
            email: 'test@example.com',
            name: 'Test User',
          }),
        });

        // Mock database
        mockUpsert.mockResolvedValueOnce({ error: null });

        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=valid_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier_abc123',
          }
        );
        await callbackGET(req);

        expect(mockFetch).toHaveBeenCalledWith(
          LINKEDIN_OAUTH_ENDPOINTS.TOKEN,
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          })
        );

        const callArgs = mockFetch.mock.calls[0][1];
        const body = new URLSearchParams(callArgs.body);
        expect(body.get('grant_type')).toBe('authorization_code');
        expect(body.get('code')).toBe('valid_code');
        expect(body.get('client_id')).toBe('test_client_id');
        expect(body.get('client_secret')).toBe('test_client_secret');
        expect(body.get('redirect_uri')).toBe('http://localhost:3000/api/auth/linkedin/callback');
        expect(body.get('code_verifier')).toBe('test_verifier_abc123');
      });
    });

    describe('User Info Fetch', () => {
      it('returns 500 if user info fetch fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'AQV8...',
            expires_in: 5184000,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=valid_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/Failed to fetch LinkedIn user profile/);
      });

      it('returns 500 if user info has no member ID', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'AQV8...',
            expires_in: 5184000,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            email: 'test@example.com',
            // Missing 'sub' field
          }),
        });

        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=valid_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/No LinkedIn member ID found/);
      });

      it('calls userinfo endpoint with Bearer token', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'AQV8_test_token',
            expires_in: 5184000,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: 'abc123def',
            email: 'test@example.com',
          }),
        });

        mockUpsert.mockResolvedValueOnce({ error: null });

        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=valid_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        await callbackGET(req);

        expect(mockFetch).toHaveBeenNthCalledWith(
          2,
          LINKEDIN_OAUTH_ENDPOINTS.USERINFO,
          expect.objectContaining({
            headers: {
              Authorization: 'Bearer AQV8_test_token',
            },
          })
        );
      });
    });

    describe('Database Storage', () => {
      const setupSuccessfulMocks = (memberId = 'abc123def') => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'AQV8_test_token',
            expires_in: 5184000,
            scope: 'w_member_social email openid profile',
            token_type: 'Bearer',
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: memberId,
            email: 'test@example.com',
            name: 'Test User',
          }),
        });
      };

      it('stores encrypted token in social_accounts table', async () => {
        setupSuccessfulMocks();
        mockUpsert.mockResolvedValueOnce({ error: null });

        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=valid_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        await callbackGET(req);

        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'abc123def',
            platform: 'linkedin',
            encrypted_access_token: 'encrypted:AQV8_test_token',
            encrypted_refresh_token: null,
          }),
          expect.objectContaining({
            onConflict: 'user_id,platform',
          })
        );

        const callArgs = mockUpsert.mock.calls[0][0];
        expect(callArgs.token_expires_at).toBeTruthy();
        expect(callArgs.updated_at).toBeTruthy();
      });

      it('returns 500 if database upsert fails', async () => {
        setupSuccessfulMocks();
        mockUpsert.mockResolvedValueOnce({
          error: {
            message: 'Connection timeout',
            code: 'PGRST301',
          },
        });

        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=valid_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/Failed to store LinkedIn credentials/);
        expect(body.details).toContain('Connection timeout');
      });

      it('handles refresh_token if provided', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'AQV8_test_token',
            refresh_token: 'AQV8_refresh_token',
            expires_in: 5184000,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: 'abc123def',
            email: 'test@example.com',
          }),
        });

        mockUpsert.mockResolvedValueOnce({ error: null });

        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=valid_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        await callbackGET(req);

        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            encrypted_refresh_token: 'encrypted:AQV8_refresh_token',
          }),
          expect.any(Object)
        );
      });
    });

    describe('Successful Flow', () => {
      it('redirects to home page with success parameters', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'AQV8_test_token',
            expires_in: 5184000,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: 'abc123def',
            email: 'test@example.com',
          }),
        });

        mockUpsert.mockResolvedValueOnce({ error: null });

        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=valid_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(307); // Redirect
        const location = res.headers.get('location');
        expect(location).toContain('auth=success');
        expect(location).toContain('platform=linkedin');
        expect(location).toContain('user=abc123def');
      });

      it('clears state cookie after successful authentication', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'AQV8_test_token',
            expires_in: 5184000,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: 'abc123def',
          }),
        });

        mockUpsert.mockResolvedValueOnce({ error: null });

        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=valid_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        const res = await callbackGET(req);

        const setCookieHeader = res.headers.get('set-cookie');
        expect(setCookieHeader).toContain('linkedin_oauth_state=;');
        expect(setCookieHeader).toContain('Max-Age=0');
      });
    });

    describe('Edge Cases', () => {
      it('handles network errors during token exchange', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=valid_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/Internal server error/);
        expect(body.details).toContain('Network timeout');
      });

      it('handles malformed JSON in token response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => {
            throw new Error('Unexpected token in JSON');
          },
        });

        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=valid_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/Internal server error/);
      });

      it('handles missing environment variables in callback', async () => {
        const originalClientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        delete process.env.LINKEDIN_CLIENT_SECRET;

        const req = createRequest(
          'http://localhost:3000/api/auth/linkedin/callback?code=valid_code&state=test_state',
          {
            linkedin_oauth_state: 'test_state',
            linkedin_code_verifier: 'test_verifier',
          }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/LinkedIn OAuth not configured/);

        process.env.LINKEDIN_CLIENT_SECRET = originalClientSecret;
      });
    });
  });
});
