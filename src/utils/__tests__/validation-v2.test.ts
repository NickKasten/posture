/**
 * Comprehensive tests for validation-v2.ts
 * Tests Zod-based validation schemas and functions
 */

import {
  validatePostContent,
  validateTopic,
  validateHashtag,
  validateUsername,
  validateEmail,
  validateUrl,
  validateGitHubActivity,
  validateHashtags,
  allValid,
  getValidationErrors,
  batchValidate,
  PostContentSchema,
  TopicSchema,
  HashtagSchema,
  UsernameSchema,
  EmailSchema,
  UrlSchema,
  GitHubActivitySchema,
  ToneSchema,
  PlatformSchema,
  MAX_POST_LENGTH,
  MAX_TOPIC_LENGTH,
  MAX_HASHTAG_LENGTH,
  MIN_TOPIC_LENGTH,
} from '../validation-v2';

describe('Validation Utilities - validation-v2.ts', () => {
  describe('validatePostContent', () => {
    it('should accept valid post content', () => {
      const content = 'This is a great post about software development.';
      const result = validatePostContent(content);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data).toEqual(content);
    });

    it('should reject empty content', () => {
      const result = validatePostContent('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('empty');
    });

    it('should reject whitespace-only content', () => {
      const result = validatePostContent('   \n\t   ');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject content exceeding max length', () => {
      const content = 'a'.repeat(MAX_POST_LENGTH + 1);
      const result = validatePostContent(content);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot exceed');
    });

    it('should accept content at max length boundary', () => {
      const content = 'a'.repeat(MAX_POST_LENGTH);
      const result = validatePostContent(content);

      expect(result.isValid).toBe(true);
    });

    it('should accept multi-line content', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const result = validatePostContent(content);

      expect(result.isValid).toBe(true);
    });

    it('should accept content with punctuation and special chars', () => {
      const content = 'Check this out! 🚀 Amazing achievement. #WebDev';
      const result = validatePostContent(content);

      expect(result.isValid).toBe(true);
    });

    it('should accept minimum valid content (1 char)', () => {
      const result = validatePostContent('a');

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateTopic', () => {
    it('should accept valid topic', () => {
      const topic = 'How to build scalable APIs with Node.js';
      const result = validateTopic(topic);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data).toEqual(topic);
    });

    it('should reject topic shorter than minimum', () => {
      const topic = 'short';
      const result = validateTopic(topic);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least');
      expect(result.error).toContain('10');
    });

    it('should reject topic with single word after trim', () => {
      const topic = 'verylongtopic';
      const result = validateTopic(topic);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 2 words');
    });

    it('should accept topic at minimum length with 2 words', () => {
      const topic = 'ab cd ef gh ij'; // 14 chars, 5 words
      const result = validateTopic(topic);

      expect(result.isValid).toBe(true);
    });

    it('should reject topic exceeding max length', () => {
      const topic = 'a b ' + 'c'.repeat(MAX_TOPIC_LENGTH);
      const result = validateTopic(topic);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot exceed');
    });

    it('should accept topic at max length boundary', () => {
      // Create a topic that's exactly MAX_TOPIC_LENGTH but valid
      const words = Array(Math.ceil(MAX_TOPIC_LENGTH / 5)).fill('word');
      const topic = words.join(' ').substring(0, MAX_TOPIC_LENGTH);
      const result = validateTopic(topic);

      // As long as it has valid structure it should work
      expect(result.isValid).toBe(true);
    });

    it('should reject empty topic', () => {
      const result = validateTopic('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject whitespace-only topic', () => {
      const result = validateTopic('   \n\t   ');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should trim whitespace when validating length', () => {
      const topic = '  How to build APIs  ';
      const result = validateTopic(topic);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateHashtag', () => {
    it('should accept valid hashtag with #', () => {
      const result = validateHashtag('#JavaScript');

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual('#JavaScript');
    });

    it('should accept valid hashtag without #', () => {
      const result = validateHashtag('JavaScript');

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual('JavaScript');
    });

    it('should accept hashtag with numbers', () => {
      const result = validateHashtag('#WebDev2024');

      expect(result.isValid).toBe(true);
    });

    it('should accept hashtag with underscores', () => {
      const result = validateHashtag('#Web_Development');

      expect(result.isValid).toBe(true);
    });

    it('should reject hashtag with special characters', () => {
      const result = validateHashtag('#Web-Dev@2024');

      expect(result.isValid).toBe(false);
    });

    it('should reject single character hashtag', () => {
      const result = validateHashtag('#A');

      expect(result.isValid).toBe(false);
    });

    it('should reject hashtag exceeding max length', () => {
      const hashtag = '#' + 'a'.repeat(MAX_HASHTAG_LENGTH + 1);
      const result = validateHashtag(hashtag);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should accept hashtag at max length boundary', () => {
      const hashtag = '#' + 'a'.repeat(MAX_HASHTAG_LENGTH - 1);
      const result = validateHashtag(hashtag);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateUsername', () => {
    it('should accept valid username with @', () => {
      const result = validateUsername('@john_doe');

      expect(result.isValid).toBe(true);
    });

    it('should accept valid username without @', () => {
      const result = validateUsername('john_doe');

      expect(result.isValid).toBe(true);
    });

    it('should accept username with numbers', () => {
      const result = validateUsername('@user2024');

      expect(result.isValid).toBe(true);
    });

    it('should accept username with hyphens', () => {
      const result = validateUsername('john-doe');

      expect(result.isValid).toBe(true);
    });

    it('should reject username with special characters', () => {
      const result = validateUsername('user@#$');

      expect(result.isValid).toBe(false);
    });

    it('should reject username shorter than 3 characters', () => {
      const result = validateUsername('ab');

      expect(result.isValid).toBe(false);
    });

    it('should reject username longer than 30 characters (excluding @)', () => {
      const result = validateUsername('@' + 'a'.repeat(31));

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email', () => {
      const result = validateEmail('user@example.com');

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual('user@example.com');
    });

    it('should accept email with plus addressing', () => {
      const result = validateEmail('user+tag@example.com');

      expect(result.isValid).toBe(true);
    });

    it('should accept email with subdomain', () => {
      const result = validateEmail('user@mail.example.co.uk');

      expect(result.isValid).toBe(true);
    });

    it('should reject email without @', () => {
      const result = validateEmail('userexample.com');

      expect(result.isValid).toBe(false);
    });

    it('should reject email without domain', () => {
      const result = validateEmail('user@');

      expect(result.isValid).toBe(false);
    });

    it('should reject email without local part', () => {
      const result = validateEmail('@example.com');

      expect(result.isValid).toBe(false);
    });

    it('should reject email with spaces', () => {
      const result = validateEmail('user @example.com');

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should accept http URL', () => {
      const result = validateUrl('http://example.com');

      expect(result.isValid).toBe(true);
    });

    it('should accept https URL', () => {
      const result = validateUrl('https://example.com/path');

      expect(result.isValid).toBe(true);
    });

    it('should accept URL with query parameters', () => {
      const result = validateUrl('https://example.com/page?id=123');

      expect(result.isValid).toBe(true);
    });

    it('should accept URL with fragment', () => {
      const result = validateUrl('https://example.com#section');

      expect(result.isValid).toBe(true);
    });

    it('should reject URL without protocol', () => {
      const result = validateUrl('example.com');

      expect(result.isValid).toBe(false);
    });

    it('should reject invalid URL', () => {
      const result = validateUrl('not a url');

      expect(result.isValid).toBe(false);
    });

    it('should reject empty URL', () => {
      const result = validateUrl('');

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateGitHubActivity', () => {
    it('should accept valid activity description', () => {
      const activity = 'Fixed bug in authentication system';
      const result = validateGitHubActivity(activity);

      expect(result.isValid).toBe(true);
    });

    it('should accept activity with commit hash', () => {
      const activity = 'Merged PR #1234 in commit abc123def456';
      const result = validateGitHubActivity(activity);

      expect(result.isValid).toBe(true);
    });

    it('should accept activity with URLs', () => {
      const activity = 'See https://github.com/user/repo/pull/123 for details';
      const result = validateGitHubActivity(activity);

      expect(result.isValid).toBe(true);
    });

    it('should reject empty activity', () => {
      const result = validateGitHubActivity('');

      expect(result.isValid).toBe(false);
    });

    it('should reject activity exceeding max length', () => {
      const activity = 'a'.repeat(2001);
      const result = validateGitHubActivity(activity);

      expect(result.isValid).toBe(false);
    });
  });

  describe('Zod Schemas', () => {
    it('PostContentSchema should validate directly', () => {
      const result = PostContentSchema.safeParse('Valid content');
      expect(result.success).toBe(true);
    });

    it('TopicSchema should validate directly', () => {
      const result = TopicSchema.safeParse('Valid topic with words');
      expect(result.success).toBe(true);
    });

    it('ToneSchema should accept valid tones', () => {
      const validTones = ['technical', 'casual', 'inspiring', 'professional', 'creative'];

      for (const tone of validTones) {
        const result = ToneSchema.safeParse(tone);
        expect(result.success).toBe(true);
      }
    });

    it('ToneSchema should reject invalid tone', () => {
      const result = ToneSchema.safeParse('invalid-tone');
      expect(result.success).toBe(false);
    });

    it('PlatformSchema should accept valid platforms', () => {
      const validPlatforms = ['linkedin', 'twitter', 'both', 'github'];

      for (const platform of validPlatforms) {
        const result = PlatformSchema.safeParse(platform);
        expect(result.success).toBe(true);
      }
    });

    it('PlatformSchema should reject invalid platform', () => {
      const result = PlatformSchema.safeParse('instagram');
      expect(result.success).toBe(false);
    });
  });

  describe('validateHashtags (plural)', () => {
    it('should validate multiple hashtags', () => {
      const hashtags = ['#JavaScript', '#WebDev', '#React'];
      const results = validateHashtags(hashtags);

      expect(results.length).toBe(3);
      expect(results.every((r) => r.isValid)).toBe(true);
    });

    it('should handle mixed valid and invalid hashtags', () => {
      const hashtags = ['#Valid', '#in@valid', '#OK'];
      const results = validateHashtags(hashtags);

      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[2].isValid).toBe(true);
    });

    it('should return empty array for empty input', () => {
      const results = validateHashtags([]);
      expect(results).toEqual([]);
    });
  });

  describe('allValid utility', () => {
    it('should return true when all results are valid', () => {
      const results = [
        { isValid: true },
        { isValid: true },
        { isValid: true },
      ];

      expect(allValid(results)).toBe(true);
    });

    it('should return false when any result is invalid', () => {
      const results = [
        { isValid: true },
        { isValid: false },
        { isValid: true },
      ];

      expect(allValid(results)).toBe(false);
    });

    it('should work with empty array', () => {
      expect(allValid([])).toBe(true);
    });
  });

  describe('getValidationErrors utility', () => {
    it('should extract error messages from results', () => {
      const results = [
        { isValid: true },
        { isValid: false, error: 'Error 1' },
        { isValid: false, error: 'Error 2' },
      ];

      const errors = getValidationErrors(results);

      expect(errors).toHaveLength(2);
      expect(errors).toContain('Error 1');
      expect(errors).toContain('Error 2');
    });

    it('should return empty array when all valid', () => {
      const results = [{ isValid: true }, { isValid: true }];

      const errors = getValidationErrors(results);

      expect(errors).toEqual([]);
    });
  });

  describe('batchValidate utility', () => {
    it('should validate multiple fields with different schemas', () => {
      const inputs = {
        content: 'Valid post content here',
        topic: 'This is a valid topic with words',
        email: 'user@example.com',
      };

      const schemas = {
        content: PostContentSchema,
        topic: TopicSchema,
        email: EmailSchema,
      };

      const results = batchValidate(inputs, schemas);

      expect(results.content.isValid).toBe(true);
      expect(results.topic.isValid).toBe(true);
      expect(results.email.isValid).toBe(true);
    });

    it('should handle invalid inputs in batch', () => {
      const inputs = {
        content: '',
        topic: 'short',
      };

      const schemas = {
        content: PostContentSchema,
        topic: TopicSchema,
      };

      const results = batchValidate(inputs, schemas);

      expect(results.content.isValid).toBe(false);
      expect(results.topic.isValid).toBe(false);
    });

    it('should skip fields without schemas', () => {
      const inputs = {
        content: 'Valid content',
        unknown: 'This has no schema',
      };

      const schemas = {
        content: PostContentSchema,
      };

      const results = batchValidate(inputs, schemas);

      expect(results.content).toBeDefined();
      expect(results.unknown).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long but valid post', () => {
      const content = 'word '.repeat(600).trim();
      const result = validatePostContent(content);

      expect(result.isValid).toBe(true);
    });

    it('should handle Unicode in post content', () => {
      const content = '你好世界 Hello World 🌍';
      const result = validatePostContent(content);

      expect(result.isValid).toBe(true);
    });

    it('should handle special characters in topic', () => {
      const topic = 'How to use special chars? (like these!)';
      const result = validateTopic(topic);

      expect(result.isValid).toBe(true);
    });

    it('should handle consecutive whitespace in content', () => {
      const content = 'Text   with    multiple     spaces';
      const result = validatePostContent(content);

      expect(result.isValid).toBe(true);
    });

    it('should handle tab and newline characters', () => {
      const content = 'Line1\n\tLine2\nLine3';
      const result = validatePostContent(content);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should preserve type information for PostContent', () => {
      const result = validatePostContent('Valid content');

      if (result.isValid && result.data) {
        const _: string = result.data; // Type should be string
        expect(typeof _).toBe('string');
      }
    });

    it('should preserve type information for Topic', () => {
      const result = validateTopic('Valid topic with words');

      if (result.isValid && result.data) {
        const _: string = result.data; // Type should be string
        expect(typeof _).toBe('string');
      }
    });
  });

  describe('Performance', () => {
    it('should validate quickly', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        validatePostContent('Valid post content');
      }

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100); // 1000 validations in < 100ms
    });

    it('should batch validate efficiently', () => {
      const inputs: Record<string, string> = {};
      for (let i = 0; i < 50; i++) {
        inputs[`field${i}`] = 'Valid content for field ' + i;
      }

      const schemas: Record<string, any> = {};
      for (let i = 0; i < 50; i++) {
        schemas[`field${i}`] = PostContentSchema;
      }

      const start = Date.now();
      batchValidate(inputs, schemas);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50); // Batch of 50 in < 50ms
    });
  });
});
