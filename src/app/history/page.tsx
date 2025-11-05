'use client'

import * as React from 'react'
import { PublishingHistory } from '@/components/PublishingHistory'

/**
 * History Page
 *
 * Displays publishing history for all social media posts
 */
export default function HistoryPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📊 Publishing History
        </h1>
        <p className="text-gray-600">
          View all your published posts and their engagement metrics
        </p>
      </div>

      {/* Main Content */}
      <PublishingHistory />
    </div>
  )
}
