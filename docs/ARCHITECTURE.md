# Technical Architecture - Vibe Posts

**Last Updated:** 2025-10-30
**Status:** MVP Phase - Active Development

---

## Overview

Vibe Posts is built as a modern Next.js application with a focus on type-safety, security, and scalability. This document describes the current architecture and technical decisions.

---

## Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.3+ (strict mode)
- **UI:** Tailwind CSS + custom components
- **Animation:** Framer Motion (planned)
- **State Management:** React Context + Hooks
- **Testing:** Jest + React Testing Library

### Backend
- **API Routes:** Next.js serverless functions
- **Database:** Supabase PostgreSQL
- **ORM:** Direct SQL (Prisma planned for Phase 2)
- **Authentication:** Supabase Auth + OAuth 2.1
- **AI:** OpenAI GPT-4 API
- **Encryption:** Node.js crypto (AES-256-CBC)

### Infrastructure
- **Hosting:** Vercel (Edge Network)
- **Database:** Supabase (managed PostgreSQL)
- **CDN:** Vercel automatic
- **Environment:** Vercel environment variables
- **CI/CD:** GitHub Actions (test on push)

### Development
- **Package Manager:** npm
- **Linting:** ESLint + TypeScript ESLint
- **Formatting:** Prettier (recommended)
- **Version Control:** Git + GitHub

---

## Project Structure

```
vibe-posts/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   │   └── github/      # GitHub OAuth handler
│   │   │   ├── github/          # GitHub integration
│   │   │   │   └── activity/    # Fetch user activity
│   │   │   └── ai/              # AI post generation (planned)
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home page
│   │   └── globals.css          # Global styles
│   ├── components/              # React components
│   │   ├── ui/                  # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   └── textarea.tsx
│   │   └── auth/                # Auth components (planned)
│   ├── lib/                     # Core utilities
│   │   └── storage/             # Database & encryption
│   │       └── supabase.ts      # Supabase client + crypto
│   ├── utils/                   # Utilities
│   │   ├── sanitize.ts          # Input sanitization
│   │   └── validation.ts        # Input validation
│   ├── types/                   # TypeScript types
│   │   └── index.ts             # Global type definitions
│   └── constants/               # Application constants
│       └── index.ts
├── supabase/
│   └── schema.sql               # Database schema
├── docs/                        # Documentation
├── .env.example                 # Environment template
├── next.config.js               # Next.js config
├── tailwind.config.ts           # Tailwind config
├── tsconfig.json                # TypeScript config
├── jest.config.js               # Jest config
└── package.json                 # Dependencies

```

---

## Database Schema

### Current Tables

#### `user_tokens`
Stores encrypted OAuth tokens for external providers.

```sql
CREATE TABLE user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                -- GitHub user ID
  provider VARCHAR(50) NOT NULL,        -- 'github', 'linkedin', 'openai'
  encrypted_token TEXT NOT NULL,        -- AES-256 encrypted
  refresh_token TEXT,                   -- Encrypted refresh token
  github_user_id BIGINT,                -- GitHub numeric ID
  expires_at TIMESTAMPTZ,               -- Token expiration
  scopes TEXT[],                        -- OAuth scopes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
```

**Indexes:**
- `idx_user_tokens_user_id` on `user_id`
- `idx_user_tokens_provider` on `provider`
- `idx_user_tokens_github_id` on `github_user_id` (WHERE provider = 'github')

#### `posts`
Stores generated and published posts.

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                -- References user_tokens.user_id
  title TEXT,
  content TEXT NOT NULL,                -- Post content
  hashtags TEXT[],                      -- Hashtags array
  github_activity_summary TEXT,         -- GitHub context
  ai_provider VARCHAR(50),              -- 'openai', 'anthropic', etc.
  style VARCHAR(50),                    -- 'professional', 'casual', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_posts_user_id` on `user_id`
- `idx_posts_created_at` on `created_at DESC`

### Planned Tables (Phase 2+)

```sql
-- User profiles and brand settings
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  display_name TEXT,
  brand_tone TEXT[],                    -- ['technical', 'approachable']
  brand_topics TEXT[],                  -- ['GraphQL', 'APIs']
  career_goals TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription management
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  tier VARCHAR(20) NOT NULL,            -- 'free', 'standard', 'premium'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status VARCHAR(20) NOT NULL,          -- 'active', 'trial', 'canceled'
  current_period_end TIMESTAMPTZ,
  posts_this_month INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post analytics
CREATE TABLE post_analytics (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  platform VARCHAR(20) NOT NULL,        -- 'linkedin', 'twitter'
  platform_post_id TEXT,                -- External ID
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  engagement_rate FLOAT,
  sentiment_score FLOAT,                -- -1 to +1
  last_synced TIMESTAMPTZ
);
```

---

## Security Architecture

### Token Encryption

All OAuth tokens are encrypted using **AES-256-CBC** before storage.

**Implementation** (src/lib/storage/supabase.ts:18):
```typescript
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return iv.toString('base64') + ':' + encrypted; // IV:ciphertext
}

