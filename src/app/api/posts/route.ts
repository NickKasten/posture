// GET /api/posts
// Returns published posts for the authenticated user

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getPublishedPosts } from '@/lib/db/posts';
import { createUserId } from '@/types/database';

/**
 * GET /api/posts
 *
 * Fetches all published posts for the authenticated user
 * Supports pagination and filtering by platform
 *
 * Query params:
 * - platform: 'linkedin' | 'twitter' (optional)
 * - limit: number (default 50)
 * - offset: number (default 0)
 *
 * Response:
 * {
 *   "posts": [
 *     {
 *       "id": "uuid",
 *       "platform": "linkedin",
 *       "content": "Post content...",
 *       "published_at": "2025-11-04T12:00:00Z",
 *       "platform_post_id": "linkedin_post_id",
 *       "engagement_metrics": { "likes": 10, "comments": 2 }
 *     }
 *   ],
 *   "total": 25
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to view posts' },
        { status: 401 }
      );
    }

    const userId = createUserId(session.user.id);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') as 'linkedin' | 'twitter' | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit', message: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Invalid offset', message: 'Offset must be non-negative' },
        { status: 400 }
      );
    }

    // Fetch published posts
    const posts = await getPublishedPosts(userId, {
      platform: platform || undefined,
      limit,
      offset,
    });

    // Get total count for pagination
    let countQuery = supabase
      .from('published_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (platform) {
      countQuery = countQuery.eq('platform', platform);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting posts:', countError);
    }

    return NextResponse.json({
      posts,
      total: count || 0,
      limit,
      offset,
    });

  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch posts',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
