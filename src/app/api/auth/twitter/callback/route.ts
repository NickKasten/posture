// Twitter OAuth 2.0 Callback Route with PKCE
// Handles authorization code exchange and stores access token

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { encrypt } from '../../../../../lib/storage/supabase';
import {
  TWITTER_OAUTH_ENDPOINTS,
  TWITTER_API_ENDPOINTS,
  TWITTER_TOKEN_LIFESPAN_SECONDS,
  type TwitterTokenResponse,
  type TwitterUser,
  type TwitterOAuthError,
  isTwitterOAuthError,
} from '../../../../../types/twitter';

// Environment variables (server-side only - no NEXT_PUBLIC prefix)
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI;

/**
 * GET /api/auth/twitter/callback
 *
 * Handles OAuth callback from Twitter:
 * 1. Validates state parameter (CSRF protection)
 * 2. Retrieves code verifier from cookie (PKCE)
 * 3. Exchanges authorization code for access token with code_verifier
 * 4. Fetches user's Twitter user ID
 * 5. Stores encrypted tokens in database
 * 6. Redirects to dashboard
 *
 * Security features:
 * - Requires authenticated Supabase session
 * - CSRF validation via state parameter
 * - PKCE verification with code_verifier
 * - Token encryption with AES-256
 * - Proper user_id mapping (Supabase UUID, not Twitter ID)
 * - Sanitized error messages
 *
 * @param request - Contains authorization code and state in query params
 * @returns Redirect to dashboard or error page
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate user with Supabase FIRST
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('User not authenticated for Twitter OAuth callback');
      const errorUrl = new URL('/login', request.url);
      errorUrl.searchParams.set('error', 'unauthenticated');
      errorUrl.searchParams.set('message', 'Please sign in to connect Twitter');
      return NextResponse.redirect(errorUrl);
    }

    const authenticatedUserId = session.user.id;

    // Validate environment variables
    if (!TWITTER_CLIENT_ID || !TWITTER_REDIRECT_URI) {
      console.error('Missing Twitter OAuth environment variables');
      return NextResponse.json(
        {
          error: 'Twitter OAuth not configured',
          details: 'Missing required environment variables',
        },
        { status: 500 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle authorization errors
    if (error) {
      console.error('Twitter OAuth error:', { error, errorDescription });
      const errorUrl = new URL('/', request.url);
      errorUrl.searchParams.set('auth_error', error);
      if (errorDescription) {
        errorUrl.searchParams.set('auth_error_description', errorDescription);
      }
      return NextResponse.redirect(errorUrl.toString());
    }

    // Validate required parameters
    if (!code) {
      console.error('Missing authorization code');
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    if (!state) {
      console.error('Missing state parameter');
      return NextResponse.json(
        { error: 'Missing state parameter' },
        { status: 400 }
      );
    }

    // 2. Validate CSRF protection state
    const storedState = request.cookies.get('twitter_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      console.error('Invalid state parameter', {
        hasStoredState: !!storedState,
        stateMatch: storedState === state,
      });
      return NextResponse.json(
        {
          error: 'Invalid state parameter',
          details: 'CSRF validation failed. Please try again.',
        },
        { status: 400 }
      );
    }

    // 3. Retrieve PKCE code verifier from cookie
    const codeVerifier = request.cookies.get('twitter_code_verifier')?.value;
    if (!codeVerifier) {
      console.error('Missing code verifier');
      return NextResponse.json(
        {
          error: 'Missing code verifier',
          details: 'PKCE validation failed. Please try again.',
        },
        { status: 400 }
      );
    }

    // 4. Exchange authorization code for access token with code_verifier
    console.log('Exchanging authorization code for access token with PKCE');
    const tokenResponse = await fetch(TWITTER_OAUTH_ENDPOINTS.TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Twitter uses Basic Auth with client_id as username (no password)
        'Authorization': `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: TWITTER_REDIRECT_URI,
        code_verifier: codeVerifier, // PKCE verification
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({})) as TwitterOAuthError;
      console.error('Token exchange failed', {
        status: tokenResponse.status,
        error: errorData,
      });
      return NextResponse.json(
        {
          error: 'Failed to exchange authorization code',
          details: errorData.error_description || errorData.error || 'Token exchange failed',
          statusCode: tokenResponse.status,
        },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json() as TwitterTokenResponse;

    if (!tokenData.access_token) {
      console.error('No access token in response', tokenData);
      return NextResponse.json(
        {
          error: 'No access token received',
          details: 'Twitter did not return an access token',
        },
        { status: 500 }
      );
    }

    if (!tokenData.refresh_token) {
      console.error('No refresh token in response', tokenData);
      return NextResponse.json(
        {
          error: 'No refresh token received',
          details: 'Twitter did not return a refresh token. Ensure offline.access scope is requested.',
        },
        { status: 500 }
      );
    }

    console.log('Successfully received access token', {
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      hasRefreshToken: !!tokenData.refresh_token,
    });

    // 5. Fetch user info from Twitter API
    console.log('Fetching Twitter user info');
    const userInfoResponse = await fetch(
      `${TWITTER_API_ENDPOINTS.USERS_ME}?user.fields=id,name,username,profile_image_url,verified`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      console.error('Failed to fetch user info', {
        status: userInfoResponse.status,
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch Twitter user profile',
          details: `Status: ${userInfoResponse.status}`,
        },
        { status: 500 }
      );
    }

    const userInfoData = await userInfoResponse.json() as { data: TwitterUser };
    const userInfo = userInfoData.data;

    if (!userInfo.id) {
      console.error('No user ID in user info', userInfo);
      return NextResponse.json(
        {
          error: 'No Twitter user ID found',
          details: 'User info did not contain user ID',
        },
        { status: 500 }
      );
    }

    console.log('Successfully fetched user info', {
      userId: userInfo.id,
      username: userInfo.username,
    });

    // Calculate token expiration time
    const tokenExpiresAt = new Date(
      Date.now() + (tokenData.expires_in || TWITTER_TOKEN_LIFESPAN_SECONDS) * 1000
    ).toISOString();

    // 6. Encrypt tokens
    const encryptedAccessToken = encrypt(tokenData.access_token);
    const encryptedRefreshToken = encrypt(tokenData.refresh_token);

    // 7. Store encrypted tokens in database with proper Supabase user_id
    console.log('Storing encrypted tokens in database');
    const { error: dbError } = await supabase
      .from('social_accounts')
      .upsert(
        {
          user_id: authenticatedUserId, // Supabase user UUID
          platform: 'twitter',
          twitter_user_id: userInfo.id, // Twitter user ID stored separately
          encrypted_access_token: encryptedAccessToken,
          encrypted_refresh_token: encryptedRefreshToken,
          token_expires_at: tokenExpiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,platform', // Update if already exists
        }
      );

    if (dbError) {
      console.error('Failed to store tokens in database');
      return NextResponse.json(
        {
          error: 'Failed to store Twitter credentials',
          details: 'Database error occurred',
        },
        { status: 500 }
      );
    }

    console.log('Successfully stored Twitter credentials for user');

    // 8. Clear cookies
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('twitter_oauth_state', '', {
      maxAge: 0,
      path: '/',
    });
    response.cookies.set('twitter_code_verifier', '', {
      maxAge: 0,
      path: '/',
    });

    // Add success parameters to URL
    const successUrl = new URL('/', request.url);
    successUrl.searchParams.set('auth', 'success');
    successUrl.searchParams.set('platform', 'twitter');
    successUrl.searchParams.set('username', userInfo.username);

    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
