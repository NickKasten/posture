/**
 * PostPreview Component Tests
 *
 * Tests cover:
 * - Component rendering
 * - Content editing
 * - Character counting
 * - Character counter colors
 * - Hashtag management
 * - Publishing action
 * - Cancel action
 * - Regenerate action
 * - Loading states
 * - Error handling
 * - Accessibility compliance
 */

import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PostPreview } from '../PostPreview'
import type { GeneratedPost, Platform } from '@/types/post'

describe('PostPreview', () => {
  const mockPost: GeneratedPost = {
    content: 'This is a great post about web development and modern technologies!',
    hashtags: ['WebDev', 'LinkedIn', 'Coding'],
    characterCount: 68,
    platform: 'linkedin',
  }

  const mockOnPublish = jest.fn()
  const mockOnCancel = jest.fn()
  const mockOnRegenerate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnPublish.mockClear()
    mockOnCancel.mockClear()
    mockOnRegenerate.mockClear()
  })

  describe('Rendering', () => {
    it('should render with generated post content', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      expect(screen.getByText('Preview Your Post')).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockPost.content)).toBeInTheDocument()
    })

    it('should display platform information in description', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      expect(screen.getByText(/Review and edit your post before publishing to LinkedIn/i)).toBeInTheDocument()
    })

    it('should display Twitter platform information', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="twitter"
          onPublish={mockOnPublish}
        />
      )

      expect(screen.getByText(/Review and edit your post before publishing to Twitter/i)).toBeInTheDocument()
    })

    it('should display both platforms information', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="both"
          onPublish={mockOnPublish}
        />
      )

      expect(screen.getByText(/Review and edit your post before publishing to LinkedIn and Twitter/i)).toBeInTheDocument()
    })

    it('should render all hashtags as chips', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      expect(screen.getByText('Hashtags:')).toBeInTheDocument()
      expect(screen.getByText('#WebDev')).toBeInTheDocument()
      expect(screen.getByText('#LinkedIn')).toBeInTheDocument()
      expect(screen.getByText('#Coding')).toBeInTheDocument()
    })

    it('should render publish button', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      expect(screen.getByRole('button', { name: /Publish/i })).toBeInTheDocument()
    })

    it('should render cancel button when onCancel is provided', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
    })

    it('should render regenerate button when onRegenerate is provided', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
          onRegenerate={mockOnRegenerate}
        />
      )

      expect(screen.getByRole('button', { name: /Regenerate/i })).toBeInTheDocument()
    })

    it('should not render cancel button when onCancel is not provided', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      expect(screen.queryByRole('button', { name: /Cancel/i })).not.toBeInTheDocument()
    })

    it('should not render regenerate button when onRegenerate is not provided', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      expect(screen.queryByRole('button', { name: /Regenerate/i })).not.toBeInTheDocument()
    })

    it('should not display hashtag section when there are no hashtags', () => {
      const postWithoutHashtags: GeneratedPost = {
        ...mockPost,
        hashtags: [],
      }

      render(
        <PostPreview
          post={postWithoutHashtags}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      expect(screen.queryByText('Hashtags:')).not.toBeInTheDocument()
    })
  })

  describe('Content Editing', () => {
    it('should allow editing post content', async () => {
      const user = userEvent.setup()
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const textarea = screen.getByLabelText(/Edit post content/i)
      await user.clear(textarea)
      await user.type(textarea, 'Updated post content')

      expect(textarea).toHaveValue('Updated post content')
    })

    it('should update character count when editing', async () => {
      const user = userEvent.setup()
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const textarea = screen.getByLabelText(/Edit post content/i)
      await user.clear(textarea)
      await user.type(textarea, 'Hello World')

      expect(screen.getByText('11 / 3000')).toBeInTheDocument()
    })
  })

  describe('Character Counter', () => {
    it('should display correct character limit for LinkedIn', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      expect(screen.getByText((content, element) => {
        return element?.id === 'character-counter' && content.includes('3000')
      })).toBeInTheDocument()
      expect(screen.getByText(/LinkedIn: 3000 characters max/i)).toBeInTheDocument()
    })

    it('should display correct character limit for Twitter', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="twitter"
          onPublish={mockOnPublish}
        />
      )

      expect(screen.getByText((content, element) => {
        return element?.id === 'character-counter' && content.includes('280')
      })).toBeInTheDocument()
      expect(screen.getByText(/Twitter: 280 characters max/i)).toBeInTheDocument()
    })

    it('should display correct character limit for both platforms', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="both"
          onPublish={mockOnPublish}
        />
      )

      expect(screen.getByText((content, element) => {
        return element?.id === 'character-counter' && content.includes('280')
      })).toBeInTheDocument()
      expect(screen.getByText(/Character limit: 280 \(Twitter\)/i)).toBeInTheDocument()
    })

    it('should show green color when under 80% of limit', () => {
      const shortPost: GeneratedPost = {
        content: 'Short post',
        hashtags: [],
        characterCount: 10,
        platform: 'linkedin',
      }

      render(
        <PostPreview
          post={shortPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const counter = screen.getByText('10 / 3000')
      expect(counter).toHaveClass('text-muted-foreground')
    })

    it('should show yellow color when between 80% and 95% of limit', async () => {
      const user = userEvent.setup()
      render(
        <PostPreview
          post={mockPost}
          platform="twitter"
          onPublish={mockOnPublish}
        />
      )

      const textarea = screen.getByLabelText(/Edit post content/i)
      await user.clear(textarea)
      // 85% of 280 = 238 characters
      await user.type(textarea, 'a'.repeat(238))

      const counter = screen.getByText('238 / 280')
      expect(counter).toHaveClass('text-yellow-600')
    })

    it('should show red color when at or above 95% of limit', async () => {
      const user = userEvent.setup()
      render(
        <PostPreview
          post={mockPost}
          platform="twitter"
          onPublish={mockOnPublish}
        />
      )

      const textarea = screen.getByLabelText(/Edit post content/i)
      await user.clear(textarea)
      // 95% of 280 = 266 characters
      await user.type(textarea, 'a'.repeat(266))

      const counter = screen.getByText('266 / 280')
      expect(counter).toHaveClass('text-destructive')
    })

    it('should have aria-live attribute for accessibility', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const counter = screen.getByText((content, element) => {
        return element?.id === 'character-counter' && content.includes('3000')
      })
      expect(counter).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Hashtag Management', () => {
    it('should remove hashtag when X button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const removeButton = screen.getByLabelText(/Remove hashtag WebDev/i)
      await user.click(removeButton)

      expect(screen.queryByText('#WebDev')).not.toBeInTheDocument()
      expect(screen.getByText('#LinkedIn')).toBeInTheDocument()
      expect(screen.getByText('#Coding')).toBeInTheDocument()
    })

    it('should remove all hashtags one by one', async () => {
      const user = userEvent.setup()
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      // Remove all hashtags
      await user.click(screen.getByLabelText(/Remove hashtag WebDev/i))
      await user.click(screen.getByLabelText(/Remove hashtag LinkedIn/i))
      await user.click(screen.getByLabelText(/Remove hashtag Coding/i))

      // Hashtag section should be hidden when no hashtags remain
      expect(screen.queryByText('Hashtags:')).not.toBeInTheDocument()
    })

    it('should have proper aria labels for hashtag removal', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      expect(screen.getByLabelText(/Remove hashtag WebDev/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Remove hashtag LinkedIn/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Remove hashtag Coding/i)).toBeInTheDocument()
    })
  })

  describe('Publishing', () => {
    it('should call onPublish with edited content and hashtags', async () => {
      const user = userEvent.setup()
      mockOnPublish.mockResolvedValueOnce(undefined)

      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const textarea = screen.getByLabelText(/Edit post content/i)
      await user.clear(textarea)
      await user.type(textarea, 'Updated content')

      const publishButton = screen.getByRole('button', { name: /Publish/i })
      await user.click(publishButton)

      await waitFor(() => {
        expect(mockOnPublish).toHaveBeenCalledWith(
          'Updated content',
          ['WebDev', 'LinkedIn', 'Coding']
        )
      })
    })

    it('should call onPublish with updated hashtags after removal', async () => {
      const user = userEvent.setup()
      mockOnPublish.mockResolvedValueOnce(undefined)

      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      // Remove one hashtag
      await user.click(screen.getByLabelText(/Remove hashtag WebDev/i))

      const publishButton = screen.getByRole('button', { name: /Publish/i })
      await user.click(publishButton)

      await waitFor(() => {
        expect(mockOnPublish).toHaveBeenCalledWith(
          mockPost.content,
          ['LinkedIn', 'Coding']
        )
      })
    })

    it('should trim whitespace from content before publishing', async () => {
      const user = userEvent.setup()
      mockOnPublish.mockResolvedValueOnce(undefined)

      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const textarea = screen.getByLabelText(/Edit post content/i)
      await user.clear(textarea)
      await user.type(textarea, '  Content with spaces  ')

      const publishButton = screen.getByRole('button', { name: /Publish/i })
      await user.click(publishButton)

      await waitFor(() => {
        expect(mockOnPublish).toHaveBeenCalledWith(
          'Content with spaces',
          expect.any(Array)
        )
      })
    })

    it('should not allow publishing empty content', async () => {
      const user = userEvent.setup()
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const textarea = screen.getByLabelText(/Edit post content/i)
      await user.clear(textarea)

      const publishButton = screen.getByRole('button', { name: /Publish/i })
      expect(publishButton).toBeDisabled()
    })

    it('should not allow publishing content exceeding character limit', async () => {
      const user = userEvent.setup()
      render(
        <PostPreview
          post={mockPost}
          platform="twitter"
          onPublish={mockOnPublish}
        />
      )

      const textarea = screen.getByLabelText(/Edit post content/i)
      await user.clear(textarea)
      await user.type(textarea, 'a'.repeat(281))

      const publishButton = screen.getByRole('button', { name: /Publish/i })
      expect(publishButton).toBeDisabled()
    })
  })

  describe('Loading State', () => {
    it('should display loading state while publishing', async () => {
      const user = userEvent.setup()

      // Mock a delayed publish
      mockOnPublish.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const publishButton = screen.getByRole('button', { name: /Publish/i })
      await user.click(publishButton)

      // Check for loading state - button should show "Publishing..."
      expect(screen.getByRole('button', { name: /Publishing/i })).toBeInTheDocument()
      expect(publishButton).toBeDisabled()
      expect(publishButton).toHaveAttribute('aria-busy', 'true')

      // Wait for publishing to complete
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Publishing/i })).not.toBeInTheDocument()
      })
    })

    it('should disable all buttons while publishing', async () => {
      const user = userEvent.setup()

      mockOnPublish.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
          onCancel={mockOnCancel}
          onRegenerate={mockOnRegenerate}
        />
      )

      const publishButton = screen.getByRole('button', { name: /Publish/i })
      await user.click(publishButton)

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /Regenerate/i })).toBeDisabled()

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Publishing/i })).not.toBeInTheDocument()
      })
    })

    it('should disable textarea while publishing', async () => {
      const user = userEvent.setup()

      mockOnPublish.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const publishButton = screen.getByRole('button', { name: /Publish/i })
      await user.click(publishButton)

      const textarea = screen.getByLabelText(/Edit post content/i)
      expect(textarea).toBeDisabled()

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Publishing/i })).not.toBeInTheDocument()
      })
    })

    it('should disable hashtag removal buttons while publishing', async () => {
      const user = userEvent.setup()

      mockOnPublish.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const publishButton = screen.getByRole('button', { name: /Publish/i })
      await user.click(publishButton)

      const removeButton = screen.getByLabelText(/Remove hashtag WebDev/i)
      expect(removeButton).toBeDisabled()

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Publishing/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when publishing fails', async () => {
      const user = userEvent.setup()
      mockOnPublish.mockRejectedValueOnce(new Error('Network error'))

      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const publishButton = screen.getByRole('button', { name: /Publish/i })
      await user.click(publishButton)

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert')
        expect(errorMessage).toHaveTextContent(/Network error/i)
      })
    })

    it('should display generic error for non-Error objects', async () => {
      const user = userEvent.setup()
      mockOnPublish.mockRejectedValueOnce('String error')

      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const publishButton = screen.getByRole('button', { name: /Publish/i })
      await user.click(publishButton)

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert')
        expect(errorMessage).toHaveTextContent(/Failed to publish post/i)
      })
    })

    it('should clear error when editing content', async () => {
      const user = userEvent.setup()
      mockOnPublish.mockRejectedValueOnce(new Error('Publishing failed'))

      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const publishButton = screen.getByRole('button', { name: /Publish/i })
      await user.click(publishButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Edit content to clear error
      const textarea = screen.getByLabelText(/Edit post content/i)
      await user.type(textarea, ' more text')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should show validation error when trying to publish empty content', async () => {
      const user = userEvent.setup()
      const postWithEmptyContent: GeneratedPost = {
        content: '   ',
        hashtags: ['Test'],
        characterCount: 3,
        platform: 'linkedin',
      }

      render(
        <PostPreview
          post={postWithEmptyContent}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      // Button should be disabled due to invalid content
      const publishButton = screen.getByRole('button', { name: /Publish/i })
      expect(publishButton).toBeDisabled()
    })
  })

  describe('Cancel Action', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Regenerate Action', () => {
    it('should call onRegenerate when regenerate button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
          onRegenerate={mockOnRegenerate}
        />
      )

      const regenerateButton = screen.getByRole('button', { name: /Regenerate/i })
      await user.click(regenerateButton)

      expect(mockOnRegenerate).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on textarea', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const textarea = screen.getByLabelText(/Edit post content/i)
      expect(textarea).toHaveAttribute('aria-describedby', 'character-counter')
    })

    it('should set aria-invalid when content exceeds limit', async () => {
      const user = userEvent.setup()
      render(
        <PostPreview
          post={mockPost}
          platform="twitter"
          onPublish={mockOnPublish}
        />
      )

      const textarea = screen.getByLabelText(/Edit post content/i)
      await user.clear(textarea)
      await user.type(textarea, 'a'.repeat(281))

      expect(textarea).toHaveAttribute('aria-invalid', 'true')
    })

    it('should have aria-live region for character counter', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const counter = screen.getByText((content, element) => {
        return element?.id === 'character-counter' && content.includes('3000')
      })
      expect(counter).toHaveAttribute('aria-live', 'polite')
    })

    it('should have role="alert" on error messages', async () => {
      const user = userEvent.setup()
      mockOnPublish.mockRejectedValueOnce(new Error('Error'))

      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const publishButton = screen.getByRole('button', { name: /Publish/i })
      await user.click(publishButton)

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveAttribute('aria-live', 'assertive')
      })
    })

    it('should have accessible button states', async () => {
      const user = userEvent.setup()

      mockOnPublish.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const publishButton = screen.getByRole('button', { name: /Publish/i })
      await user.click(publishButton)

      expect(publishButton).toHaveAttribute('aria-busy', 'true')

      await waitFor(() => {
        expect(publishButton).toHaveAttribute('aria-busy', 'false')
      })
    })

    it('should have proper role and aria-label for hashtag list', () => {
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
        />
      )

      const hashtagList = screen.getByRole('list', { name: /Post hashtags/i })
      expect(hashtagList).toBeInTheDocument()

      const hashtagItems = within(hashtagList).getAllByRole('listitem')
      expect(hashtagItems).toHaveLength(3)
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(
        <PostPreview
          post={mockPost}
          platform="linkedin"
          onPublish={mockOnPublish}
          onRegenerate={mockOnRegenerate}
          onCancel={mockOnCancel}
        />
      )

      // Tab should move focus to textarea first (it's focused on mount)
      const textarea = screen.getByLabelText(/Edit post content/i)
      expect(textarea).toHaveFocus()

      // Tab through hashtag removal buttons
      await user.tab()
      expect(screen.getByLabelText(/Remove hashtag WebDev/i)).toHaveFocus()
    })
  })
})
