// Integration tests for Twitter OAuth 2.0 with PKCE flow

// Mock environment variables BEFORE imports
process.env.TWITTER_CLIENT_ID = 'test_twitter_client_id';
process.env.TWITTER_REDIRECT_URI = 'http://localhost:3000/api/auth/twitter/callback';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockGetSession = jest.fn();
const mockUpsert = jest.fn();

// Mock dependencies BEFORE importing the routes
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: () => ({
    auth: {
      getSession: mockGetSession,
    },
    from: () => ({
      upsert: mockUpsert,
    }),
  }),
}));

jest.mock('../../../../../lib/storage/supabase', () => ({
  encrypt: (token: string) => `encrypted:${token}`,
  supabaseClient: {},
}));

// Mock the cookies function
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock crypto for PKCE generation
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn((size: number) => {
    const buffer = Buffer.alloc(size);
    for (let i = 0; i < size; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
  }),
  createHash: jest.fn((algorithm: string) => {
    const actualCrypto = jest.requireActual('crypto');
    return actualCrypto.createHash(algorithm);
  }),
}));

// Now import the routes AFTER mocks are set up
import { GET as authGET } from '../route';
import { GET as callbackGET } from '../callback/route';
import { TWITTER_OAUTH_ENDPOINTS, TWITTER_DEFAULT_SCOPES, TWITTER_API_ENDPOINTS } from '../../../../../types/twitter';

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

