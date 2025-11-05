'use client'

import * as React from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import type { GeneratedPost, Platform } from '@/types/post'
import { cn } from '@/lib/utils'

export interface PostPreviewProps {
  post: GeneratedPost
  platform: Platform
  onPublish: (content: string, hashtags: string[]) => Promise<void>
  onCancel?: () => void
  onRegenerate?: () => void
}

/**
 * Character limits for each platform
 */
const PLATFORM_LIMITS = {
  linkedin: 3000,
  twitter: 280,
  both: 280, // Use the more restrictive limit when posting to both
} as const

/**
 * Get character counter color based on percentage used
 */
const getCounterColor = (count: number, limit: number): string => {
  const percentage = (count / limit) * 100

  if (percentage >= 95) {
    return 'text-destructive font-medium'
  } else if (percentage >= 80) {
    return 'text-yellow-600 dark:text-yellow-500 font-medium'
  }
  return 'text-muted-foreground'
}

/**
 * PostPreview Component
 *
 * Displays a generated post with editing capabilities before publishing.
 * Allows users to:
 * - Edit the post content
 * - Remove hashtags
 * - See character count with color-coded indicators
 * - Publish, cancel, or regenerate the post
 */
export function PostPreview({
  post,
  platform,
  onPublish,
  onCancel,
  onRegenerate,
}: PostPreviewProps) {
  // State management
  const [content, setContent] = React.useState(post.content)
  const [hashtags, setHashtags] = React.useState<string[]>(post.hashtags)
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Refs for accessibility
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const errorRef = React.useRef<HTMLDivElement>(null)

  // Get character limit based on platform
  const characterLimit = PLATFORM_LIMITS[platform]
  const characterCount = content.length

  // Validation
  const isContentValid = content.trim().length > 0 && characterCount <= characterLimit
  const canPublish = isContentValid && !isPublishing

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setError(null)
  }

  // Handle hashtag removal
  const handleRemoveHashtag = (hashtagToRemove: string) => {
    setHashtags((prev) => prev.filter((tag) => tag !== hashtagToRemove))
  }

  // Handle publish
  const handlePublish = async () => {
    // Validate content
    if (!isContentValid) {
      setError('Please ensure your content is not empty and within character limits')
      errorRef.current?.focus()
      return
    }

    setIsPublishing(true)
    setError(null)

    try {
      await onPublish(content.trim(), hashtags)
      // Success - parent component will handle navigation/state
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish post'
      setError(errorMessage)
      errorRef.current?.focus()
    } finally {
      setIsPublishing(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  // Handle regenerate
  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate()
    }
  }

  // Focus textarea on mount for immediate editing
  React.useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Preview Your Post</CardTitle>
        <CardDescription>
          Review and edit your post before publishing to {platform === 'both' ? 'LinkedIn and Twitter' : platform.charAt(0).toUpperCase() + platform.slice(1)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Content Editor */}
          <div className="space-y-2">
            <label htmlFor="post-content" className="sr-only">
              Post Content
            </label>
            <Textarea
              id="post-content"
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              className="min-h-32 resize-y"
              aria-label="Edit post content"
              aria-describedby="character-counter"
              aria-invalid={!isContentValid && content.length > 0}
              disabled={isPublishing}
              placeholder="Edit your post content..."
            />
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                {platform === 'linkedin' && 'LinkedIn: 3000 characters max'}
                {platform === 'twitter' && 'Twitter: 280 characters max'}
                {platform === 'both' && 'Character limit: 280 (Twitter)'}
              </p>
              <p
                id="character-counter"
                className={cn(
                  'tabular-nums',
                  getCounterColor(characterCount, characterLimit)
                )}
                aria-live="polite"
              >
                {characterCount} / {characterLimit}
              </p>
            </div>
          </div>

          {/* Hashtags Section */}
          {hashtags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Hashtags:</h3>
              <div className="flex flex-wrap gap-2" role="list" aria-label="Post hashtags">
                {hashtags.map((hashtag) => (
                  <div
                    key={hashtag}
                    role="listitem"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  >
                    <span>#{hashtag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHashtag(hashtag)}
                      disabled={isPublishing}
                      className="inline-flex size-4 items-center justify-center rounded-full hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Remove hashtag ${hashtag}`}
                    >
                      <svg
                        className="size-3"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div
              ref={errorRef}
              role="alert"
              aria-live="assertive"
              className="rounded-md border border-destructive bg-destructive/10 p-4"
              tabIndex={-1}
            >
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Regenerate Button */}
            {onRegenerate && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRegenerate}
                disabled={isPublishing}
                className="flex-1 sm:flex-initial"
              >
                <svg
                  className="size-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                Regenerate
              </Button>
            )}

            {/* Cancel Button */}
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPublishing}
                className="flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
            )}

            {/* Publish Button */}
            <Button
              type="button"
              onClick={handlePublish}
              disabled={!canPublish}
              className="flex-1 sm:flex-auto"
              aria-busy={isPublishing}
            >
              {isPublishing ? (
                <>
                  <svg
                    className="size-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Publishing...
                </>
              ) : (
                <>
                  Publish
                  <svg
                    className="size-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
