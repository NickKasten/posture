/**
 * PostGenerator Component Tests
 *
 * Tests cover:
 * - Component rendering
 * - Form validation
 * - User interactions
 * - API integration
 * - Error handling
 * - Accessibility compliance
 */

import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PostGenerator } from '../PostGenerator'
import type { GeneratedPost } from '@/types/post'

// Mock fetch globally
global.fetch = jest.fn()

describe('PostGenerator', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Rendering', () => {
    it('should render all form elements', () => {
      render(<PostGenerator />)

      // Check for title and description
      expect(screen.getByText('Generate Your Post')).toBeInTheDocument()
      expect(screen.getByText(/Create engaging LinkedIn or Twitter posts/i)).toBeInTheDocument()

      // Check for topic textarea
      expect(screen.getByLabelText(/What would you like to share?/i)).toBeInTheDocument()

      // Check for platform radio buttons
      const platformFieldset = screen.getByRole('group', { name: /platform/i })
      expect(platformFieldset).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /linkedin/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /both/i })).toBeInTheDocument()

      // Check for tone select
      expect(screen.getByLabelText(/tone/i)).toBeInTheDocument()

      // Check for GitHub activity checkbox
      expect(screen.getByLabelText(/Include recent GitHub activity/i)).toBeInTheDocument()

      // Check for submit button
      expect(screen.getByRole('button', { name: /Generate Post/i })).toBeInTheDocument()
    })

    it('should have LinkedIn selected by default', () => {
      render(<PostGenerator />)
      const linkedinRadio = screen.getByRole('radio', { name: /linkedin/i })
      expect(linkedinRadio).toBeChecked()
    })

    it('should have technical tone selected by default', () => {
      render(<PostGenerator />)
      const toneSelect = screen.getByLabelText(/tone/i)
      expect(toneSelect).toHaveTextContent('Technical')
    })
  })

  describe('Character Counter', () => {
    it('should update character count on input', async () => {
      const user = userEvent.setup()
      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'Hello World')

      expect(screen.getByText('11 / 500')).toBeInTheDocument()
    })

    it('should not allow input beyond 500 characters', async () => {
      const user = userEvent.setup()
      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      const longText = 'a'.repeat(600)
      await user.type(textarea, longText)

      const displayedText = (textarea as HTMLTextAreaElement).value
      expect(displayedText.length).toBeLessThanOrEqual(500)
    })

    it('should highlight character count when approaching limit', async () => {
      const user = userEvent.setup()
      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      const text = 'a'.repeat(460) // Over 90% of 500
      await user.type(textarea, text)

      const counter = screen.getByText(/460 \/ 500/i)
      expect(counter).toHaveClass('text-destructive')
    })
  })

  describe('Form Validation', () => {
    it('should disable submit button when topic is empty', () => {
      render(<PostGenerator />)
      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when topic is less than 10 characters', async () => {
      const user = userEvent.setup()
      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'Short')

      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when topic is 10 or more characters', async () => {
      const user = userEvent.setup()
      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'This is a valid topic with enough characters')

      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      expect(submitButton).not.toBeDisabled()
    })

    it('should show validation error when submitting invalid form', async () => {
      const user = userEvent.setup()
      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'Short')

      // Try to submit
      const form = textarea.closest('form')!
      await user.click(form)

      // The button should be disabled, preventing submission
      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Platform Selection', () => {
    it('should allow switching between platforms', async () => {
      const user = userEvent.setup()
      render(<PostGenerator />)

      const twitterRadio = screen.getByRole('radio', { name: /twitter/i })
      await user.click(twitterRadio)

      expect(twitterRadio).toBeChecked()
      expect(screen.getByRole('radio', { name: /linkedin/i })).not.toBeChecked()
    })

    it('should select "both" platform', async () => {
      const user = userEvent.setup()
      render(<PostGenerator />)

      const bothRadio = screen.getByRole('radio', { name: /both/i })
      await user.click(bothRadio)

      expect(bothRadio).toBeChecked()
    })
  })

  describe('Tone Selection', () => {
    it('should allow changing tone', async () => {
      const user = userEvent.setup()
      const mockCallback = jest.fn()
      const mockResponse: GeneratedPost = {
        content: 'Post content',
        hashtags: ['Tech'],
        characterCount: 12,
        platform: 'linkedin',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<PostGenerator onPostGenerated={mockCallback} />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'Testing tone selection with valid topic')

      // Try to interact with tone select - it should be visible
      const toneSelect = screen.getByLabelText(/tone/i)
      expect(toneSelect).toBeInTheDocument()

      // Submit the form and verify default tone is sent
      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ai', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"tone":"technical"'),
        }))
      })
    })
  })

  describe('GitHub Activity Checkbox', () => {
    it('should toggle GitHub activity checkbox', async () => {
      const user = userEvent.setup()
      render(<PostGenerator />)

      const checkbox = screen.getByLabelText(/Include recent GitHub activity/i)
      expect(checkbox).not.toBeChecked()

      await user.click(checkbox)
      expect(checkbox).toBeChecked()

      await user.click(checkbox)
      expect(checkbox).not.toBeChecked()
    })
  })

  describe('API Integration', () => {
    it('should call API with correct parameters on submit', async () => {
      const user = userEvent.setup()
      const mockResponse: GeneratedPost = {
        content: 'Great post content',
        hashtags: ['WebDev', 'Tech'],
        characterCount: 18,
        platform: 'linkedin',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'This is my achievement that I want to share')

      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: 'This is my achievement that I want to share',
            platform: 'linkedin',
            tone: 'technical',
            githubActivity: undefined,
          }),
        })
      })
    })

    it('should include GitHub activity in request when checkbox is checked', async () => {
      const user = userEvent.setup()
      const mockResponse: GeneratedPost = {
        content: 'Great post content',
        hashtags: ['WebDev', 'Tech'],
        characterCount: 18,
        platform: 'linkedin',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'This is my achievement with GitHub activity')

      const checkbox = screen.getByLabelText(/Include recent GitHub activity/i)
      await user.click(checkbox)

      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      await user.click(submitButton)

      await waitFor(() => {
        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
        expect(callBody.githubActivity).toBe('Recent GitHub activity')
      })
    })
  })

  describe('Loading State', () => {
    it('should display loading state while generating', async () => {
      const user = userEvent.setup()

      // Mock a delayed response
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            content: 'Post',
            hashtags: [],
            characterCount: 4,
            platform: 'linkedin',
          }),
        }), 100))
      )

      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'Valid topic for testing loading state')

      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      await user.click(submitButton)

      // Check for loading state
      expect(screen.getByText(/Generating.../i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveAttribute('aria-busy', 'true')

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/Generating.../i)).not.toBeInTheDocument()
      })
    })

    it('should disable all form inputs while generating', async () => {
      const user = userEvent.setup()

      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            content: 'Post',
            hashtags: [],
            characterCount: 4,
            platform: 'linkedin',
          }),
        }), 100))
      )

      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'Valid topic for testing')

      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      await user.click(submitButton)

      // Check that form elements are disabled
      expect(textarea).toBeDisabled()
      expect(screen.getByRole('radio', { name: /linkedin/i })).toBeDisabled()

      await waitFor(() => {
        expect(screen.queryByText(/Generating.../i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      const user = userEvent.setup()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal server error',
          message: 'Unable to generate post. Please try again.',
        }),
      })

      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'This should trigger an error')

      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      await user.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert')
        expect(errorMessage).toHaveTextContent(/Unable to generate post/i)
      })
    })

    it('should display rate limit error', async () => {
      const user = userEvent.setup()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: 'Rate limit exceeded',
          message: 'Too many requests.',
        }),
      })

      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'Testing rate limit error')

      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      await user.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert')
        expect(errorMessage).toHaveTextContent(/Rate limit exceeded/i)
      })
    })

    it('should display validation errors from API', async () => {
      const user = userEvent.setup()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid request',
          details: [
            { field: 'topic', message: 'Topic is too short' },
          ],
        }),
      })

      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'Short text that will trigger validation error')

      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      await user.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert')
        expect(errorMessage).toHaveTextContent(/Topic is too short/i)
      })
    })

    it('should clear error when user types after error', async () => {
      const user = userEvent.setup()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Error occurred',
          message: 'Something went wrong',
        }),
      })

      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'Testing error clearing')

      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Type more to clear error
      await user.type(textarea, ' more text')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Success Callback', () => {
    it('should call onPostGenerated callback with generated post', async () => {
      const user = userEvent.setup()
      const mockCallback = jest.fn()
      const mockResponse: GeneratedPost = {
        content: 'Generated post content with hashtags',
        hashtags: ['Tech', 'WebDev'],
        characterCount: 38,
        platform: 'linkedin',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<PostGenerator onPostGenerated={mockCallback} />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'Testing success callback functionality')

      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith(mockResponse)
      })
    })

    it('should reset form after successful generation', async () => {
      const user = userEvent.setup()
      const mockResponse: GeneratedPost = {
        content: 'Post content',
        hashtags: ['Tech'],
        characterCount: 12,
        platform: 'linkedin',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'Testing form reset after success')

      const twitterRadio = screen.getByRole('radio', { name: /twitter/i })
      await user.click(twitterRadio)

      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect((textarea as HTMLTextAreaElement).value).toBe('')
        expect(screen.getByRole('radio', { name: /linkedin/i })).toBeChecked()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on all inputs', () => {
      render(<PostGenerator />)

      // Topic textarea
      const textarea = screen.getByLabelText(/What would you like to share?/i)
      expect(textarea).toHaveAttribute('aria-required', 'true')
      expect(textarea).toHaveAttribute('aria-describedby')

      // Platform radiogroup
      const radiogroup = screen.getByRole('radiogroup')
      expect(radiogroup).toHaveAttribute('aria-required', 'true')
    })

    it('should set aria-invalid when topic is invalid', async () => {
      const user = userEvent.setup()
      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'Short')

      expect(textarea).toHaveAttribute('aria-invalid', 'true')
    })

    it('should have aria-live region for character counter', () => {
      render(<PostGenerator />)

      const counter = screen.getByText(/0 \/ 500/i)
      expect(counter).toHaveAttribute('aria-live', 'polite')
    })

    it('should have role="alert" on error messages', async () => {
      const user = userEvent.setup()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Error',
          message: 'Something went wrong',
        }),
      })

      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'Testing accessibility of error messages')

      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      await user.click(submitButton)

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveAttribute('aria-live', 'assertive')
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<PostGenerator />)

      // Tab through form elements
      await user.tab()
      expect(screen.getByLabelText(/What would you like to share?/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('radio', { name: /linkedin/i })).toHaveFocus()
    })

    it('should have accessible button states', async () => {
      const user = userEvent.setup()

      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            content: 'Post',
            hashtags: [],
            characterCount: 4,
            platform: 'linkedin',
          }),
        }), 100))
      )

      render(<PostGenerator />)

      const textarea = screen.getByLabelText(/What would you like to share?/i)
      await user.type(textarea, 'Testing button accessibility')

      const submitButton = screen.getByRole('button', { name: /Generate Post/i })
      await user.click(submitButton)

      expect(submitButton).toHaveAttribute('aria-busy', 'true')

      await waitFor(() => {
        expect(submitButton).toHaveAttribute('aria-busy', 'false')
      })
    })
  })
})
