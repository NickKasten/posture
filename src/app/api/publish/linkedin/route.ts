// src/app/api/publish/linkedin/route.ts
// LinkedIn Post Publishing API

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { LinkedInClient } from '@/lib/linkedin/client';
import { getLinkedInToken } from '@/lib/db/posts';
import { savePublishedPost } from '@/lib/db/posts';
import { createUserId, createPostDraftId, type Platform } from '@/types/database';
import { sanitizePostContent } from '@/utils/sanitize-v2';
import { validatePostContent } from '@/utils/validation-v2';
import { publishRateLimit } from '@/lib/rate-limit/client';
import { withRateLimit, addRateLimitHeaders } from '@/lib/rate-limit/middleware';

// Request validation schema
const PublishLinkedInRequestSchema = z.object({
  content: z.string().min(1, 'Content is required').max(3000, 'Content too long for LinkedIn'),
  draftId: z.string().uuid().optional(),
});

export type PublishLinkedInRequest = z.infer<typeof PublishLinkedInRequestSchema>;

/**
 * POST /api/publish/linkedin
 *
 * Publish a post to LinkedIn using stored OAuth token
 *
 * Rate limit: 20 requests per hour (user-based)
 *
 * Request body:
 * {
 *   "content": "Post content here...",
 *   "draftId": "uuid-of-draft" (optional)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "postId": "linkedin_post_id",
 *   "url": "https://linkedin.com/feed/update/urn:li:share:..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user with Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to publish posts' },
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
    const validationResult = PublishLinkedInRequestSchema.safeParse(body);

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

    // Check if user has LinkedIn connected
    const brandedUserId = createUserId(userId);
    const accessToken = await getLinkedInToken(brandedUserId);

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'LinkedIn not connected',
          message: 'Please connect your LinkedIn account first',
          action: 'redirect',
          redirectUrl: '/api/auth/linkedin',
        },
        { status: 403 }
      );
    }

    // Create LinkedIn client
    // Note: personId will be fetched automatically by the client
    const client = new LinkedInClient(accessToken, '');

    // Publish post
    console.log(`Publishing to LinkedIn for user ${userId}`);
    const result = await client.publishPost(sanitizedContent);

    if (!result.success) {
      // Handle specific errors
      if (result.error_details?.code === 'TOKEN_EXPIRED') {
        return NextResponse.json(
          {
            error: 'Token expired',
            message: 'Your LinkedIn connection has expired. Please reconnect.',
            action: 'redirect',
            redirectUrl: '/api/auth/linkedin',
          },
          { status: 401 }
        );
      }

      if (result.error_details?.code === 'RATE_LIMIT_EXCEEDED') {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'LinkedIn API rate limit reached. Please try again later.',
            retryAfter: 3600, // 1 hour
          },
          { status: 429 }
        );
      }

      // Generic error
      return NextResponse.json(
        {
          error: 'Publishing failed',
          message: result.error || result.error_details?.message || 'Failed to publish post to LinkedIn',
          code: result.error_details?.code,
        },
        { status: 500 }
      );
    }

    // Save published post to database
    try {
      await savePublishedPost({
        draft_id: draftId ? createPostDraftId(draftId) : undefined,
        user_id: brandedUserId,
        platform: 'linkedin' as Platform,
        platform_post_id: result.post_id!,
        content: sanitizedContent,
      });
    } catch (dbError) {
      // Post was published successfully, but DB save failed
      // Log error but return success (post is live on LinkedIn)
      console.error('Failed to save published post to database');
    }

    // Construct LinkedIn post URL
    const postUrl = `https://www.linkedin.com/feed/update/urn:li:share:${result.post_id}`;

    const response = NextResponse.json(
      {
        success: true,
        postId: result.post_id,
        url: postUrl,
        message: 'Post published successfully to LinkedIn!',
      },
      { status: 201 }
    );

    // Add rate limit headers to response
    if (rateLimitResult.metadata) {
      return addRateLimitHeaders(response, rateLimitResult.metadata);
    }

    return response;

  } catch (error: any) {
    console.error('Unexpected error in LinkedIn publishing:', error);

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
