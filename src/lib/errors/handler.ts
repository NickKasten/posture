// Error Handler for Next.js API Routes
// Converts any error into a consistent NextResponse with proper logging

import { NextResponse } from 'next/server';
import { AppError } from './framework';
import crypto from 'crypto';

/**
 * Determine if we're in development mode
 * Shows detailed error information in development, sanitized in production
 */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Generate unique request ID for error tracking
 * Useful for correlating errors across logs and support requests
 */
function generateRequestId(): string {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Log error with context (no sensitive data)
 * Logs different levels based on error type
 */
function logError(error: unknown, requestId: string): void {
  const timestamp = new Date().toISOString();
  const logPrefix = `[${timestamp}] [RequestID: ${requestId}]`;

  if (error instanceof AppError) {
    // Application errors - expected errors, log as warnings
    console.warn(`${logPrefix} ${error.name}:`, {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      // Only log sanitized details
      details: error.toJSON(false).details,
    });
  } else if (error instanceof Error) {
    // Unexpected errors - log as errors with stack trace
    console.error(`${logPrefix} Unexpected Error:`, {
      name: error.name,
      message: error.message,
      stack: isDevelopment ? error.stack : undefined,
    });
  } else {
    // Unknown error type
    console.error(`${logPrefix} Unknown Error:`, error);
  }
}

/**
 * Convert error to user-friendly message
 * Provides helpful messages without exposing internal details
 */
function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Only show error message in development
    if (isDevelopment) {
      return error.message;
    }
  }

  // Generic message for production
  return 'An unexpected error occurred. Please try again later.';
}

/**
 * Extract status code from error
 * Defaults to 500 for unknown errors
 */
function getStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  // Default to 500 for unknown errors
  return 500;
}

/**
 * Build error response body
 * Consistent structure across all API errors
 */
function buildErrorResponse(
  error: unknown,
  requestId: string
): Record<string, unknown> {
  const baseResponse: Record<string, unknown> = {
    error: getUserFriendlyMessage(error),
    code: error instanceof AppError ? error.code : 'INTERNAL_SERVER_ERROR',
    statusCode: getStatusCode(error),
    timestamp: new Date().toISOString(),
    requestId,
  };

  // Add detailed information in development mode
  if (isDevelopment) {
    if (error instanceof AppError) {
      const details = error.toJSON(true).details;
      if (details !== undefined) {
        baseResponse.details = details;
      }
    } else if (error instanceof Error) {
      baseResponse.details = {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5), // First 5 lines of stack
      };
    }
  }

  return baseResponse;
}

/**
 * Main error handler for API routes
 *
 * Usage in API routes:
 * ```typescript
 * import { handleAPIError } from '@/lib/errors/handler';
 *
 * export async function GET(request: NextRequest) {
 *   try {
 *     // Your logic here
 *   } catch (error) {
 *     return handleAPIError(error);
 *   }
 * }
 * ```
 *
 * @param error - Any error thrown in the API route
 * @param context - Optional context for additional logging
 * @returns NextResponse with appropriate status code and error body
 */
export function handleAPIError(
  error: unknown,
  context?: {
    endpoint?: string;
    userId?: string;
    platform?: string;
  }
): NextResponse {
  const requestId = generateRequestId();

  // Log error with context
  if (context) {
    console.warn(`Error context:`, {
      requestId,
      endpoint: context.endpoint,
      userId: context.userId ? `user_${context.userId.slice(0, 8)}...` : undefined,
      platform: context.platform,
    });
  }

  logError(error, requestId);

  // Build and return response
  const statusCode = getStatusCode(error);
  const responseBody = buildErrorResponse(error, requestId);

  const response = NextResponse.json(responseBody, { status: statusCode });

  // Add helpful headers
  response.headers.set('X-Request-ID', requestId);

  // Add retry-after header for rate limit errors
  if (error instanceof AppError && error.code === 'RATE_LIMIT_EXCEEDED') {
    const retryAfter = (error.details as { retryAfter?: number })?.retryAfter || 60;
    response.headers.set('Retry-After', retryAfter.toString());
  }

  return response;
}

/**
 * Create error response for redirects (OAuth flows, etc.)
 * Encodes error information in URL params for client-side display
 *
 * @param error - Any error thrown
 * @param redirectUrl - Base URL to redirect to
 * @returns NextResponse redirect with error params
 */
export function handleRedirectError(
  error: unknown,
  redirectUrl: string | URL
): NextResponse {
  const requestId = generateRequestId();
  logError(error, requestId);

  const url = new URL(redirectUrl);

  // Add error params
  if (error instanceof AppError) {
    url.searchParams.set('error', error.code);
    url.searchParams.set('error_message', error.message);
  } else if (error instanceof Error) {
    url.searchParams.set('error', 'INTERNAL_ERROR');
    url.searchParams.set('error_message', getUserFriendlyMessage(error));
  } else {
    url.searchParams.set('error', 'UNKNOWN_ERROR');
    url.searchParams.set('error_message', 'An unexpected error occurred');
  }

  url.searchParams.set('request_id', requestId);

  return NextResponse.redirect(url);
}