export function decrypt(encrypted: string): string {
  const [ivBase64, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**Storage:**
- Tokens encrypted before database insert
- Decrypted only when needed (API calls)
- Never logged or sent to client
- Environment variable for key (32 characters)

### Input Validation & Sanitization

**Validation** (src/utils/validation.ts):
- GitHub tokens: Must start with `ghp_` or `gho_`
- User IDs: Must be alphanumeric
- Max lengths enforced (tokens: 500 chars, user IDs: 100 chars)

**Sanitization** (src/utils/sanitize.ts):
- XSS prevention: Strip HTML tags, encode special characters
- SQL injection: Use parameterized queries (Supabase client)
- Command injection: Allowlist validation on inputs
- Path traversal: Strict validation on file paths (future)

### Row-Level Security (RLS)

**Current:** RLS policies defined in schema but **disabled** (using service key for development)

**Planned for Production:**
```sql
-- Enable RLS
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users access own tokens" ON user_tokens
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users access own posts" ON posts
  FOR ALL USING (auth.uid()::text = user_id);
```

### Content Moderation

**Planned (Phase 1 - AI Integration):**
```typescript
// OpenAI Moderation API
async function moderateContent(content: string): Promise<{ safe: boolean; reason?: string }> {
  const moderation = await openai.moderations.create({ input: content });
  const result = moderation.results[0];

  if (result.flagged) {
    const categories = Object.entries(result.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category);
    return { safe: false, reason: `Flagged: ${categories.join(', ')}` };
  }

  return { safe: true };
}
```

---

## Authentication Flow

### GitHub OAuth (Current Implementation)

**Flow:**
1. User clicks "Tell My Story" → redirected to GitHub OAuth
2. GitHub redirects to `/api/auth/github?code=xyz`
3. API exchanges code for access token
4. Token encrypted and stored in `user_tokens` table
5. User redirected to dashboard with session cookie

**Implementation** (src/app/api/auth/github/route.ts:14):
```typescript
export async function GET(request: NextRequest) {
  const code = searchParams.get('code');

  // Exchange code for token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const { access_token } = await tokenResponse.json();

  // Store encrypted token
  const encryptedToken = encrypt(access_token);
  await supabaseClient.from('user_tokens').upsert({
    user_id: userData.login,
    provider: 'github',
    encrypted_token: encryptedToken,
    github_user_id: userData.id,
    scopes: ['read:user', 'repo'],
  });
}
```

### LinkedIn/Twitter OAuth (Planned - Phase 1)

**OAuth 2.1 with PKCE:**
1. Generate PKCE code verifier + challenge
2. Redirect to provider authorization URL
3. Exchange authorization code + verifier for token
4. Store encrypted token with scopes
5. Refresh token rotation on renewal

---

## Type-Safety Approach

### TypeScript Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "strict": true,                      // Enable all strict checks
    "noUncheckedIndexedAccess": true,   // Array access returns T | undefined
    "exactOptionalPropertyTypes": true, // Distinguish undefined vs missing
    "noImplicitReturns": true,          // All code paths return
    "noFallthroughCasesInSwitch": true, // Explicit fallthrough only
    "forceConsistentCasingInFileNames": true
  }
}
```

### Branded Types (Planned)

Prevent mixing of similar-looking strings at compile-time:

```typescript
// Security-critical types
type GitHubToken = string & { readonly __brand: 'GitHubToken' };
type LinkedInToken = string & { readonly __brand: 'LinkedInToken' };
type UserId = string & { readonly __brand: 'UserId' };
type EncryptedData = string & { readonly __brand: 'EncryptedData' };

// Constructor functions
function GitHubToken(token: string): GitHubToken {
  if (!token.startsWith('ghp_')) throw new Error('Invalid GitHub token format');
  return token as GitHubToken;
}

// Type-safe API
function storeToken(userId: UserId, token: GitHubToken) {
  // Compiler enforces correct types
}

// ❌ Compiler error: can't pass string where GitHubToken expected
storeToken('user123', 'ghp_abc123');

// ✅ Correct usage
storeToken(UserId('user123'), GitHubToken('ghp_abc123'));
```

### Discriminated Unions (Planned)

Make impossible states unrepresentable:

```typescript
// Post status state machine
type PostState =
  | { status: 'draft'; content: string; savedAt: Date }
  | { status: 'scheduled'; content: string; scheduledFor: Date }
  | { status: 'published'; content: string; platformUrl: string; publishedAt: Date }
  | { status: 'failed'; error: string; attemptedAt: Date };

function handlePost(post: PostState) {
  switch (post.status) {
    case 'draft':
      // TypeScript knows post.savedAt exists
      return `Draft saved at ${post.savedAt}`;
    case 'scheduled':
      // TypeScript knows post.scheduledFor exists
      return `Scheduled for ${post.scheduledFor}`;
    case 'published':
      // TypeScript knows post.platformUrl exists
      return `Published at ${post.platformUrl}`;
    case 'failed':
      // TypeScript knows post.error exists
      return `Failed: ${post.error}`;
    default:
      // Exhaustiveness check
      const _exhaustive: never = post;
      return _exhaustive;
  }
}
```

### Runtime Validation with Zod (Planned)

```typescript
import { z } from 'zod';

