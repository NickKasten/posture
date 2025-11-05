// GET /api/accounts/status
// Returns connection status for all social media accounts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * GET /api/accounts/status
 *
 * Returns the connection status for all social media accounts
 * Shows which platforms are connected and token expiration info
 *
 * Response:
 * {
 *   "accounts": [
 *     {
 *       "platform": "linkedin",
 *       "connected": true,
 *       "expiresAt": "2025-12-31T00:00:00.000Z",
 *       "memberId": "linkedin_member_id"
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to view account status' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch all social accounts for this user
    const { data: accounts, error: dbError } = await supabase
      .from('social_accounts')
      .select('platform, token_expires_at, linkedin_member_id, twitter_user_id')
      .eq('user_id', userId);

    if (dbError) {
      console.error('Database error fetching accounts:', dbError);
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to fetch account status' },
        { status: 500 }
      );
    }

    // Transform to account status format
    const accountStatus = (accounts || []).map(account => ({
      platform: account.platform,
      connected: true,
      expiresAt: account.token_expires_at,
      memberId: account.platform === 'linkedin'
        ? account.linkedin_member_id
        : account.twitter_user_id,
    }));

    // Add platforms that aren't connected
    const connectedPlatforms = new Set(accountStatus.map(a => a.platform));
    const allPlatforms: Array<'linkedin' | 'twitter'> = ['linkedin', 'twitter'];

    for (const platform of allPlatforms) {
      if (!connectedPlatforms.has(platform)) {
        accountStatus.push({
          platform,
          connected: false,
          expiresAt: null,
          memberId: null,
        });
      }
    }

    return NextResponse.json({
      accounts: accountStatus,
    });

  } catch (error: any) {
    console.error('Unexpected error in account status endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
