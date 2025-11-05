// GET /api/user
// Returns current authenticated user information

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * GET /api/user
 *
 * Returns the currently authenticated user's information
 *
 * Response:
 * {
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "name": "User Name"
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No active session' },
        { status: 401 }
      );
    }

    // Return user info
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
      },
    });

  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch user information',
      },
      { status: 500 }
    );
  }
}
