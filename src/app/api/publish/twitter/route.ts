// src/app/api/publish/twitter/route.ts
// Twitter Post Publishing API

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { TwitterClient } from '@/lib/twitter/client';
import { getTwitterToken } from '@/lib/db/posts';
import { savePublishedPost } from '@/lib/db/posts';
import { createUserId, createPostDraftId, type Platform } from '@/types/database';
import { sanitizePostContent } from '@/utils/sanitize-v2';
import { validatePostContent } from '@/utils/validation-v2';
import { publishRateLimit } from '@/lib/rate-limit/client';
import { withRateLimit, addRateLimitHeaders } from '@/lib/rate-limit/middleware';

// Request validation schema
const PublishTwitterRequestSchema = z.object({
  content: z.string().min(1, 'Content is required').max(280, 'Content too long for Twitter'),
  draftId: z.string().uuid().optional(),
});

export type PublishTwitterRequest = z.infer<typeof PublishTwitterRequestSchema>;

/**
 * POST /api/publish/twitter
 *
 * Publish a tweet to Twitter using stored OAuth token
 *
 * Rate limit: 20 requests per hour (user-based)
 *
 * Request body:
 * {
 *   "content": "Tweet content here...",
 *   "draftId": "uuid-of-draft" (optional)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "tweetId": "twitter_tweet_id",
 *   "url": "https://twitter.com/user/status/..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user with Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to publish tweets' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Apply rate limiting (user-based to prevent spam)
    const rateLimitResult = await withRateLimit(request, publishRateLimit, userId);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = PublishTwitterRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { content, draftId } = validationResult.data;

    // Sanitize and validate content using v2 (prevents XSS and prompt injection)
    const sanitizedContent = sanitizePostContent(content);
    const contentValidation = validatePostContent(sanitizedContent);

    if (!contentValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid content', details: contentValidation.error },
        { status: 400 }
      );
    }

    // Additional Twitter-specific length check (280 characters)
    if (sanitizedContent.length > 280) {
      return NextResponse.json(
        {
          error: 'Content too long',
          message: `Tweet exceeds 280 character limit (current: ${sanitizedContent.length})`,
        },
        { status: 400 }
      );
    }

    // Check if user has Twitter connected
    const brandedUserId = createUserId(userId);
    const accessToken = await getTwitterToken(brandedUserId);

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Twitter not connected',
          message: 'Please connect your Twitter account first',
          action: 'redirect',
          redirectUrl: '/api/auth/twitter',
        },
        { status: 403 }
      );
    }

    // Create Twitter client
    // Note: userId will be fetched automatically by the client if needed
    const client = new TwitterClient(accessToken, '');

    // Publish tweet
    console.log(`Publishing to Twitter for user ${userId}`);
    const result = await client.publishTweet(sanitizedContent);

    if (!result.success) {
      // Handle specific errors
      if (result.error?.code === 'TOKEN_EXPIRED') {
        return NextResponse.json(
          {
            error: 'Token expired',
            message: 'Your Twitter connection has expired. Please reconnect.',
            action: 'redirect',
            redirectUrl: '/api/auth/twitter',
          },
          { status: 401 }
        );
      }

      if (result.error?.code === 'RATE_LIMIT_EXCEEDED') {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Twitter API rate limit reached (300 tweets per 3 hours). Please try again later.',
            retryAfter: 10800, // 3 hours
          },
          { status: 429 }
        );
      }

      // Generic error
      return NextResponse.json(
        {
          error: 'Publishing failed',
          message: result.error?.message || 'Failed to publish tweet to Twitter',
          code: result.error?.code,
        },
        { status: 500 }
      );
    }

    // Save published post to database
    try {
      await savePublishedPost({
        draft_id: draftId ? createPostDraftId(draftId) : undefined,
        user_id: brandedUserId,
        platform: 'twitter' as Platform,
        platform_post_id: result.tweet_id!,
        content: sanitizedContent,
      });
    } catch (dbError) {
      // Post was published successfully, but DB save failed
      // Log error but return success (post is live on Twitter)
      console.error('Failed to save published post to database:', dbError);
    }

    // Construct Twitter post URL
    // Note: We don't have the username, so use a generic URL format
    const postUrl = `https://twitter.com/i/web/status/${result.tweet_id}`;

    const response = NextResponse.json(
      {
        success: true,
        tweetId: result.tweet_id,
        url: postUrl,
        message: 'Tweet published successfully to Twitter!',
      },
      { status: 201 }
    );

    // Add rate limit headers to response
    if (rateLimitResult.metadata) {
      return addRateLimitHeaders(response, rateLimitResult.metadata);
    }

    return response;

  } catch (error: any) {
    console.error('Unexpected error in Twitter publishing:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while publishing',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
