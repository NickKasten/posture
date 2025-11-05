/**
 * Advanced Input Sanitization and XSS Prevention
 *
 * This module provides comprehensive sanitization for user inputs with:
 * - Unicode normalization to prevent bypass attacks
 * - XSS prevention using DOMPurify
 * - AI prompt injection pattern detection and removal
 * - Character whitelisting with emoji support
 * - Configurable length limits and rules
 *
 * Migration from sanitize.ts:
 * - Use sanitizePostContent() for post/content inputs
 * - Use sanitizeTopic() for topic/prompt inputs
 * - Use sanitizeUserInput() for general-purpose inputs
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Configuration options for sanitization
 */
export interface SanitizeOptions {
  /** Maximum length of sanitized output (default: 5000) */
  maxLength?: number;
  /** HTML tags allowed in output (default: []) */
  allowedTags?: string[];
  /** Allow emoji characters (default: true) */
  allowEmojis?: boolean;
  /** Remove AI prompt injection patterns (default: true) */
  preventAIInjection?: boolean;
  /** Allow newlines (default: true) */
  allowNewlines?: boolean;
  /** Trim whitespace (default: true) */
  trim?: boolean;
}

/**
 * Common patterns used in AI prompt injection attacks
 */
const AI_INJECTION_PATTERNS = [
  // Role/system directives
  /\b(system|assistant|user|role|instruction|prompt|context)\s*:/gi,
  // Ignore directives - matches both variations
  /\b(ignore|disregard|forget|override|bypass)\b/gi,
  // Code blocks
  /```[\s\S]*?```/g,
  // Quote markers and special formatting
  /^[\s>]+/gm,
  // Special tokens (common in LLM contexts)
  /<\|.*?\|>/g,
  // Command injection patterns
  /\b(execute|eval|run|do this|do that|perform)\s*:\s*/gi,
  // HTML/XML injection
  /<[^>]*>/g,
];

/**
 * Unicode characters that are commonly used in bypass attacks
 * This helps catch homoglyph and homophone attacks
 */
const SUSPICIOUS_UNICODE_PATTERNS = [
  // Zero-width characters
  /[\u200B-\u200D\uFEFF]/g,
  // Right-to-left override
  /\u202E/g,
  // Combining diacritical marks used for obfuscation
  /[\u0300-\u036F]/g,
];

/**
 * Main sanitization function with comprehensive protection
 *
 * @param input - User input string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string
 *
 * @example
 * ```typescript
 * const clean = sanitizeUserInput(userInput, {
 *   maxLength: 3000,
 *   allowEmojis: true,
 *   preventAIInjection: true
 * });
 * ```
 */
