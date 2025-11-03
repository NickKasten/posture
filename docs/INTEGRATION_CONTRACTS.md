# 🔗 Integration Contracts - Posture Agent Teams

**Project:** Posture LinkedPost Agent v2.0
**Purpose:** Define precise interfaces between agent teams
**Last Updated:** 2025-10-06

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Data Contracts](#data-contracts)
3. [API Contracts](#api-contracts)
4. [Component Contracts](#component-contracts)
5. [Security Contracts](#security-contracts)
6. [Testing Contracts](#testing-contracts)

---

## Overview

### What is an Integration Contract?

An **integration contract** defines:
- **Input**: What data/format Team A provides
- **Output**: What data/format Team B expects
- **Validation**: How to verify correctness
- **Error Handling**: What happens when contract breaks

### Contract Principles

1. **Explicit**: No assumptions, everything documented
2. **Versioned**: Changes trigger updates to all consumers
3. **Validated**: Automated tests verify compliance
4. **Documented**: TypeScript types + comments

---

## Data Contracts

### Contract 1: Onboarding → Editor (Team 1 → Team 2)

**Purpose**: Pass conversation context from onboarding to post editor

**Interface:**
```typescript
// src/types/contracts/onboarding-to-editor.ts

interface OnboardingContext {
  // GitHub activity data (if user authorized)
  githubActivity: {
    commits: GitHubCommit[];
    pullRequests: GitHubPullRequest[];
    summary: string; // AI-generated summary
  } | null;

  // User's answers to Q&A
  userContext: {
    question: string;
    answer: string;
  }[];

  // Selected writing style
  style: 'Technical' | 'Casual' | 'Inspiring';

  // Whether user skipped parts
  skipReasons?: {
    githubScan?: 'user_skip' | 'no_auth' | 'api_error';
    questions?: 'user_skip' | 'no_data';
  };

  // Metadata
  createdAt: Date;
  userId: string;
}

// GitHub data structures
interface GitHubCommit {
  sha: string;
  message: string;
  date: Date;
  repository: string;
  additions: number;
  deletions: number;
}

interface GitHubPullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  repository: string;
  createdAt: Date;
  mergedAt?: Date;
}
```

**Provider (Team 1):**
- Validates all fields before passing
- Sanitizes user input (via Team 6 utilities)
- Ensures `style` is one of three valid values

**Consumer (Team 2):**
- Receives context via Next.js router state or session storage
- Falls back gracefully if `githubActivity` is null
- Uses `skipReasons` to adjust prompt strategy

**Validation:**
```typescript
// src/types/contracts/validation.ts

export const validateOnboardingContext = (
  ctx: unknown
): OnboardingContext => {
  if (!ctx || typeof ctx !== 'object') {
    throw new Error('Invalid context: must be object');
  }

  const { style, userContext, userId } = ctx as any;

  if (!['Technical', 'Casual', 'Inspiring'].includes(style)) {
    throw new Error(`Invalid style: ${style}`);
  }

  if (!Array.isArray(userContext)) {
    throw new Error('Invalid userContext: must be array');
  }

  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  return ctx as OnboardingContext;
};
```

**Test:**
```typescript
// src/types/contracts/onboarding-to-editor.test.ts

test('Contract 1: Valid onboarding context', () => {
  const ctx: OnboardingContext = {
    githubActivity: {
      commits: [{
        sha: 'abc123',
        message: 'fix: resolve bug',
        date: new Date(),
        repository: 'user/repo',
        additions: 10,
        deletions: 5
      }],
      pullRequests: [],
      summary: 'Fixed critical bug in auth flow'
    },
    userContext: [
      { question: 'What did you build?', answer: 'Auth system' }
    ],
    style: 'Technical',
    createdAt: new Date(),
    userId: '123'
  };

  expect(() => validateOnboardingContext(ctx)).not.toThrow();
});

test('Contract 1: Invalid style throws error', () => {
  const ctx = {
    style: 'Invalid',
    userContext: [],
    userId: '123',
    createdAt: new Date()
  };

  expect(() => validateOnboardingContext(ctx)).toThrow('Invalid style');
});
```

---

### Contract 2: Editor → Publishing (Team 2 → Team 3)

**Purpose**: Pass generated post to LinkedIn publishing system

**Interface:**
```typescript
// src/types/contracts/editor-to-publishing.ts

interface PostContent {
  // Unique ID for this post
  postId: string;

  // Post content (validated, sanitized)
  content: string; // max 1300 characters for LinkedIn

  // Hashtags (validated, no duplicates)
  hashtags: string[]; // max 30 hashtags, each max 30 chars

  // Publishing options
  publishOptions: {
    // When to publish
    publishAt: Date | 'now';

    // Visibility
    visibility: 'PUBLIC' | 'CONNECTIONS';

    // Whether to notify user's network
    notify?: boolean;
  };

  // Metadata
  userId: string;
  generatedBy: 'openai' | 'anthropic' | 'gemini' | 'groq' | 'manual';
  version: number; // for version history
  createdAt: Date;
  updatedAt: Date;
}
```

**Provider (Team 2):**
- Validates content length (≤1300 chars)
- Validates hashtags (max 30, each ≤30 chars, no duplicates)
- Ensures content is sanitized (no XSS)
- Stores post in database before publishing

**Consumer (Team 3):**
- Receives post via API call to `/api/linkedin/publish`
- Converts to LinkedIn UGC format
- Handles scheduling if `publishAt` is future date
- Returns publish status and LinkedIn URL (if successful)

**Validation:**
```typescript
// src/types/contracts/validation.ts

export const validatePostContent = (
  post: unknown
): PostContent => {
  if (!post || typeof post !== 'object') {
    throw new Error('Invalid post: must be object');
  }

  const { content, hashtags, publishOptions } = post as any;

  // Validate content
  if (!content || typeof content !== 'string') {
    throw new Error('Invalid content: must be string');
  }
  if (content.length > 1300) {
    throw new Error('Content exceeds 1300 character limit');
  }

  // Validate hashtags
  if (!Array.isArray(hashtags)) {
    throw new Error('Invalid hashtags: must be array');
  }
  if (hashtags.length > 30) {
    throw new Error('Too many hashtags: max 30');
  }
  for (const tag of hashtags) {
    if (typeof tag !== 'string' || tag.length > 30) {
      throw new Error(`Invalid hashtag: ${tag}`);
    }
  }

  // Validate publish options
  if (!['PUBLIC', 'CONNECTIONS'].includes(publishOptions?.visibility)) {
    throw new Error('Invalid visibility');
  }

  return post as PostContent;
};
```

---

### Contract 3: Editor → Dashboard (Team 2 → Team 4)

**Purpose**: Save drafts and published posts to dashboard

**Interface:**
```typescript
// src/types/contracts/editor-to-dashboard.ts

interface PostRecord {
  // Database fields
  id: string; // UUID
  userId: string;

  // Content
  content: string;
  hashtags: string[];

  // Status
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledFor?: Date;
  publishedAt?: Date;
  failureReason?: string;

  // Metadata
  githubActivitySummary?: string;
  aiProvider: 'openai' | 'anthropic' | 'gemini' | 'groq' | 'manual';
  style: 'Technical' | 'Casual' | 'Inspiring';
  version: number;

  // Analytics (if LinkedIn API provides)
  analytics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Provider (Team 2):**
- Calls `/api/posts` to create/update posts
- Updates status when publishing
- Increments version on edits

**Consumer (Team 4):**
- Stores in `posts` table in Supabase
- Enforces RLS policies (user can only see their posts)
- Provides query API for filtering, searching

---

### Contract 4: Dashboard → Editor (Team 4 → Team 2)

**Purpose**: Load draft/published post for editing

**Interface:**
```typescript
// src/types/contracts/dashboard-to-editor.ts

interface EditPostRequest {
  postId: string;
  userId: string;
}

interface EditPostResponse {
  post: PostRecord; // From Contract 3
  versions: PostVersion[]; // History
}

interface PostVersion {
  id: string;
  postId: string;
  content: string;
  hashtags: string[];
  versionNumber: number;
  createdAt: Date;
}
```

**Provider (Team 4):**
- Calls `/api/posts/:id` to fetch post
- Includes version history
- Validates user owns post (RLS)

**Consumer (Team 2):**
- Loads post into editor
- Shows version history in sidebar
- Allows restore to previous version

---

## API Contracts

### API 1: GitHub Activity Endpoint

**Endpoint:** `GET /api/github/activity`

**Request:**
```typescript
// Query parameters
interface GitHubActivityRequest {
  userId: string;
  since?: string; // ISO date, default: 7 days ago
  until?: string; // ISO date, default: now
}
```

**Response:**
```typescript
interface GitHubActivityResponse {
  success: boolean;
  data?: {
    commits: GitHubCommit[];
    pullRequests: GitHubPullRequest[];
    summary: string; // AI-generated
  };
  error?: {
    code: 'AUTH_REQUIRED' | 'API_ERROR' | 'RATE_LIMIT' | 'INVALID_TOKEN';
    message: string;
  };
}
```

**Owner:** Team 1 (provides), Team 2 (may consume for re-analysis)

**Security:** Team 6 validates token, rate limits to 10 req/min per user

---

### API 2: AI Generation Endpoint

**Endpoint:** `POST /api/ai/generate`

**Request:**
```typescript
interface AIGenerateRequest {
  activity: string; // Sanitized GitHub summary
  context: string; // Sanitized user context
  style: 'Technical' | 'Casual' | 'Inspiring';
  provider?: 'openai' | 'anthropic' | 'gemini' | 'groq'; // Optional preference
}
```

**Response:**
```typescript
interface AIGenerateResponse {
  success: boolean;
  data?: {
    post: string; // max 1300 chars
    hashtags: string[]; // max 30
    provider: string; // which provider was used
  };
  error?: {
    code: 'RATE_LIMIT' | 'PROVIDER_ERROR' | 'INVALID_INPUT' | 'ALL_PROVIDERS_FAILED';
    message: string;
    retryAfter?: number; // seconds
  };
}
```

**Owner:** Team 2 (provides and consumes)

**Security:** Team 6 sanitizes inputs, validates outputs, rate limits to 20 req/min

---

### API 3: LinkedIn Publish Endpoint

**Endpoint:** `POST /api/linkedin/publish`

**Request:**
```typescript
interface LinkedInPublishRequest {
  postId: string; // References posts table
  userId: string;
  scheduledFor?: Date; // Optional, 'now' if omitted
}
```

**Response:**
```typescript
interface LinkedInPublishResponse {
  success: boolean;
  data?: {
    linkedInUrl: string; // URL to published post
    publishedAt: Date;
  };
  error?: {
    code: 'AUTH_REQUIRED' | 'API_ERROR' | 'RATE_LIMIT' | 'INVALID_POST' | 'API_UNAVAILABLE';
    message: string;
    fallback?: 'copy_to_clipboard' | 'browser_extension';
  };
}
```

**Owner:** Team 3 (provides), Team 2 (consumes)

**Security:** Team 6 validates OAuth token, rate limits to 5 req/min per user

---

### API 4: Posts CRUD Endpoints

**Endpoints:**
- `GET /api/posts` - List user's posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

**List Posts Request:**
```typescript
// GET /api/posts?status=draft&search=auth&limit=20&offset=0
interface ListPostsRequest {
  status?: 'draft' | 'scheduled' | 'published' | 'failed';
  search?: string; // Full-text search
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  limit?: number; // Default 20, max 100
  offset?: number; // For pagination
}
```

**List Posts Response:**
```typescript
interface ListPostsResponse {
  success: boolean;
  data?: {
    posts: PostRecord[];
    total: number;
    hasMore: boolean;
  };
  error?: {
    code: 'AUTH_REQUIRED' | 'INVALID_PARAMS';
    message: string;
  };
}
```

**Owner:** Team 4 (provides), Teams 2, 3 (consume)

**Security:** Team 6 enforces RLS (user can only access their posts)

---

## Component Contracts

### Component 1: Context Preview Sidebar (Team 1)

**Props:**
```typescript
// src/components/onboarding/ContextPreview.tsx

interface ContextPreviewProps {
  // Data to display
  githubActivity: {
    commits: number;
    pullRequests: number;
    summary: string;
  } | null;

  userAnswers: {
    question: string;
    answer: string;
  }[];

  style: 'Technical' | 'Casual' | 'Inspiring';

  // Callbacks
  onRemoveAnswer?: (index: number) => void; // Allow editing
  onChangeStyle?: (newStyle: string) => void;
}
```

**Usage by Team 2:**
```tsx
<ContextPreview
  githubActivity={onboardingContext.githubActivity}
  userAnswers={onboardingContext.userContext}
  style={onboardingContext.style}
  onChangeStyle={(newStyle) => setStyle(newStyle)}
/>
```

---

### Component 2: Post Editor (Team 2)

**Props:**
```typescript
// src/components/editor/PostEditor.tsx

interface PostEditorProps {
  // Initial content
  initialContent?: string;
  initialHashtags?: string[];

  // Configuration
  maxLength: number; // 1300 for LinkedIn
  style: 'Technical' | 'Casual' | 'Inspiring';

  // Callbacks
  onChange: (content: string, hashtags: string[]) => void;
  onGenerate: (prompt: string) => Promise<void>;
  onSave: (status: 'draft' | 'scheduled' | 'published') => Promise<void>;

  // State
  isGenerating?: boolean;
  isSaving?: boolean;
}
```

**Usage by Team 1:**
```tsx
<PostEditor
  initialContent={generatedPost}
  maxLength={1300}
  style={onboardingContext.style}
  onChange={(content, hashtags) => setPost({ content, hashtags })}
  onGenerate={async (prompt) => await generatePost(prompt)}
  onSave={async (status) => await savePost(status)}
  isGenerating={isLoading}
/>
```

---

### Component 3: Achievement Toast (Team 7)

**Props:**
```typescript
// src/components/whimsy/AchievementToast.tsx

interface AchievementToastProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: string; // emoji or image URL
  };

  onDismiss: () => void;
  duration?: number; // ms, default 5000
}
```

**Usage by Teams 2, 3:**
```tsx
{showAchievement && (
  <AchievementToast
    achievement={{
      id: 'first-post',
      name: 'Storyteller',
      description: 'Published your first post!',
      icon: '🎉'
    }}
    onDismiss={() => setShowAchievement(false)}
  />
)}
```

---

## Security Contracts

### Security Contract 1: Input Sanitization (Team 6 → All Teams)

**Function:**
```typescript
// src/lib/security/sanitize.ts (provided by Team 6)

/**
 * Sanitize user input to prevent prompt injection and XSS
 * @param input - Raw user input
 * @param options - Sanitization options
 * @returns Sanitized string
 */
export function sanitizeUserInput(
  input: string,
  options?: {
    maxLength?: number; // Default 500
    allowedChars?: RegExp; // Default: alphanumeric + basic punctuation
    removePatterns?: string[]; // Additional patterns to remove
  }
): string {
  // Implementation by Team 6
}
```

**Usage by Team 1:**
```typescript
import { sanitizeUserInput } from '@/lib/security/sanitize';

const answer = sanitizeUserInput(userInput, {
  maxLength: 500,
  removePatterns: ['System:', 'Assistant:', 'DROP TABLE']
});
```

**Contract:**
- All teams MUST sanitize user input before storage or AI processing
- Team 6 validates correct usage in code reviews
- Automated tests verify sanitization on all input paths

---

### Security Contract 2: Token Validation (Team 6 → Teams 1, 3)

**Function:**
```typescript
// src/lib/security/tokens.ts (provided by Team 6)

/**
 * Validate OAuth token and refresh if needed
 * @param userId - User ID
 * @param provider - OAuth provider
 * @returns Valid access token
 * @throws If token invalid or refresh fails
 */
export async function getValidToken(
  userId: string,
  provider: 'github' | 'linkedin'
): Promise<string> {
  // Implementation by Team 6
}
```

**Usage by Team 1:**
```typescript
import { getValidToken } from '@/lib/security/tokens';

const githubToken = await getValidToken(userId, 'github');
const activity = await fetchGitHubActivity(githubToken);
```

**Contract:**
- All teams MUST use this function, not direct database access
- Team 6 handles encryption, decryption, refresh automatically
- Tokens expire after 1 hour, auto-refresh within last 5 minutes

---

### Security Contract 3: Audit Logging (Team 6 → All Teams)

**Function:**
```typescript
// src/lib/security/audit.ts (provided by Team 6)

interface AuditEvent {
  action: 'token_access' | 'post_create' | 'post_publish' | 'post_delete' | 'data_export';
  userId: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

/**
 * Log security-relevant event
 * @param event - Event details
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  // Implementation by Team 6
}
```

**Usage by Team 3:**
```typescript
import { logAuditEvent } from '@/lib/security/audit';

await logAuditEvent({
  action: 'post_publish',
  userId: user.id,
  resourceId: post.id,
  metadata: { provider: 'linkedin', visibility: 'PUBLIC' }
});
```

**Contract:**
- Teams MUST log all sensitive actions
- Required actions: token_access, post_publish, data_export, account_deletion
- Team 6 monitors logs for anomalies, alerts on suspicious patterns

---

## Testing Contracts

### Test Contract 1: Integration Test Coverage (All Teams)

**Requirement:**
Each team MUST provide integration tests for their API endpoints/components

**Template:**
```typescript
// src/app/api/[endpoint]/route.test.ts

describe('API: [Endpoint Name]', () => {
  test('Success case: returns expected data', async () => {
    // Test happy path
  });

  test('Error case: missing authentication', async () => {
    // Test auth failure
  });

  test('Error case: invalid input', async () => {
    // Test validation failure
  });

  test('Error case: rate limit exceeded', async () => {
    // Test rate limiting
  });

  test('Contract: response matches interface', async () => {
    // Validate TypeScript interface compliance
  });
});
```

**Validation by Team 8:**
- Automated CI/CD checks run all integration tests
- Must achieve >80% coverage on API routes
- Contract validation tests are mandatory

---

### Test Contract 2: Cross-Team Integration Tests (Team 8)

**Requirement:**
Team 8 provides end-to-end tests that span multiple teams

**Example:**
```typescript
// tests/integration/post-creation-flow.test.ts

describe('E2E: Post Creation Flow', () => {
  test('Complete flow: Onboarding → Editor → Publish', async () => {
    // 1. Team 1: Complete onboarding
    const context = await completeOnboarding({
      githubAuth: true,
      answerQuestions: true,
      style: 'Technical'
    });

    // 2. Team 2: Generate post
    const post = await generatePost(context);
    expect(post.content.length).toBeLessThanOrEqual(1300);

    // 3. Team 3: Publish post (or copy to clipboard)
    const result = await publishPost(post);
    expect(result.success).toBe(true);

    // 4. Team 4: Verify post in dashboard
    const posts = await fetchUserPosts(userId);
    expect(posts).toContainEqual(expect.objectContaining({ id: post.id }));
  });
});
```

---

## Contract Change Management

### Version Control

All contracts are versioned using semantic versioning:
- **Major version** (v2.0.0): Breaking changes, requires all consumers to update
- **Minor version** (v1.1.0): New optional fields, backward compatible
- **Patch version** (v1.0.1): Bug fixes, no interface changes

### Change Process

1. **Propose**: Team creates PR with contract changes
2. **Review**: All affected teams review and approve
3. **Implement**: Provider updates implementation
4. **Test**: Automated tests verify new contract
5. **Migrate**: Consumers update to new contract
6. **Deploy**: All teams deploy simultaneously

### Breaking Change Protocol

If a breaking change is unavoidable:
1. Create new versioned endpoint (e.g., `/api/v2/posts`)
2. Maintain old endpoint for 1 sprint (7 days)
3. Update all consumers to new version
4. Deprecate old endpoint with warnings
5. Remove old endpoint after 1 sprint

---

## Contract Compliance Checklist

**Before merging any PR:**
- [ ] All contracts are documented in TypeScript interfaces
- [ ] Validation functions exist for all data contracts
- [ ] Integration tests verify contract compliance
- [ ] All affected teams have reviewed and approved
- [ ] Documentation is up to date
- [ ] No breaking changes without migration plan

---

**End of Integration Contracts**
