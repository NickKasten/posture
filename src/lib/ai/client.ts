// src/lib/ai/client.ts
// OpenAI GPT-5-mini client wrapper with retry logic and error handling

import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configuration
export const MODEL = 'gpt-5-mini-2025-08-07';
export const MAX_TOKENS = 500; // For LinkedIn posts (~300-400 words)
export const TEMPERATURE = 0.7; // Balance creativity and coherence

// Post generation types
export interface GeneratePostOptions {
  topic: string;
  platform: 'linkedin' | 'twitter' | 'both';
  tone?: 'technical' | 'casual' | 'inspiring';
  githubActivity?: string;
  maxLength?: number;
}

export interface GeneratePostResponse {
  content: string;
  hashtags: string[];
  characterCount: number;
  platform: 'linkedin' | 'twitter';
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate LinkedIn/Twitter post using GPT-5-mini
 *
 * Features:
 * - Automatic retries with exponential backoff
 * - Error handling for rate limits and API failures
 * - Platform-specific character limits
 * - Structured output with hashtags
 */
export async function generatePost(
  options: GeneratePostOptions
): Promise<GeneratePostResponse> {
  const { topic, platform, tone = 'professional', githubActivity, maxLength } = options;

  // Determine character limit based on platform
  const charLimit = platform === 'twitter' ? 280 : maxLength || 1300;

  // Build system prompt
  const systemPrompt = buildSystemPrompt(platform, tone, charLimit);

  // Build user prompt
  const userPrompt = buildUserPrompt(topic, githubActivity);

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  // Attempt generation with retries
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages,
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      // Parse response
      const parsed = parsePostResponse(content, platform);

      return parsed;

    } catch (error) {
      lastError = error as Error;

      // Check if it's a rate limit error
      const isRateLimit = (error as any)?.status === 429 ||
                          (error as any)?.code === 'rate_limit_exceeded';

      if (isRateLimit) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        continue;
      }

      // For other errors, rethrow immediately
      throw error;
    }
  }

  // All retries exhausted
  throw new Error(`Failed to generate post after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

/**
 * Build system prompt based on platform and tone
 */
function buildSystemPrompt(
  platform: 'linkedin' | 'twitter' | 'both',
  tone: string,
  charLimit: number
): string {
  const platformName = platform === 'twitter' ? 'Twitter' : 'LinkedIn';

  return `You are a professional ${platformName} post writer.

Tone: ${tone}
Character limit: ${charLimit} characters (strict)

Your task:
1. Write an engaging ${platformName} post about the user's professional achievement
2. Keep it under ${charLimit} characters INCLUDING hashtags
3. Include 2-4 relevant hashtags at the end
4. Use a ${tone} tone
5. Make it authentic and relatable

Format your response as JSON:
{
  "content": "The post content with hashtags at the end",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}

Important: The content field should be the COMPLETE post including hashtags.`;
}

/**
 * Build user prompt with topic and optional GitHub context
 */
function buildUserPrompt(topic: string, githubActivity?: string): string {
  let prompt = `Write a post about: ${topic}`;

  if (githubActivity) {
    prompt += `\n\nRecent GitHub activity for context:\n${githubActivity}`;
  }

  return prompt;
}

/**
 * Parse and validate GPT-5-mini response
 */
function parsePostResponse(
  content: string,
  platform: 'linkedin' | 'twitter' | 'both'
): GeneratePostResponse {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(content);

    if (!parsed.content || !Array.isArray(parsed.hashtags)) {
      throw new Error('Invalid response format');
    }

    return {
      content: parsed.content,
      hashtags: parsed.hashtags,
      characterCount: parsed.content.length,
      platform: platform === 'both' ? 'linkedin' : platform,
    };
  } catch (error) {
    // Fallback: treat entire response as content
    console.warn('Failed to parse JSON response, using raw content');

    // Extract hashtags from content
    const hashtags = extractHashtags(content);

    return {
      content,
      hashtags,
      characterCount: content.length,
      platform: platform === 'both' ? 'linkedin' : platform,
    };
  }
}

/**
 * Extract hashtags from text
 */
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

/**
 * Estimate cost for a post generation request
 *
 * Based on GPT-5-mini pricing:
 * - Input: $0.25 per 1M tokens
 * - Output: $2.00 per 1M tokens
 */
export function estimateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 0.25;
  const outputCost = (outputTokens / 1_000_000) * 2.0;
  return inputCost + outputCost;
}
