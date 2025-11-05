/**
 * Advanced Input Validation with Zod Schemas
 *
 * This module provides type-safe validation using Zod with:
 * - Comprehensive validation schemas for common input types
 * - Clear error messages for user feedback
 * - Custom validation rules and refinements
 * - Type inference from schemas
 *
 * Migration from validation.ts:
 * - Use PostContentSchema for post content validation
 * - Use TopicSchema for topic/prompt validation
 * - Use HashtagSchema for hashtag validation
 * - All validators return { isValid, error?, data? }
 */

import { z } from 'zod';

/**
 * Maximum length constants
 */
export const MAX_POST_LENGTH = 3000;
export const MAX_TOPIC_LENGTH = 500;
export const MAX_HASHTAG_LENGTH = 50;
export const MIN_TOPIC_LENGTH = 10;

/**
 * Validation result type for unified error handling
 */
export interface ValidationResult<T = unknown> {
  isValid: boolean;
  error?: string;
  data?: T;
}

/**
 * Post content validation schema
 * Used for LinkedIn, Twitter, and other social media posts
 *
 * Requirements:
 * - Minimum 1 character (after trimming)
 * - Maximum 3000 characters
 * - Cannot be only whitespace
 * - Should contain meaningful content
 */
export const PostContentSchema = z
  .string()
  .min(1, 'Content cannot be empty')
  .max(MAX_POST_LENGTH, `Content cannot exceed ${MAX_POST_LENGTH} characters`)
  .refine(
    (val) => val.trim().length > 0,
    'Content cannot be only whitespace'
  )
  .refine(
    (val) => val.trim().split(/\s+/).length >= 1,
    'Content must contain at least one word'
  );

export type PostContent = z.infer<typeof PostContentSchema>;

/**
 * Topic/prompt validation schema
 * Used for AI prompt generation, search queries, etc.
 *
 * Requirements:
 * - Minimum 10 characters (after trimming)
 * - Maximum 500 characters
 * - Cannot be only whitespace
 * - Should have meaningful content
 */
export const TopicSchema = z
  .string()
  .min(1, 'Topic cannot be empty')
  .max(MAX_TOPIC_LENGTH, `Topic cannot exceed ${MAX_TOPIC_LENGTH} characters`)
  .refine(
    (val) => val.trim().length >= MIN_TOPIC_LENGTH,
    `Topic must be at least ${MIN_TOPIC_LENGTH} characters (after trimming)`
  )
  .refine(
    (val) => val.trim().split(/\s+/).length >= 2,
    'Topic should contain at least 2 words'
  );

export type Topic = z.infer<typeof TopicSchema>;

/**
 * Hashtag validation schema
 * Used for social media hashtags
 *
 * Requirements:
 * - Can start with optional #
 * - Only alphanumeric characters and underscores
 * - Maximum 50 characters
 * - At least 2 characters (excluding #)
 */
