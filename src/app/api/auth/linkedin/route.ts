// LinkedIn OAuth 2.1 Authorization Route with PKCE
// Initiates OAuth flow by redirecting user to LinkedIn authorization endpoint

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  LINKEDIN_OAUTH_ENDPOINTS,
  LINKEDIN_DEFAULT_SCOPES,
  PKCE_CODE_VERIFIER_LENGTH,
  type LinkedInAuthParams,
} from '../../../../types/linkedin';
import { authRateLimit } from '@/lib/rate-limit/client';
import { withRateLimit } from '@/lib/rate-limit/middleware';
import { handleAPIError } from '@/lib/errors/handler';
import { ConfigurationError } from '@/lib/errors/framework';

// Environment variables (server-side only - no NEXT_PUBLIC prefix)
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;

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
 * GET /api/auth/linkedin
 *
 * Initiates LinkedIn OAuth 2.1 flow with PKCE and CSRF protection
 * Redirects user to LinkedIn authorization page
 *
 * Security features:
 * - PKCE with S256 challenge method
 * - State parameter for CSRF protection
 * - HttpOnly, Secure cookies for state and codeVerifier
 *
 * Rate limit: 5 requests per minute (IP-based)
 *
 * @returns Redirect to LinkedIn authorization URL
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Apply rate limiting (IP-based to prevent OAuth abuse)
  const rateLimitResult = await withRateLimit(request, authRateLimit);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  try {
    // Validate environment variables
    if (!LINKEDIN_CLIENT_ID || !LINKEDIN_REDIRECT_URI) {
      throw new ConfigurationError(
        'LinkedIn OAuth not configured',
        {
          hasClientId: !!LINKEDIN_CLIENT_ID,
          hasRedirectUri: !!LINKEDIN_REDIRECT_URI,
        }
      );
    }

    // Generate PKCE challenge
    const { codeVerifier, codeChallenge } = generatePKCE();

    // Generate CSRF protection state token
    const state = crypto.randomBytes(32).toString('hex');

    // Build authorization URL with OAuth 2.1 + PKCE parameters
    const authParams: LinkedInAuthParams = {
      client_id: LINKEDIN_CLIENT_ID,
      redirect_uri: LINKEDIN_REDIRECT_URI,
      response_type: 'code',
      scope: LINKEDIN_DEFAULT_SCOPES, // w_member_social email openid profile
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    };

    const authUrl = new URL(LINKEDIN_OAUTH_ENDPOINTS.AUTHORIZATION);
    Object.entries(authParams).forEach(([key, value]) => {
      authUrl.searchParams.set(key, String(value));
    });

    // Log authorization initiation (without sensitive data)
    console.log('LinkedIn OAuth authorization initiated', {
      scope: authParams.scope,
      redirectUri: LINKEDIN_REDIRECT_URI,
    });

    // Store state and codeVerifier in secure cookies
    // These are needed in the callback for validation and token exchange
    const response = NextResponse.redirect(authUrl.toString());

    // Store CSRF state token
    response.cookies.set('linkedin_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes - state expires quickly
      path: '/',
    });

    // Store PKCE code verifier (must be kept secret)
    response.cookies.set('linkedin_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes - verifier expires quickly
      path: '/',
    });

    return response;
  } catch (error) {
    return handleAPIError(error, {
      endpoint: '/api/auth/linkedin',
      platform: 'linkedin',
    });
  }
}
