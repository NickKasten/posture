# 🚀 Development Plan - LinkedPost Agent Web App

**Project:** Posture LinkedPost Agent (Web Edition)  
**Timeline:** 7-Day MVP Sprint  
**Architecture:** Next.js + TypeScript + Supabase  
**Security:** Cloud-first with encrypted token storage

---

## 📋 Executive Summary

This plan outlines the 7-day development sprint to build a secure, web-based LinkedIn post generator for developers. The app will fetch GitHub activity, use AI to generate professional posts, and enable secure publishing through LinkedIn's API with cloud convenience.

---

## 🏗️ Project Setup & Architecture

### Core Stack
- **Frontend:** Next.js 13+ + TypeScript + TailwindCSS
- **Backend:** Next.js API Routes + Serverless Functions
- **Storage:** Supabase PostgreSQL with AES-256 encrypted token storage
- **Auth:** Supabase Auth for GitHub and LinkedIn OAuth flows
- **Deployment:** Vercel

### Project Structure
```
src/
├── app/                     # Next.js 13+ app directory
│   ├── api/                 # API routes
│   │   ├── github/          # GitHub API integration
│   │   ├── linkedin/        # LinkedIn API integration
│   │   └── ai/              # AI prompt generation
│   ├── auth/                # Auth callback pages
│   ├── dashboard/           # Post library/dashboard
│   └── globals.css          # Global styles
├── components/              # React components
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities and configurations
├── types/                   # TypeScript interfaces
└── utils/                   # Helper functions
```

---

## 📅 7-Day Sprint Breakdown

### Day 1: Foundation & GitHub Integration ✅ COMPLETED
**Goal:** Set up project structure and implement GitHub authentication

#### Specific Deliverables:
- [x] Next.js 15.3.5 project initialized with TypeScript, TailwindCSS, and ESLint
- [x] Supabase project created with authentication enabled
- [x] GitHub OAuth app registered and configured
- [x] `user_tokens` table created with RLS policies and comprehensive schema
- [x] GitHub OAuth flow implemented (`/api/auth/github` route)
- [x] Token encryption functions implemented and tested (AES-256)
- [x] GitHub API client created (`/api/github/activity` endpoint)
- [x] Environment variable validation setup
- [x] Jest testing framework configured for Next.js
- [x] Comprehensive unit tests for GitHub OAuth flow with edge cases
- [x] GitHub activity route with proper error handling
- [ ] Basic error logging with Sentry integration

#### Key Files:
- `src/app/api/auth/github/route.ts`
- `src/app/api/github/activity/route.ts`
- `src/lib/supabase.ts`

#### Security Implementation:
```typescript
// Token encryption and storage
import { createClient } from '@supabase/supabase-js'

export const storeGitHubToken = async (userId: string, token: string) => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  
  const { error } = await supabase
    .from('user_tokens')
    .upsert({
      user_id: userId,
      provider: 'github',
      encrypted_token: encrypt(token)
    })
  
  if (error) throw error
}
```

---

### Day 2: Input Validation & UI Setup ✅ PARTIALLY COMPLETED
**Goal:** Implement security measures and create core UI components

#### Specific Deliverables:
- [x] Input sanitization functions implemented with comprehensive testing
- [x] Welcome screen component created with responsive design
- [x] GitHub authentication flow integrated in UI with state management
- [x] Basic UI components (Card, Button) implemented with shadcn/ui
- [x] App routing setup with Next.js App Router
- [x] Authentication state handling with URL parameters
- [x] Unit tests for input sanitization and validation functions
- [ ] Context input form with character limits (500 chars)
- [ ] Style selector dropdown (Technical, Casual, Inspiring)
- [ ] Loading states and error boundaries implemented
- [ ] CORS configuration for API routes

