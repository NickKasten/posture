/**
 * DEPRECATED: Use validation-v2.ts instead
 *
 * This module contains legacy validation functions without comprehensive
 * type safety and limited error messaging.
 *
 * Migration Guide:
 * - Replace: validatePostContent() -> validatePostContent() from validation-v2.ts
 * - Replace: validateUserInput() -> validateUserInput() from validation-v2.ts
 * - Use Zod schemas directly from validation-v2.ts for Typescript types
 *
 * The v2 version provides:
 * ✓ Zod-based schemas for type safety
 * ✓ Better error messages
 * ✓ Validation result types with data
 * ✓ Batch validation utilities
 * ✓ Custom refinements for business logic
 *
 * New implementations MUST use validation-v2.ts
 */

export const MAX_USER_INPUT_LENGTH = 500
export const MAX_POST_LENGTH = 1300

export interface ValidationResult {
  isValid: boolean
  error?: string
  characterCount: number
}

export const validateUserInput = (input: string): ValidationResult => {
  const characterCount = input.length
  
  if (characterCount === 0) {
    return {
      isValid: false,
      error: 'Input cannot be empty',
      characterCount: 0
    }
  }
  
  if (characterCount > MAX_USER_INPUT_LENGTH) {
    return {
      isValid: false,
      error: `Input cannot exceed ${MAX_USER_INPUT_LENGTH} characters`,
      characterCount
    }
  }
  
  return {
    isValid: true,
    characterCount
  }
}

export const validatePostContent = (content: string): ValidationResult => {
  const characterCount = content.length
  
  if (characterCount === 0) {
    return {
      isValid: false,
      error: 'Post content cannot be empty',
      characterCount: 0
    }
  }
  
  if (characterCount > MAX_POST_LENGTH) {
    return {
      isValid: false,
      error: `Post cannot exceed ${MAX_POST_LENGTH} characters`,
      characterCount
    }
  }
  
  return {
    isValid: true,
    characterCount
  }
}

export const getCharacterCountDisplay = (current: number, max: number): string => {
  return `${current}/${max}`
}

export const isCharacterLimitExceeded = (current: number, max: number): boolean => {
  return current > max
} 