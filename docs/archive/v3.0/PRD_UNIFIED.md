# 📄 Product Requirements Document (PRD) - Posture v3.0

**Product Name:** Posture - Professional Branding Automation Platform
**Owner:** Nicholas Kasten
**Date:** October 2025
**Version:** 3.0 (Unified)
**Status:** Active - OpenAI Apps SDK Integration

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision & Goals](#product-vision--goals)
3. [Target Users & Personas](#target-users--personas)
4. [Core Features - 5-Phase Roadmap](#core-features---5-phase-roadmap)
5. [Technical Architecture](#technical-architecture)
6. [Type-Safety First Approach](#type-safety-first-approach)
7. [Subscription Tiers](#subscription-tiers)
8. [OpenAI Apps SDK Integration](#openai-apps-sdk-integration)
9. [Compliance & Safety Requirements](#compliance--safety-requirements)
10. [Success Metrics](#success-metrics)
11. [Risk Mitigation](#risk-mitigation)

---

## Executive Summary

**Posture** is a professional branding automation platform that helps users establish, enhance, and maintain their digital career presence through AI-driven content creation and personalized brand management.

### What Makes Posture Unique

- **AI Career Coach**: Conversational brand manager that learns your professional identity
- **Multi-Platform Publishing**: LinkedIn + X (Twitter) with one-click posting
- **OpenAI Apps SDK Integration**: Access Posture directly through ChatGPT
- **Autonomous AI Intern**: Optional agent that posts and engages on your behalf
- **Type-Safe Architecture**: TypeScript strict mode with compile-time guarantees
- **Progressive UX**: Conversational onboarding reduces cognitive load by 30-40%

### Key Statistics

- **Target Implementation:** 12 days with 11 specialized agent teams
- **Subscription Model:** Free → $12/mo → $29/mo
- **Tech Stack:** Next.js 15 + TypeScript 5.3 + Supabase + OpenAI GPT-5
- **Compliance:** OpenAI Apps SDK review-compliant from Day 1

---

## Product Vision & Goals

### Vision Statement

> Empower professionals to build authentic digital brands through AI-powered automation that feels human, respects user agency, and integrates seamlessly into their existing workflows—from GitHub to ChatGPT to social platforms.

### Primary Goals

1. **Simplify Brand Management**
   - Reduce time to create professional content from 30 min → 2 min
   - Automate social media posting while maintaining authentic voice
   - Provide AI coaching to refine professional identity

2. **Deliver Delightful UX**
   - Conversational interfaces that feel natural
   - Progressive disclosure to reduce overwhelm
   - Micro-animations celebrating professional milestones
   - Trust through transparency (explicit consent flows)

3. **Integrate Into Existing Ecosystems**
   - ChatGPT integration via OpenAI Apps SDK (MCP protocol)
   - LinkedIn + X/Twitter native publishing
   - GitHub activity as content source (optional)

4. **Ensure Safety & Compliance**
   - OpenAI review requirements met (consent, toxicity, undo)
   - GDPR-compliant data handling
   - OAuth 2.1 with PKCE/DCR security
   - Row-level security (Supabase RLS)

5. **Build Sustainable Business**
   - Free tier for acquisition (2 posts/month)
   - Standard tier ($12/mo) for active users (unlimited posts + AI Coach)
   - Premium tier ($29/mo) for power users (AI Intern + analytics)

---

## Target Users & Personas

### Primary Users

**1. Early-Career Professionals**
- **Demographics:** 22-28 years old, 1-3 years experience
- **Needs:** Stand out in competitive job market, build LinkedIn presence
- **Pain Point:** "I don't know what to say about my work"
- **Tier Fit:** Free → Standard

**2. Experienced Developers**
- **Demographics:** 28-40 years old, 5+ years experience
- **Needs:** Maintain consistent posting, minimal time investment
- **Pain Point:** "I ship great code but no one knows"
- **Tier Fit:** Standard → Premium

**3. Technical Leaders**
- **Demographics:** 35-50 years old, 10+ years experience, team management
- **Needs:** Share insights, build thought leadership, delegate content creation
- **Pain Point:** "Writing takes too long, I need automation"
- **Tier Fit:** Premium

### Secondary Users

**4. Career Switchers**
- Showcasing portfolio projects during transition
- Need: Credibility-building content
- Tier Fit: Free → Standard

**5. Developer Advocates**
- Content creation at scale for community building
- Need: Multi-post scheduling, analytics
- Tier Fit: Premium

**6. Marketing Consultants**
- Managing multiple client brands
- Need: White-label option (future), team accounts
- Tier Fit: Premium → Enterprise (future)

### User Personas (Detailed)

**Persona 1: "Busy Backend Developer" (Alex)**
- **Profile:** 29 years old, 5+ years backend experience, commits daily to microservices
- **LinkedIn Status:** Profile exists but rarely posts (1-2x/year)
- **Motivation:** Wants to transition to senior role, knows visibility helps but writing feels like "wasted coding time"
- **User Journey:**
  1. Signs up with GitHub (sees recent commits)
  2. AI Coach asks: "What are you most proud of this week?"
  3. Alex: "Reduced API latency by 40%"
  4. AI generates post, Alex edits minimally, publishes
  5. Post gets 50+ reactions, Alex is surprised
  6. Upgrades to Standard tier for unlimited posts
- **Success Metric:** Posts 2x/week, 6-month promotion

**Persona 2: "Career Builder" (Jordan)**
- **Profile:** 24 years old, 1.5 years experience, actively networking
- **LinkedIn Status:** Posts 1x/week but struggles with tone
- **Motivation:** Junior → Mid-level promotion, wants to be seen as technical expert
- **User Journey:**
  1. Onboarding: "I want to sound more confident"
  2. AI Coach creates brand profile: "Technical + approachable"
  3. Uses AI to refine drafts (3-4 edits typical)
  4. Tracks engagement analytics (Standard tier)
  5. AI suggests trending topics based on industry
  6. Gets noticed by recruiters, lands new role
- **Success Metric:** 2x profile views, 3 recruiter messages/month

**Persona 3: "Technical Leader" (Sam)**
- **Profile:** 38 years old, 12 years experience, manages team of 8
- **LinkedIn Status:** Thought leader, posts insights 2x/week
- **Motivation:** Build personal brand for future consulting/speaking opportunities
- **User Journey:**
  1. Onboards Premium tier immediately
  2. Enables AI Intern (semi-auto mode)
  3. AI drafts posts about team wins, Sam approves
  4. AI suggests engagement (comment on relevant posts)
  5. Analytics show consistent growth (500 → 2K followers in 6 months)
  6. Lands keynote speaking opportunity
- **Success Metric:** Thought leader status, speaking invitations

---

## Core Features - 5-Phase Roadmap

### Phase 1: MVP + MCP Foundations (Days 1-4)

**Goal:** Launch functional LinkedIn post generator with ChatGPT integration

#### 1.1 Adaptive Career Content Generator
- **Conversational Onboarding**
  - 3-5 adaptive questions based on GitHub activity
  - Optional GitHub scan ("Analyze my activity?" → Yes/Skip)
  - Platform selection (LinkedIn, X/Twitter, or both)
  - Style preferences (Technical, Casual, Inspiring)

- **AI Post Generation**
  - GPT-5 integration with structured prompts
  - Tone aligned with user's brand profile
  - Character limits enforced (LinkedIn: 1300, Twitter: 280)
  - Hashtag suggestions (max 30 LinkedIn, contextual for Twitter)

- **Built-In Editor**
  - Split-pane: post editor (left) + AI chat (right)
  - Real-time character counter
  - Tone adjustment dropdown
  - Preview before publish

- **Platform Publishing**
  - LinkedIn OAuth 2.1 with PKCE
  - One-click publish with consent flow (preview → confirm → undo)
  - Post scheduling for optimal engagement times
  - Draft saving (Supabase storage)

#### 1.2 MCP Server Integration
- **OpenAI Apps SDK Endpoints**
  - `/generate_post` - Create post from prompt
  - `/schedule_post` - Schedule for later
  - `/list_posts` - View drafts/scheduled/published
  - `/brand_profile` - Read/update brand settings

- **OAuth 2.1 Implementation**
  - PKCE (Proof Key for Code Exchange) flow
  - Dynamic Client Registration (DCR)
  - Scoped permissions (`post:read`, `post:write`, `brand:write`)
  - Token storage with branded types (compile-time safety)

- **Conversational UX**
  - ChatGPT asks: "What should the post be about?"
  - User: "My recent API performance optimization"
  - ChatGPT calls `/generate_post` via MCP
  - Returns preview: "Here's a draft post. Want to publish or edit?"
  - User confirms → ChatGPT calls `/schedule_post`

#### 1.3 Safety & Compliance
- **Toxicity Filtering**
  - Content moderation before every post (OpenAI Moderation API)
  - Brand-safety checks (no profanity, harassment, spam)
  - User feedback on false positives

- **Consent Flows**
  - Explicit preview + confirm for all write actions
  - Undo window (5 minutes for posts, instant for scheduled)
  - Clear disclosure: "Posture will post on your behalf to LinkedIn"

- **Privacy Foundations**
  - Privacy Policy + Terms of Service pages
  - Support email: support@posture.ai
  - Data retention disclosed (posts: indefinite, analytics: 90 days)
  - User-initiated deletion (GDPR compliance)

**Phase 1 Deliverables:**
- ✅ LinkedIn post generation & publishing functional
- ✅ MCP server with 4 core endpoints live
- ✅ OAuth 2.1 PKCE flow working
- ✅ Toxicity filter active on all content
- ✅ Privacy/Terms/Support pages deployed

**🔍 USER VERIFICATION CHECKPOINT (End of Day 4):**
- Test full flow: ChatGPT → "Create a LinkedIn post about my latest project"
- Verify consent flow (preview → confirm → undo)
- Attempt toxic content (verify filter blocks)
- Test OAuth (revoke access, re-grant)

---

### Phase 2: AI Coach & Personalization (Days 5-6)

**Goal:** Intelligent brand manager that learns and adapts

#### 2.1 Career Brand Manager (AI Coach)
- **Conversational Setup**
  - Initial brand session (15-20 questions over 10 min)
  - "Tell me about your career goals..."
  - "What tone do you want to project? Technical expert? Approachable mentor?"
  - "What topics should you be known for?"

- **Brand Profile Storage**
  - Tone embeddings (GPT-5 fine-tuning)
  - Personality traits (5-7 key descriptors)
  - Topics of expertise (indexed for relevance)
  - Writing style examples (user's previous posts)

- **Adaptive Learning**
  - Track which AI-generated posts user edits heavily vs. publishes as-is
  - Learn from edits: "User always changes 'utilized' to 'used' — update style"
  - Adjust tone over time based on engagement analytics

- **Brand Review Sessions**
  - Bi-monthly check-in (Standard tier: 2x/month, Premium: unlimited)
  - "Your brand has evolved — let's update your profile"
  - Review recent posts, suggest adjustments
  - Export brand evolution report (PDF)

#### 2.2 Personalization Engine
- **Tone Embedding Storage**
  - Store GPT-5 embeddings for user's preferred tone
  - Use embeddings to guide future generation (semantic consistency)
  - Update embeddings after each brand review

- **Context Retention**
  - Remember user's GitHub projects (if opted-in)
  - Track mentioned technologies, frameworks, tools
  - Suggest content based on recent activity: "You just merged a PR on GraphQL — want to post about it?"

**Phase 2 Deliverables:**
- ✅ AI Coach conversational interface live
- ✅ Brand profile storage (Prisma schema)
- ✅ Tone embeddings integrated into post generation
- ✅ Bi-monthly review scheduling functional

**🔍 USER VERIFICATION CHECKPOINT (End of Day 6):**
- Complete brand setup session with AI Coach
- Generate 3 posts with different tones (technical, casual, inspiring)
- Verify tone consistency matches brand profile
- Test brand review session (update preferences, regenerate post)

---

### Phase 3: Subscriptions & Billing (Days 7-8)

**Goal:** Monetize with fair, transparent pricing

#### 3.1 Stripe Integration
- **Subscription Management**
  - Stripe Checkout for signup (pre-built UI)
  - Webhook handling (`subscription.created`, `payment.succeeded`, `payment.failed`)
  - Automatic tier assignment in database
  - Prorated upgrades/downgrades

- **Payment Methods**
  - Credit/debit cards (Stripe standard)
  - Apple Pay, Google Pay (via Stripe)
  - Invoice billing for Enterprise (future)

- **Trial Period**
  - 7-day free trial on Standard tier (no credit card required)
  - Automatic downgrade to Free tier if not converted
  - Email reminders (Day 5, Day 7)

#### 3.2 Tier Logic & Feature Gates
- **Subscription Tiers**
  ```typescript
  type SubscriptionTier =
    | { type: 'free'; postsRemaining: number; maxPosts: 2 }
    | { type: 'standard'; coachSessionsRemaining: number; maxSessions: 2 }
    | { type: 'premium'; internEnabled: boolean; analyticsEnabled: true };
  ```

- **Feature Gating (Compile-Time)**
  ```typescript
  function canAccessFeature<T extends SubscriptionTier>(
    tier: T,
    feature: 'unlimited_posts' | 'ai_coach' | 'ai_intern' | 'analytics'
  ): boolean {
    if (feature === 'unlimited_posts') return tier.type !== 'free';
    if (feature === 'ai_coach') return tier.type === 'standard' || tier.type === 'premium';
    if (feature === 'ai_intern') return tier.type === 'premium';
    if (feature === 'analytics') return tier.type === 'premium';
    return false;
  }
  ```

- **Usage Tracking**
  - Posts created per month (Free tier limit: 2)
  - Coach sessions consumed (Standard tier limit: 2/month)
  - API calls (rate limiting per tier)

#### 3.3 Admin Dashboard
- **User Management**
  - User list with search/filter (email, tier, status)
  - Subscription status (active, trial, canceled, past_due)
  - Usage metrics (posts/month, coach sessions, API calls)

- **Billing Analytics**
  - MRR (Monthly Recurring Revenue)
  - Churn rate by tier
  - Conversion funnel (Free → Standard → Premium)
  - LTV (Lifetime Value) per tier

**Phase 3 Deliverables:**
- ✅ Stripe integration functional (3 tiers + trial)
- ✅ Feature gates enforced at API + UI level
- ✅ Admin dashboard deployed
- ✅ Webhook handling tested (create, payment, cancel)

**🔍 USER VERIFICATION CHECKPOINT (End of Day 8):**
- Create test subscription (Stripe test mode)
- Trigger payment success/failure (webhook events)
- Verify feature gates (try Premium feature on Free tier → blocked)
- Test upgrade flow (Free → Standard → Premium)
- Test downgrade flow (Premium → Standard)
- Review admin dashboard (user list, billing analytics)

---

### Phase 4: Advanced Features (Days 9-11)

**Goal:** Autonomous agent, multi-platform, analytics, gamification

#### 4.1 AI Branding & Publicity Intern (Autonomous Agent)
- **Autonomy Modes**
  - **Manual Assist (Default):** AI drafts, user approves every action
  - **Semi-Auto:** AI posts on schedule, user reviews before each batch
  - **Fully Autonomous:** AI posts + engages without approval (Premium opt-in)

- **Capabilities**
  - **Drafting:** Generate posts based on brand profile + recent activity
  - **Scheduling:** Optimize for engagement times (analyze past performance)
  - **Publishing:** Post to LinkedIn + X/Twitter automatically
  - **Engagement:** Comment on relevant posts (authentic, contextual responses)
  - **Suggestions:** Trending topics, connection opportunities

- **Safety Controls**
  - Global kill switch (emergency stop, visible in UI)
  - Daily summary email: "Your AI Intern posted 2 times, engaged 5 times"
  - Approval required for first 5 autonomous posts (trust-building)
  - Content preview mode (see what will be posted 24 hours ahead)

- **State Machine**
  ```typescript
  type InternState =
    | { mode: 'manual'; approvalsRequired: number }
    | { mode: 'semi-auto'; batchSize: number; nextApproval: Date }
    | { mode: 'fully-auto'; trustLevel: number; killSwitch: boolean };
  ```

#### 4.2 X/Twitter Integration
- **OAuth & Publishing**
  - Twitter OAuth 2.0 with PKCE
  - Post format conversion (1300 chars → 280 chars)
  - Thread generation for long content (auto-split into tweets)
  - Hashtag optimization (#DevCommunity vs #100DaysOfCode)

- **Twitter-Specific Features**
  - Retweet suggestions (relevant to user's brand)
  - Quote tweet generator (AI drafts commentary)
  - Thread mode (multi-tweet storytelling)

#### 4.3 Analytics & Brand Insights Dashboard
- **Post Performance**
  - Engagement rate (likes + comments / impressions)
  - Sentiment scoring (-1 to +1, positive/negative comments)
  - Best performing posts (top 10 by engagement)
  - Worst performing (learn from mistakes)

- **Tone Evolution Visualization**
  - Chart showing tone changes over time (technical → approachable)
  - Word cloud of most-used terms
  - Hashtag effectiveness (which hashtags drive engagement)

- **AI Recommendations**
  - "Your technical posts get 2x engagement — post more about architecture"
  - "Posting on Tuesday at 10 AM gets 40% more views"
  - "Try adding a question to your posts — boosts comments by 25%"

- **Trend Detection**
  - Industry trending topics (GraphQL adoption, AI safety, etc.)
  - Connection opportunities (people to follow, events to mention)

#### 4.4 Gamified Progress Tracker
- **Achievement System**
  - Badges: First Post, 10 Posts, 100 Reactions, 7-Day Streak, Thought Leader (500 followers)
  - Confetti celebrations on milestone unlocks
  - LinkedIn blue color scheme (professional gamification)

- **Streak Counter**
  - Track consecutive days of posting
  - Visual indicator (🔥 3-day streak!)
  - Encouragement messages: "You're on fire! Keep the momentum going"

- **Milestones**
  - Profile views: 100 → 500 → 1K → 5K
  - Engagement rate: 2% → 5% → 10%
  - Followers: 50 → 200 → 500 → 1K

**Phase 4 Deliverables:**
- ✅ AI Intern fully functional with 3 autonomy modes
- ✅ X/Twitter OAuth + publishing live
- ✅ Analytics dashboard with 10+ metrics
- ✅ Gamification system (badges, streaks, milestones)

**🔍 USER VERIFICATION CHECKPOINT (End of Day 11):**
- Enable AI Intern (semi-auto mode)
- Verify AI drafts + schedules post without approval
- Test kill switch (emergency stop)
- Publish to X/Twitter (test thread generation)
- Review analytics dashboard (engagement rate, sentiment)
- Unlock 3 achievements (verify confetti animations)
- Test streak counter (simulate 3-day posting)

---

### Phase 5: SDK Polish & OpenAI Review Prep (Day 12)

**Goal:** Production-ready, compliance-approved

#### 5.1 MCP Metadata Refinement
- **Tool Metadata Completion**
  - JSON Schema for all 4 endpoints (generate, schedule, list, brand_profile)
  - Examples for each tool (ChatGPT samples)
  - Error surfaces (deterministic error messages)
  - Parameter descriptions (what each field does)

- **OpenAPI Spec Generation**
  - Auto-generate from TypeScript types (no drift)
  - Validate with `@apidevtools/swagger-parser`
  - Host at `/api/openapi.json`

#### 5.2 Compliance Audit
- **OpenAI Apps SDK Checklist**
  - [ ] Purpose & quality: Clear, non-duplicative
  - [ ] UI native to ChatGPT: Concise, scannable
  - [ ] Consent gates: All write actions require approval
  - [ ] Undo implemented: 5-minute window for posts
  - [ ] Least-privilege scopes: Request only necessary permissions
  - [ ] Data handling disclosed: Privacy Policy linked
  - [ ] Toxicity filters active: Content moderation on all outputs
  - [ ] Error messages: Deterministic, actionable recovery
  - [ ] Offline mode: Queue + notify when APIs throttle
  - [ ] Human-in-the-loop: Editor required before first posts
  - [ ] Third-party disclosure: "Not built by OpenAI" clear
  - [ ] Support contact: support@posture.ai visible
  - [ ] Test account: Reviewer credentials ready

#### 5.3 Integration Testing
- **End-to-End Test Suite**
  - Onboarding → Post Generation → Publishing → Analytics (full flow)
  - Cross-browser (Chrome, Firefox, Safari, Edge)
  - Mobile devices (iOS Safari, Android Chrome)
  - Error scenarios (API failures, rate limits, network issues)

- **Load Testing**
  - 100 concurrent users (k6 or Artillery)
  - Database performance (Supabase connection pooling)
  - Auto-scaling validation (Vercel Edge Functions)

- **Penetration Testing**
  - Prompt injection attempts (Team 6)
  - XSS vulnerabilities (sanitization checks)
  - CSRF protection (token validation)

**Phase 5 Deliverables:**
- ✅ OpenAPI 3.1 spec complete (auto-generated)
- ✅ Type coverage >95% (run `npx type-coverage`)
- ✅ All compliance checklist items ✅
- ✅ Integration tests passing (100% critical paths)
- ✅ Penetration test report (no critical vulnerabilities)

**🔍 FINAL USER VERIFICATION CHECKPOINT (End of Day 12):**
- Run full end-to-end test suite (`npm test`)
- Review type coverage report (`npx type-coverage`)
- Test all MCP endpoints via ChatGPT (or simulator)
- Attempt prompt injection attacks (verify blocks)
- Attempt XSS attacks (verify sanitization)
- Review OpenAI compliance checklist (100% complete)
- **FINAL APPROVAL for production deployment & OpenAI review submission**

---

## Technical Architecture

### Frontend Stack

**Framework:** Next.js 15 (React 18, Server-Side Rendering)
- TypeScript 5.3 strict mode
- App Router for file-based routing
- Server Components for performance

**UI Library:** Tailwind CSS + Radix UI primitives
- Custom component system (Button, Card, Input, Select, Textarea)
- Framer Motion for animations
- Dark mode support (system preference detection)

**State Management:** React Context + Hooks
- `useConversationState` for onboarding
- `usePostEditor` for editor state
- `useSubscription` for tier management

**Authentication:** Supabase Auth + OAuth
- GitHub OAuth (existing)
- LinkedIn OAuth 2.1 with PKCE
- X/Twitter OAuth 2.0 with PKCE
- Session management (1-hour inactivity timeout)

### Backend Stack

**API Layer:** Next.js API Routes (serverless)
- TypeScript with Zod validation
- RESTful endpoints (consider tRPC for type-safety)
- Rate limiting (Upstash Redis)

**Database:** Supabase PostgreSQL
- Prisma ORM (type-safe queries, migrations)
- Row-Level Security (RLS) policies
- Connection pooling (Supavisor)

**Schema:**
```typescript
// Prisma schema (simplified)
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  githubId      String?  @unique
  subscription  Subscription?
  brandProfile  BrandProfile?
  posts         Post[]
  achievements  Achievement[]
  createdAt     DateTime @default(now())
}

model Subscription {
  id            String   @id @default(uuid())
  userId        String   @unique
  tier          SubscriptionTier // enum: FREE, STANDARD, PREMIUM
  stripeId      String?  @unique
  status        SubscriptionStatus // enum: ACTIVE, TRIAL, CANCELED, PAST_DUE
  currentPeriodEnd DateTime?
  postsThisMonth Int     @default(0)
  coachSessionsThisMonth Int @default(0)
}

model BrandProfile {
  id            String   @id @default(uuid())
  userId        String   @unique
  tone          String[] // ["technical", "approachable", "concise"]
  topics        String[] // ["GraphQL", "API design", "microservices"]
  styleExamples String[] // Previous posts for learning
  toneEmbedding Json?    // GPT-5 embeddings
  lastReview    DateTime?
}

model Post {
  id            String   @id @default(uuid())
  userId        String
  content       String   @db.Text
  platform      Platform // enum: LINKEDIN, TWITTER
  status        PostStatus // enum: DRAFT, SCHEDULED, PUBLISHED, FAILED
  scheduledFor  DateTime?
  publishedAt   DateTime?
  hashtags      String[]
  analytics     PostAnalytics?
  createdAt     DateTime @default(now())
}

model PostAnalytics {
  id            String   @id @default(uuid())
  postId        String   @unique
  views         Int      @default(0)
  likes         Int      @default(0)
  comments      Int      @default(0)
  shares        Int      @default(0)
  engagementRate Float   @default(0)
  sentiment     Float?   // -1 to +1
  updatedAt     DateTime @updatedAt
}
```

**AI Layer:** OpenAI GPT-5 API
- Structured prompts with Zod schemas (prevent injection)
- Fine-tuned model for brand coach (future)
- Toxicity filtering (OpenAI Moderation API)
- Token usage tracking (cost optimization)

**MCP Server:** Node.js + Fastify
- Separate service (or Next.js API routes)
- JSON Schema generation from TypeScript (`typescript-json-schema` or `@sinclair/typebox`)
- OAuth 2.1 implementation with PKCE/DCR
- Tool metadata for ChatGPT discovery

**Scheduler:** Supabase Edge Functions + CRON
- Scheduled post publishing (cron job every 15 minutes)
- Daily analytics aggregation
- Bi-monthly brand review reminders

**Integrations:**
- **LinkedIn API:** Posting, metrics, OAuth 2.1
- **X/Twitter API:** Posting, threads, OAuth 2.0
- **Stripe API:** Subscriptions, webhooks, billing
- **Supabase Storage:** User data, post history, brand profiles
- **OpenAI Apps SDK:** MCP protocol, tool discovery

**Monitoring & Telemetry:**
- **Sentry:** Error tracking, performance monitoring
- **Vercel Analytics:** Web Vitals, page load times
- **Stripe Dashboard:** Billing analytics, subscription metrics
- **Supabase Logs:** Database queries, API calls, auth events
- **Custom Audit Logs:** Tool invocations, write actions, failures (PII-scrubbed, user-exportable)

---

## Type-Safety First Approach

### Core Principles

1. **Strict TypeScript Everywhere**
   - `tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess: true`
   - No `any` types (use `unknown` + type guards)
   - Exhaustive switch statements (`never` type checking)

2. **Runtime Validation with Zod**
   - All API inputs validated at runtime
   - Zod schemas → TypeScript types (single source of truth)
   - Parsing errors return 400 with actionable messages

3. **Branded Types for Security**
   - Sensitive data wrapped in branded types
   - Compile-time enforcement (can't pass string where GitHubToken expected)
   - Example:
     ```typescript
     type GitHubToken = string & { readonly __brand: 'GitHubToken' };
     type UserId = string & { readonly __brand: 'UserId' };
     type StripeCustomerId = string & { readonly __brand: 'StripeCustomerId' };
     ```

4. **Discriminated Unions for State Machines**
   - Impossible states unrepresentable at compile-time
   - Example:
     ```typescript
     type SubscriptionState =
       | { status: 'active'; stripeId: string; expiresAt: Date }
       | { status: 'trial'; startsAt: Date; expiresAt: Date }
       | { status: 'canceled'; canceledAt: Date }
       | { status: 'past_due'; failedPaymentAt: Date; retryAt: Date };

     function handleSubscription(sub: SubscriptionState) {
       switch (sub.status) {
         case 'active':
           // TypeScript knows sub.stripeId exists
           return `Active until ${sub.expiresAt}`;
         case 'trial':
           // TypeScript knows sub.startsAt exists
           return `Trial ends ${sub.expiresAt}`;
         case 'canceled':
           return `Canceled on ${sub.canceledAt}`;
         case 'past_due':
           return `Payment failed, retry on ${sub.retryAt}`;
         default:
           // Exhaustiveness check: this will error if we add a new status
           const _exhaustive: never = sub;
           return _exhaustive;
       }
     }
     ```

5. **OpenAPI Spec Generation from Types**
   - No manual API documentation
   - TypeScript types → JSON Schema → OpenAPI 3.1
   - Tools: `typescript-json-schema`, `@apidevtools/swagger-parser`
   - Prevents drift between implementation and documentation

6. **Type-Safe Database Queries**
   - Prisma ORM generates types from schema
   - All queries type-checked at compile-time
   - Migrations validated before deploy

7. **Type-Safe Environment Variables**
   - Zod schema for `process.env`
   - Parse at startup, fail fast on missing/invalid vars
   - Example:
     ```typescript
     import { z } from 'zod';

     const envSchema = z.object({
       DATABASE_URL: z.string().url(),
       OPENAI_API_KEY: z.string().startsWith('sk-'),
       STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
       NODE_ENV: z.enum(['development', 'production', 'test']),
     });

     export const env = envSchema.parse(process.env);
     ```

### Type-Safety Benefits

| Benefit | Impact |
|---------|--------|
| **Catch Bugs at Compile-Time** | 80% of type errors caught before runtime |
| **Refactoring Confidence** | Change types → compiler finds all affected code |
| **Self-Documenting Code** | Types serve as inline documentation |
| **API Contract Enforcement** | Frontend/backend can't drift (tRPC or OpenAPI) |
| **Reduced Test Burden** | Type system acts as static tests |
| **Security Guarantees** | Branded types prevent token/ID misuse |

### Type Coverage Target

- **Goal:** >95% type coverage (measured with `npx type-coverage`)
- **Exceptions:** Generated code, third-party libraries without types
- **Enforcement:** CI/CD fails if coverage drops below 95%

---

## Subscription Tiers

### Free Tier (Acquisition)

**Price:** $0/month

**Features:**
- 2 posts per month (LinkedIn or X/Twitter)
- Basic post generation (GPT-5)
- Manual publishing (no scheduling)
- 1 platform (LinkedIn OR X/Twitter, not both)
- Community support (Discord, docs)

**Limits:**
- No AI Coach access
- No analytics dashboard
- No AI Intern
- No multi-platform posting

**Target User:** Trying out the platform, occasional posters

**Conversion Strategy:**
- Show "You've used 2/2 posts this month — upgrade for unlimited" banner
- Preview AI Coach ("Get personalized advice — upgrade to Standard")
- Highlight analytics ("See how your posts perform — upgrade to Premium")

---

### Standard Tier (Core Users)

**Price:** $12/month (or $120/year, save 17%)

**Features:**
- **Unlimited posts** (LinkedIn + X/Twitter)
- **AI Career Coach** (2 brand review sessions per month)
- **Multi-platform publishing** (post to both simultaneously)
- **Post scheduling** (optimal engagement times suggested)
- **Basic analytics** (views, likes, engagement rate)
- **Priority support** (email, 24-hour response)

**Limits:**
- No AI Intern (autonomous posting)
- No advanced analytics (sentiment, trends, recommendations)
- No API access

**Target User:** Active professionals posting 2-10x/month

**Upsell to Premium:**
- "Let your AI Intern handle posting — upgrade to Premium"
- "See advanced insights (sentiment, trends) — upgrade to Premium"

---

### Premium Tier (Power Users)

**Price:** $29/month (or $290/year, save 17%)

**Features:**
- **Everything in Standard**, plus:
- **AI Branding & Publicity Intern** (autonomous posting + engagement)
  - Manual assist, semi-auto, or fully autonomous modes
  - Comment on relevant posts (authentic engagement)
  - Trending topic suggestions
- **Advanced Analytics Dashboard**
  - Sentiment analysis (positive/negative comments)
  - Tone evolution over time
  - AI recommendations (best posting times, topics, formats)
  - Competitor benchmarking (future)
- **Unlimited AI Coach Sessions** (no 2/month limit)
- **Gamification Features** (badges, streaks, achievements)
- **API Access** (future: build custom integrations)
- **White-Label Option** (future: remove Posture branding)

**Target User:** Thought leaders, developer advocates, consultants

**Retention Strategy:**
- Quarterly business reviews (usage stats, ROI calculation)
- Early access to new features (beta program)
- Dedicated account manager (at scale)

---

### Enterprise Tier (Future)

**Price:** Custom pricing (contact sales)

**Features:**
- **Everything in Premium**, plus:
- **Team Accounts** (multi-user workspaces, role-based access)
- **Collaborative Editing** (draft sharing, approval workflows)
- **Custom Integrations** (Zapier, Make.com, custom APIs)
- **SSO (SAML, OIDC)** for enterprise auth
- **Dedicated Support** (Slack channel, phone support)
- **SLA Guarantees** (99.9% uptime)

**Target User:** Marketing agencies, large consultancies, enterprise tech companies

---

### Tier Comparison Matrix

| Feature | Free | Standard | Premium | Enterprise |
|---------|------|----------|---------|------------|
| **Posts/Month** | 2 | Unlimited | Unlimited | Unlimited |
| **Platforms** | 1 (LinkedIn OR X) | 2 (Both) | 2 (Both) | 2+ (Custom) |
| **AI Coach Sessions** | ❌ | 2/month | Unlimited | Unlimited |
| **Post Scheduling** | ❌ | ✅ | ✅ | ✅ |
| **AI Intern (Autonomous)** | ❌ | ❌ | ✅ | ✅ |
| **Analytics Dashboard** | ❌ | Basic | Advanced | Advanced + Custom |
| **Gamification** | ❌ | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ | ✅ + Custom |
| **Support** | Community | Email (24h) | Email (12h) + Chat | Dedicated (SLA) |
| **Team Accounts** | ❌ | ❌ | ❌ | ✅ |
| **SSO** | ❌ | ❌ | ❌ | ✅ |

---

## OpenAI Apps SDK Integration

### MCP (Model Context Protocol) Overview

**What is MCP?**
- Protocol for ChatGPT to discover and invoke external tools
- Tools defined with JSON Schema metadata
- OAuth 2.1 for authentication
- Request/response via HTTPS

**How ChatGPT Uses Posture:**
1. User: "Create a LinkedIn post about my latest project"
2. ChatGPT discovers Posture tools via MCP registry
3. ChatGPT calls `/generate_post` with user's input
4. Posture API returns generated post (JSON)
5. ChatGPT shows preview: "Here's a draft post. Want to edit or publish?"
6. User: "Publish it"
7. ChatGPT calls `/schedule_post` with consent
8. Posture publishes to LinkedIn
9. ChatGPT confirms: "Posted to LinkedIn! 🎉"

### MCP Tools Specification

#### Tool 1: `generate_post`

**Purpose:** Generate a professional post from user input

**JSON Schema:**
```json
{
  "name": "generate_post",
  "description": "Generate a LinkedIn or Twitter post based on user's input and brand profile",
  "parameters": {
    "type": "object",
    "properties": {
      "topic": {
        "type": "string",
        "description": "What the post should be about (e.g., 'my API performance optimization')"
      },
      "platform": {
        "type": "string",
        "enum": ["linkedin", "twitter", "both"],
        "description": "Which platform to optimize for"
      },
      "tone": {
        "type": "string",
        "enum": ["technical", "casual", "inspiring"],
        "description": "Desired tone (defaults to user's brand profile)"
      }
    },
    "required": ["topic", "platform"]
  }
}
```

**Example Request:**
```json
{
  "topic": "I reduced API latency by 40% using Redis caching",
  "platform": "linkedin",
  "tone": "technical"
}
```

**Example Response:**
```json
{
  "post": {
    "content": "Just achieved a 40% reduction in API latency by implementing strategic Redis caching. Key insight: Cache invalidation strategy matters more than cache hit rate. What's your approach to caching in distributed systems? #APIOoptimization #Redis #Performance",
    "hashtags": ["APIOptimization", "Redis", "Performance"],
    "characterCount": 287,
    "platform": "linkedin"
  },
  "preview_url": "https://posture.ai/preview/abc123"
}
```

---

#### Tool 2: `schedule_post`

**Purpose:** Schedule a post for publishing (requires consent)

**JSON Schema:**
```json
{
  "name": "schedule_post",
  "description": "Schedule a post for publishing to LinkedIn or Twitter. Requires user confirmation.",
  "parameters": {
    "type": "object",
    "properties": {
      "content": {
        "type": "string",
        "description": "Post content (max 1300 chars for LinkedIn, 280 for Twitter)"
      },
      "platform": {
        "type": "string",
        "enum": ["linkedin", "twitter", "both"]
      },
      "scheduledFor": {
        "type": "string",
        "format": "date-time",
        "description": "When to publish (ISO 8601). Omit for immediate publishing."
      },
      "hashtags": {
        "type": "array",
        "items": { "type": "string" },
        "maxItems": 30
      }
    },
    "required": ["content", "platform"]
  }
}
```

**Consent Flow:**
1. ChatGPT calls tool with post content
2. Posture API returns: `{ "status": "pending_consent", "preview": "..." }`
3. ChatGPT shows user: "Posture will post this to LinkedIn: [preview]. Confirm?"
4. User: "Yes"
5. ChatGPT calls with `consent: true` parameter
6. Posture publishes: `{ "status": "published", "url": "https://linkedin.com/posts/..." }`

**Example Response (Published):**
```json
{
  "status": "published",
  "post_id": "post_xyz789",
  "platform_url": "https://www.linkedin.com/posts/user_abc123",
  "published_at": "2025-10-09T14:30:00Z",
  "undo_available_until": "2025-10-09T14:35:00Z"
}
```

---

#### Tool 3: `list_posts`

**Purpose:** View user's posts (drafts, scheduled, published)

**JSON Schema:**
```json
{
  "name": "list_posts",
  "description": "List user's posts with optional filtering",
  "parameters": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": ["draft", "scheduled", "published", "failed", "all"],
        "description": "Filter by status (default: all)"
      },
      "platform": {
        "type": "string",
        "enum": ["linkedin", "twitter", "all"]
      },
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 50,
        "default": 10
      }
    }
  }
}
```

**Example Response:**
```json
{
  "posts": [
    {
      "id": "post_xyz789",
      "content": "Just achieved a 40% reduction in API latency...",
      "platform": "linkedin",
      "status": "published",
      "published_at": "2025-10-09T14:30:00Z",
      "analytics": {
        "views": 234,
        "likes": 18,
        "comments": 3,
        "engagement_rate": 0.09
      }
    }
  ],
  "total": 15,
  "has_more": true
}
```

---

#### Tool 4: `brand_profile`

**Purpose:** Read or update user's brand profile

**JSON Schema (Read):**
```json
{
  "name": "brand_profile",
  "description": "Get user's professional brand profile",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["read"],
        "description": "Action to perform (read-only for now)"
      }
    },
    "required": ["action"]
  }
}
```

**Example Response:**
```json
{
  "brand": {
    "tone": ["technical", "approachable", "concise"],
    "topics": ["API design", "GraphQL", "microservices", "performance optimization"],
    "career_goals": "Become a recognized expert in API architecture",
    "preferred_style": "Data-driven insights with practical examples",
    "last_review": "2025-10-01T10:00:00Z"
  }
}
```

---

### OAuth 2.1 Implementation

**Flow:** Authorization Code with PKCE (Proof Key for Code Exchange)

**Steps:**
1. **User initiates:** "Hey ChatGPT, use Posture to create a post"
2. **ChatGPT redirects:** User sent to `https://posture.ai/oauth/authorize`
3. **User grants permission:** Sees scopes: `post:read`, `post:write`, `brand:read`
4. **Posture redirects back:** `https://chat.openai.com/oauth/callback?code=xyz`
5. **ChatGPT exchanges code:** Sends to `/oauth/token` with PKCE verifier
6. **Posture returns tokens:** Access token + refresh token (scoped)
7. **ChatGPT stores tokens:** Uses for subsequent API calls
8. **Token refresh:** When access token expires, use refresh token

**Scopes:**
- `post:read` - List posts, view drafts
- `post:write` - Create, schedule, publish posts
- `brand:read` - View brand profile
- `brand:write` - Update brand profile (requires separate consent)

**Token Storage:**
- Access tokens: Short-lived (1 hour), stored in Supabase with encryption
- Refresh tokens: Long-lived (30 days), encrypted at rest, rotated on use

**Security:**
- PKCE prevents authorization code interception
- Dynamic Client Registration (DCR) for ChatGPT instances
- Scoped permissions (least privilege)
- Consent flow for every write action
- Undo window (5 minutes for posts)

---

### ChatGPT Integration UX Patterns

**Pattern 1: Conversational Post Creation**
```
User: "Create a LinkedIn post about my recent work on GraphQL federation"

ChatGPT: I'll help you create a post using Posture. Let me generate a draft...
[Calls /generate_post]

ChatGPT: Here's a professional post about GraphQL federation:

"🚀 Just implemented GraphQL federation across 5 microservices—game changer for our API architecture! Key learnings:
1. Schema stitching → federation = better developer experience
2. Gateway performance: monitor carefully
3. Team autonomy: each service owns its schema

What's your experience with federation? #GraphQL #Microservices #APIDesign"

Want me to publish this to LinkedIn, or would you like to edit it first?

User: "Make it more technical"

ChatGPT: [Calls /generate_post with tone: "technical"]
Updated draft:

"Implemented GraphQL federation using Apollo Federation v2 across 5 microservices. Results after 2 weeks:
- Latency: 120ms → 85ms (gateway optimization)
- Type safety: Shared schema validation catches 90% of integration bugs
- Developer experience: Teams iterate independently, no monolith bottleneck

Tech stack: Apollo Gateway, Rust resolvers, Redis for query caching. #GraphQL #Microservices"

Publish this version?

User: "Yes, publish it"

ChatGPT: Perfect! I'll publish this to LinkedIn on your behalf.
[Calls /schedule_post with consent]

ChatGPT: ✅ Posted to LinkedIn! Your post is live at [link]. You can undo this within the next 5 minutes if needed.
```

**Pattern 2: Scheduled Posting**
```
User: "Schedule a post for tomorrow at 10 AM about my new blog post"

ChatGPT: I'll create and schedule a post for you. What's the blog post about?

User: "It's about optimizing React performance with useMemo"

ChatGPT: [Calls /generate_post]
Here's a draft:

"New blog post: Optimizing React performance with strategic useMemo usage 🚀
Covered:
- When (and when NOT) to use useMemo
- Measuring impact with React DevTools Profiler
- Real-world example: 60fps → smooth UX

Read more: [your-blog.com/react-usememo]
#React #Performance #WebDev"

Schedule this for tomorrow at 10 AM on LinkedIn?

User: "Yes"

ChatGPT: [Calls /schedule_post with scheduledFor: "2025-10-10T10:00:00Z"]
✅ Scheduled! Your post will go live tomorrow (Oct 10) at 10:00 AM. You can edit or cancel it anytime before then.
```

**Pattern 3: Analytics Review**
```
User: "How are my recent posts performing?"

ChatGPT: [Calls /list_posts with status: "published", limit: 5]

Here's how your last 5 posts performed:

1. "Implemented GraphQL federation..." (Oct 9)
   - Views: 234
   - Engagement rate: 9% (👍 18, 💬 3)

2. "New blog post: React performance..." (Oct 8)
   - Views: 412
   - Engagement rate: 12% (👍 31, 💬 8, 🔄 2)

3. "Excited to announce..." (Oct 5)
   - Views: 156
   - Engagement rate: 6% (👍 7, 💬 2)

Your average engagement rate is 9%, which is above the 5% benchmark for technical content. Posts with practical examples (like your React post) perform 33% better than announcements.

Want me to help you create more content like your top-performing posts?
```

---

## Compliance & Safety Requirements

### OpenAI Apps SDK Review Checklist

**Purpose & Quality**
- [x] Clear, narrow purpose: Professional branding automation
- [x] No generic/duplicative functionality (unique: AI Coach + multi-platform + MCP)
- [x] UI native to ChatGPT (concise responses, scannable content)
- [x] No impersonation of OpenAI (third-party disclosure)
- [x] No spam or promotional copy in tool descriptions

**Safety, Privacy & Consent**
- [x] Explicit consent gates for all write actions (post, schedule, comment)
- [x] Preview + confirmation before publishing
- [x] Undo window (5 minutes for posts, instant for drafts)
- [x] Least-privilege OAuth scopes (`post:read`, `post:write` separate)
- [x] Data handling disclosed (Privacy Policy linked)
- [x] User deletion functional (GDPR compliance)
- [x] Consent stored (audit trail)

**Guardrails**
- [x] Toxicity filtering (OpenAI Moderation API on all content)
- [x] Harassment detection (block abusive language)
- [x] Brand-safety checks (no profanity, spam, self-promotion)
- [x] User feedback on false positives (improve filters)

**Reliability & UX**
- [x] Deterministic error messages (actionable recovery steps)
  - "Rate limit exceeded. Try again in 2 minutes."
  - "LinkedIn API unavailable. Post saved as draft, will retry in 15 min."
- [x] Loading states for long operations (>2 seconds)
- [x] Empty states with next steps ("No posts yet. Want to create one?")
- [x] Offline/degraded mode (queue posts when API throttles)

**Human-in-the-Loop**
- [x] Editor required before first post (no full-auto for new users)
- [x] Autonomous mode is Premium opt-in only
- [x] Global kill switch visible in UI (emergency stop)
- [x] Daily summary email (transparency: what AI did today)

**Identity, Branding & Disclosure**
- [x] Third-party disclosure: "Posture is a third-party app, not built by OpenAI"
- [x] Privacy Policy linked from all surfaces
- [x] Terms of Service linked
- [x] Support email visible: support@posture.ai
- [x] App description in manifest (purpose, capabilities)
- [x] Category: Productivity > Professional Networking

**MCP/Authentication Requirements**
- [x] Tool metadata complete (names, descriptions, JSON schemas, examples)
- [x] OAuth 2.1 with PKCE implemented
- [x] Dynamic Client Registration (DCR) for ChatGPT
- [x] Scoped authorization (`post:write` vs `post:read`)
- [x] Token storage encrypted (Supabase RLS)
- [x] Refresh tokens rotated on use

**Content & Tone**
- [x] Concise responses (ChatGPT sets overall voice)
- [x] Non-promotional (no "Try Posture Premium!" in tool outputs)
- [x] Context-first (explain what happened, why, next steps)
- [x] Offer brand flavor without overshadowing clarity

**Pre-Submission Requirements**
- [x] Privacy Policy published (https://posture.ai/privacy)
- [x] Terms of Service published (https://posture.ai/terms)
- [x] Support email active (support@posture.ai)
- [x] Test account created for reviewers (credentials in submission)
- [x] Sandbox data populated (example posts, brand profile)
- [x] End-to-end demo video (onboarding → post → publish)

---

### Safety Implementation Details

**Toxicity Filtering:**
```typescript
import { openai } from './ai-client';

async function moderateContent(content: string): Promise<{ safe: boolean; reason?: string }> {
  const moderation = await openai.moderations.create({
    input: content,
  });

  const result = moderation.results[0];

  if (result.flagged) {
    const categories = Object.entries(result.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category);

    return {
      safe: false,
      reason: `Content flagged for: ${categories.join(', ')}. Please revise.`
    };
  }

  return { safe: true };
}
```

**Consent Flow:**
```typescript
type ConsentState =
  | { status: 'pending'; preview: string; expiresAt: Date }
  | { status: 'granted'; grantedAt: Date; revokedAt?: never }
  | { status: 'denied'; deniedAt: Date }
  | { status: 'expired'; expiredAt: Date };

async function requestConsent(action: 'publish' | 'schedule' | 'comment', preview: string): Promise<ConsentState> {
  // Store consent request in database
  const consent = await db.consent.create({
    data: {
      action,
      preview,
      status: 'pending',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
  });

  return {
    status: 'pending',
    preview: consent.preview,
    expiresAt: consent.expiresAt,
  };
}
```

**Undo Implementation:**
```typescript
async function undoPost(postId: string, userId: string): Promise<{ success: boolean; message: string }> {
  const post = await db.post.findUnique({
    where: { id: postId, userId },
  });

  if (!post) {
    return { success: false, message: 'Post not found' };
  }

  const undoDeadline = new Date(post.publishedAt.getTime() + 5 * 60 * 1000);
  const now = new Date();

  if (now > undoDeadline) {
    return {
      success: false,
      message: `Undo window expired (posts can be undone within 5 minutes of publishing)`,
    };
  }

  // Delete from LinkedIn/Twitter via API
  await deleteFromPlatform(post.platform, post.platformPostId);

  // Mark as deleted in database
  await db.post.update({
    where: { id: postId },
    data: { status: 'DELETED', deletedAt: now },
  });

  return {
    success: true,
    message: 'Post successfully deleted from LinkedIn. It may take a few minutes to disappear from feeds.',
  };
}
```

---

## Success Metrics

### Phase 1: MVP Launch (Day 4)

**Acquisition Metrics**
- **Goal:** 100 signups in first week
- **KPI:** Sign-up conversion rate >15% (landing page → account)
- **Measurement:** Google Analytics, Vercel Analytics

**Activation Metrics**
- **Goal:** 70% of signups create first post within 48 hours
- **KPI:** Time to first post <5 minutes (onboarding → publish)
- **Measurement:** Custom event tracking (Supabase, Sentry)

**Quality Metrics**
- **Goal:** >90% of generated posts published without heavy editing
- **KPI:** Average edits per post <2
- **Measurement:** Edit count tracking, user surveys

**Technical Metrics**
- **Goal:** Lighthouse score >95 on all pages
- **KPI:** Core Web Vitals pass (LCP <2.5s, FID <100ms, CLS <0.1)
- **Measurement:** Vercel Analytics, Lighthouse CI

**Security Metrics**
- **Goal:** Zero high/critical vulnerabilities
- **KPI:** Type coverage >95%, no `any` types in new code
- **Measurement:** `npx type-coverage`, Snyk scan

---

### Phase 2: AI Coach (Day 6)

**Engagement Metrics**
- **Goal:** 80% of Standard tier users complete brand setup
- **KPI:** Average brand session duration 8-12 minutes
- **Measurement:** Session analytics (Supabase)

**Quality Metrics**
- **Goal:** >85% of users report AI Coach "helpful" or "very helpful"
- **KPI:** Net Promoter Score (NPS) >50
- **Measurement:** In-app survey (after brand session)

**Retention Metrics**
- **Goal:** 70% of users return within 7 days for second post
- **KPI:** 7-day retention rate >70%
- **Measurement:** Cohort analysis (Supabase, Stripe)

---

### Phase 3: Subscriptions (Day 8)

**Conversion Metrics**
- **Goal:** 10% of free users upgrade to Standard within 30 days
- **KPI:** Free → Standard conversion >10%, Standard → Premium >5%
- **Measurement:** Stripe webhooks, conversion funnel analytics

**Revenue Metrics**
- **Goal:** $500 MRR within 30 days of launch
- **KPI:** Average Revenue Per User (ARPU) >$5
- **Measurement:** Stripe Dashboard, custom billing analytics

**Churn Metrics**
- **Goal:** <10% monthly churn rate (Standard + Premium)
- **KPI:** Retention rate >90% after 3 months
- **Measurement:** Stripe subscription status changes

---

### Phase 4: Advanced Features (Day 11)

**AI Intern Adoption**
- **Goal:** 30% of Premium users enable AI Intern
- **KPI:** Autonomous posts created >50% of total Premium posts
- **Measurement:** AI Intern usage analytics

**Multi-Platform Usage**
- **Goal:** 40% of users publish to both LinkedIn + X/Twitter
- **KPI:** Average posts per user per week >2 (any platform)
- **Measurement:** Post creation analytics by platform

**Analytics Engagement**
- **Goal:** 60% of Premium users access analytics dashboard weekly
- **KPI:** Average time spent in analytics >3 minutes/session
- **Measurement:** Page view analytics (Vercel)

**Gamification Impact**
- **Goal:** Streak feature increases posting frequency by 25%
- **KPI:** Users with 7+ day streak post 2x more frequently
- **Measurement:** Streak analytics, post frequency before/after

---

### Phase 5: OpenAI Compliance (Day 12)

**Compliance Metrics**
- **Goal:** 100% of OpenAI review checklist items complete
- **KPI:** Zero critical findings in penetration test
- **Measurement:** Manual checklist review, security audit report

**Integration Metrics**
- **Goal:** 95% of end-to-end tests passing
- **KPI:** Type coverage >95%
- **Measurement:** Jest test results, `npx type-coverage`

**Performance Metrics**
- **Goal:** Load test passes (100 concurrent users, <2s response time)
- **KPI:** Error rate <1% under load
- **Measurement:** k6 or Artillery load testing

---

### Long-Term Metrics (30/60/90 Days)

**30-Day Metrics**
- **Users:** 500 total signups
- **MRR:** $1,000 (20 Standard @ $12, 10 Premium @ $29)
- **Activation:** 75% create first post
- **Retention:** 60% 30-day retention

**60-Day Metrics**
- **Users:** 2,000 total signups
- **MRR:** $5,000 (100 Standard, 50 Premium)
- **Activation:** 80% create first post
- **Retention:** 50% 60-day retention
- **NPS:** >50

**90-Day Metrics (Product-Market Fit)**
- **Users:** 5,000 total signups
- **MRR:** $15,000 (300 Standard, 150 Premium)
- **Activation:** 85% create first post
- **Retention:** 40% 90-day retention, 20% weekly active
- **NPS:** >60
- **Viral Coefficient:** >0.3 (referrals per user)

---

## Risk Mitigation

### Technical Risks

**Risk 1: LinkedIn/X API Rate Limits**
- **Impact:** Users can't publish posts, poor UX
- **Probability:** High (LinkedIn: 500/day, Twitter: varies)
- **Mitigation:**
  - Queue posts when rate limited (Supabase Edge Functions)
  - Notify user: "Post queued, will publish in 15 minutes"
  - Implement exponential backoff
  - Cache API responses where possible
  - Monitor usage, alert before limits

**Risk 2: OpenAI API Costs**
- **Impact:** High costs eat into margins, unsustainable
- **Probability:** Medium (depends on token usage)
- **Mitigation:**
  - Token usage tracking per user/tier
  - Implement caching for common prompts
  - Use GPT-3.5 for non-critical features (analytics summaries)
  - Rate limiting (20 posts/minute max)
  - Consider fine-tuned smaller model for brand coach (future)

**Risk 3: Type Errors in Production**
- **Impact:** Runtime crashes, data corruption
- **Probability:** Low (with strict TypeScript + Zod)
- **Mitigation:**
  - TypeScript strict mode enforced
  - Zod runtime validation on all external data
  - 95% type coverage requirement
  - CI/CD fails on type errors
  - Sentry error tracking for uncaught exceptions

**Risk 4: Database Performance**
- **Impact:** Slow queries, poor UX, timeouts
- **Probability:** Medium (as user base grows)
- **Mitigation:**
  - Prisma query optimization (avoid N+1 queries)
  - Database indexing (userId, postId, createdAt)
  - Supabase connection pooling
  - Read replicas for analytics queries (future)
  - Monitor slow queries (Supabase logs)

---

### Business Risks

**Risk 5: Low Conversion (Free → Paid)**
- **Impact:** Revenue below projections, unsustainable
- **Probability:** Medium (typical SaaS conversion: 2-5%)
- **Mitigation:**
  - Strong value prop in free tier (taste of AI Coach)
  - Upgrade prompts at key moments ("You've hit 2/2 posts — upgrade for unlimited!")
  - A/B test pricing ($10 vs $12 vs $15)
  - Offer annual discount (17% off) to increase LTV
  - Referral program (give 1 free month for each referral)

**Risk 6: High Churn Rate**
- **Impact:** Users cancel after 1-2 months, low LTV
- **Probability:** Medium (SaaS average: 5-7% monthly churn)
- **Mitigation:**
  - Onboarding improvements (reduce time to first value)
  - Email campaigns (weekly tips, success stories)
  - Gamification (streaks encourage habit formation)
  - Quarterly business reviews for Premium users (show ROI)
  - Exit surveys (understand why users cancel, iterate)

**Risk 7: Competitor Enters Market**
- **Impact:** Users switch to competitor, growth stalls
- **Probability:** High (low barriers to entry)
- **Mitigation:**
  - Differentiation: AI Coach + multi-platform + MCP integration (unique combo)
  - Network effects: Community features (future)
  - Brand loyalty: Delightful UX, trust through transparency
  - Rapid iteration: Ship new features monthly
  - Strategic moat: Fine-tuned AI Coach model (future)

---

### Compliance Risks

**Risk 8: OpenAI Review Rejection**
- **Impact:** Can't integrate with ChatGPT, lose key distribution channel
- **Probability:** Medium (first-time submissions often require revisions)
- **Mitigation:**
  - Follow Apps SDK guidelines from Day 1
  - Built-in compliance checklist (verify before submission)
  - Test account with rich sandbox data
  - Demo video showing full user flow
  - Iterate based on reviewer feedback (expect 1-2 revision cycles)

**Risk 9: GDPR Violations**
- **Impact:** Legal penalties, user distrust, PR damage
- **Probability:** Low (with proper implementation)
- **Mitigation:**
  - Data retention disclosed in Privacy Policy
  - User-initiated deletion functional (cascade to all tables)
  - Audit logs exportable by user (transparency)
  - Consent stored for all data processing
  - EU data residency (Supabase EU region if needed)

**Risk 10: Security Breach**
- **Impact:** User data leaked, loss of trust, legal liability
- **Probability:** Low (with security-first approach)
- **Mitigation:**
  - OAuth tokens encrypted at rest (AES-256-GCM)
  - Row-Level Security (Supabase RLS)
  - Penetration testing before launch (Team 6)
  - Regular dependency updates (`npm audit`, Snyk)
  - Incident response plan (revoke tokens, notify users, rotate keys)
  - Bug bounty program (future)

---

### Operational Risks

**Risk 11: Team Coordination Failures**
- **Impact:** Delays, integration bugs, missed deadlines
- **Probability:** Medium (11 teams, complex dependencies)
- **Mitigation:**
  - Clear orchestration plan (Team 8 manages dependencies)
  - Daily async standups (progress updates, blockers)
  - Integration checkpoints (Days 4, 6, 8, 11, 12)
  - Type-safe contracts (prevent integration drift)
  - User verification gates (catch issues early)

**Risk 12: Scope Creep**
- **Impact:** Timeline延长, incomplete features
- **Probability:** High (new ideas emerge during implementation)
- **Mitigation:**
  - Strict MVP definition (Phase 1-5 locked)
  - Feature backlog for post-launch (don't derail roadmap)
  - "No" by default to scope additions mid-sprint
  - User verification ensures quality > quantity

---

## Appendix: Tech Stack Summary

### Frontend
- **Framework:** Next.js 15 (React 18, TypeScript 5.3)
- **Styling:** Tailwind CSS + Radix UI primitives
- **Animation:** Framer Motion
- **State:** React Context + Hooks
- **Forms:** React Hook Form + Zod validation
- **Testing:** Jest + React Testing Library

### Backend
- **API:** Next.js API Routes (serverless)
- **Database:** Supabase PostgreSQL + Prisma ORM
- **Auth:** Supabase Auth + OAuth 2.1 (PKCE)
- **AI:** OpenAI GPT-5 API
- **MCP Server:** Node.js + Fastify (or Next.js routes)
- **Scheduler:** Supabase Edge Functions + CRON
- **Payments:** Stripe API
- **Storage:** Supabase Storage (user uploads, drafts)

### Infrastructure
- **Hosting:** Vercel (Edge Network)
- **Database:** Supabase (managed PostgreSQL)
- **CDN:** Vercel Edge Network
- **Monitoring:** Sentry (errors), Vercel Analytics (web vitals)
- **CI/CD:** GitHub Actions (tests, type checks, deploy)

### Security
- **Encryption:** AES-256-GCM (tokens), TLS 1.3 (transport)
- **Auth:** OAuth 2.1 (PKCE/DCR), Supabase Auth
- **Validation:** Zod (runtime), TypeScript (compile-time)
- **Content Moderation:** OpenAI Moderation API
- **Secrets:** Vercel Environment Variables (encrypted)

### DevOps
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions
- **Linting:** ESLint + TypeScript ESLint
- **Formatting:** Prettier
- **Type Checking:** `tsc --noEmit`, `type-coverage`
- **Testing:** Jest (unit), Playwright (e2e, future)
- **Load Testing:** k6 or Artillery

---

## Next Steps

1. **Implement Phase 1 (Days 1-4):** MVP + MCP foundations
2. **User Verification Checkpoint:** End of Day 4
3. **Implement Phase 2 (Days 5-6):** AI Coach
4. **User Verification Checkpoint:** End of Day 6
5. **Implement Phase 3 (Days 7-8):** Subscriptions
6. **User Verification Checkpoint:** End of Day 8
7. **Implement Phase 4 (Days 9-11):** Advanced features
8. **User Verification Checkpoint:** End of Day 11
9. **Implement Phase 5 (Day 12):** Compliance & polish
10. **Final User Verification Checkpoint:** End of Day 12
11. **Production Deployment**
12. **OpenAI Apps SDK Review Submission**

---

**Document Version:** 3.0 (Unified)
**Last Updated:** October 9, 2025
**Status:** Active - Approved for Implementation
**Contact:** Nicholas Kasten | support@posture.ai

---

**Let's build the future of professional branding! 🚀**