#### Security Implementation:
```typescript
// Input sanitization
export const sanitizeUserInput = (input: string): string => {
  return input
    .replace(/```/g, '')
    .replace(/System:/g, '')
    .replace(/Assistant:/g, '')
    .replace(/[^\w\s.,!?-_()[\]{}]/g, '')
    .slice(0, 500)
}
```

#### UI Components:
- Welcome screen with "Tell My Story" CTA
- GitHub consent and auth flow
- Context input form with style selector

---

### Day 3-4: AI Integration & Post Generation ✅ PARTIALLY COMPLETED
**Goal:** Implement AI prompt generation and response handling

#### Specific Deliverables:
- [x] AI prompt template system with structured formatting
- [x] AI API integration with OpenAI (primary) and comprehensive fallback system
- [x] JSON response validation with schema enforcement
- [x] Character count display with LinkedIn limit validation (1300 chars)
- [x] Hashtag generation and validation
- [x] Error handling for AI API failures with detailed error messages
- [x] Comprehensive unit tests for AI response parsing and validation
- [x] Input validation and sanitization for AI requests
- [ ] Post editor component with live preview
- [ ] Rate limiting middleware for AI API calls
- [ ] Integration tests for complete post generation workflow

#### AI Prompt Template:
```typescript
const generatePrompt = (activity: string, context: string, style: string) => {
  return `SYSTEM: You are a LinkedIn post generator. Generate professional posts only.
GITHUB_ACTIVITY: ${sanitizeUserInput(activity)}
USER_CONTEXT: ${sanitizeUserInput(context)}
STYLE: ${style}

Respond with valid JSON: {"post": "...", "hashtags": ["..."]}`
}
```

#### Response Validation:
```typescript
interface AIResponse {
  post: string      // max 1300 chars
  hashtags: string[]
}

