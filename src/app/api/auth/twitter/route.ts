// Twitter OAuth 2.0 Authorization Route with PKCE
// Initiates OAuth flow by redirecting user to Twitter authorization endpoint

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import {
  TWITTER_OAUTH_ENDPOINTS,
  TWITTER_DEFAULT_SCOPES,
  PKCE_CODE_VERIFIER_LENGTH,
  type TwitterAuthParams,
} from '../../../../types/twitter';

// Environment variables (server-side only - no NEXT_PUBLIC prefix)
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI;

/**
 * Generate PKCE code verifier and challenge
 *
 * PKCE (Proof Key for Code Exchange) prevents authorization code interception attacks
 * 1. Generate random code_verifier (43-128 chars, base64url-encoded)
 * 2. Create code_challenge = BASE64URL(SHA256(code_verifier))
 * 3. Send code_challenge in authorization request
 * 4. Send code_verifier in token exchange request
 *
 * @returns Object with codeVerifier and codeChallenge
 */
function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  // Generate random code verifier (base64url-encoded random bytes)
  const codeVerifier = crypto
    .randomBytes(PKCE_CODE_VERIFIER_LENGTH)
    .toString('base64url');

  // Create SHA-256 hash of code verifier
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return { codeVerifier, codeChallenge };
}

/**
 * GET /api/auth/twitter
 *
 * Initiates Twitter OAuth 2.0 flow with PKCE and CSRF protection
 * Redirects user to Twitter authorization page
 *
 * Security features:
 * - Requires authenticated Supabase session BEFORE OAuth
 * - PKCE with S256 challenge method
 * - State parameter for CSRF protection
 * - HttpOnly, Secure cookies for state and codeVerifier
 *
 * @returns Redirect to Twitter authorization URL
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate user with Supabase FIRST
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('User not authenticated for Twitter OAuth');
      const errorUrl = new URL('/login', request.url);
      errorUrl.searchParams.set('error', 'unauthenticated');
      errorUrl.searchParams.set('message', 'Please sign in to connect Twitter');
      return NextResponse.redirect(errorUrl);
    }

    // Validate environment variables
    if (!TWITTER_CLIENT_ID || !TWITTER_REDIRECT_URI) {
      console.error('Missing Twitter OAuth environment variables', {
        hasClientId: !!TWITTER_CLIENT_ID,
        hasRedirectUri: !!TWITTER_REDIRECT_URI,
      });
      return NextResponse.json(
        {
          error: 'Twitter OAuth not configured',
          details: 'Missing TWITTER_CLIENT_ID or TWITTER_REDIRECT_URI',
        },
        { status: 500 }
      );
    }

    // 2. Generate PKCE challenge
    const { codeVerifier, codeChallenge } = generatePKCE();

    // 3. Generate CSRF protection state token
    const state = crypto.randomBytes(32).toString('hex');

    // Build authorization URL with OAuth 2.0 + PKCE parameters
    const authParams: TwitterAuthParams = {
      response_type: 'code',
      client_id: TWITTER_CLIENT_ID,
      redirect_uri: TWITTER_REDIRECT_URI,
      scope: TWITTER_DEFAULT_SCOPES, // tweet.read tweet.write users.read offline.access
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    };

    const authUrl = new URL(TWITTER_OAUTH_ENDPOINTS.AUTHORIZATION);
    Object.entries(authParams).forEach(([key, value]) => {
      authUrl.searchParams.set(key, String(value));
    });

    // Log authorization initiation (without sensitive data)
    console.log('Twitter OAuth authorization initiated', {
      scope: authParams.scope,
      redirectUri: TWITTER_REDIRECT_URI,
      userId: session.user.id,
    });

    // 4. Store state and codeVerifier in secure cookies
    // These are needed in the callback for validation and token exchange
    const response = NextResponse.redirect(authUrl.toString());

    // Store CSRF state token
    response.cookies.set('twitter_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes - state expires quickly
      path: '/',
    });

    // Store PKCE code verifier (must be kept secret)
    response.cookies.set('twitter_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes - verifier expires quickly
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Twitter OAuth authorization error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate Twitter OAuth',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
