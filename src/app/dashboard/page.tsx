'use client'

import * as React from 'react'
import { PostGenerator } from '@/components/PostGenerator'
import { PostPreview } from '@/components/PostPreview'
import { ConnectAccountsCard } from '@/components/ConnectAccountsCard'
import type { GeneratedPost, Platform } from '@/types/post'

/**
 * Dashboard Page
 *
 * Main interface for generating and publishing LinkedIn/Twitter posts
 * Integrates PostGenerator, PostPreview, and ConnectAccountsCard components
 */
export default function DashboardPage() {
  const [generatedPost, setGeneratedPost] = React.useState<GeneratedPost | null>(null)
  const [selectedPlatform, setSelectedPlatform] = React.useState<Platform>('linkedin')
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [publishError, setPublishError] = React.useState<string | null>(null)
  const [publishSuccess, setPublishSuccess] = React.useState(false)

  /**
   * Handle post generation completion
   */
  const handlePostGenerated = React.useCallback((post: GeneratedPost) => {
    setGeneratedPost(post)
    setSelectedPlatform(post.platform)
    setPublishSuccess(false)
    setPublishError(null)
  }, [])

  /**
   * Handle post publishing
   */
  const handlePublish = React.useCallback(async (content: string, hashtags: string[]) => {
    setIsPublishing(true)
    setPublishError(null)

    try {
      // Add hashtags to content if not already included
      const contentWithHashtags = hashtags.length > 0 && !content.includes('#')
        ? `${content}\n\n${hashtags.map(tag => `#${tag.replace(/^#/, '')}`).join(' ')}`
        : content

      // Determine which endpoint to call based on platform
      const endpoint = selectedPlatform === 'linkedin'
        ? '/api/publish/linkedin'
        : selectedPlatform === 'twitter'
        ? '/api/publish/twitter'
        : null // 'both' case needs separate logic

      if (!endpoint) {
        throw new Error('Multi-platform publishing not yet implemented')
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In production, add auth token header here
        },
        body: JSON.stringify({
          content: contentWithHashtags,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 403 && data.action === 'redirect') {
          // User needs to connect account
          window.location.href = data.redirectUrl
          return
        }

        if (response.status === 401 && data.action === 'redirect') {
          // Token expired, need to reconnect
          if (confirm('Your connection has expired. Reconnect now?')) {
            window.location.href = data.redirectUrl
          }
          return
        }

        throw new Error(data.message || 'Failed to publish post')
      }

      // Success!
      setPublishSuccess(true)
      setGeneratedPost(null) // Clear the preview

      // Show success message
      alert(`✅ Post published successfully!\n\nView it here: ${data.url}`)

    } catch (error: any) {
      console.error('Publishing error:', error)
      setPublishError(error.message || 'Failed to publish post')
    } finally {
      setIsPublishing(false)
    }
  }, [selectedPlatform])

  /**
   * Handle cancel (clear preview)
   */
  const handleCancel = React.useCallback(() => {
    setGeneratedPost(null)
    setPublishError(null)
    setPublishSuccess(false)
  }, [])

  /**
   * Handle regenerate (clear preview to show generator again)
   */
  const handleRegenerate = React.useCallback(() => {
    setGeneratedPost(null)
  }, [])

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📝 Create Your Post
        </h1>
        <p className="text-gray-600">
          Generate professional LinkedIn and Twitter posts powered by AI
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Connect Accounts Card */}
        <ConnectAccountsCard />

        {/* Show PostGenerator if no generated post */}
        {!generatedPost && (
          <PostGenerator onPostGenerated={handlePostGenerated} />
        )}

        {/* Show PostPreview if post is generated */}
        {generatedPost && (
          <PostPreview
            post={generatedPost}
            platform={selectedPlatform}
            onPublish={handlePublish}
            onCancel={handleCancel}
            onRegenerate={handleRegenerate}
          />
        )}

        {/* Success Message */}
        {publishSuccess && !generatedPost && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-lg font-semibold text-green-900 mb-1">
              Post Published!
            </h3>
            <p className="text-green-700 mb-4">
              Your post has been successfully published to {selectedPlatform === 'linkedin' ? 'LinkedIn' : 'Twitter'}.
            </p>
            <button
              onClick={() => setPublishSuccess(false)}
              className="text-green-700 underline hover:text-green-900"
            >
              Create another post →
            </button>
          </div>
        )}
      </div>

      {/* Footer / Help Text */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Need help? Check out the{' '}
          <a href="/docs" className="text-blue-600 hover:underline">
            documentation
          </a>
          {' '}or{' '}
          <a href="/support" className="text-blue-600 hover:underline">
            contact support
          </a>
          .
        </p>
      </div>
    </div>
  )
}
