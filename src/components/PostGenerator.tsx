'use client'

import * as React from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import type { GeneratedPost, Platform, Tone } from '@/types/post'
import { cn } from '@/lib/utils'

export interface PostGeneratorProps {
  onPostGenerated?: (post: GeneratedPost) => void;
}

export function PostGenerator({ onPostGenerated }: PostGeneratorProps) {
  // State management
  const [topic, setTopic] = React.useState('')
  const [platform, setPlatform] = React.useState<Platform>('linkedin')
  const [tone, setTone] = React.useState<Tone>('technical')
  const [includeGitHubActivity, setIncludeGitHubActivity] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Refs for accessibility
  const topicRef = React.useRef<HTMLTextAreaElement>(null)
  const errorRef = React.useRef<HTMLDivElement>(null)

  // Character count
  const characterCount = topic.length
  const maxCharacters = 500

  // Validation
  const isTopicValid = topic.trim().length >= 10
  const canSubmit = isTopicValid && !isGenerating

  // Handle topic change
  const handleTopicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= maxCharacters) {
      setTopic(value)
      setError(null)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Clear previous errors
    setError(null)

    // Validate topic
    if (!isTopicValid) {
      setError('Topic must be at least 10 characters long')
      topicRef.current?.focus()
      errorRef.current?.focus()
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          platform,
          tone,
          // Include GitHub activity if checkbox is checked
          // In a real implementation, this would fetch actual GitHub data
          githubActivity: includeGitHubActivity ? 'Recent GitHub activity' : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error types
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a few moments.')
        }
        if (response.status === 400 && data.details) {
          // Handle validation errors
          if (Array.isArray(data.details)) {
            throw new Error(data.details.map((d: any) => d.message).join(', '))
          }
          throw new Error(data.details)
        }
        throw new Error(data.message || data.error || 'Failed to generate post')
      }

      // Success - call the callback with the generated post
      if (onPostGenerated) {
        onPostGenerated(data)
      }

      // Reset form
      setTopic('')
      setPlatform('linkedin')
      setTone('technical')
      setIncludeGitHubActivity(false)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      errorRef.current?.focus()
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Generate Your Post</CardTitle>
        <CardDescription>
          Create engaging LinkedIn or Twitter posts with AI assistance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic Input */}
          <div className="space-y-2">
            <Label htmlFor="topic">
              What would you like to share? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="topic"
              ref={topicRef}
              value={topic}
              onChange={handleTopicChange}
              placeholder="e.g., I just reduced our API latency by 40% using caching strategies..."
              className="min-h-24 resize-none"
              aria-required="true"
              aria-invalid={!isTopicValid && topic.length > 0}
              aria-describedby="topic-description topic-counter"
              disabled={isGenerating}
            />
            <div className="flex items-center justify-between text-sm">
              <p id="topic-description" className="text-muted-foreground">
                Minimum 10 characters required
              </p>
              <p
                id="topic-counter"
                className={cn(
                  'tabular-nums',
                  characterCount > maxCharacters * 0.9 && 'text-destructive font-medium'
                )}
                aria-live="polite"
              >
                {characterCount} / {maxCharacters}
              </p>
            </div>
          </div>

          {/* Platform Selection */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">
              Platform <span className="text-destructive">*</span>
            </legend>
            <div className="flex gap-4" role="radiogroup" aria-required="true">
              <label
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border-2 px-4 py-3 transition-all hover:bg-accent',
                  platform === 'linkedin'
                    ? 'border-primary bg-primary/5'
                    : 'border-input'
                )}
              >
                <input
                  type="radio"
                  name="platform"
                  value="linkedin"
                  checked={platform === 'linkedin'}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="sr-only"
                  disabled={isGenerating}
                />
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="font-medium">LinkedIn</span>
              </label>
              <label
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border-2 px-4 py-3 transition-all hover:bg-accent',
                  platform === 'twitter'
                    ? 'border-primary bg-primary/5'
                    : 'border-input'
                )}
              >
                <input
                  type="radio"
                  name="platform"
                  value="twitter"
                  checked={platform === 'twitter'}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="sr-only"
                  disabled={isGenerating}
                />
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="font-medium">Twitter</span>
              </label>
              <label
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border-2 px-4 py-3 transition-all hover:bg-accent',
                  platform === 'both'
                    ? 'border-primary bg-primary/5'
                    : 'border-input'
                )}
              >
                <input
                  type="radio"
                  name="platform"
                  value="both"
                  checked={platform === 'both'}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="sr-only"
                  disabled={isGenerating}
                />
                <span className="font-medium">Both</span>
              </label>
            </div>
          </fieldset>

          {/* Tone Selection */}
          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={(value) => setTone(value as Tone)} disabled={isGenerating}>
              <SelectTrigger id="tone" className="w-full" aria-label="Select post tone">
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="inspiring">Inspiring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* GitHub Activity Checkbox */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="github-activity"
              checked={includeGitHubActivity}
              onChange={(e) => setIncludeGitHubActivity(e.target.checked)}
              className="mt-1 size-4 rounded border-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              disabled={isGenerating}
            />
            <div className="space-y-1">
              <Label htmlFor="github-activity" className="cursor-pointer font-normal">
                Include recent GitHub activity
              </Label>
              <p className="text-sm text-muted-foreground">
                Optionally incorporate your latest commits and contributions
              </p>
            </div>
          </div>

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

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!canSubmit}
            aria-busy={isGenerating}
          >
            {isGenerating ? (
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
                Generating...
              </>
            ) : (
              <>
                Generate Post
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
        </form>
      </CardContent>
    </Card>
  )
}
