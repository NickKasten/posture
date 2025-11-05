'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConnectAccountsCard } from '@/components/ConnectAccountsCard'

/**
 * Settings Page
 *
 * User settings and preferences management
 */
export default function SettingsPage() {
  const [defaultPlatform, setDefaultPlatform] = React.useState<'linkedin' | 'twitter' | 'both'>('linkedin')
  const [defaultTone, setDefaultTone] = React.useState<'technical' | 'casual' | 'inspiring'>('technical')
  const [saving, setSaving] = React.useState(false)
  const [saveSuccess, setSaveSuccess] = React.useState(false)

  /**
   * Load preferences on mount
   */
  React.useEffect(() => {
    const loadedPlatform = localStorage.getItem('defaultPlatform') as 'linkedin' | 'twitter' | 'both' | null
    const loadedTone = localStorage.getItem('defaultTone') as 'technical' | 'casual' | 'inspiring' | null

    if (loadedPlatform) setDefaultPlatform(loadedPlatform)
    if (loadedTone) setDefaultTone(loadedTone)
  }, [])

  /**
   * Save preferences
   */
  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)

    try {
      // Save to localStorage (in future, save to database)
      localStorage.setItem('defaultPlatform', defaultPlatform)
      localStorage.setItem('defaultTone', defaultTone)

      // Show success message
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ⚙️ Settings
        </h1>
        <p className="text-gray-600">
          Manage your account connections and preferences
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Account Connections */}
        <ConnectAccountsCard />

        {/* Posting Preferences */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Posting Preferences
          </h2>

          <div className="space-y-6">
            {/* Default Platform */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Platform
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Choose which platform to publish to by default
              </p>
              <div className="flex gap-3">
                {(['linkedin', 'twitter', 'both'] as const).map(platform => (
                  <button
                    key={platform}
                    onClick={() => setDefaultPlatform(platform)}
                    className={`
                      flex-1 px-4 py-3 rounded-lg border-2 font-medium text-sm transition-colors
                      ${defaultPlatform === platform
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }
                    `}
                  >
                    {platform === 'linkedin' && '💼 LinkedIn'}
                    {platform === 'twitter' && '🐦 Twitter'}
                    {platform === 'both' && '🌐 Both'}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Tone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Tone
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Choose the default tone for AI-generated posts
              </p>
              <div className="flex gap-3">
                {(['technical', 'casual', 'inspiring'] as const).map(tone => (
                  <button
                    key={tone}
                    onClick={() => setDefaultTone(tone)}
                    className={`
                      flex-1 px-4 py-3 rounded-lg border-2 font-medium text-sm transition-colors
                      ${defaultTone === tone
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }
                    `}
                  >
                    {tone === 'technical' && '🔬 Technical'}
                    {tone === 'casual' && '😊 Casual'}
                    {tone === 'inspiring' && '✨ Inspiring'}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
                {saveSuccess && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Saved successfully!
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Account Management */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Account Management
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Data & Privacy</h3>
              <p className="text-sm text-gray-600 mb-3">
                Your data is encrypted and stored securely. OAuth tokens are encrypted at rest using AES-256.
              </p>
              <Button variant="outline" size="sm">
                View Privacy Policy
              </Button>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-medium text-amber-900 mb-2">⚠️ Danger Zone</h3>
              <p className="text-sm text-amber-700 mb-3">
                Delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="outline" size="sm" className="border-red-600 text-red-600 hover:bg-red-50">
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
