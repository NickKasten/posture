'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'

/**
 * User Stats Type
 */
interface UserStats {
  totalPosts: number
  linkedinPosts: number
  twitterPosts: number
  totalEngagement: number
  connectedAccounts: number
}

/**
 * Profile Page
 *
 * Displays user information and usage statistics
 */
export default function ProfilePage() {
  const [user, setUser] = React.useState<{ id: string; email: string; name?: string } | null>(null)
  const [stats, setStats] = React.useState<UserStats | null>(null)
  const [loading, setLoading] = React.useState(true)

  /**
   * Fetch user info and stats on mount
   */
  React.useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user info
        const userResponse = await fetch('/api/user')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData.user)
        }

        // Fetch posts to calculate stats
        const postsResponse = await fetch('/api/posts?limit=1000')
        if (postsResponse.ok) {
          const postsData = await postsResponse.json()
          const posts = postsData.posts || []

          // Fetch account status
          const accountsResponse = await fetch('/api/accounts/status')
          const accountsData = accountsResponse.ok ? await accountsResponse.json() : { accounts: [] }
          const connectedCount = accountsData.accounts?.filter((a: any) => a.connected).length || 0

          // Calculate stats
          const linkedinCount = posts.filter((p: any) => p.platform === 'linkedin').length
          const twitterCount = posts.filter((p: any) => p.platform === 'twitter').length

          const totalEngagement = posts.reduce((sum: number, post: any) => {
            const metrics = post.engagement_metrics || {}
            return sum + (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0) + (metrics.reposts || 0)
          }, 0)

          setStats({
            totalPosts: posts.length,
            linkedinPosts: linkedinCount,
            twitterPosts: twitterCount,
            totalEngagement,
            connectedAccounts: connectedCount,
          })
        }
      } catch (error) {
        console.error('Error fetching profile data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          👤 Profile
        </h1>
        <p className="text-gray-600">
          View your account information and usage statistics
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* User Info Card */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.name || 'User'}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                User ID: {user?.id?.slice(0, 8)}...
              </p>
            </div>
          </div>
        </Card>

        {/* Stats Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Usage Statistics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Total Posts */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-3xl font-bold text-blue-700 mb-1">
                {stats?.totalPosts || 0}
              </div>
              <div className="text-sm text-blue-600">Total Posts</div>
            </div>

            {/* LinkedIn Posts */}
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
              <div className="text-3xl font-bold text-indigo-700 mb-1">
                {stats?.linkedinPosts || 0}
              </div>
              <div className="text-sm text-indigo-600">LinkedIn Posts</div>
            </div>

            {/* Twitter Posts */}
            <div className="p-4 bg-gradient-to-br from-sky-50 to-sky-100 rounded-lg">
              <div className="text-3xl font-bold text-sky-700 mb-1">
                {stats?.twitterPosts || 0}
              </div>
              <div className="text-sm text-sky-600">Twitter Posts</div>
            </div>

            {/* Total Engagement */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-3xl font-bold text-purple-700 mb-1">
                {stats?.totalEngagement || 0}
              </div>
              <div className="text-sm text-purple-600">Total Engagement</div>
            </div>

            {/* Connected Accounts */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-3xl font-bold text-green-700 mb-1">
                {stats?.connectedAccounts || 0}/2
              </div>
              <div className="text-sm text-green-600">Connected Accounts</div>
            </div>

            {/* Placeholder for future stat */}
            <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
              <div className="text-3xl font-bold text-amber-700 mb-1">
                Soon
              </div>
              <div className="text-sm text-amber-600">Analytics</div>
            </div>
          </div>
        </Card>

        {/* Account Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>

          {stats && stats.totalPosts > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Published {stats.totalPosts} {stats.totalPosts === 1 ? 'post' : 'posts'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Across {stats.connectedAccounts} {stats.connectedAccounts === 1 ? 'platform' : 'platforms'}
                  </p>
                </div>
              </div>

              {stats.totalEngagement > 0 && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Received {stats.totalEngagement} total engagements
                    </p>
                    <p className="text-xs text-gray-500">
                      Likes, comments, shares, and reposts
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-gray-600">No activity yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Start publishing posts to see your activity here
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