export function sanitizeUserInput(
  input: string,
  options: SanitizeOptions = {}
): string {
  // Validate input
  if (typeof input !== 'string') {
    return '';
  }

  const {
    maxLength = 5000,
    allowedTags = [],
    allowEmojis = true,
    preventAIInjection = true,
    allowNewlines = true,
    trim: shouldTrim = true,
  } = options;

  let cleaned = input;

  // Step 1: Remove suspicious Unicode patterns (prevents Unicode bypass attacks)
  for (const pattern of SUSPICIOUS_UNICODE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Step 2: Unicode normalization (NFKC - compatibility decomposition)
  // This prevents lookalike character attacks
  cleaned = cleaned.normalize('NFKC');

  // Step 3: Use DOMPurify for HTML/XSS prevention
  cleaned = DOMPurify.sanitize(cleaned, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    FORCE_BODY: false,
    RETURN_DOM: false,
  });

  // Step 4: Remove AI prompt injection patterns
  if (preventAIInjection) {
    cleaned = removeAIInjectionPatterns(cleaned);
  }

  // Step 5: Character whitelist with emoji support
  if (allowEmojis) {
    // Allow: letters, numbers, punctuation, whitespace, and emojis
    // Using Unicode property escapes: \p{L}=Letter, \p{N}=Number, \p{P}=Punctuation,
    // \p{Z}=Separator, \p{Emoji}=Emoji, \p{Emoji_Component}=Emoji components
    // Also allow a few safe symbols: @, #, /, :, and newlines if allowNewlines is true
    const pattern = allowNewlines
      ? /[^\p{L}\p{N}\p{P}\p{Z}\p{Emoji}\p{Emoji_Component}@#/:\n]/gu
      : /[^\p{L}\p{N}\p{P}\p{Z}\p{Emoji}\p{Emoji_Component}@#/:]/gu;
    cleaned = cleaned.replace(pattern, '');
  } else {
    // Strict ASCII only: alphanumeric, basic punctuation, and common symbols
    // Include newlines in whitespace only if allowNewlines is true
    const pattern = allowNewlines
      ? /[^a-zA-Z0-9\s.,!?'"()\-_/\\@#$%&+=:;\n]/g
      : /[^a-zA-Z0-9.,!?'"()\-_/\\@#$%&+=:; ]/g;
    cleaned = cleaned.replace(pattern, '');
  }

  // Step 6: Normalize whitespace
  if (allowNewlines) {
    // Collapse multiple spaces (but preserve single newlines)
    cleaned = cleaned.replace(/[ \t]+/g, ' ').replace(/(\r\n|\r|\n)\s*/g, '\n');
  } else {
    // Remove all newlines and collapse multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ');
  }

  // Step 7: Trim if requested (only trim leading/trailing whitespace, preserve internal newlines)
  if (shouldTrim) {
    if (allowNewlines) {
      // Only trim spaces/tabs, not newlines
      cleaned = cleaned.replace(/^[ \t]+|[ \t]+$/gm, '').replace(/^\n+|\n+$/g, '');
    } else {
      cleaned = cleaned.trim();
    }
  }

  // Step 8: Enforce length limit
  if (cleaned.length > maxLength) {
    let truncated = cleaned.substring(0, maxLength);
    if (shouldTrim) {
      if (allowNewlines) {
        truncated = truncated.replace(/^[ \t]+|[ \t]+$/gm, '').replace(/^\n+|\n+$/g, '');
      } else {
        truncated = truncated.trim();
      }
    }
    cleaned = truncated;
  }

  return cleaned;
}

/**
 * Remove common AI prompt injection patterns
 *
 * This function targets patterns frequently used to manipulate AI systems:
 * - Role-switching directives (system:, assistant:)
 * - Override instructions (ignore previous instructions)
 * - Code injection attempts
 * - Special tokens and formatting
 *
 * @param text - Input text
 * @returns Text with injection patterns removed
 */
export function removeAIInjectionPatterns(text: string): string {
  let cleaned = text;

  for (const pattern of AI_INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  // Clean up resulting multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Sanitize post content (social media posts)
 * Optimized for LinkedIn/Twitter with emoji support
 *
 * @param content - Post content to sanitize
 * @returns Sanitized post content
 *
 * @example
 * ```typescript
 * const cleanPost = sanitizePostContent(userPost);
 * ```
 */
export function sanitizePostContent(content: string): string {
  return sanitizeUserInput(content, {
    maxLength: 3000, // LinkedIn max is 3000, Twitter is less but we allow up to LinkedIn's limit
    allowEmojis: true,
    preventAIInjection: true,
    allowNewlines: true,
    trim: true,
  });
}

/**
 * Sanitize topic/prompt input for AI generation
 * Prevents prompt injection while maintaining usability
 *
 * @param topic - Topic/prompt to sanitize
 * @returns Sanitized topic
 *
 * @example
 * ```typescript
 * const cleanTopic = sanitizeTopic(userTopic);
 * ```
 */
export function sanitizeTopic(topic: string): string {
  return sanitizeUserInput(topic, {
    maxLength: 500,
    allowEmojis: true,
    preventAIInjection: true,
    allowNewlines: false, // Topics should be single-line
    trim: true,
  });
}

/**
 * Sanitize hashtag input
 * Validates hashtag format and removes invalid characters
 *
 * @param hashtag - Hashtag to sanitize (with or without #)
 * @returns Sanitized hashtag
 *
 * @example
 * ```typescript
 * const cleanHashtag = sanitizeHashtag('#JavaScript');
 * // Returns: 'JavaScript'
 * ```
 */
export function sanitizeHashtag(hashtag: string): string {
  let cleaned = hashtag.trim();

  // Remove leading # if present
  if (cleaned.startsWith('#')) {
    cleaned = cleaned.substring(1);
  }

  // Keep only alphanumeric and underscore
  cleaned = cleaned.replace(/[^a-zA-Z0-9_]/g, '');

  // Limit to 50 characters (Twitter hashtag limit)
  cleaned = cleaned.substring(0, 50);

  return cleaned;
}

/**
 * Sanitize URLs (basic validation)
 * Removes dangerous URL schemes and patterns
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 *
 * @example
 * ```typescript
 * const cleanUrl = sanitizeUrl('javascript:alert("xss")');
 * // Returns: ''
 * ```
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  const trimmed = url.trim();

  // Dangerous URL schemes
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const scheme of dangerousSchemes) {
    if (trimmed.toLowerCase().startsWith(scheme)) {
      return '';
    }
  }

  // Only allow http, https, and mailto
  if (!/^(https?:\/\/|mailto:|\/)/i.test(trimmed)) {
    return '';
  }

  return trimmed;
}

/**
 * Sanitize email addresses
 * Basic email validation and sanitization
 *
 * @param email - Email to sanitize
 * @returns Sanitized email or empty string if invalid
 *
 * @example
 * ```typescript
 * const cleanEmail = sanitizeEmail('user@example.com');
 * ```
 */
export function sanitizeEmail(email: string): string {
  const cleaned = email.trim().toLowerCase();

  // Basic email regex (RFC 5322 simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(cleaned)) {
    return '';
  }

  return cleaned;
}

/**
 * Batch sanitization for multiple inputs
 *
 * @param inputs - Object with string values to sanitize
 * @param options - Sanitization options
 * @returns Object with sanitized values
 *
 * @example
 * ```typescript
 * const clean = sanitizeBatch({ title, content, topic }, { maxLength: 500 });
 * ```
 */
export function sanitizeBatch<T extends Record<string, string>>(
  inputs: T,
  options: SanitizeOptions = {}
): Record<keyof T, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(inputs)) {
    result[key] = sanitizeUserInput(value, options);
  }

  return result as Record<keyof T, string>;
}

/**
 * Check if input contains potentially malicious patterns
 * Returns information about detected patterns for logging/debugging
 *
 * @param input - Input to check
 * @returns Object with detection results
 *
 * @example
 * ```typescript
 * const check = detectMaliciousPatterns(userInput);
 * if (check.foundPatterns.length > 0) {
 *   console.warn('Suspicious patterns detected:', check.foundPatterns);
 * }
 * ```
 */
export function detectMaliciousPatterns(input: string): {
  hasMaliciousPatterns: boolean;
  foundPatterns: string[];
  riskLevel: 'low' | 'medium' | 'high';
} {
  const foundPatterns: string[] = [];

  // Check for XSS patterns
  if (/<[^>]*>/g.test(input)) {
    foundPatterns.push('HTML_TAGS');
  }

  // Check for script tags
  if (/<script/i.test(input)) {
    foundPatterns.push('SCRIPT_TAG');
  }

  // Check for event handlers
  if (/on\w+\s*=/i.test(input)) {
    foundPatterns.push('EVENT_HANDLER');
  }

  // Check for AI injection
  for (const pattern of AI_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      foundPatterns.push('AI_INJECTION');
      break;
    }
  }

  // Check for URL scheme attacks
  if (/(javascript|data|vbscript):/i.test(input)) {
    foundPatterns.push('DANGEROUS_URL_SCHEME');
  }

  // Check for SQL injection patterns
  if (/(union|select|insert|update|delete|drop)\s+/i.test(input)) {
    foundPatterns.push('SQL_INJECTION');
  }

  // Check for suspicious Unicode
  let hasSuspiciousUnicode = false;
  for (const pattern of SUSPICIOUS_UNICODE_PATTERNS) {
    if (pattern.test(input)) {
      hasSuspiciousUnicode = true;
      break;
    }
  }
  if (hasSuspiciousUnicode) {
    foundPatterns.push('SUSPICIOUS_UNICODE');
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (foundPatterns.includes('SCRIPT_TAG') || foundPatterns.includes('DANGEROUS_URL_SCHEME')) {
    riskLevel = 'high';
  } else if (
    foundPatterns.includes('HTML_TAGS') ||
    foundPatterns.includes('EVENT_HANDLER') ||
    foundPatterns.includes('AI_INJECTION')
  ) {
    riskLevel = 'medium';
  }

  return {
    hasMaliciousPatterns: foundPatterns.length > 0,
    foundPatterns,
    riskLevel,
  };
}
