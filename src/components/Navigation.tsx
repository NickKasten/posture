'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

/**
 * Navigation Component
 *
 * Global navigation header with links to main pages
 * Highlights active page and shows user info
 */
export function Navigation() {
  const pathname = usePathname()
  const [user, setUser] = React.useState<{ email?: string; name?: string } | null>(null)

  /**
   * Fetch user info on mount
   */
  React.useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/user')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (err) {
        console.error('Failed to fetch user:', err)
      }
    }
    fetchUser()
  }, [])

  /**
   * Handle sign out
   */
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      window.location.href = '/'
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '📝' },
    { href: '/history', label: 'History', icon: '📊' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl">✨</div>
            <span className="font-bold text-xl text-gray-900">Vibe Posts</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive(link.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:block text-sm text-gray-600">
                {user.email || user.name || 'User'}
              </div>
            )}
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 flex gap-2 overflow-x-auto">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${isActive(link.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                }
              `}
            >
              <span className="mr-1">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
