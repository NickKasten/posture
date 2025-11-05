'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Published Post Type
 */
interface PublishedPost {
  id: string
  platform: 'linkedin' | 'twitter'
  content: string
  published_at: string
  platform_post_id: string
  engagement_metrics: {
    likes?: number
    comments?: number
    shares?: number
    reposts?: number
    impressions?: number
  } | null
}

/**
 * PublishingHistory Component
 *
 * Displays a list of published posts with engagement metrics
 * Supports filtering by platform and pagination
 */
export function PublishingHistory() {
  const [posts, setPosts] = React.useState<PublishedPost[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<'all' | 'linkedin' | 'twitter'>('all')
  const [total, setTotal] = React.useState(0)

  /**
   * Fetch published posts
   */
  const fetchPosts = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: '0',
      })

      if (filter !== 'all') {
        params.set('platform', filter)
      }

      const response = await fetch(`/api/posts?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }

      const data = await response.json()
      setPosts(data.posts || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      console.error('Error fetching posts:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filter])

  /**
   * Fetch posts on mount and when filter changes
   */
  React.useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  /**
   * Get platform icon
   */
  const getPlatformIcon = (platform: 'linkedin' | 'twitter'): string => {
    return platform === 'linkedin' ? 'in' : '𝕏'
  }

  /**
   * Get platform color
   */
  const getPlatformColor = (platform: 'linkedin' | 'twitter'): string => {
    return platform === 'linkedin' ? 'bg-blue-600' : 'bg-sky-500'
  }

  /**
   * Get post URL
   */
  const getPostUrl = (post: PublishedPost): string => {
    if (post.platform === 'linkedin') {
      return `https://www.linkedin.com/feed/update/urn:li:share:${post.platform_post_id}`
    } else {
      return `https://twitter.com/i/web/status/${post.platform_post_id}`
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Publishing History
            </h2>
            <p className="text-sm text-gray-600">
              {total} {total === 1 ? 'post' : 'posts'} published
            </p>
          </div>
          <Button
            onClick={fetchPosts}
            variant="outline"
            size="sm"
          >
            🔄 Refresh
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'linkedin', 'twitter'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {f === 'all' ? 'All Posts' : f === 'linkedin' ? 'LinkedIn' : 'Twitter'}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No posts yet
          </h3>
          <p className="text-gray-600 mb-4">
            Start by creating and publishing your first post!
          </p>
          <Button
            onClick={() => window.location.href = '/dashboard'}
          >
            Create Post
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div
              key={post.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              {/* Post Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${getPlatformColor(post.platform)} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                    {getPlatformIcon(post.platform)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {post.platform}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(post.published_at)}
                    </p>
                  </div>
                </div>
                <a
                  href={getPostUrl(post)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  View Post →
                </a>
              </div>

              {/* Post Content */}
              <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                {post.content}
              </p>

              {/* Engagement Metrics */}
              {post.engagement_metrics && Object.keys(post.engagement_metrics).length > 0 && (
                <div className="flex gap-4 pt-3 border-t border-gray-100">
                  {post.engagement_metrics.likes !== undefined && (
                    <div className="text-xs text-gray-600">
                      ❤️ {post.engagement_metrics.likes} likes
                    </div>
                  )}
                  {post.engagement_metrics.comments !== undefined && (
                    <div className="text-xs text-gray-600">
                      💬 {post.engagement_metrics.comments} comments
                    </div>
                  )}
                  {post.engagement_metrics.shares !== undefined && (
                    <div className="text-xs text-gray-600">
                      🔄 {post.engagement_metrics.shares} shares
                    </div>
                  )}
                  {post.engagement_metrics.reposts !== undefined && (
                    <div className="text-xs text-gray-600">
                      🔁 {post.engagement_metrics.reposts} reposts
                    </div>
                  )}
                  {post.engagement_metrics.impressions !== undefined && (
                    <div className="text-xs text-gray-600">
                      👁️ {post.engagement_metrics.impressions} impressions
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
