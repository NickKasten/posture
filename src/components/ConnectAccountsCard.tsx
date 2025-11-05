'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Account Connection Status
 */
interface AccountStatus {
  platform: 'linkedin' | 'twitter'
  connected: boolean
  expiresAt: string | null
  memberId: string | null
}

/**
 * ConnectAccountsCard Component
 *
 * Displays connection status for LinkedIn and Twitter accounts
 * Provides buttons to initiate OAuth connection flows
 */
export function ConnectAccountsCard() {
  const [accounts, setAccounts] = React.useState<AccountStatus[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  /**
   * Fetch account connection status on mount
   */
  React.useEffect(() => {
    async function fetchAccountStatus() {
      try {
        const response = await fetch('/api/accounts/status')

        if (!response.ok) {
          throw new Error('Failed to fetch account status')
        }

        const data = await response.json()
        setAccounts(data.accounts || [])
      } catch (err: any) {
        console.error('Error fetching accounts:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAccountStatus()
  }, [])

  /**
   * Handle connect button click
   */
  const handleConnect = (platform: 'linkedin' | 'twitter') => {
    window.location.href = `/api/auth/${platform}`
  }

  /**
   * Check if token is expiring soon (within 7 days)
   */
  const isExpiringSoon = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false
    const expiryDate = new Date(expiresAt)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    return expiryDate < sevenDaysFromNow
  }

  /**
   * Get account status for a platform
   */
  const getAccountStatus = (platform: 'linkedin' | 'twitter'): AccountStatus | undefined => {
    return accounts.find(acc => acc.platform === platform)
  }

  const linkedinStatus = getAccountStatus('linkedin')
  const twitterStatus = getAccountStatus('twitter')

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Connected Accounts
        </h2>
        <p className="text-sm text-gray-600">
          Connect your social media accounts to start publishing
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {/* LinkedIn Connection */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              in
            </div>
            <div>
              <h3 className="font-medium text-gray-900">LinkedIn</h3>
              {linkedinStatus?.connected ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-sm text-green-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Connected
                  </span>
                  {linkedinStatus.expiresAt && isExpiringSoon(linkedinStatus.expiresAt) && (
                    <span className="text-xs text-amber-600">
                      ⚠️ Expires soon
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Not connected</p>
              )}
            </div>
          </div>
          <Button
            onClick={() => handleConnect('linkedin')}
            variant={linkedinStatus?.connected ? 'outline' : 'default'}
            size="sm"
          >
            {linkedinStatus?.connected ? 'Reconnect' : 'Connect'}
          </Button>
        </div>

        {/* Twitter Connection */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              𝕏
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Twitter / X</h3>
              {twitterStatus?.connected ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-sm text-green-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Connected
                  </span>
                  {twitterStatus.expiresAt && isExpiringSoon(twitterStatus.expiresAt) && (
                    <span className="text-xs text-amber-600">
                      ⚠️ Expires soon
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Not connected</p>
              )}
            </div>
          </div>
          <Button
            onClick={() => handleConnect('twitter')}
            variant={twitterStatus?.connected ? 'outline' : 'default'}
            size="sm"
          >
            {twitterStatus?.connected ? 'Reconnect' : 'Connect'}
          </Button>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Connect at least one account to start publishing AI-generated posts to your social media profiles.
        </p>
      </div>
    </Card>
  )
}
