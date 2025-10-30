# 🤖 Agent Team Specifications

**Project:** Posture LinkedPost Agent
**Version:** 2.0
**Last Updated:** 2025-10-06
**Purpose:** Complete specifications for all specialized agent teams working on the project

---

## 📋 Table of Contents

1. [Team 1: UX Flow Architect](#team-1-ux-flow-architect)
2. [Team 2: Editor & AI Integration Specialist](#team-2-editor--ai-integration-specialist)
3. [Team 3: LinkedIn & Publishing Expert](#team-3-linkedin--publishing-expert)
4. [Team 4: Dashboard & Analytics Engineer](#team-4-dashboard--analytics-engineer)
5. [Team 5: Accessibility & Performance Specialist](#team-5-accessibility--performance-specialist)
6. [Team 6: Security & Cyber Defense](#team-6-security--cyber-defense)
7. [Team 7: Whimsy Injection Agent](#team-7-whimsy-injection-agent)
8. [Team 8: Orchestration & Coordination](#team-8-orchestration--coordination)

---

## Team 1: UX Flow Architect

### Role
Transform static UI into conversational AI-led experience with progressive disclosure

### Expertise Required
- Progressive disclosure patterns (2025 best practices)
- Conversational UI design
- React state management (hooks, context)
- Framer Motion animations
- Mobile-first responsive design

### Primary Objectives

1. **Implement AI Q&A System**
   - Build conversational flow with 3-5 adaptive questions
   - Questions adapt based on GitHub activity presence
   - Allow users to skip any question
   - Store conversation context in state

2. **Build Progressive Disclosure Patterns**
   - Show essential UI first, hide advanced features
   - Reduce cognitive load by 30-40%
   - Smooth transitions between steps
   - Visual progress indicators

3. **Create Skip-to-Draft Functionality**
   - "Skip, I'll tell you myself" option on GitHub scan
   - "Skip to drafting" button during Q&A
   - Blank slate or minimal draft generation

4. **Add Real-Time Context Preview**
   - Sidebar showing what AI is learning
   - Updates as user answers questions
   - Visual representation of gathered context

### Technical Requirements

**State Management:**
```typescript
interface ConversationState {
  currentQuestion: number;
  answers: Record<string, string>;
  githubActivity: GitHubActivity | null;
  contextPreview: string[];
  isSkipped: boolean;
}
```

**Component Structure:**
```
src/components/onboarding/
├── WelcomeScreen.tsx
├── GitHubScanPrompt.tsx
├── AIQuestionFlow.tsx
├── QuestionCard.tsx
├── ContextPreview.tsx
├── ProgressIndicator.tsx
└── SkipButton.tsx
```

**Accessibility:**
- ARIA labels on all interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Focus management between question steps
- Screen reader announcements for progress

### Integration Points

**Inputs:**
- GitHub activity from `/api/github/activity`
- User authentication state from Supabase

**Outputs:**
- Conversation context to Team 2 (Editor)
- Format: `{ activity: string, context: string, style: string }`

**Dependencies:**
- Team 6: Security validation on all inputs
- Team 5: Accessibility review
- Team 7: Whimsy injection (loading states, progress celebrations)

### Success Criteria

- [ ] Complete onboarding flow in <2 minutes
- [ ] 30-40% reduction in cognitive load (A/B testing)
- [ ] Skip option available at every stage
- [ ] Context preview updates in real-time (<100ms)
- [ ] Zero keyboard navigation dead-ends
- [ ] Mobile completion rate matches desktop (±5%)

### Files to Create/Modify

- `src/app/onboarding/page.tsx` (new)
- `src/components/onboarding/*` (new directory)
- `src/hooks/useConversationState.ts` (new)
- `src/app/page.tsx` (modify to route to onboarding)

---

## Team 2: Editor & AI Integration Specialist

### Role
Build core post creation experience with real-time AI assistance

### Expertise Required
- LLM API integration (OpenAI, Anthropic, Gemini)
- Real-time editing interfaces
- Prompt engineering
- Error handling and fallback strategies
- Rate limiting and cost optimization

### Primary Objectives

1. **Implement Split-Pane Editor**
   - Left pane: Editable post content (textarea)
   - Right pane: AI chat assistant for refinements
   - Responsive layout (stack vertically on mobile)

2. **Integrate Real AI Providers**
   - OpenAI GPT-4o as primary
   - Anthropic Claude as secondary
   - Groq Llama 3.1 70B as free tier fallback
   - Graceful degradation on failures

3. **Add Real-Time Features**
   - Character counter (1300 LinkedIn limit)
   - Tone adjustment dropdown (Technical, Casual, Inspiring)
   - Live preview of formatting
   - Debounced auto-save to drafts

4. **Create AI Suggestion Engine**
   - Inline suggestions without forced changes
   - "Rephrase this section" functionality
   - "Make more technical/casual/inspiring"
   - "Add more details about X"

### Technical Requirements

**AI Provider Configuration:**
```typescript
// src/lib/ai/providers.ts
interface AIProvider {
  name: 'openai' | 'anthropic' | 'gemini' | 'groq';
  apiKey: string | null; // user-supplied or null for free tier
  endpoint: string;
  model: string;
  maxTokens: number;
  rateLimit: { requests: number; window: string };
}

const providers: AIProvider[] = [
  {
    name: 'openai',
    apiKey: process.env.OPENAI_API_KEY || null,
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    maxTokens: 2000,
    rateLimit: { requests: 20, window: '1m' }
  },
  {
    name: 'groq',
    apiKey: process.env.GROQ_API_KEY, // free tier
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-70b-versatile',
    maxTokens: 2000,
    rateLimit: { requests: 30, window: '1m' }
  }
];
```

**Prompt Engineering:**
```typescript
// src/lib/ai/prompts.ts
export const generatePostPrompt = (
  activity: string,
  context: string,
  style: string
) => {
  const systemPrompt = `You are a LinkedIn post generator for developers.
Generate professional, engaging posts that showcase technical achievements.

CONSTRAINTS:
- Maximum 1300 characters
- Include 3-5 relevant hashtags
- Match the requested style: ${style}
- Focus on storytelling, not just facts
- Avoid jargon unless style is "Technical"

OUTPUT FORMAT (JSON only):
{
  "post": "The post content here...",
  "hashtags": ["#WebDev", "#AI", "#OpenSource"]
}`;

  const userPrompt = `Create a LinkedIn post based on:

GITHUB ACTIVITY:
${activity}

PERSONAL CONTEXT:
${context}

STYLE: ${style}`;

  return { systemPrompt, userPrompt };
};
```

**Component Structure:**
```
src/components/editor/
├── SplitPaneEditor.tsx
├── PostEditor.tsx (left pane)
├── AIAssistant.tsx (right pane)
├── CharacterCounter.tsx
├── ToneSelector.tsx
├── SuggestionCard.tsx
└── SaveDraftButton.tsx
```

**API Endpoints:**
```
POST /api/ai/generate
  Body: { activity, context, style, provider? }
  Response: { post, hashtags }

POST /api/ai/refine
  Body: { currentPost, instruction }
  Response: { refinedPost }

POST /api/ai/suggest
  Body: { currentPost, section }
  Response: { suggestions: string[] }
```

### Integration Points

**Inputs:**
- Conversation context from Team 1
- User-supplied API keys (optional)
- Draft posts from Team 4 (edit mode)

**Outputs:**
- Generated posts to Team 3 (Publishing)
- Saved drafts to Team 4 (Dashboard)

**Dependencies:**
- Team 6: Input sanitization, output validation
- Team 5: Keyboard shortcuts, accessibility
- Team 7: Loading states, success animations

### Success Criteria

- [ ] Post generation in <10 seconds (p95)
- [ ] AI refinement in <5 seconds (p95)
- [ ] Zero prompt injection vulnerabilities
- [ ] Seamless provider fallback (<2s switch)
- [ ] Character counter updates in real-time (<50ms)
- [ ] Drafts auto-save every 30 seconds

### Files to Create/Modify

- `src/app/editor/page.tsx` (new)
- `src/components/editor/*` (new directory)
- `src/lib/ai/providers.ts` (new)
- `src/lib/ai/prompts.ts` (new)
- `src/app/api/ai/route.ts` (modify - remove mock)
- `src/app/api/ai/refine/route.ts` (new)
- `src/app/api/ai/suggest/route.ts` (new)

---

## Team 3: LinkedIn & Publishing Expert

### Role
Complete publishing pipeline with LinkedIn integration or alternative solutions

### Expertise Required
- OAuth 2.0 flows (PKCE)
- LinkedIn API (UGC Posts)
- Partner Program requirements
- Scheduling systems
- Error handling for API failures

### Primary Objectives

1. **Research LinkedIn Partner Program**
   - Application requirements and timeline
   - Alternative approaches if not approved
   - Compliance with LinkedIn policies

2. **Implement LinkedIn OAuth**
   - Authorization flow with PKCE
   - Token storage and refresh
   - Scope management (w_member_social)

3. **Build Post Publishing**
   - UGC Post API integration
   - Preview with accurate formatting
   - Error handling (rate limits, failures)

4. **Create Scheduling System**
   - Date/time picker for future posts
   - Queue management
   - Optimal time suggestions (AI-powered)

### Technical Requirements

**LinkedIn API Specifications:**
```typescript
// src/lib/linkedin/types.ts
interface LinkedInPost {
  author: string; // urn:li:person:{id}
  lifecycleState: 'PUBLISHED';
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: {
        text: string; // max 3000 chars (we use 1300)
      };
      shareMediaCategory: 'NONE' | 'ARTICLE' | 'IMAGE';
    };
  };
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' | 'CONNECTIONS';
  };
}
```

**OAuth Flow:**
```
1. User clicks "Connect LinkedIn"
2. Redirect to: https://www.linkedin.com/oauth/v2/authorization
   - response_type=code
   - client_id={CLIENT_ID}
   - redirect_uri={REDIRECT_URI}
   - state={RANDOM_STATE}
   - scope=w_member_social,r_liteprofile

3. Callback: /api/auth/linkedin/callback?code={CODE}&state={STATE}
4. Exchange code for access token
5. Store encrypted token in Supabase
```

**Alternative Approaches (if Partner Program blocked):**
1. **Copy-to-Clipboard with Format Preservation**
   - Generate formatted text
   - Copy button with rich text formatting
   - Instructions for manual paste

2. **Browser Extension Companion**
   - Inject content directly into LinkedIn post composer
   - User initiates from extension popup
   - No API required

3. **LinkedIn Share URL**
   - Generate pre-filled share URL
   - Open in new tab for user to review and post
   - Limited formatting control

**Component Structure:**
```
src/components/publishing/
├── LinkedInConnect.tsx
├── PostPreview.tsx
├── SchedulePicker.tsx
├── PublishButton.tsx
├── CopyToClipboard.tsx (fallback)
└── PublishingStatus.tsx
```

**API Endpoints:**
```
GET /api/auth/linkedin/authorize
  Redirects to LinkedIn OAuth

GET /api/auth/linkedin/callback
  Handles OAuth callback, stores token

POST /api/linkedin/publish
  Body: { postId, scheduledFor? }
  Response: { success, linkedInUrl? }

GET /api/linkedin/profile
  Response: { id, name, profilePicture }
```

### Integration Points

**Inputs:**
- Generated posts from Team 2
- User authentication (Supabase)
- Scheduled posts from Team 4

**Outputs:**
- Published post status to Team 4
- Error notifications to user

**Dependencies:**
- Team 6: Token encryption, OAuth security
- Team 5: Accessible date picker
- Team 7: Success celebrations on publish

### Success Criteria

- [ ] OAuth flow completes in <30 seconds
- [ ] Preview matches LinkedIn formatting 100%
- [ ] Scheduling accurate to the minute
- [ ] Clear error messages for failures
- [ ] Fallback (copy-to-clipboard) works on all browsers
- [ ] Rate limit handling (500 posts/day)

### Files to Create/Modify

- `src/app/api/auth/linkedin/authorize/route.ts` (new)
- `src/app/api/auth/linkedin/callback/route.ts` (new)
- `src/app/api/linkedin/publish/route.ts` (new)
- `src/app/api/linkedin/profile/route.ts` (new)
- `src/components/publishing/*` (new directory)
- `src/lib/linkedin/client.ts` (new)

---

## Team 4: Dashboard & Analytics Engineer

### Role
Build post management, history, and performance tracking interface

### Expertise Required
- Data visualization
- Filtering and search systems
- Database optimization (indexes, queries)
- Export functionality (CSV, JSON)

### Primary Objectives

1. **Create Post Library**
   - Grid/list view toggle
   - Filtering by status (Draft, Scheduled, Published)
   - Filtering by date range
   - Search with fuzzy matching

2. **Implement Version History**
   - Track edits to posts
   - Snapshot comparison
   - Restore previous versions

3. **Build Template Library**
   - Save successful posts as templates
   - Template categories (Launch, Learning, Achievement)
   - Quick-apply templates

4. **Add Basic Analytics**
   - View counts (if LinkedIn API available)
   - Engagement rates
   - Best performing posts
   - Export to CSV

### Technical Requirements

**Database Schema Extensions:**
```sql
-- Post versions for history
CREATE TABLE post_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  hashtags TEXT[],
  version_number INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, version_number)
);

-- Post templates
CREATE TABLE post_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  hashtags TEXT[],
  category VARCHAR(50),
  use_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post analytics (if LinkedIn provides data)
CREATE TABLE post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Component Structure:**
```
src/components/dashboard/
├── DashboardLayout.tsx
├── PostGrid.tsx
├── PostCard.tsx
├── FilterSidebar.tsx
├── SearchBar.tsx
├── ViewToggle.tsx
├── VersionHistory.tsx
├── TemplateLibrary.tsx
├── AnalyticsChart.tsx
└── ExportButton.tsx
```

**API Endpoints:**
```
GET /api/posts
  Query: { status?, dateFrom?, dateTo?, search? }
  Response: { posts: Post[], total: number }

POST /api/posts/duplicate
  Body: { postId }
  Response: { newPost: Post }

DELETE /api/posts/:id
  Response: { success: boolean }

GET /api/posts/:id/versions
  Response: { versions: PostVersion[] }

POST /api/templates
  Body: { name, description, content, hashtags, category }
  Response: { template: Template }

GET /api/templates
  Response: { templates: Template[] }

GET /api/analytics/summary
  Response: { totalPosts, totalViews, avgEngagement }
```

### Integration Points

**Inputs:**
- Posts from Team 2 (drafts, published)
- Analytics data from Team 3 (LinkedIn API)

**Outputs:**
- Draft posts to Team 2 (edit mode)
- Templates to Team 2 (quick-apply)

**Dependencies:**
- Team 6: RLS policies, secure queries
- Team 5: Accessible data tables
- Team 7: Achievement badges, milestone celebrations

### Success Criteria

- [ ] Dashboard loads in <2 seconds
- [ ] Search results in <500ms
- [ ] Filter updates without page refresh
- [ ] Template library saves 50% creation time
- [ ] Export completes in <5 seconds for 100 posts
- [ ] Version comparison renders in <1 second

### Files to Create/Modify

- `src/app/dashboard/page.tsx` (new)
- `src/components/dashboard/*` (new directory)
- `src/app/api/posts/route.ts` (new)
- `src/app/api/posts/[id]/route.ts` (new)
- `src/app/api/templates/route.ts` (new)
- `src/app/api/analytics/summary/route.ts` (new)
- `supabase/schema.sql` (add new tables)

---

## Team 5: Accessibility & Performance Specialist

### Role
Ensure smooth, inclusive, cutting-edge UX across all devices and abilities

### Expertise Required
- WCAG 2.1 AA/AAA compliance
- Core Web Vitals optimization
- Mobile-first development
- Voice UI (Web Speech API)
- Performance profiling

### Primary Objectives

1. **Implement Voice Input**
   - Web Speech API for Q&A responses
   - Voice-to-text for post editing
   - Language support (English primary)
   - Error handling for unsupported browsers

2. **Add Comprehensive Keyboard Navigation**
   - Tab order optimization
   - Keyboard shortcuts (Ctrl+Enter to publish, etc.)
   - Focus management between views
   - Skip links for screen readers

3. **Build Dark Mode**
   - System preference detection
   - Manual toggle
   - Consistent color contrast (WCAG AAA)
   - Smooth transition animations

4. **Optimize Core Web Vitals**
   - Largest Contentful Paint (LCP) <2.5s
   - First Input Delay (FID) <100ms
   - Cumulative Layout Shift (CLS) <0.1
   - Code splitting, lazy loading

### Technical Requirements

**Voice Input Implementation:**
```typescript
// src/hooks/useVoiceInput.ts
interface VoiceInputOptions {
  language?: string;
  continuous?: boolean;
  onResult: (transcript: string) => void;
  onError: (error: string) => void;
}

export const useVoiceInput = ({
  language = 'en-US',
  continuous = false,
  onResult,
  onError
}: VoiceInputOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  // Implementation...
};
```

**Keyboard Shortcuts:**
```typescript
// src/hooks/useKeyboardShortcuts.ts
const shortcuts = {
  'Ctrl+Enter': 'Publish post',
  'Ctrl+S': 'Save draft',
  'Ctrl+/': 'Show keyboard shortcuts',
  'Escape': 'Close modal/cancel',
  'Tab': 'Navigate forward',
  'Shift+Tab': 'Navigate backward'
};
```

**Dark Mode:**
```typescript
// src/hooks/useDarkMode.ts
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    // Check system preference
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return { isDark, setIsDark };
};
```

**Performance Optimization:**
```typescript
// next.config.js
module.exports = {
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  images: {
    formats: ['image/avif', 'image/webp']
  }
};

// Component-level optimization
import dynamic from 'next/dynamic';

const DashboardChart = dynamic(() => import('@/components/dashboard/AnalyticsChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
```

### Integration Points

**Cross-Team Reviews:**
- Review Team 1 onboarding for accessibility
- Review Team 2 editor for keyboard shortcuts
- Review Team 3 publishing for focus management
- Review Team 4 dashboard for data table accessibility
- Review Team 7 animations for motion preferences

**Dependencies:**
- All teams: Provide components for accessibility audit
- Team 7: Ensure animations respect `prefers-reduced-motion`

### Success Criteria

- [ ] Zero keyboard navigation dead-ends
- [ ] Voice input accuracy >90%
- [ ] All Core Web Vitals in "good" range
- [ ] Lighthouse score >95 for all categories
- [ ] Mobile completion rate matches desktop
- [ ] Zero WCAG 2.1 AA violations
- [ ] Dark mode contrast ratio >7:1 (AAA)

### Files to Create/Modify

- `src/hooks/useVoiceInput.ts` (new)
- `src/hooks/useKeyboardShortcuts.ts` (new)
- `src/hooks/useDarkMode.ts` (new)
- `src/components/ui/VoiceInputButton.tsx` (new)
- `src/components/ui/KeyboardShortcutsModal.tsx` (new)
- `src/components/ui/DarkModeToggle.tsx` (new)
- `src/app/globals.css` (add dark mode variables)
- `tailwind.config.ts` (add dark mode configuration)

---

## Team 6: Security & Cyber Defense

### Role
Comprehensive security hardening for users AND creators

### Expertise Required
- Application security (OWASP Top 10)
- Cryptography (AES-256, TLS)
- Threat modeling
- Penetration testing
- GDPR compliance

### Primary Objectives

#### User Protection

1. **Token Management**
   - Automatic token refresh with rotation
   - Encrypted storage (AES-256-GCM)
   - HTTPOnly cookies for session tokens
   - Short expiration windows

2. **Content Moderation**
   - Profanity filter for generated posts
   - Spam detection (repetitive content)
   - Malicious link scanning
   - Output sanitization

3. **GDPR Compliance**
   - Data export functionality (JSON/CSV)
   - Account deletion (cascade all data)
   - Consent management
   - Privacy policy enforcement

#### Creator Protection

1. **API Security**
   - Authentication on all endpoints
   - Rate limiting with Redis
   - Input validation (client + server)
   - SQL injection prevention

2. **Infrastructure Security**
   - DDoS protection (Vercel built-in)
   - Secrets management (never commit keys)
   - Dependency scanning (npm audit, Snyk)
   - CSP headers, CORS policies

3. **Monitoring & Incident Response**
   - Audit logging for all sensitive operations
   - Anomaly detection
   - Automated alerts (Sentry)
   - Rollback procedures

### Technical Requirements

**Token Refresh Implementation:**
```typescript
// src/lib/auth/tokenRefresh.ts
export const refreshTokenIfNeeded = async (
  provider: 'github' | 'linkedin',
  userId: string
): Promise<string> => {
  const tokenData = await getTokenFromDB(userId, provider);

  // Check if token expires in next 5 minutes
  if (tokenData.expires_at &&
      new Date(tokenData.expires_at) < new Date(Date.now() + 5 * 60 * 1000)) {

    // Refresh token
    const newToken = await refreshProviderToken(provider, tokenData.refresh_token);

    // Store new token
    await storeToken(userId, provider, newToken);

    return newToken.access_token;
  }

  return tokenData.encrypted_token;
};
```

**Content Moderation:**
```typescript
// src/lib/moderation/contentFilter.ts
interface ModerationResult {
  isClean: boolean;
  issues: string[];
  severity: 'low' | 'medium' | 'high';
}

export const moderateContent = (content: string): ModerationResult => {
  const issues: string[] = [];

  // Profanity check
  if (containsProfanity(content)) {
    issues.push('Contains inappropriate language');
  }

  // Spam detection
  if (isSpam(content)) {
    issues.push('Detected spam patterns');
  }

  // Malicious link check
  if (containsMaliciousLinks(content)) {
    issues.push('Contains potentially malicious links');
  }

  return {
    isClean: issues.length === 0,
    issues,
    severity: issues.length > 2 ? 'high' : issues.length > 0 ? 'medium' : 'low'
  };
};
```

**Rate Limiting:**
```typescript
// src/middleware/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
  analytics: true
});

export const rateLimitMiddleware = async (req: Request) => {
  const identifier = req.headers.get('x-user-id') || 'anonymous';
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

  if (!success) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString()
      }
    });
  }

  return null; // Continue to handler
};
```

**Audit Logging:**
```typescript
// src/lib/audit/logger.ts
interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export const logAuditEvent = async (log: AuditLog) => {
  // Store in dedicated audit_logs table
  await supabase.from('audit_logs').insert({
    user_id: log.userId,
    action: log.action,
    resource: log.resource,
    metadata: log.metadata,
    ip_address: log.ipAddress,
    user_agent: log.userAgent
  });

  // Alert on sensitive actions
  if (['token_access', 'data_export', 'account_deletion'].includes(log.action)) {
    await sendSecurityAlert(log);
  }
};
```

**GDPR Data Export:**
```typescript
// src/app/api/user/export/route.ts
export async function POST(req: Request) {
  const { userId } = await req.json();

  // Gather all user data
  const [tokens, posts, templates, analytics] = await Promise.all([
    supabase.from('user_tokens').select('*').eq('user_id', userId),
    supabase.from('posts').select('*').eq('user_id', userId),
    supabase.from('post_templates').select('*').eq('user_id', userId),
    supabase.from('post_analytics').select('*').eq('user_id', userId)
  ]);

  // Redact sensitive fields
  const exportData = {
    tokens: tokens.data?.map(t => ({ provider: t.provider, created_at: t.created_at })),
    posts: posts.data,
    templates: templates.data,
    analytics: analytics.data,
    exportedAt: new Date().toISOString()
  };

  return Response.json(exportData);
}
```

### Integration Points

**Security Reviews:**
- Team 1: Validate all user inputs from onboarding
- Team 2: Sanitize AI prompts and outputs
- Team 3: Secure OAuth flows, token storage
- Team 4: Enforce RLS policies on database queries
- All Teams: CSP headers, XSS prevention

### Success Criteria

- [ ] Zero high/critical vulnerabilities in production
- [ ] <5 minute MTTD (mean time to detect) for anomalies
- [ ] 100% audit coverage for sensitive operations
- [ ] All tokens rotated within 1 hour of expiration
- [ ] GDPR data export completes in <24 hours
- [ ] Rate limiting prevents abuse (0 incidents)
- [ ] npm audit shows 0 high/critical vulnerabilities

### Files to Create/Modify

- `src/lib/auth/tokenRefresh.ts` (new)
- `src/lib/moderation/contentFilter.ts` (new)
- `src/middleware/rateLimit.ts` (new)
- `src/lib/audit/logger.ts` (new)
- `src/app/api/user/export/route.ts` (new)
- `src/app/api/user/delete/route.ts` (new)
- `supabase/schema.sql` (add audit_logs table)
- `next.config.js` (add CSP headers)

---

## Team 7: Whimsy Injection Agent

### Role
Inject delightful, engaging, on-brand UI features that enhance professional storytelling

### Expertise Required
- Micro-interactions design
- Animation (Framer Motion, Lottie)
- Gamification principles
- Emotional design
- Storytelling UX

### Core Philosophy
**Professional ≠ Boring.** Career growth is exciting! Celebrate wins, make sharing joyful.

### Primary Objectives

#### Micro-Interactions

1. **Celebration Animations**
   - Confetti on first post published
   - Progress celebration for GitHub commit streak
   - Smooth page transitions
   - Hover states with personality

2. **Loading States**
   - "Crafting your story..."
   - "Polishing your narrative..."
   - "Analyzing your journey..."
   - Animated progress indicators

#### Gamification (Professional Context)

1. **Story Streak Counter**
   - Days of consistent posting
   - Visual streak indicator
   - Encouragement on milestones

2. **Impact Score**
   - Engagement prediction 0-100
   - Visual indicator (color-coded)
   - Tips to improve score

3. **Achievement System**
   - First post published
   - 10 posts milestone
   - Viral post (>1000 views)
   - Week streak (7 consecutive days)

#### Storytelling Enhancements

1. **Career Timeline Visualization**
   - GitHub activity as narrative journey
   - Visual representation of work history
   - Highlight significant contributions

2. **Before/After Comparison**
   - Show draft evolution during editing
   - Side-by-side view of improvements
   - AI suggestions impact visualization

3. **Narrative Arc Detector**
   - AI identifies story structure
   - Setup → Challenge → Resolution
   - Visual feedback on narrative quality

### Technical Requirements

**Confetti Animation:**
```typescript
// src/components/whimsy/Confetti.tsx
import confetti from 'canvas-confetti';

export const celebratePublish = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#0077B5', '#00A0DC', '#86D9F2'] // LinkedIn blues
  });
};
```

**Achievement System:**
```typescript
// src/lib/achievements/types.ts
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number; // 0-100
  requirement: number;
}

const achievements: Achievement[] = [
  {
    id: 'first-post',
    name: 'Storyteller',
    description: 'Published your first post',
    icon: '🎉',
    requirement: 1
  },
  {
    id: 'ten-posts',
    name: 'Consistent Creator',
    description: 'Published 10 posts',
    icon: '🚀',
    requirement: 10
  },
  {
    id: 'week-streak',
    name: 'Dedicated Professional',
    description: 'Posted for 7 consecutive days',
    icon: '🔥',
    requirement: 7
  }
];
```

**Loading Messages:**
```typescript
// src/lib/whimsy/loadingMessages.ts
export const loadingMessages = [
  'Crafting your story...',
  'Polishing your narrative...',
  'Analyzing your journey...',
  'Finding the perfect words...',
  'Highlighting your achievements...',
  'Preparing to inspire...'
];

export const getRandomLoadingMessage = () => {
  return loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
};
```

**Micro-Interaction Animations:**
```typescript
// src/components/whimsy/AnimatedButton.tsx
import { motion } from 'framer-motion';

export const AnimatedPublishButton = ({ onClick, disabled }: Props) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        boxShadow: disabled
          ? 'none'
          : ['0px 0px 0px rgba(0,119,181,0)', '0px 0px 20px rgba(0,119,181,0.5)', '0px 0px 0px rgba(0,119,181,0)']
      }}
      transition={{
        boxShadow: { duration: 2, repeat: Infinity }
      }}
      onClick={onClick}
      disabled={disabled}
    >
      Share My Story
    </motion.button>
  );
};
```

**Career Timeline:**
```typescript
// src/components/whimsy/CareerTimeline.tsx
interface TimelineEvent {
  date: Date;
  type: 'commit' | 'pr' | 'post';
  description: string;
  impact: number; // 1-10
}

export const CareerTimeline = ({ events }: { events: TimelineEvent[] }) => {
  return (
    <div className="timeline">
      {events.map((event, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="timeline-event"
        >
          <div className={`impact-${event.impact}`}>
            {event.description}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
```

### Theme-Appropriate Features

**✅ Professional Growth Oriented:**
- Growth Tracker (posting consistency graph)
- Network Effect (connection growth visualization)
- Skill Tags (auto-detect technologies, build skill cloud)
- Career Compass (suggest topics based on profile gaps)

**✅ Delightful but Not Distracting:**
- Easter eggs (Konami code reveals super draft mode)
- Seasonal themes (subtle color shifts)
- Optional sound effects (muted by default)
- Cursor sparkles on high-score posts

**❌ Anti-Patterns to Avoid:**
- Forced gamification (no annoying popups)
- Childish animations (no bouncing cartoons)
- Distracting motion (respect prefers-reduced-motion)
- Fake urgency ("Only 2 posts left!")
- Dark patterns (manipulative engagement)

### Integration Points

**Enhancement Targets:**
- Team 1: Onboarding (progress celebrations, loading messages)
- Team 2: Editor (achievement unlocks, success animations)
- Team 3: Publishing (confetti on first post, impact score)
- Team 4: Dashboard (career timeline, achievement display)

**Dependencies:**
- Team 5: All animations respect `prefers-reduced-motion`
- Team 6: No whimsy features compromise security

### Success Criteria

- [ ] User delight score >8/10 (qualitative testing)
- [ ] Animation performance: 60fps on mid-tier devices
- [ ] Zero complaints about "unprofessional" features
- [ ] Engagement lift: +20% return visits in first week
- [ ] NPS improvement: +15 points
- [ ] All animations <16ms frame time

### Files to Create/Modify

- `src/components/whimsy/Confetti.tsx` (new)
- `src/components/whimsy/AnimatedButton.tsx` (new)
- `src/components/whimsy/AchievementToast.tsx` (new)
- `src/components/whimsy/CareerTimeline.tsx` (new)
- `src/components/whimsy/LoadingMessage.tsx` (new)
- `src/lib/achievements/types.ts` (new)
- `src/lib/achievements/tracker.ts` (new)
- `src/lib/whimsy/loadingMessages.ts` (new)
- `package.json` (add canvas-confetti, @lottiefiles/react-lottie-player)

---

## Team 8: Orchestration & Coordination

### Role
Meta-agent managing all subagent teams, ensuring smooth coordination and delivery

### Expertise Required
- Project management
- Dependency resolution
- Integration testing
- DevOps (CI/CD, deployment)
- Risk management

### Primary Responsibilities

#### 1. Dependency Management

**Dependency Graph:**
```
Foundation Layer (Parallel):
├── Team 6: Security baseline
├── Team 5: Accessibility infrastructure
└── Team 4: Database scaffolding

Core Features (Sequential):
Team 1 → Team 2 → Team 7 (whimsy)

Publishing (Parallel + Sequential):
├── Team 3: LinkedIn integration (parallel)
└── Team 4: Dashboard (after Team 2)

Polish (Parallel):
├── Team 5: Performance optimization
├── Team 6: Security audit
└── Team 7: Final touches
```

**Critical Path:**
`Team 1 (Onboarding) → Team 2 (Editor + AI) → Team 3 (Publishing)`

#### 2. Integration Contracts

**Team 1 ↔ Team 2:**
```typescript
// Contract: Conversation context to post generation
interface OnboardingToEditor {
  activity: string; // from GitHub or user input
  context: string; // from Q&A responses
  style: 'Technical' | 'Casual' | 'Inspiring';
  skipReason?: 'user_skip' | 'no_github_data';
}
```

**Team 2 ↔ Team 3:**
```typescript
// Contract: Generated post to publishing
interface EditorToPublishing {
  postId: string;
  content: string; // max 1300 chars
  hashtags: string[];
  scheduledFor?: Date;
  visibility: 'PUBLIC' | 'CONNECTIONS';
}
```

**Team 2 ↔ Team 4:**
```typescript
// Contract: Save draft
interface EditorToDashboard {
  userId: string;
  content: string;
  hashtags: string[];
  status: 'draft' | 'scheduled' | 'published';
  githubActivitySummary?: string;
  aiProvider: string;
  style: string;
}
```

**Team 6 ↔ All Teams:**
```typescript
// Contract: Security validation
interface SecurityContract {
  validateInput: (input: string) => ValidationResult;
  sanitizeOutput: (output: string) => string;
  checkTokenExpiry: (userId: string, provider: string) => Promise<boolean>;
  auditLog: (action: string, metadata: Record<string, any>) => Promise<void>;
}
```

#### 3. Work Sequencing

**Phase 1: Foundation (Days 1-2)**
- Orchestrator establishes communication
- Team 6 implements security baseline
- Team 5 sets up accessibility framework
- Team 4 scaffolds database and APIs
- **Checkpoint:** Security audit passes, framework ready

**Phase 2: Core UX (Days 3-4)**
- Team 1 builds onboarding flow
- Team 2 integrates real AI providers
- Team 2 implements editor
- Team 7 adds whimsy to onboarding/editor
- Team 6 validates all AI integration
- **Checkpoint:** End-to-end post creation works

**Phase 3: Publishing (Day 5)**
- Team 3 implements LinkedIn OAuth
- Team 4 builds dashboard
- Team 7 adds achievements
- **Checkpoint:** Users can publish/save drafts

**Phase 4: Polish (Day 6)**
- Team 5 optimizes performance
- Team 7 adds final touches
- Team 6 penetration testing
- **Checkpoint:** Lighthouse >90, zero vulnerabilities

**Phase 5: Integration (Day 7)**
- Orchestrator coordinates final testing
- All teams fix integration bugs
- Team 6 final security sign-off
- **Checkpoint:** Production deployment

#### 4. Monitoring & Metrics

**Development Velocity:**
- Story points per team per sprint
- Blocker resolution time (<4 hours target)
- Code review turnaround (<2 hours target)

**Quality Metrics:**
- Test coverage (>80% target)
- Bug density (bugs per 1000 LOC)
- Security vulnerabilities (0 high/critical)

**Integration Health:**
- API contract compliance (100%)
- Integration test pass rate (>95%)
- Cross-team dependency satisfaction

**User Experience:**
- Lighthouse scores (>95)
- Accessibility violations (0)
- User delight score (>8/10)

#### 5. Conflict Resolution

**Resource Conflicts:**
- Priority: Security (Team 6) > Accessibility (Team 5) > Features
- Critical path teams (1, 2, 3) get priority

**Design Conflicts:**
- Team 7 whimsy must not conflict with Team 5 accessibility
- Team 5 has veto power on motion/animations

**Technical Conflicts:**
- Team 6 security overrides all other teams
- Example: Fast AI is good, but safe AI is mandatory

### Communication Protocol

**Daily Standups (async):**
- What did you complete yesterday?
- What are you working on today?
- Any blockers or dependencies?

**Integration Checkpoints (every 3 days):**
- Test inter-team handoffs
- Validate integration contracts
- Address breaking changes

**Weekly Demos:**
- User-facing progress showcase
- Stakeholder feedback
- Adjust priorities as needed

### Success Criteria

- [ ] Zero integration failures in final product
- [ ] All teams complete on schedule (7 days)
- [ ] Cross-team dependencies resolved <4 hours
- [ ] All security audits pass before deployment
- [ ] User testing shows cohesive experience
- [ ] Post-launch: <5 critical bugs in first week

### Files to Create/Modify

- `docs/INTEGRATION_CONTRACTS.md` (new)
- `docs/ORCHESTRATION_PLAN.md` (new)
- `.github/workflows/integration-tests.yml` (new)
- `docs/DEPLOYMENT_CHECKLIST.md` (new)

---

## 🔗 Cross-Reference Guide

**Security-Critical Teams:**
- Team 6 (Primary)
- Team 3 (OAuth flows)
- Team 2 (AI prompts)

**User-Facing Teams:**
- Team 1 (First impression)
- Team 2 (Core experience)
- Team 7 (Delight factor)

**Infrastructure Teams:**
- Team 4 (Data layer)
- Team 5 (Performance)
- Team 8 (Orchestration)

---

**End of Agent Team Specifications**
