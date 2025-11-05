// LinkedIn OAuth 2.1 Callback Route
// Handles authorization code exchange and stores access token

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { encrypt } from '../../../../../lib/storage/supabase';
import {
  LINKEDIN_OAUTH_ENDPOINTS,
  LINKEDIN_TOKEN_LIFESPAN_SECONDS,
  type LinkedInTokenResponse,
  type LinkedInUserInfo,
  type LinkedInOAuthError,
  isLinkedInOAuthError,
} from '../../../../../types/linkedin';
import { authRateLimit } from '@/lib/rate-limit/client';
import { withRateLimit } from '@/lib/rate-limit/middleware';
import { handleAPIError, handleRedirectError } from '@/lib/errors/handler';
import {
  AuthenticationError,
  ValidationError,
  ConfigurationError,
  CSRFError,
  PKCEError,
  ExternalAPIError,
  DatabaseError,
} from '@/lib/errors/framework';

// Environment variables (server-side only - no NEXT_PUBLIC prefix)
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;

/**
 * GET /api/auth/linkedin/callback
 *
 * Handles OAuth callback from LinkedIn:
 * 1. Validates state parameter (CSRF protection)
 * 2. Retrieves code verifier from cookie (PKCE)
 * 3. Exchanges authorization code for access token with code_verifier
 * 4. Fetches user's LinkedIn member ID
 * 5. Stores encrypted token in database
 * 6. Redirects to dashboard
 *
 * Security features:
 * - Requires authenticated Supabase session
 * - CSRF validation via state parameter
 * - PKCE verification with code_verifier
 * - Token encryption with AES-256
 *
 * Rate limit: 5 requests per minute (IP-based)
 *
 * @param request - Contains authorization code and state in query params
 * @returns Redirect to dashboard or error page
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Apply rate limiting (IP-based to prevent OAuth callback abuse)
  const rateLimitResult = await withRateLimit(request, authRateLimit);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  try {
    // Authenticate user with Supabase FIRST
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      throw new AuthenticationError('Please sign in to connect LinkedIn');
    }

    const authenticatedUserId = session.user.id;

    // Validate environment variables
    if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET || !LINKEDIN_REDIRECT_URI) {
      throw new ConfigurationError('LinkedIn OAuth not configured');
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle authorization errors
    if (error) {
      console.error('LinkedIn OAuth error:', { error, errorDescription });
      const errorUrl = new URL('/', request.url);
      errorUrl.searchParams.set('auth_error', error);
      if (errorDescription) {
        errorUrl.searchParams.set('auth_error_description', errorDescription);
      }
      return NextResponse.redirect(errorUrl.toString());
    }

    // Validate required parameters
    if (!code) {
      throw new ValidationError('Missing authorization code');
    }

    if (!state) {
      throw new ValidationError('Missing state parameter');
    }

    // Validate CSRF protection state
    const storedState = request.cookies.get('linkedin_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      throw new CSRFError('Invalid state parameter');
    }

    // Retrieve PKCE code verifier from cookie
    const codeVerifier = request.cookies.get('linkedin_code_verifier')?.value;
    if (!codeVerifier) {
      throw new PKCEError('Missing code verifier');
    }

    // Exchange authorization code for access token with code_verifier
    console.log('Exchanging authorization code for access token with PKCE');
    const tokenResponse = await fetch(LINKEDIN_OAUTH_ENDPOINTS.TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        code_verifier: codeVerifier, // PKCE verification
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({})) as LinkedInOAuthError;
      throw new ExternalAPIError(
        'LinkedIn',
        'Failed to exchange authorization code',
        {
          status: tokenResponse.status,
          error: errorData.error_description || errorData.error,
        }
      );
    }

    const tokenData = await tokenResponse.json() as LinkedInTokenResponse;

    if (!tokenData.access_token) {
      throw new ExternalAPIError(
        'LinkedIn',
        'No access token received from LinkedIn'
      );
    }

    console.log('Successfully received access token', {
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
    });

    // Fetch user's LinkedIn member ID via OpenID Connect
    console.log('Fetching LinkedIn user info');
    const userInfoResponse = await fetch(LINKEDIN_OAUTH_ENDPOINTS.USERINFO, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new ExternalAPIError(
        'LinkedIn',
        'Failed to fetch LinkedIn user profile',
        { status: userInfoResponse.status }
      );
    }

    const userInfo = await userInfoResponse.json() as LinkedInUserInfo;

    if (!userInfo.sub) {
      throw new ExternalAPIError(
        'LinkedIn',
        'No LinkedIn member ID found in user info'
      );
    }

    console.log('Successfully fetched user info', {
      memberId: userInfo.sub,
      hasEmail: !!userInfo.email,
    });

    // Calculate token expiration time
    const tokenExpiresAt = new Date(
      Date.now() + (tokenData.expires_in || LINKEDIN_TOKEN_LIFESPAN_SECONDS) * 1000
    ).toISOString();

    // Encrypt access token
    const encryptedToken = encrypt(tokenData.access_token);

    // Store encrypted token in database with proper Supabase user_id
    console.log('Storing encrypted token in database');
    const { error: dbError } = await supabase
      .from('social_accounts')
      .upsert(
        {
          user_id: authenticatedUserId, // Supabase user UUID
          platform: 'linkedin',
          linkedin_member_id: userInfo.sub, // LinkedIn member ID stored separately
          encrypted_access_token: encryptedToken,
          encrypted_refresh_token: tokenData.refresh_token
            ? encrypt(tokenData.refresh_token)
            : null,
          token_expires_at: tokenExpiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,platform', // Update if already exists
        }
      );

    if (dbError) {
      throw new DatabaseError('Failed to store LinkedIn credentials', {
        code: dbError.code,
        message: dbError.message,
      });
    }

    console.log('Successfully stored LinkedIn credentials for user');

    // Clear state and code_verifier cookies
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('linkedin_oauth_state', '', {
      maxAge: 0,
      path: '/',
    });
    response.cookies.set('linkedin_code_verifier', '', {
      maxAge: 0,
      path: '/',
    });

    // Add success parameters to URL
    const successUrl = new URL('/', request.url);
    successUrl.searchParams.set('auth', 'success');
    successUrl.searchParams.set('platform', 'linkedin');
    successUrl.searchParams.set('user', userInfo.sub);

    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    return handleAPIError(error, {
      endpoint: '/api/auth/linkedin/callback',
      platform: 'linkedin',
    });
  }
}