// Define schema
const PostInputSchema = z.object({
  content: z.string().min(10).max(1300),
  platform: z.enum(['linkedin', 'twitter']),
  tone: z.enum(['technical', 'casual', 'inspiring']).optional(),
  hashtags: z.array(z.string()).max(30).optional(),
});

// Infer TypeScript type from schema
type PostInput = z.infer<typeof PostInputSchema>;

// Validate at runtime
export async function POST(request: Request) {
  const body = await request.json();
  const result = PostInputSchema.safeParse(body);

  if (!result.success) {
    return Response.json({ error: result.error.issues }, { status: 400 });
  }

  // result.data is fully typed
  const post = await generatePost(result.data);
}
```

---

## API Routes

### Current Endpoints

#### `GET /api/auth/github`
**Purpose:** GitHub OAuth callback handler
**Parameters:** `code` (query string)
**Response:** Redirect to dashboard
**Implementation:** src/app/api/auth/github/route.ts

#### `GET /api/github/activity`
**Purpose:** Fetch user's recent GitHub activity
**Parameters:** `userId` (query string)
**Response:** `{ commits: Commit[], repos: string[] }`
**Implementation:** src/app/api/github/activity/route.ts

#### `POST /api/ai` (Planned)
**Purpose:** Generate LinkedIn post from user input
**Request Body:**
```typescript
{
  topic: string;
  githubActivity?: object;
  style?: 'professional' | 'casual' | 'technical';
}
```
**Response:**
```typescript
{
  content: string;
  hashtags: string[];
  characterCount: number;
}
```

### Planned Endpoints (Phase 1-2)

- `POST /api/linkedin/oauth` - LinkedIn OAuth handler
- `POST /api/twitter/oauth` - Twitter OAuth handler
- `POST /api/posts` - Create/publish post
- `GET /api/posts` - List user's posts
- `GET /api/posts/:id` - Get single post
- `DELETE /api/posts/:id` - Delete post (undo)
- `GET /api/brand-profile` - Get user's brand settings
- `PUT /api/brand-profile` - Update brand settings

### MCP Endpoints (Phase 1)

See `API_CONTRACTS.md` for full MCP tool specifications.

---

## Performance Considerations

### Current Optimizations
- Next.js automatic code splitting
- Static asset optimization (Vercel CDN)
- Tailwind CSS purging in production
- React Server Components (where applicable)

### Planned Optimizations
- Database connection pooling (Supabase Supavisor)
- Redis caching for API responses (Upstash)
- Image optimization (next/image)
- Lazy loading for analytics dashboard
- Service worker for offline support

### Monitoring
- Vercel Analytics (Web Vitals)
- Sentry error tracking (planned)
- Custom performance metrics (planned)

**Target Metrics:**
- Lighthouse Score: >95
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1

---

## Testing Strategy

### Current Tests
- **Unit Tests:** Utils (sanitize, validation)
- **API Tests:** GitHub OAuth, GitHub activity
- **Component Tests:** Page rendering
- **Coverage:** ~80% of current code

### Test Commands
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### Future Testing
- E2E tests with Playwright
- Integration tests for AI generation
- Visual regression tests (Percy/Chromatic)
- Load testing (k6 or Artillery)
- Accessibility tests (jest-axe)

---

## Deployment

### Vercel Configuration

**Environment Variables Required:**
```env
# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
NEXT_PUBLIC_GITHUB_REDIRECT_URI=https://your-app.vercel.app/api/auth/github

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Encryption
ENCRYPTION_KEY=...  # 32 characters

# OpenAI (Phase 1)
OPENAI_API_KEY=sk-...

# Stripe (Phase 3)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Build Command:** `npm run build`
**Output Directory:** `.next`
**Install Command:** `npm install`

### Production Checklist
- [ ] Environment variables configured
- [ ] Database RLS policies enabled
- [ ] Error monitoring active (Sentry)
- [ ] SSL certificate verified
- [ ] GitHub OAuth production app configured
- [ ] Content Security Policy headers set
- [ ] Rate limiting enabled
- [ ] Backup strategy verified

---

## Future Architecture Considerations

### Scalability
- Move to dedicated backend (NestJS/tRPC) if serverless limits hit
- Prisma for type-safe ORM (currently direct SQL)
- Message queue for async tasks (BullMQ + Redis)
- CDN for user-generated content (Cloudflare R2)

### Multi-Tenancy (Enterprise Tier)
- Workspace support (multiple users per org)
- Role-based access control (RBAC)
- Custom branding per workspace
- SSO integration (SAML/OIDC)

### Observability
- Distributed tracing (Datadog/New Relic)
- Custom dashboards for metrics
- User behavior analytics (PostHog)
- A/B testing framework (Growthbook)

---

**Next Steps:** See `ROADMAP.md` for implementation timeline and `DEVELOPMENT.md` for setup instructions.
