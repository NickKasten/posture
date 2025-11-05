// src/types/post.ts
// TypeScript types for post generation

/**
 * Generated post response from the AI API
 */
export interface GeneratedPost {
  content: string;
  hashtags: string[];
  characterCount: number;
  platform: 'linkedin' | 'twitter' | 'both';
}

/**
 * Request payload for generating a post
 */
export interface GeneratePostRequest {
  topic: string;
  platform: 'linkedin' | 'twitter' | 'both';
  tone?: 'technical' | 'casual' | 'inspiring';
  githubActivity?: string;
  maxLength?: number;
}

/**
 * Supported social media platforms
 */
export type Platform = 'linkedin' | 'twitter' | 'both';

/**
 * Supported post tones
 */
export type Tone = 'technical' | 'casual' | 'inspiring';

/**
 * Error response from the API
 */
export interface ApiError {
  error: string;
  message?: string;
  details?: string | Array<{ field: string; message: string }>;
}