describe('Twitter OAuth 2.0 with PKCE Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockGetSession.mockReset();
    mockUpsert.mockReset();
  });

  describe('Authorization Flow (GET /api/auth/twitter)', () => {
    it('requires authenticated Supabase session', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const req = createRequest('http://localhost:3000/api/auth/twitter');
      const res = await authGET(req);

      expect(res.status).toBe(307); // Redirect to login
      const location = res.headers.get('location');
      expect(location).toContain('/login');
      expect(location).toContain('error=unauthenticated');
    });

    it('redirects to Twitter authorization URL with PKCE parameters', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: {
          session: {
            user: { id: 'test-user-123' },
          },
        },
        error: null,
      });

      const req = createRequest('http://localhost:3000/api/auth/twitter');
      const res = await authGET(req);

      expect(res.status).toBe(307); // NextResponse.redirect status
      const location = res.headers.get('location');
      expect(location).toContain(TWITTER_OAUTH_ENDPOINTS.AUTHORIZATION);

      const locationUrl = new URL(location!);
      expect(locationUrl.searchParams.get('response_type')).toBe('code');
      expect(locationUrl.searchParams.get('client_id')).toBe('test_twitter_client_id');
      expect(locationUrl.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/auth/twitter/callback');
      expect(locationUrl.searchParams.get('scope')).toBe(TWITTER_DEFAULT_SCOPES);
      expect(locationUrl.searchParams.get('state')).toBeTruthy();
      expect(locationUrl.searchParams.get('state')!.length).toBeGreaterThan(32);

      // PKCE parameters
      expect(locationUrl.searchParams.get('code_challenge')).toBeTruthy();
      expect(locationUrl.searchParams.get('code_challenge_method')).toBe('S256');
    });

    it('sets secure cookies for state and code_verifier (PKCE)', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: {
          session: {
            user: { id: 'test-user-123' },
          },
        },
        error: null,
      });

      const req = createRequest('http://localhost:3000/api/auth/twitter');
      const res = await authGET(req);

      const setCookieHeader = res.headers.get('set-cookie');

      // Check state cookie
      expect(setCookieHeader).toContain('twitter_oauth_state=');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite=Lax');
      expect(setCookieHeader).toContain('Path=/');
      expect(setCookieHeader).toContain('Max-Age=600'); // 10 minutes

      // Check code_verifier cookie
      expect(setCookieHeader).toContain('twitter_code_verifier=');
    });

    it('returns 500 if CLIENT_ID is missing', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: {
          session: {
            user: { id: 'test-user-123' },
          },
        },
        error: null,
      });

      const originalClientId = process.env.TWITTER_CLIENT_ID;
      delete process.env.TWITTER_CLIENT_ID;

      const req = createRequest('http://localhost:3000/api/auth/twitter');
      const res = await authGET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toMatch(/Twitter OAuth not configured/);
      expect(body.details).toContain('TWITTER_CLIENT_ID');

      process.env.TWITTER_CLIENT_ID = originalClientId;
    });

    it('returns 500 if REDIRECT_URI is missing', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: {
          session: {
            user: { id: 'test-user-123' },
          },
        },
        error: null,
      });

      const originalRedirectUri = process.env.TWITTER_REDIRECT_URI;
      delete process.env.TWITTER_REDIRECT_URI;

      const req = createRequest('http://localhost:3000/api/auth/twitter');
      const res = await authGET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toMatch(/Twitter OAuth not configured/);
      expect(body.details).toContain('TWITTER_REDIRECT_URI');

      process.env.TWITTER_REDIRECT_URI = originalRedirectUri;
    });
  });

  describe('Callback Flow (GET /api/auth/twitter/callback)', () => {
    describe('Supabase Authentication', () => {
      it('requires authenticated Supabase session', async () => {
        mockGetSession.mockResolvedValueOnce({
          data: { session: null },
          error: null,
        });

        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?code=test_code&state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier' }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(307); // Redirect to login
        const location = res.headers.get('location');
        expect(location).toContain('/login');
        expect(location).toContain('error=unauthenticated');
      });
    });

    describe('CSRF Protection', () => {
      beforeEach(() => {
        mockGetSession.mockResolvedValue({
          data: {
            session: {
              user: { id: 'test-user-123' },
            },
          },
          error: null,
        });
      });

      it('returns 400 if state parameter is missing', async () => {
        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?code=test_code'
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toMatch(/Missing state parameter/);
      });

      it('returns 400 if state cookie is missing', async () => {
        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?code=test_code&state=test_state'
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toMatch(/Invalid state parameter/);
        expect(body.details).toContain('CSRF validation failed');
      });

      it('returns 400 if state does not match cookie', async () => {
        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?code=test_code&state=test_state',
          { twitter_oauth_state: 'different_state', twitter_code_verifier: 'test_verifier' }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toMatch(/Invalid state parameter/);
      });
    });

    describe('PKCE Validation', () => {
      beforeEach(() => {
        mockGetSession.mockResolvedValue({
          data: {
            session: {
              user: { id: 'test-user-123' },
            },
          },
          error: null,
        });
      });

      it('returns 400 if code_verifier cookie is missing', async () => {
        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?code=test_code&state=test_state',
          { twitter_oauth_state: 'test_state' }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toMatch(/Missing code verifier/);
        expect(body.details).toContain('PKCE validation failed');
      });
    });

    describe('Input Validation', () => {
      beforeEach(() => {
        mockGetSession.mockResolvedValue({
          data: {
            session: {
              user: { id: 'test-user-123' },
            },
          },
          error: null,
        });
      });

      it('returns 400 if authorization code is missing', async () => {
        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier' }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toMatch(/Missing authorization code/);
      });

      it('handles OAuth error response from Twitter', async () => {
        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?error=access_denied&error_description=User+cancelled',
          { twitter_oauth_state: 'test_state' }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(307); // Redirect
        const location = res.headers.get('location');
        expect(location).toContain('auth_error=access_denied');
        expect(location).toContain('auth_error_description=User+cancelled');
      });
    });

    describe('Token Exchange with PKCE', () => {
      beforeEach(() => {
        mockGetSession.mockResolvedValue({
          data: {
            session: {
              user: { id: 'test-user-123' },
            },
          },
          error: null,
        });
      });

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
          'http://localhost:3000/api/auth/twitter/callback?code=expired_code&state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier' }
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
          'http://localhost:3000/api/auth/twitter/callback?code=bad_code&state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier' }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/No access token received/);
      });

      it('returns 500 if token response has no refresh_token', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'twitter_access_token',
            token_type: 'bearer',
            expires_in: 7200,
            scope: 'tweet.read tweet.write users.read',
          }),
        });

        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?code=bad_code&state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier' }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/No refresh token received/);
        expect(body.details).toContain('offline.access');
      });

      it('calls token endpoint with PKCE code_verifier', async () => {
        // Mock token exchange
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'twitter_access_token',
            token_type: 'bearer',
            expires_in: 7200,
            refresh_token: 'twitter_refresh_token',
            scope: 'tweet.read tweet.write users.read offline.access',
          }),
        });

        // Mock user info
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              id: '123456789',
              name: 'Test User',
              username: 'testuser',
            },
          }),
        });

        // Mock database
        mockUpsert.mockResolvedValueOnce({ error: null });

        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?code=valid_code&state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier_abc123' }
        );
        await callbackGET(req);

        expect(mockFetch).toHaveBeenCalledWith(
          TWITTER_OAUTH_ENDPOINTS.TOKEN,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': expect.stringContaining('Basic'),
            }),
          })
        );

        const callArgs = mockFetch.mock.calls[0][1];
        const body = new URLSearchParams(callArgs.body);
        expect(body.get('grant_type')).toBe('authorization_code');
        expect(body.get('code')).toBe('valid_code');
        expect(body.get('redirect_uri')).toBe('http://localhost:3000/api/auth/twitter/callback');
        expect(body.get('code_verifier')).toBe('test_verifier_abc123');
      });
    });

    describe('User Info Fetch', () => {
      beforeEach(() => {
        mockGetSession.mockResolvedValue({
          data: {
            session: {
              user: { id: 'test-user-123' },
            },
          },
          error: null,
        });
      });

      it('returns 500 if user info fetch fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'twitter_access_token',
            token_type: 'bearer',
            expires_in: 7200,
            refresh_token: 'twitter_refresh_token',
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?code=valid_code&state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier' }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/Failed to fetch Twitter user profile/);
      });

      it('returns 500 if user info has no user ID', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'twitter_access_token',
            token_type: 'bearer',
            expires_in: 7200,
            refresh_token: 'twitter_refresh_token',
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              name: 'Test User',
              // Missing 'id' field
            },
          }),
        });

        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?code=valid_code&state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier' }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/No Twitter user ID found/);
      });

      it('calls users/me endpoint with Bearer token', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'twitter_access_token',
            token_type: 'bearer',
            expires_in: 7200,
            refresh_token: 'twitter_refresh_token',
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              id: '123456789',
              name: 'Test User',
              username: 'testuser',
            },
          }),
        });

        mockUpsert.mockResolvedValueOnce({ error: null });

        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?code=valid_code&state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier' }
        );
        await callbackGET(req);

        expect(mockFetch).toHaveBeenNthCalledWith(
          2,
          expect.stringContaining(TWITTER_API_ENDPOINTS.USERS_ME),
          expect.objectContaining({
            headers: {
              Authorization: 'Bearer twitter_access_token',
            },
          })
        );
      });
    });

    describe('Database Storage', () => {
      beforeEach(() => {
        mockGetSession.mockResolvedValue({
          data: {
            session: {
              user: { id: 'supabase-user-uuid-123' },
            },
          },
          error: null,
        });
      });

      const setupSuccessfulMocks = (twitterUserId = '123456789', username = 'testuser') => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'twitter_access_token',
            token_type: 'bearer',
            expires_in: 7200,
            refresh_token: 'twitter_refresh_token',
            scope: 'tweet.read tweet.write users.read offline.access',
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              id: twitterUserId,
              name: 'Test User',
              username,
            },
          }),
        });
      };

      it('stores encrypted tokens in social_accounts table with proper user_id mapping', async () => {
        setupSuccessfulMocks();
        mockUpsert.mockResolvedValueOnce({ error: null });

        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?code=valid_code&state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier' }
        );
        await callbackGET(req);

        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'supabase-user-uuid-123', // Supabase UUID, not Twitter ID
            platform: 'twitter',
            twitter_user_id: '123456789', // Twitter ID stored separately
            encrypted_access_token: 'encrypted:twitter_access_token',
            encrypted_refresh_token: 'encrypted:twitter_refresh_token',
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
          'http://localhost:3000/api/auth/twitter/callback?code=valid_code&state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier' }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/Failed to store Twitter credentials/);
      });
    });

    describe('Successful Flow', () => {
      beforeEach(() => {
        mockGetSession.mockResolvedValue({
          data: {
            session: {
              user: { id: 'supabase-user-uuid-123' },
            },
          },
          error: null,
        });
      });

      it('redirects to home page with success parameters', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'twitter_access_token',
            token_type: 'bearer',
            expires_in: 7200,
            refresh_token: 'twitter_refresh_token',
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              id: '123456789',
              name: 'Test User',
              username: 'testuser',
            },
          }),
        });

        mockUpsert.mockResolvedValueOnce({ error: null });

        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?code=valid_code&state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier' }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(307); // Redirect
        const location = res.headers.get('location');
        expect(location).toContain('auth=success');
        expect(location).toContain('platform=twitter');
        expect(location).toContain('username=testuser');
      });

      it('clears state and code_verifier cookies after successful authentication', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'twitter_access_token',
            token_type: 'bearer',
            expires_in: 7200,
            refresh_token: 'twitter_refresh_token',
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              id: '123456789',
              username: 'testuser',
            },
          }),
        });

        mockUpsert.mockResolvedValueOnce({ error: null });

        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?code=valid_code&state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier' }
        );
        const res = await callbackGET(req);

        const setCookieHeader = res.headers.get('set-cookie');
        expect(setCookieHeader).toContain('twitter_oauth_state=;');
        expect(setCookieHeader).toContain('twitter_code_verifier=;');
        expect(setCookieHeader).toContain('Max-Age=0');
      });
    });

    describe('Edge Cases', () => {
      beforeEach(() => {
        mockGetSession.mockResolvedValue({
          data: {
            session: {
              user: { id: 'test-user-123' },
            },
          },
          error: null,
        });
      });

      it('handles network errors during token exchange', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?code=valid_code&state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier' }
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
          'http://localhost:3000/api/auth/twitter/callback?code=valid_code&state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier' }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/Internal server error/);
      });

      it('handles missing environment variables in callback', async () => {
        const originalClientId = process.env.TWITTER_CLIENT_ID;
        delete process.env.TWITTER_CLIENT_ID;

        const req = createRequest(
          'http://localhost:3000/api/auth/twitter/callback?code=valid_code&state=test_state',
          { twitter_oauth_state: 'test_state', twitter_code_verifier: 'test_verifier' }
        );
        const res = await callbackGET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/Twitter OAuth not configured/);

        process.env.TWITTER_CLIENT_ID = originalClientId;
      });
    });
  });
});
