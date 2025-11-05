// Database CRUD Operations Tests
// Tests for posts.ts database operations

import {
  saveDraft,
  getDrafts,
  getDraftById,
  updateDraft,
  deleteDraft,
  savePublishedPost,
  getPublishedPosts,
  updatePostMetrics,
  getLinkedInToken,
  getTwitterToken,
  isAccountConnected,
} from '../posts';
import { supabaseClient } from '../../storage/supabase';
import { decrypt } from '../../storage/supabase';
import {
  createUserId,
  createPostDraftId,
  createPublishedPostId,
  DatabaseError,
  CreatePostDraftInput,
  UpdatePostDraftInput,
  CreatePublishedPostInput,
  PostDraftFilters,
  PublishedPostFilters,
} from '@/types/database';

// Mock Supabase client
jest.mock('../../storage/supabase', () => ({
  supabaseClient: {
    from: jest.fn(),
  },
  decrypt: jest.fn(),
}));

describe('Database CRUD Operations', () => {
  const mockUserId = createUserId('test-user-123');
  const mockDraftId = createPostDraftId('draft-123');
  const mockPublishedPostId = createPublishedPostId('post-123');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // DRAFT OPERATIONS TESTS
  // ============================================================================

  describe('saveDraft', () => {
    it('should successfully save a draft', async () => {
      const input: CreatePostDraftInput = {
        user_id: mockUserId,
        content: 'Test draft content',
        platform: 'linkedin',
        tone: 'technical',
        hashtags: ['testing', 'draft'],
        status: 'draft',
      };

      const mockDraft = {
        id: 'draft-123',
        user_id: mockUserId,
        content: 'Test draft content',
        platform: 'linkedin',
        tone: 'technical',
        hashtags: ['testing', 'draft'],
        status: 'draft',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: mockDraft, error: null }),
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await saveDraft(input);

      expect(result.content).toBe('Test draft content');
      expect(result.platform).toBe('linkedin');
      expect(supabaseClient.from).toHaveBeenCalledWith('post_drafts');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        content: 'Test draft content',
        platform: 'linkedin',
        tone: 'technical',
        hashtags: ['testing', 'draft'],
        status: 'draft',
      });
    });

    it('should use default status if not provided', async () => {
      const input: CreatePostDraftInput = {
        user_id: mockUserId,
        content: 'Test content',
        platform: 'twitter',
      };

      const mockDraft = {
        id: 'draft-123',
        user_id: mockUserId,
        content: 'Test content',
        platform: 'twitter',
        tone: null,
        hashtags: null,
        status: 'draft',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: mockDraft, error: null }),
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await saveDraft(input);

      expect(result.status).toBe('draft');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        content: 'Test content',
        platform: 'twitter',
        tone: null,
        hashtags: null,
        status: 'draft',
      });
    });

    it('should throw DatabaseError on Supabase error', async () => {
      const input: CreatePostDraftInput = {
        user_id: mockUserId,
        content: 'Test content',
        platform: 'linkedin',
      };

      const mockSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error', code: 'DB_ERROR' },
        }),
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await expect(saveDraft(input)).rejects.toThrow(DatabaseError);
      await expect(saveDraft(input)).rejects.toThrow('Failed to save draft');
    });
  });

  describe('getDrafts', () => {
    it('should get all drafts for a user', async () => {
      const mockDrafts = [
        {
          id: 'draft-1',
          user_id: mockUserId,
          content: 'Draft 1',
          platform: 'linkedin',
          tone: 'technical',
          hashtags: ['tech'],
          status: 'draft',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        {
          id: 'draft-2',
          user_id: mockUserId,
          content: 'Draft 2',
          platform: 'twitter',
          tone: 'casual',
          hashtags: ['casual'],
          status: 'draft',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockDrafts, error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getDrafts(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Draft 1');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should apply platform filter', async () => {
      const filters: PostDraftFilters = {
        platform: 'linkedin',
      };

      const mockChain = {
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockChain.eq = jest.fn().mockReturnValue(mockChain);

      const mockEq = jest.fn().mockReturnValue(mockChain);
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await getDrafts(mockUserId, filters);

      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockChain.eq).toHaveBeenCalledWith('platform', 'linkedin');
    });

    it('should apply date range filters', async () => {
      const filters: PostDraftFilters = {
        created_after: '2024-01-01T00:00:00Z',
        created_before: '2024-12-31T23:59:59Z',
      };

      const mockChain = {
        gte: jest.fn(),
        lte: jest.fn(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockChain.gte.mockReturnValue(mockChain);
      mockChain.lte.mockReturnValue(mockChain);

      const mockEq = jest.fn().mockReturnValue(mockChain);
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await getDrafts(mockUserId, filters);

      expect(mockChain.gte).toHaveBeenCalledWith('created_at', '2024-01-01T00:00:00Z');
      expect(mockChain.lte).toHaveBeenCalledWith('created_at', '2024-12-31T23:59:59Z');
    });

    it('should return empty array if no drafts found', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getDrafts(mockUserId);

      expect(result).toEqual([]);
    });

    it('should throw DatabaseError on Supabase error', async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await expect(getDrafts(mockUserId)).rejects.toThrow(DatabaseError);
    });
  });

  describe('getDraftById', () => {
    it('should get a draft by ID', async () => {
      const mockDraft = {
        id: 'draft-123',
        user_id: mockUserId,
        content: 'Test draft',
        platform: 'linkedin',
        tone: 'technical',
        hashtags: ['test'],
        status: 'draft',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockDraft, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getDraftById(mockDraftId);

      expect(result).not.toBeNull();
      expect(result?.content).toBe('Test draft');
      expect(mockEq).toHaveBeenCalledWith('id', mockDraftId);
    });

    it('should return null if draft not found', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getDraftById(mockDraftId);

      expect(result).toBeNull();
    });

    it('should throw DatabaseError on other errors', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await expect(getDraftById(mockDraftId)).rejects.toThrow(DatabaseError);
    });
  });

  describe('updateDraft', () => {
    it('should update a draft', async () => {
      const input: UpdatePostDraftInput = {
        content: 'Updated content',
        status: 'published',
      };

      const mockUpdatedDraft = {
        id: 'draft-123',
        user_id: mockUserId,
        content: 'Updated content',
        platform: 'linkedin',
        tone: 'technical',
        hashtags: ['test'],
        status: 'published',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockUpdatedDraft, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await updateDraft(mockDraftId, input);

      expect(result.content).toBe('Updated content');
      expect(result.status).toBe('published');
      expect(mockUpdate).toHaveBeenCalledWith({
        content: 'Updated content',
        status: 'published',
      });
      expect(mockEq).toHaveBeenCalledWith('id', mockDraftId);
    });

    it('should only update provided fields', async () => {
      const input: UpdatePostDraftInput = {
        status: 'scheduled',
      };

      const mockUpdatedDraft = {
        id: 'draft-123',
        user_id: mockUserId,
        content: 'Original content',
        platform: 'linkedin',
        tone: 'technical',
        hashtags: ['test'],
        status: 'scheduled',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockUpdatedDraft, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      await updateDraft(mockDraftId, input);

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'scheduled',
      });
    });

    it('should throw DatabaseError on error', async () => {
      const input: UpdatePostDraftInput = {
        content: 'Updated content',
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed', code: 'UPDATE_ERROR' },
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      await expect(updateDraft(mockDraftId, input)).rejects.toThrow(DatabaseError);
    });
  });

  describe('deleteDraft', () => {
    it('should delete a draft', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      await deleteDraft(mockDraftId);

      expect(mockEq).toHaveBeenCalledWith('id', mockDraftId);
    });

    it('should throw DatabaseError on error', async () => {
      const mockEq = jest.fn().mockResolvedValue({
        error: { message: 'Delete failed', code: 'DELETE_ERROR' },
      });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      await expect(deleteDraft(mockDraftId)).rejects.toThrow(DatabaseError);
    });
  });

  // ============================================================================
  // PUBLISHED POST OPERATIONS TESTS
  // ============================================================================

  describe('savePublishedPost', () => {
    it('should save a published post', async () => {
      const input: CreatePublishedPostInput = {
        draft_id: mockDraftId,
        user_id: mockUserId,
        platform: 'linkedin',
        platform_post_id: 'linkedin-post-123',
        content: 'Published content',
        engagement_metrics: { likes: 10, comments: 5 },
      };

      const mockPost = {
        id: 'post-123',
        draft_id: mockDraftId,
        user_id: mockUserId,
        platform: 'linkedin',
        platform_post_id: 'linkedin-post-123',
        content: 'Published content',
        published_at: '2024-01-01T00:00:00Z',
        engagement_metrics: { likes: 10, comments: 5 },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockPost, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await savePublishedPost(input);

      expect(result.platform).toBe('linkedin');
      expect(result.content).toBe('Published content');
      expect(result.engagement_metrics?.likes).toBe(10);
    });

    it('should handle missing optional fields', async () => {
      const input: CreatePublishedPostInput = {
        user_id: mockUserId,
        platform: 'twitter',
        platform_post_id: 'twitter-post-123',
        content: 'Tweet content',
      };

      const mockPost = {
        id: 'post-123',
        draft_id: null,
        user_id: mockUserId,
        platform: 'twitter',
        platform_post_id: 'twitter-post-123',
        content: 'Tweet content',
        published_at: new Date().toISOString(),
        engagement_metrics: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockPost, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await savePublishedPost(input);

      expect(result.draft_id).toBeNull();
      expect(result.engagement_metrics).toBeNull();
    });

    it('should throw DatabaseError on error', async () => {
      const input: CreatePublishedPostInput = {
        user_id: mockUserId,
        platform: 'linkedin',
        platform_post_id: 'post-123',
        content: 'Content',
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed', code: 'INSERT_ERROR' },
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await expect(savePublishedPost(input)).rejects.toThrow(DatabaseError);
    });
  });

  describe('getPublishedPosts', () => {
    it('should get all published posts for a user', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          draft_id: null,
          user_id: mockUserId,
          platform: 'linkedin',
          platform_post_id: 'linkedin-1',
          content: 'Post 1',
          published_at: '2024-01-02T00:00:00Z',
          engagement_metrics: { likes: 5 },
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        {
          id: 'post-2',
          draft_id: 'draft-123',
          user_id: mockUserId,
          platform: 'twitter',
          platform_post_id: 'twitter-1',
          content: 'Post 2',
          published_at: '2024-01-01T00:00:00Z',
          engagement_metrics: { likes: 10 },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockPosts, error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getPublishedPosts(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Post 1');
      expect(mockOrder).toHaveBeenCalledWith('published_at', { ascending: false });
    });

    it('should apply platform filter', async () => {
      const filters: PublishedPostFilters = {
        platform: 'linkedin',
      };

      const mockChain = {
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockChain.eq = jest.fn().mockReturnValue(mockChain);

      const mockEq = jest.fn().mockReturnValue(mockChain);
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await getPublishedPosts(mockUserId, filters);

      expect(mockChain.eq).toHaveBeenCalledWith('platform', 'linkedin');
    });

    it('should apply date range filters', async () => {
      const filters: PublishedPostFilters = {
        published_after: '2024-01-01T00:00:00Z',
        published_before: '2024-12-31T23:59:59Z',
      };

      const mockChain = {
        gte: jest.fn(),
        lte: jest.fn(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockChain.gte.mockReturnValue(mockChain);
      mockChain.lte.mockReturnValue(mockChain);

      const mockEq = jest.fn().mockReturnValue(mockChain);
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await getPublishedPosts(mockUserId, filters);

      expect(mockChain.gte).toHaveBeenCalledWith('published_at', '2024-01-01T00:00:00Z');
      expect(mockChain.lte).toHaveBeenCalledWith('published_at', '2024-12-31T23:59:59Z');
    });

    it('should return empty array if no posts found', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getPublishedPosts(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('updatePostMetrics', () => {
    it('should update engagement metrics', async () => {
      const metrics = {
        likes: 20,
        comments: 10,
        shares: 5,
      };

      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      await updatePostMetrics(mockPublishedPostId, metrics);

      expect(mockUpdate).toHaveBeenCalledWith({ engagement_metrics: metrics });
      expect(mockEq).toHaveBeenCalledWith('id', mockPublishedPostId);
    });

    it('should throw DatabaseError on error', async () => {
      const metrics = { likes: 20 };

      const mockEq = jest.fn().mockResolvedValue({
        error: { message: 'Update failed', code: 'UPDATE_ERROR' },
      });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      await expect(updatePostMetrics(mockPublishedPostId, metrics)).rejects.toThrow(
        DatabaseError
      );
    });
  });

  // ============================================================================
  // SOCIAL ACCOUNT TOKEN OPERATIONS TESTS
  // ============================================================================

  describe('getLinkedInToken', () => {
    it('should get and decrypt LinkedIn token', async () => {
      const encryptedToken = 'encrypted-token-data';
      const decryptedToken = 'decrypted-linkedin-token';

      const mockSingle = jest.fn().mockResolvedValue({
        data: { encrypted_access_token: encryptedToken },
        error: null,
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      (decrypt as jest.Mock).mockReturnValue(decryptedToken);

      const result = await getLinkedInToken(mockUserId);

      expect(result).toBe(decryptedToken);
      expect(mockEq1).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockEq2).toHaveBeenCalledWith('platform', 'linkedin');
      expect(decrypt).toHaveBeenCalledWith(encryptedToken);
    });

    it('should return null if account not found', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getLinkedInToken(mockUserId);

      expect(result).toBeNull();
    });

    it('should throw DatabaseError on decryption error', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { encrypted_access_token: 'invalid-encrypted-data' },
        error: null,
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      (decrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      await expect(getLinkedInToken(mockUserId)).rejects.toThrow(DatabaseError);
      await expect(getLinkedInToken(mockUserId)).rejects.toThrow('Failed to decrypt');
    });
  });

  describe('getTwitterToken', () => {
    it('should get and decrypt Twitter token', async () => {
      const encryptedToken = 'encrypted-token-data';
      const decryptedToken = 'decrypted-twitter-token';

      const mockSingle = jest.fn().mockResolvedValue({
        data: { encrypted_access_token: encryptedToken },
        error: null,
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      (decrypt as jest.Mock).mockReturnValue(decryptedToken);

      const result = await getTwitterToken(mockUserId);

      expect(result).toBe(decryptedToken);
      expect(mockEq1).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockEq2).toHaveBeenCalledWith('platform', 'twitter');
      expect(decrypt).toHaveBeenCalledWith(encryptedToken);
    });

    it('should return null if account not found', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getTwitterToken(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('isAccountConnected', () => {
    it('should return true if account is connected', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'account-123' },
        error: null,
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await isAccountConnected(mockUserId, 'linkedin');

      expect(result).toBe(true);
      expect(mockEq1).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockEq2).toHaveBeenCalledWith('platform', 'linkedin');
    });

    it('should return false if account is not connected', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await isAccountConnected(mockUserId, 'twitter');

      expect(result).toBe(false);
    });

    it('should throw DatabaseError on database error', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });

      (supabaseClient.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await expect(isAccountConnected(mockUserId, 'linkedin')).rejects.toThrow(DatabaseError);
    });
  });
});
