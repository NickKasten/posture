// src/lib/ai/client.test.ts
// Tests for OpenAI GPT-5-mini client

import { estimateCost, MODEL } from './client';

// Mock the entire client module to avoid real OpenAI calls
const mockCreate = jest.fn();

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

describe('AI Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockClear();
  });

  describe('generatePost', () => {
    it('should generate a LinkedIn post successfully', async () => {
      const { generatePost } = await import('./client');

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                content: 'Just reduced API latency by 40%! 🚀 #WebDev #Performance',
                hashtags: ['WebDev', 'Performance'],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await generatePost({
        topic: 'I reduced API latency by 40%',
        platform: 'linkedin',
        tone: 'technical',
      });

      expect(result).toEqual({
        content: 'Just reduced API latency by 40%! 🚀 #WebDev #Performance',
        hashtags: ['WebDev', 'Performance'],
        characterCount: 58,
        platform: 'linkedin',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: MODEL,
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
        temperature: 0.7,
        max_tokens: 500,
      });
    });

    it('should handle rate limit errors with retry', async () => {
      const { generatePost } = await import('./client');

      const rateLimitError = { status: 429, message: 'Rate limit exceeded' };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                content: 'Success after retry',
                hashtags: ['Success'],
              }),
            },
          },
        ],
      };

      mockCreate
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockResponse);

      const result = await generatePost({
        topic: 'Test retry',
        platform: 'linkedin',
      });

      expect(result.content).toBe('Success after retry');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries exhausted', async () => {
      const { generatePost } = await import('./client');

      const rateLimitError = { status: 429, message: 'Rate limit exceeded' };

      mockCreate.mockRejectedValue(rateLimitError);

      await expect(
        generatePost({
          topic: 'Test failure',
          platform: 'linkedin',
        })
      ).rejects.toThrow('Failed to generate post after 3 attempts');

      expect(mockCreate).toHaveBeenCalledTimes(3);
    }, 10000); // Increase timeout for retry delays

    it('should handle non-JSON response gracefully', async () => {
      const { generatePost } = await import('./client');

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is a plain text response #Test #Fallback',
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await generatePost({
        topic: 'Test fallback',
        platform: 'twitter',
      });

      expect(result.content).toBe('This is a plain text response #Test #Fallback');
      expect(result.hashtags).toEqual(['Test', 'Fallback']);
      expect(result.platform).toBe('twitter');
    });

    it('should include GitHub activity in prompt when provided', async () => {
      const { generatePost } = await import('./client');

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                content: 'Post with GitHub context',
                hashtags: ['GitHub'],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await generatePost({
        topic: 'My recent work',
        platform: 'linkedin',
        githubActivity: 'Fixed critical bug in auth module',
      });

      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');

      expect(userMessage.content).toContain('Recent GitHub activity');
      expect(userMessage.content).toContain('Fixed critical bug');
    });

    it('should respect platform character limits', async () => {
      const { generatePost } = await import('./client');

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                content: 'Short tweet #Twitter',
                hashtags: ['Twitter'],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await generatePost({
        topic: 'Quick update',
        platform: 'twitter',
      });

      const callArgs = mockCreate.mock.calls[0][0];
      const systemMessage = callArgs.messages.find((m: any) => m.role === 'system');

      expect(systemMessage.content).toContain('Character limit: 280');
    });
  });

  describe('estimateCost', () => {
    it('should calculate cost correctly for typical post generation', () => {
      // Typical request: ~300 input tokens, ~150 output tokens
      const cost = estimateCost(300, 150);

      // Expected: (300 / 1M * $0.25) + (150 / 1M * $2.00)
      // = 0.000075 + 0.0003 = 0.000375
      expect(cost).toBeCloseTo(0.000375, 6);
    });

    it('should calculate cost for 100 posts per day', () => {
      // 100 posts * (300 input + 150 output tokens)
      const totalInput = 100 * 300;
      const totalOutput = 100 * 150;
      const cost = estimateCost(totalInput, totalOutput);

      // Expected: ~$0.0375 per day
      expect(cost).toBeCloseTo(0.0375, 4);
    });

    it('should handle zero tokens', () => {
      const cost = estimateCost(0, 0);
      expect(cost).toBe(0);
    });
  });
});
