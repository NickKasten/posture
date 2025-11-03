// src/app/api/ai/route.ts
// AI Post Generation API - GPT-5-mini Integration

import { NextRequest, NextResponse } from 'next/server';
import { generatePost } from '@/lib/ai/client';
import { sanitizeUserInput } from '@/utils/sanitize';
import { validateUserInput } from '@/utils/validation';
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
});

export type GeneratePostRequest = z.infer<typeof GeneratePostRequestSchema>;

/**
 * POST /api/ai
 *
 * Generate a LinkedIn or Twitter post using GPT-5-mini
 *
 * Request body:
 * {
 *   "topic": "I reduced API latency by 40%",
 *   "platform": "linkedin" | "twitter" | "both",
 *   "tone": "technical" | "casual" | "inspiring" (optional),
 *   "githubActivity": "Recent commits..." (optional),
 *   "maxLength": 1300 (optional)
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

    const { topic, platform, tone, githubActivity, maxLength } = validationResult.data;

    // Sanitize inputs
    const sanitizedTopic = sanitizeUserInput(topic);
    const sanitizedActivity = githubActivity ? sanitizeUserInput(githubActivity) : undefined;

    // Additional validation for sanitized inputs
    const topicValidation = validateUserInput(sanitizedTopic);
    if (!topicValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid topic', details: topicValidation.error },
        { status: 400 }
      );
    }

    if (sanitizedActivity) {
      const activityValidation = validateUserInput(sanitizedActivity);
      if (!activityValidation.isValid) {
        return NextResponse.json(
          { error: 'Invalid GitHub activity', details: activityValidation.error },
          { status: 400 }
        );
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

      return NextResponse.json(result, { status: 200 });

    } catch (aiError: any) {
      console.error('AI generation error:', aiError);

      // Check for specific OpenAI errors
      if (aiError.status === 429) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again in a few moments.',
          },
          { status: 429 }
        );
      }

      if (aiError.status === 401) {
        return NextResponse.json(
          { error: 'Authentication failed', message: 'Invalid API key configuration.' },
          { status: 500 }
        );
      }

      if (aiError.status === 400) {
        return NextResponse.json(
          {
            error: 'Invalid request to AI service',
            message: 'The request could not be processed by the AI service.',
          },
          { status: 400 }
        );
      }

      // Generic AI error
      return NextResponse.json(
        {
          error: 'AI generation failed',
          message: 'Unable to generate post. Please try again.',
          details: process.env.NODE_ENV === 'development' ? aiError.message : undefined,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Unexpected error in /api/ai:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
