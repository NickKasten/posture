// src/app/api/ai/route.ts
// AI Post Generation API - GPT-5-mini Integration

import { NextRequest, NextResponse } from 'next/server';
import { generatePost } from '@/lib/ai/client';
import { sanitizeTopic, sanitizeUserInput } from '@/utils/sanitize-v2';
import { validateTopic, GitHubActivitySchema } from '@/utils/validation-v2';
import { aiRateLimit } from '@/lib/rate-limit/client';
import { withRateLimit, addRateLimitHeaders } from '@/lib/rate-limit/middleware';
import { handleAPIError } from '@/lib/errors/handler';
import { ValidationError, ExternalAPIError } from '@/lib/errors/framework';
import { z } from 'zod';

// Request validation schema
const GeneratePostRequestSchema = z.object({
  topic: z.string().min(10, 'Topic must be at least 10 characters').max(500, 'Topic too long'),
  platform: z.enum(['linkedin', 'twitter', 'both'], {
    errorMap: () => ({ message: 'Platform must be linkedin, twitter, or both' }),
  }),
  tone: z.enum(['technical', 'casual', 'inspiring']).optional(),
  githubActivity: z.string().max(2000, 'GitHub activity too long').optional(),
  maxLength: z.number().min(50).max(2000).optional(),
  userId: z.string().optional(), // For rate limiting
});

export type GeneratePostRequest = z.infer<typeof GeneratePostRequestSchema>;

/**
 * POST /api/ai
 *
 * Generate a LinkedIn or Twitter post using GPT-5-mini
 *
 * Rate limit: 10 requests per hour (user-based, falls back to IP-based)
 *
 * Request body:
 * {
 *   "topic": "I reduced API latency by 40%",
 *   "platform": "linkedin" | "twitter" | "both",
 *   "tone": "technical" | "casual" | "inspiring" (optional),
 *   "githubActivity": "Recent commits..." (optional),
 *   "maxLength": 1300 (optional),
 *   "userId": "user123" (optional, for rate limiting)
 * }
 *
 * Response:
 * {
 *   "content": "Just reduced API latency...",
 *   "hashtags": ["WebDev", "Performance"],
 *   "characterCount": 58,
 *   "platform": "linkedin"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = GeneratePostRequestSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid request', {
        fields: validationResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { userId, topic, platform, tone, githubActivity, maxLength } = validationResult.data;

    // Apply rate limiting (user-based if userId provided, otherwise IP-based)
    const rateLimitResult = await withRateLimit(request, aiRateLimit, userId);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Sanitize inputs using v2 sanitization (prevents XSS and prompt injection)
    const sanitizedTopic = sanitizeTopic(topic);
    const sanitizedActivity = githubActivity
      ? sanitizeUserInput(githubActivity, { maxLength: 2000, preventAIInjection: true })
      : undefined;

    // Additional validation for sanitized inputs
    const topicValidation = validateTopic(sanitizedTopic);
    if (!topicValidation.isValid) {
      throw new ValidationError('Invalid topic', {
        error: topicValidation.error,
      });
    }

    if (sanitizedActivity) {
      const activityValidation = GitHubActivitySchema.safeParse(sanitizedActivity);
      if (!activityValidation.success) {
        throw new ValidationError('Invalid GitHub activity', {
          error: activityValidation.error.issues[0]?.message,
        });
      }
    }

    // Generate post using GPT-5-mini
    try {
      const result = await generatePost({
        topic: sanitizedTopic,
        platform,
        tone,
        githubActivity: sanitizedActivity,
        maxLength,
      });

      const response = NextResponse.json(result, { status: 200 });

      // Add rate limit headers to response
      if (rateLimitResult.metadata) {
        return addRateLimitHeaders(response, rateLimitResult.metadata);
      }

      return response;

    } catch (aiError: any) {
      // Check for specific OpenAI errors
      if (aiError.status === 429) {
        throw new ExternalAPIError(
          'OpenAI',
          'AI rate limit exceeded. Please try again in a few moments.',
          { status: aiError.status }
        );
      }

      if (aiError.status === 401) {
        throw new ExternalAPIError(
          'OpenAI',
          'AI authentication failed',
          { status: aiError.status }
        );
      }

      if (aiError.status === 400) {
        throw new ExternalAPIError(
          'OpenAI',
          'Invalid request to AI service',
          { status: aiError.status }
        );
      }

      // Generic AI error
      throw new ExternalAPIError(
        'OpenAI',
        'AI generation failed. Please try again.',
        { message: aiError.message }
      );
    }

  } catch (error: any) {
    return handleAPIError(error, {
      endpoint: '/api/ai',
    });
  }
}