const validateAIResponse = (response: any): AIResponse => {
  if (!response.post || typeof response.post !== 'string') {
    throw new Error('Invalid post content')
  }
  if (response.post.length > 1300) {
    throw new Error('Post exceeds character limit')
  }
  return response as AIResponse
}
```

---

### Day 5: LinkedIn Integration 🔄 NEXT PRIORITY
**Goal:** Implement LinkedIn OAuth and post preview functionality

#### Specific Deliverables:
- [ ] LinkedIn OAuth app registered and configured
- [ ] LinkedIn OAuth flow implemented (`/api/auth/linkedin` route)
- [ ] LinkedIn API client for profile and posting (`/api/linkedin` endpoints)
- [ ] LinkedIn post preview component with accurate formatting
- [ ] Scheduling functionality with date/time picker
- [ ] Post confirmation dialog with preview
- [ ] Post status tracking (draft, scheduled, published)
- [ ] LinkedIn API rate limiting implementation
- [ ] Unit tests for LinkedIn OAuth and API integration
- [ ] Integration tests for complete LinkedIn posting workflow

#### LinkedIn OAuth Implementation:
```typescript
// LinkedIn OAuth callback handler
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  if (!code || !state) {
    return Response.json({ error: 'Missing code or state' }, { status: 400 })
  }
  
  // Exchange code for access token
  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!
    })
  })
  
  const tokens = await tokenResponse.json()
  // Store tokens securely and redirect
}
```

---

### Day 6-7: Publishing & Polish 🔄 FINAL PHASE
**Goal:** Complete post workflow and add final polish

#### Specific Deliverables:
- [ ] Manual and scheduled post publishing functionality
- [ ] Post dashboard with filtering and search
- [ ] Post status management (Draft/Scheduled/Posted/Failed)
- [ ] Post editing and duplication features
- [x] Responsive design foundation (mobile, tablet, desktop)
- [ ] Accessibility improvements (WCAG 2.1 AA compliance)
- [ ] Performance optimization (Core Web Vitals)
- [ ] Production deployment to Vercel with all environment variables
- [ ] Database migrations applied to production
- [x] Security implementation completed (encryption, validation)
- [ ] Load testing and performance benchmarking
- [x] Comprehensive testing framework (63 tests passing)
- [x] Documentation structure completed

#### Post Dashboard Features:
- Filter by status/date
- Edit/duplicate/delete actions
- Search functionality
- Export drafts
- Scheduled post management

---

## 🔐 Security Checklist ✅ MOSTLY COMPLETED

### Input Security:
- [x] All user inputs sanitized before AI processing
- [x] Prompt injection protection implemented
- [x] Character limits enforced (500 chars user input, 1300 chars post)
- [x] Structured prompt templates prevent manipulation
- [x] XSS protection through proper escaping

### Token Security:
- [x] All tokens encrypted in Supabase database with AES-256
- [x] No tokens logged or displayed in UI
- [x] Minimal OAuth scopes requested (read:user, user:email)
- [x] Proper token storage with RLS policies
- [ ] Token refresh handling implemented

### Network Security:
- [x] HTTPS enforced for all external requests
- [x] TLS certificate validation enabled
- [x] No sensitive data in request logs
- [x] Secure environment variable handling
- [ ] Rate limiting for API calls

### Output Security:
- [x] AI responses validated against JSON schema
- [x] Content filtering for suspicious outputs
- [x] Error sanitization before user display
- [x] No executable content in posts
- [x] Comprehensive input validation

---

## 🧪 Testing Strategy

### Unit Tests: ✅ COMPLETED
- [x] Input sanitization functions with comprehensive edge cases
- [x] Token encryption/decryption with AES-256
- [x] AI response validation with schema enforcement
- [x] GitHub OAuth flow with all error scenarios
- [x] GitHub activity route with complete mocking
- [x] Home page component testing
- [x] All 63 tests passing with robust coverage
### Specific Unit Tests Required:
- Token encryption/decryption functions
- Input sanitization against prompt injection
- OAuth callback validation
- AI response parsing and validation
- Rate limiting middleware
- Session management functions

### Integration Tests: 🔄 IN PROGRESS
- [x] GitHub API integration (OAuth and activity fetching)
- [ ] LinkedIn API integration (not yet implemented)
- [ ] End-to-end post workflow
- [x] Error handling scenarios for implemented features
### Specific Integration Tests Required:
- Complete GitHub OAuth flow (success/failure scenarios)
- Complete LinkedIn OAuth flow (success/failure scenarios)
- End-to-end post creation workflow
- AI API integration with fallback handling
- Database operations with RLS policies
- Error handling across all API endpoints

### Security Tests:
- Prompt injection attempts
- Token leakage scenarios
- Network security validation
- Input boundary testing

---

## 📦 Deployment & Distribution

### Build Process:
```bash
# Development
npm run dev

# Production build
npm run build

# Deploy to Vercel
vercel --prod
```

### Deployment Checklist:
- [ ] All environment variables configured in Vercel
- [ ] Supabase database migrations applied
- [ ] GitHub OAuth app configured with production URLs
- [ ] LinkedIn OAuth app configured with production URLs
- [ ] Domain DNS configured (if using custom domain)
- [ ] SSL certificates verified
- [ ] Error monitoring (Sentry) configured
- [ ] Analytics tracking enabled
- [ ] Rate limiting middleware tested
- [ ] Database RLS policies tested
- [ ] Backup and recovery procedures documented

### Environment-Specific Configurations:

#### Development
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `NODE_ENV=development`
- `LOG_LEVEL=debug`

#### Staging
- `NEXT_PUBLIC_APP_URL=https://staging-your-domain.vercel.app`
- `NODE_ENV=production`
- `LOG_LEVEL=info`

#### Production
- `NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app`
- `NODE_ENV=production`
- `LOG_LEVEL=error`

### Rollback Procedures:
1. **Immediate Rollback:** Use Vercel dashboard to revert to previous deployment
2. **Database Rollback:** Run migration rollback scripts if needed
3. **Monitoring:** Check error rates and user metrics post-deployment
4. **Communication:** Update status page and notify users if necessary

### Distribution Channels:
1. **Primary:** Vercel deployment with custom domain
2. **Secondary:** GitHub Pages for documentation
3. **Documentation:** README with setup guides

---

