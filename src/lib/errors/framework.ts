// Centralized Error Framework for API Routes
// Provides consistent error handling across all API endpoints

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON response format
   * Sanitizes sensitive data and provides consistent structure
   */
  toJSON(isDevelopment: boolean = false): Record<string, unknown> {
    const response: Record<string, unknown> = {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };

    // Only include details in development mode
    if (isDevelopment && this.details !== undefined) {
      response.details = this.sanitizeDetails(this.details);
    }

    return response;
  }

  /**
   * Sanitize error details to prevent leaking sensitive data
   * Removes tokens, secrets, passwords, and other sensitive fields
   */
  private sanitizeDetails(details: unknown): unknown {
    if (typeof details !== 'object' || details === null) {
      return details;
    }

    const sensitiveFields = [
      'token',
      'access_token',
      'refresh_token',
      'code_verifier',
      'code_challenge',
      'password',
      'secret',
      'api_key',
      'apiKey',
      'client_secret',
      'authorization',
    ];

    const sanitized = { ...details } as Record<string, unknown>;

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

/**
 * Authentication error (401)
 * User is not authenticated or credentials are invalid
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: unknown) {
    super(message, 'AUTHENTICATION_REQUIRED', 401, details);
  }
}

/**
 * Authorization error (403)
 * User is authenticated but lacks permission for the resource
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access forbidden', details?: unknown) {
    super(message, 'FORBIDDEN', 403, details);
  }
}

/**
 * Validation error (400)
 * Request data is invalid or missing required fields
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Rate limit error (429)
 * User has exceeded rate limit for the endpoint
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = 'Too many requests',
    details?: unknown & { retryAfter?: number }
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, details);
  }
}

/**
 * Token error (401)
 * OAuth token is invalid, expired, or missing
 */
export class TokenError extends AppError {
  constructor(message: string = 'Invalid or expired token', details?: unknown) {
    super(message, 'TOKEN_ERROR', 401, details);
  }
}

/**
 * External API error (502)
 * Third-party service (LinkedIn, Twitter, etc.) returned an error
 */
export class ExternalAPIError extends AppError {
  public readonly service: string;

  constructor(
    service: string,
    message: string = 'External service error',
    details?: unknown
  ) {
    super(message, 'EXTERNAL_API_ERROR', 502, details);
    this.service = service;
  }

  toJSON(isDevelopment: boolean = false): Record<string, unknown> {
    const json = super.toJSON(isDevelopment);
    json.service = this.service;
    return json;
  }
}

/**
 * Not found error (404)
 * Requested resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string = 'Resource',
    message?: string,
    details?: unknown
  ) {
    super(
      message || `${resource} not found`,
      'NOT_FOUND',
      404,
      details
    );
  }
}

/**
 * Conflict error (409)
 * Request conflicts with current state (e.g., duplicate resource)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: unknown) {
    super(message, 'CONFLICT', 409, details);
  }
}

/**
 * Database error (500)
 * Database operation failed
 */
export class DatabaseError extends AppError {
  constructor(
    message: string = 'Database operation failed',
    details?: unknown
  ) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

/**
 * CSRF validation error (400)
 * State parameter validation failed
 */
export class CSRFError extends AppError {
  constructor(
    message: string = 'CSRF validation failed',
    details?: unknown
  ) {
    super(message, 'CSRF_VALIDATION_FAILED', 400, details);
  }
}

/**
 * PKCE validation error (400)
 * PKCE code verifier validation failed
 */
export class PKCEError extends AppError {
  constructor(
    message: string = 'PKCE validation failed',
    details?: unknown
  ) {
    super(message, 'PKCE_VALIDATION_FAILED', 400, details);
  }
}

/**
 * Configuration error (500)
 * Server configuration is missing or invalid
 */
export class ConfigurationError extends AppError {
  constructor(
    message: string = 'Server configuration error',
    details?: unknown
  ) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
  }
}
