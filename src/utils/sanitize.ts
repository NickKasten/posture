/**
 * DEPRECATED: Use sanitize-v2.ts instead
 *
 * This module contains legacy sanitization functions with limited XSS protection
 * and no protection against Unicode bypass attacks or AI prompt injection.
 *
 * Migration Guide:
 * - Replace: sanitizeUserInput() -> sanitizeUserInput() from sanitize-v2.ts
 * - For posts: use sanitizePostContent() from sanitize-v2.ts
 * - For topics: use sanitizeTopic() from sanitize-v2.ts
 *
 * The v2 version provides:
 * ✓ Comprehensive XSS prevention with DOMPurify
 * ✓ Unicode normalization (NFKC)
 * ✓ AI prompt injection pattern detection
 * ✓ Character whitelisting with emoji support
 * ✓ Configurable sanitization options
 *
 * New implementations MUST use sanitize-v2.ts
 */

export const sanitizeUserInput = (input: string): string => {
  return input
    .replace(/```/g, '')
    .replace(/System:/g, '')
    .replace(/Assistant:/g, '')
    .replace(/[^\w\s.,!?_()[\]{}-]/g, '')
    .slice(0, 500)
}