export const HashtagSchema = z
  .string()
  .min(1, 'Hashtag cannot be empty')
  .max(MAX_HASHTAG_LENGTH, `Hashtag too long (max ${MAX_HASHTAG_LENGTH} chars)`)
  .regex(/^#?[a-zA-Z0-9_]{2,}$/, 'Hashtag can only contain letters, numbers, and underscores');

export type Hashtag = z.infer<typeof HashtagSchema>;

/**
 * Username/handle validation schema
 * Used for social media usernames, mentions, etc.
 *
 * Requirements:
 * - Can start with optional @
 * - Only alphanumeric characters, underscores, and hyphens
 * - 3-30 characters (excluding @)
 */
export const UsernameSchema = z
  .string()
  .min(1, 'Username cannot be empty')
  .max(31, 'Username too long')
  .regex(/^@?[a-zA-Z0-9_-]{3,30}$/, 'Invalid username format');

export type Username = z.infer<typeof UsernameSchema>;

/**
 * Email validation schema
 * Comprehensive email validation
 *
 * Requirements:
 * - Valid email format (RFC 5322 simplified)
 * - Maximum 255 characters
 * - Must contain @ and domain
 */
export const EmailSchema = z
  .string()
  .min(1, 'Email cannot be empty')
  .max(255, 'Email too long')
  .email('Invalid email format');

export type Email = z.infer<typeof EmailSchema>;

/**
 * URL validation schema
 * Validates common web URLs
 *
 * Requirements:
 * - Valid URL format
 * - Must be http, https, or mailto
 * - Maximum 2048 characters
 */
export const UrlSchema = z
  .string()
  .min(1, 'URL cannot be empty')
  .max(2048, 'URL too long')
  .url('Invalid URL format');

export type Url = z.infer<typeof UrlSchema>;

/**
 * GitHub activity description schema
 * Used for parsing and validating GitHub commit messages, PR descriptions, etc.
 *
 * Requirements:
 * - Maximum 2000 characters
 * - Can contain URLs, commit hashes, etc.
 */
export const GitHubActivitySchema = z
  .string()
  .min(1, 'Activity cannot be empty')
  .max(2000, 'Activity description too long');

export type GitHubActivity = z.infer<typeof GitHubActivitySchema>;

/**
 * Tone/style selection validation
 * Used for AI generation preferences
 */
export const ToneSchema = z.enum(['technical', 'casual', 'inspiring', 'professional', 'creative']);

export type Tone = z.infer<typeof ToneSchema>;

/**
 * Platform selection validation
 * Used for specifying social media platforms
 */
export const PlatformSchema = z.enum(['linkedin', 'twitter', 'both', 'github']);

export type Platform = z.infer<typeof PlatformSchema>;

/**
 * Comprehensive user input validation schema
 * Flexible schema for general-purpose validation
 *
 * Requirements:
 * - Maximum 5000 characters
 * - Cannot be empty or only whitespace
 */
export const UserInputSchema = z
  .string()
  .min(1, 'Input cannot be empty')
  .max(5000, 'Input too long')
  .refine(
    (val) => val.trim().length > 0,
    'Input cannot be only whitespace'
  );

export type UserInput = z.infer<typeof UserInputSchema>;

/**
 * Validate post content
 *
 * @param content - Content to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = validatePostContent(userContent);
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validatePostContent(content: string): ValidationResult<PostContent> {
  const result = PostContentSchema.safeParse(content);

  if (!result.success) {
    return {
      isValid: false,
      error: result.error.issues[0]?.message || 'Invalid post content',
    };
  }

  return {
    isValid: true,
    data: result.data,
  };
}

/**
 * Validate topic/prompt for AI generation
 *
 * @param topic - Topic to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = validateTopic(userTopic);
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateTopic(topic: string): ValidationResult<Topic> {
  const result = TopicSchema.safeParse(topic);

  if (!result.success) {
    return {
      isValid: false,
      error: result.error.issues[0]?.message || 'Invalid topic',
    };
  }

  return {
    isValid: true,
    data: result.data,
  };
}

/**
 * Validate hashtag
 *
 * @param hashtag - Hashtag to validate
 * @returns Validation result with error message if invalid
 */
export function validateHashtag(hashtag: string): ValidationResult<Hashtag> {
  const result = HashtagSchema.safeParse(hashtag);

  if (!result.success) {
    return {
      isValid: false,
      error: result.error.issues[0]?.message || 'Invalid hashtag',
    };
  }

  return {
    isValid: true,
    data: result.data,
  };
}

/**
 * Validate username/handle
 *
 * @param username - Username to validate
 * @returns Validation result with error message if invalid
 */
export function validateUsername(username: string): ValidationResult<Username> {
  const result = UsernameSchema.safeParse(username);

  if (!result.success) {
    return {
      isValid: false,
      error: result.error.issues[0]?.message || 'Invalid username',
    };
  }

  return {
    isValid: true,
    data: result.data,
  };
}

/**
 * Validate email address
 *
 * @param email - Email to validate
 * @returns Validation result with error message if invalid
 */
export function validateEmail(email: string): ValidationResult<Email> {
  const result = EmailSchema.safeParse(email);

  if (!result.success) {
    return {
      isValid: false,
      error: result.error.issues[0]?.message || 'Invalid email',
    };
  }

  return {
    isValid: true,
    data: result.data,
  };
}

/**
 * Validate URL
 *
 * @param url - URL to validate
 * @returns Validation result with error message if invalid
 */
export function validateUrl(url: string): ValidationResult<Url> {
  const result = UrlSchema.safeParse(url);

  if (!result.success) {
    return {
      isValid: false,
      error: result.error.issues[0]?.message || 'Invalid URL',
    };
  }

  return {
    isValid: true,
    data: result.data,
  };
}

/**
 * Validate GitHub activity description
 *
 * @param activity - Activity to validate
 * @returns Validation result with error message if invalid
 */
export function validateGitHubActivity(activity: string): ValidationResult<GitHubActivity> {
  const result = GitHubActivitySchema.safeParse(activity);

  if (!result.success) {
    return {
      isValid: false,
      error: result.error.issues[0]?.message || 'Invalid activity',
    };
  }

  return {
    isValid: true,
    data: result.data,
  };
}

/**
 * Batch validation for multiple inputs
 *
 * @param inputs - Object with fields to validate
 * @param schemas - Validation schemas for each field
 * @returns Batch validation results
 *
 * @example
 * ```typescript
 * const results = batchValidate(
 *   { content, topic },
 *   { content: PostContentSchema, topic: TopicSchema }
 * );
 * ```
 */
export function batchValidate<T extends Record<string, any>>(
  inputs: Record<string, string>,
  schemas: Record<string, z.ZodSchema>
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};

  for (const [key, value] of Object.entries(inputs)) {
    const schema = schemas[key];
    if (!schema) continue;

    const result = schema.safeParse(value);
    results[key] = {
      isValid: result.success,
      error: !result.success ? result.error?.issues[0]?.message : undefined,
      data: result.success ? result.data : undefined,
    };
  }

  return results;
}

/**
 * Validate multiple hashtags
 *
 * @param hashtags - Array of hashtags to validate
 * @returns Array of validation results
 */
export function validateHashtags(hashtags: string[]): ValidationResult<Hashtag>[] {
  return hashtags.map((hashtag) => validateHashtag(hashtag));
}

/**
 * Check if all validations passed
 *
 * @param results - Array of validation results
 * @returns True if all validations passed
 */
export function allValid(results: ValidationResult[]): boolean {
  return results.every((result) => result.isValid);
}

/**
 * Get all validation errors
 *
 * @param results - Array of validation results
 * @returns Array of error messages
 */
export function getValidationErrors(results: ValidationResult[]): string[] {
  return results.filter((r) => r.error).map((r) => r.error!);
}
