// Database CRUD operations for posts and social accounts
// Implements type-safe database operations with proper error handling and RLS

import { supabaseClient } from '../storage/supabase';
import { decrypt } from '../storage/supabase';
import {
  PostDraft,
  PostDraftId,
  PublishedPost,
  PublishedPostId,
  UserId,
  Platform,
  CreatePostDraftInput,
  UpdatePostDraftInput,
  CreatePublishedPostInput,
  PostDraftFilters,
  PublishedPostFilters,
  EngagementMetrics,
  DatabaseError,
  createPostDraftId,
  createPublishedPostId,
} from '@/types/database';

// ============================================================================
// DRAFT OPERATIONS
// ============================================================================

/**
 * Save a new draft post to the database
 * @param input Draft post data
 * @returns Created draft post with generated ID
 * @throws DatabaseError if operation fails
 */
export async function saveDraft(input: CreatePostDraftInput): Promise<PostDraft> {
  try {
    const { data, error } = await supabaseClient
      .from('post_drafts')
      .insert({
        user_id: input.user_id,
        content: input.content,
        platform: input.platform,
        tone: input.tone ?? null,
        hashtags: input.hashtags ?? null,
        status: input.status ?? 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving draft:', error);
      throw new DatabaseError(
        `Failed to save draft: ${error.message}`,
        error.code || 'SAVE_DRAFT_ERROR',
        error
      );
    }

    if (!data) {
      throw new DatabaseError(
        'Failed to save draft: No data returned',
        'NO_DATA_RETURNED'
      );
    }

    return {
      ...data,
      id: createPostDraftId(data.id),
      user_id: data.user_id as UserId,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    console.error('Unexpected error saving draft:', error);
    throw new DatabaseError(
      'Unexpected error saving draft',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Get all drafts for a user with optional filters
 * @param userId User ID to filter by
 * @param filters Optional filters for platform, tone, status, date range
 * @returns Array of draft posts (empty if none found)
 */
export async function getDrafts(
  userId: UserId,
  filters?: PostDraftFilters
): Promise<PostDraft[]> {
  try {
    let query = supabaseClient
      .from('post_drafts')
      .select('*')
      .eq('user_id', userId);

    // Apply filters
    if (filters?.platform) {
      query = query.eq('platform', filters.platform);
    }
    if (filters?.tone) {
      query = query.eq('tone', filters.tone);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.created_after) {
      query = query.gte('created_at', filters.created_after);
    }
    if (filters?.created_before) {
      query = query.lte('created_at', filters.created_before);
    }

    // Apply ordering last
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error getting drafts:', error);
      throw new DatabaseError(
        `Failed to get drafts: ${error.message}`,
        error.code || 'GET_DRAFTS_ERROR',
        error
      );
    }

    return (data || []).map((draft) => ({
      ...draft,
      id: createPostDraftId(draft.id),
      user_id: draft.user_id as UserId,
    }));
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    console.error('Unexpected error getting drafts:', error);
    throw new DatabaseError(
      'Unexpected error getting drafts',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Get a single draft by ID
 * @param id Draft post ID
 * @returns Draft post or null if not found
 * @throws DatabaseError if operation fails
 */
export async function getDraftById(id: PostDraftId): Promise<PostDraft | null> {
  try {
    const { data, error } = await supabaseClient
      .from('post_drafts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Not found is not an error, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting draft by ID:', error);
      throw new DatabaseError(
        `Failed to get draft: ${error.message}`,
        error.code || 'GET_DRAFT_ERROR',
        error
      );
    }

    if (!data) {
      return null;
    }

    return {
      ...data,
      id: createPostDraftId(data.id),
      user_id: data.user_id as UserId,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    console.error('Unexpected error getting draft by ID:', error);
    throw new DatabaseError(
      'Unexpected error getting draft',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Update an existing draft post
 * @param id Draft post ID
 * @param input Fields to update
 * @returns Updated draft post
 * @throws DatabaseError if operation fails
 */
export async function updateDraft(
  id: PostDraftId,
  input: UpdatePostDraftInput
): Promise<PostDraft> {
  try {
    const updateData: Record<string, unknown> = {};

    // Only include fields that are provided
    if (input.content !== undefined) updateData.content = input.content;
    if (input.platform !== undefined) updateData.platform = input.platform;
    if (input.tone !== undefined) updateData.tone = input.tone;
    if (input.hashtags !== undefined) updateData.hashtags = input.hashtags;
    if (input.status !== undefined) updateData.status = input.status;

    const { data, error } = await supabaseClient
      .from('post_drafts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating draft:', error);
      throw new DatabaseError(
        `Failed to update draft: ${error.message}`,
        error.code || 'UPDATE_DRAFT_ERROR',
        error
      );
    }

    if (!data) {
      throw new DatabaseError(
        'Failed to update draft: No data returned',
        'NO_DATA_RETURNED'
      );
    }

    return {
      ...data,
      id: createPostDraftId(data.id),
      user_id: data.user_id as UserId,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    console.error('Unexpected error updating draft:', error);
    throw new DatabaseError(
      'Unexpected error updating draft',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Delete a draft post
 * @param id Draft post ID
 * @throws DatabaseError if operation fails
 */
export async function deleteDraft(id: PostDraftId): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('post_drafts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting draft:', error);
      throw new DatabaseError(
        `Failed to delete draft: ${error.message}`,
        error.code || 'DELETE_DRAFT_ERROR',
        error
      );
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    console.error('Unexpected error deleting draft:', error);
    throw new DatabaseError(
      'Unexpected error deleting draft',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

// ============================================================================
// PUBLISHED POST OPERATIONS
// ============================================================================

/**
 * Save a published post record to the database
 * @param input Published post data
 * @returns Created published post with generated ID
 * @throws DatabaseError if operation fails
 */
export async function savePublishedPost(
  input: CreatePublishedPostInput
): Promise<PublishedPost> {
  try {
    const { data, error } = await supabaseClient
      .from('published_posts')
      .insert({
        draft_id: input.draft_id ?? null,
        user_id: input.user_id,
        platform: input.platform,
        platform_post_id: input.platform_post_id,
        content: input.content,
        published_at: input.published_at ?? new Date().toISOString(),
        engagement_metrics: input.engagement_metrics ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving published post:', error);
      throw new DatabaseError(
        `Failed to save published post: ${error.message}`,
        error.code || 'SAVE_PUBLISHED_POST_ERROR',
        error
      );
    }

    if (!data) {
      throw new DatabaseError(
        'Failed to save published post: No data returned',
        'NO_DATA_RETURNED'
      );
    }

    return {
      ...data,
      id: createPublishedPostId(data.id),
      draft_id: data.draft_id ? createPostDraftId(data.draft_id) : null,
      user_id: data.user_id as UserId,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    console.error('Unexpected error saving published post:', error);
    throw new DatabaseError(
      'Unexpected error saving published post',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Get all published posts for a user with optional filters
 * @param userId User ID to filter by
 * @param filters Optional filters for platform and date range
 * @returns Array of published posts (empty if none found)
 */
export async function getPublishedPosts(
  userId: UserId,
  filters?: PublishedPostFilters
): Promise<PublishedPost[]> {
  try {
    let query = supabaseClient
      .from('published_posts')
      .select('*')
      .eq('user_id', userId);

    // Apply filters
    if (filters?.platform) {
      query = query.eq('platform', filters.platform);
    }
    if (filters?.published_after) {
      query = query.gte('published_at', filters.published_after);
    }
    if (filters?.published_before) {
      query = query.lte('published_at', filters.published_before);
    }

    // Apply ordering last
    query = query.order('published_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error getting published posts:', error);
      throw new DatabaseError(
        `Failed to get published posts: ${error.message}`,
        error.code || 'GET_PUBLISHED_POSTS_ERROR',
        error
      );
    }

    return (data || []).map((post) => ({
      ...post,
      id: createPublishedPostId(post.id),
      draft_id: post.draft_id ? createPostDraftId(post.draft_id) : null,
      user_id: post.user_id as UserId,
    }));
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    console.error('Unexpected error getting published posts:', error);
    throw new DatabaseError(
      'Unexpected error getting published posts',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Update engagement metrics for a published post
 * @param id Published post ID
 * @param metrics New engagement metrics
 * @throws DatabaseError if operation fails
 */
export async function updatePostMetrics(
  id: PublishedPostId,
  metrics: EngagementMetrics
): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('published_posts')
      .update({ engagement_metrics: metrics })
      .eq('id', id);

    if (error) {
      console.error('Error updating post metrics:', error);
      throw new DatabaseError(
        `Failed to update post metrics: ${error.message}`,
        error.code || 'UPDATE_METRICS_ERROR',
        error
      );
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    console.error('Unexpected error updating post metrics:', error);
    throw new DatabaseError(
      'Unexpected error updating post metrics',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

// ============================================================================
// SOCIAL ACCOUNT TOKEN OPERATIONS
// ============================================================================

/**
 * Get decrypted LinkedIn access token for a user
 * @param userId User ID
 * @returns Decrypted access token or null if account not connected
 * @throws DatabaseError if operation fails
 */
export async function getLinkedInToken(userId: UserId): Promise<string | null> {
  try {
    const { data, error } = await supabaseClient
      .from('social_accounts')
      .select('encrypted_access_token')
      .eq('user_id', userId)
      .eq('platform', 'linkedin')
      .single();

    if (error) {
      // Not found is not an error, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting LinkedIn token:', error);
      throw new DatabaseError(
        `Failed to get LinkedIn token: ${error.message}`,
        error.code || 'GET_TOKEN_ERROR',
        error
      );
    }

    if (!data || !data.encrypted_access_token) {
      return null;
    }

    try {
      return decrypt(data.encrypted_access_token);
    } catch (decryptError) {
      console.error('Error decrypting LinkedIn token:', decryptError);
      throw new DatabaseError(
        'Failed to decrypt LinkedIn token',
        'DECRYPT_ERROR',
        decryptError
      );
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    console.error('Unexpected error getting LinkedIn token:', error);
    throw new DatabaseError(
      'Unexpected error getting LinkedIn token',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Get decrypted Twitter access token for a user
 * @param userId User ID
 * @returns Decrypted access token or null if account not connected
 * @throws DatabaseError if operation fails
 */
export async function getTwitterToken(userId: UserId): Promise<string | null> {
  try {
    const { data, error } = await supabaseClient
      .from('social_accounts')
      .select('encrypted_access_token')
      .eq('user_id', userId)
      .eq('platform', 'twitter')
      .single();

    if (error) {
      // Not found is not an error, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting Twitter token:', error);
      throw new DatabaseError(
        `Failed to get Twitter token: ${error.message}`,
        error.code || 'GET_TOKEN_ERROR',
        error
      );
    }

    if (!data || !data.encrypted_access_token) {
      return null;
    }

    try {
      return decrypt(data.encrypted_access_token);
    } catch (decryptError) {
      console.error('Error decrypting Twitter token:', decryptError);
      throw new DatabaseError(
        'Failed to decrypt Twitter token',
        'DECRYPT_ERROR',
        decryptError
      );
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    console.error('Unexpected error getting Twitter token:', error);
    throw new DatabaseError(
      'Unexpected error getting Twitter token',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Check if a user has connected a specific platform account
 * @param userId User ID
 * @param platform Social media platform
 * @returns True if account is connected, false otherwise
 */
export async function isAccountConnected(
  userId: UserId,
  platform: Platform
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('social_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    if (error) {
      // Not found means not connected
      if (error.code === 'PGRST116') {
        return false;
      }
      console.error('Error checking account connection:', error);
      throw new DatabaseError(
        `Failed to check account connection: ${error.message}`,
        error.code || 'CHECK_CONNECTION_ERROR',
        error
      );
    }

    return !!data;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    console.error('Unexpected error checking account connection:', error);
    throw new DatabaseError(
      'Unexpected error checking account connection',
      'UNEXPECTED_ERROR',
      error
    );
  }
}