## ✅ Success Metrics

| Metric | Target | Current Status | Measurement |
|--------|--------|----------------|-------------|
| Setup Time | < 5 minutes | ✅ ~3 minutes | GitHub OAuth to authenticated state |
| Project Setup | Professional structure | ✅ Complete | Next.js 15 + TypeScript + Testing |
| Security Implementation | Zero vulnerabilities | ✅ Robust | AES-256 encryption + input validation |
| Test Coverage | All critical paths | ✅ 63 tests passing | Comprehensive unit + integration tests |
| GitHub Integration | Full OAuth flow | ✅ Complete | Authentication + activity fetching |
| AI Integration | Working generation | ✅ Complete | OpenAI + validation + error handling |
| Workflow Speed | < 2 minutes | 🔄 Partial | Need LinkedIn integration |
| User Satisfaction | > 90% positive | 🔄 Pending | Awaiting user testing |

---

## 🔄 Current Status & Next Steps

### ✅ COMPLETED (Days 1-3):
1. **Foundation & GitHub Integration** - Complete professional setup
2. **Security & Input Validation** - Comprehensive protection implemented  
3. **AI Integration** - OpenAI integration with robust error handling
4. **Testing Framework** - 63 tests passing with extensive coverage
5. **UI Components** - Basic responsive design with authentication flow

### 🔄 IN PROGRESS (Days 4-5):
1. **Post Editor Component** - Live preview and editing interface
2. **Context Input Form** - User input for additional context
3. **Style Selector** - Technical/Casual/Inspiring tone options

### ⏳ PENDING (Days 5-7):
1. **LinkedIn Integration** - OAuth flow and posting API
2. **Post Scheduling** - Date/time picker for scheduled posts
3. **Dashboard** - Post management and history
4. **Polish & Deployment** - Final UX improvements

## 🔄 Post-MVP Roadmap

### Groq Llama 3.1 Free Tier Details:
- **Model:** Llama 3.1 70B Instruct
- **Rate Limit:** 30 requests/minute, 6000 requests/day
- **Context Length:** 128k tokens
- **Cost:** Free tier available
- **Fallback Strategy:** When user has no API key, use Groq with rate limiting UI

### Phase 2 Features:
- Multi-platform templates (Twitter, Medium)
- Team collaboration features
- Analytics and post performance tracking
- Custom AI model fine-tuning
- Browser extension companion

### Technical Debt:
- Comprehensive error recovery
- Offline mode improvements
- Performance optimizations
- Accessibility enhancements

---

## Error Logging & Monitoring
- Integrate error/event logging (auth failures, AI errors, post API errors).
- Use Vercel logs, Sentry, or LogRocket.
- Add env variables: `LOG_LEVEL`, `SENTRY_DSN`.

## Rate Limiting
- Implement throttling for OpenAI/LinkedIn API calls to avoid token issues or bans.

## Analytics
- Track basic usage metrics (e.g., Vercel Analytics, Plausible).

## Day 6: Testing & QA
- Test mobile responsiveness across devices and browsers.

## Post-MVP Enhancements
- AI Prompt History: Users can view/reuse past prompts.
- Export as Markdown: Allow exporting posts for external editing.
- LinkedIn Card Preview: Show accurate preview for trust/UX.

---

## 📚 Resources & Dependencies

### Required APIs:
- GitHub API (OAuth)
- LinkedIn API (OAuth + Publishing)
- AI API (user-provided OpenAI/Anthropic/Gemini key)

### Environment Variables:
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_REDIRECT_URI=https://your-app.vercel.app/api/auth/linkedin/callback

# Encryption
ENCRYPTION_KEY=your-32-byte-encryption-key
```

### Development Tools:
- Node.js (18+)
- Next.js CLI
- Supabase CLI
- Vercel CLI
- GitHub OAuth App registration
- LinkedIn Developer App registration

---

*This plan ensures a secure, user-friendly web application that respects developer privacy while providing powerful LinkedIn content generation capabilities.* 