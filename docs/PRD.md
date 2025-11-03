# Product Requirements Document - Vibe Posts

**Product Name:** Vibe Posts (formerly "Posture")
**Owner:** Nicholas Kasten
**Version:** 4.0 (Consolidated)
**Last Updated:** 2025-10-30
**Status:** Active Development - MVP Phase

---

## Executive Summary

**Vibe Posts** is an AI-powered social media manager that helps professionals build their personal brand across LinkedIn and Twitter with minimal time investment.

### What Makes It Unique

- **AI Career Coach**: Conversational brand manager that learns your professional voice
- **Multi-Platform Publishing**: LinkedIn + Twitter with one-click posting
- **OpenAI Apps SDK Integration**: Create and publish posts directly from ChatGPT
- **Autonomous AI Intern**: Optional agent that posts on your behalf
- **Type-Safe Architecture**: TypeScript strict mode with 95%+ type coverage

### Current Status

**Built:**
- ✅ GitHub OAuth authentication
- ✅ Secure token storage (AES-256-GCM encryption)
- ✅ Database schema (Prisma + Supabase)
- ✅ Core UI components
- ✅ Comprehensive test coverage

**In Progress:**
- ⏳ AI post generation (GPT-5-mini)
- ⏳ LinkedIn/Twitter OAuth
- ⏳ Social media publishing
- ⏳ OpenAI Apps SDK (MCP) integration

**Planned:**
- 📋 AI Career Coach
- 📋 Subscription billing (Stripe)
- 📋 Analytics dashboard
- 📋 AI Branding Intern (autonomous mode)

---

## Target Users

### Primary Persona: "The Busy Developer"
- **Profile:** 25-40 years old, 2-10 years experience
- **Pain Point:** "I build great things but no one knows about it"
- **Need:** Professional visibility without spending hours writing
- **Current Behavior:** Posts to LinkedIn 0-2x per month (or never)
- **Desired Outcome:** Consistent posting (2-4x/month) with minimal effort

### Secondary Personas
1. **Early-Career Professional** - Building initial brand, needs guidance
2. **Technical Leader** - Thought leadership at scale, values automation
3. **Career Switcher** - Showcasing portfolio during transition

---

## Core Features

### Phase 1: MVP (Current Focus)

#### 1. AI Post Generation
- GPT-5-mini (gpt-5-mini-2025-08-07) powered content creation
- 400K token context window, 128K max output
- Cost: $0.25/1M input tokens, $2/1M output tokens (98% cheaper than GPT-4o)
- Input: User describes recent work or achievement
- Output: Professional LinkedIn/Twitter post
- Character limits enforced (LinkedIn: 1300, Twitter: 280)
- Tone options: Technical, Casual, Inspiring
- Built-in editor with real-time preview

#### 2. Social Platform Publishing
- **LinkedIn OAuth 2.1** (PKCE flow)
- **Twitter OAuth 2.0** (PKCE flow)
- One-click publish with preview
- Post scheduling for optimal times
- Draft management

#### 3. OpenAI Apps SDK (MCP)
Enable posting from ChatGPT via 4 MCP tools:
- `generate_post` - Create post from prompt
- `schedule_post` - Schedule/publish with consent
- `list_posts` - View drafts/published posts
- `brand_profile` - Read user's brand settings

#### 4. Security & Compliance
- Token encryption (AES-256-GCM)
- Content moderation (OpenAI Moderation API)
- Explicit consent flows for publishing
- 5-minute undo window for posts
- Privacy Policy + Terms of Service

**MVP Success Criteria:**
- User can generate and publish LinkedIn post in <3 minutes
- 90%+ of generated posts require minimal editing
- Zero critical security vulnerabilities
- Lighthouse score >95

---

### Phase 2: AI Coach & Personalization

#### 1. Career Brand Manager (AI Coach)
- Conversational onboarding (15-20 questions)
- Learn user's tone, topics, career goals
- Brand profile storage (tone embeddings)
- Adaptive learning from user edits
- Bi-monthly brand review sessions

#### 2. Personalization Engine
- Remember user's projects and technologies
- Suggest content based on recent activity
- Adjust tone based on engagement patterns
- Context-aware post recommendations

**Phase 2 Success Criteria:**
- 80%+ of users complete brand setup
- Users rate AI Coach 4+ stars (out of 5)
- 70%+ 7-day retention rate

---

### Phase 3: Subscriptions & Billing

#### Subscription Tiers

**Free Tier** - $0/month
- 2 posts per month
- Basic post generation
- 1 platform (LinkedIn OR Twitter)
- Community support

**Standard Tier** - $12/month
- Unlimited posts
- AI Career Coach (2 sessions/month)
- Both platforms (LinkedIn + Twitter)
- Post scheduling
- Basic analytics
- Priority email support

**Premium Tier** - $29/month
- Everything in Standard
- AI Branding Intern (autonomous posting)
- Advanced analytics (sentiment, trends)
- Unlimited AI Coach sessions
- Gamification (badges, streaks)

**Phase 3 Success Criteria:**
- 10%+ Free → Standard conversion within 30 days
- <10% monthly churn rate
- $1,000 MRR within 30 days of billing launch

---

### Phase 4: Advanced Features

#### 1. AI Branding & Publicity Intern
Autonomous agent with 3 modes:
- **Manual Assist:** AI drafts, user approves everything
- **Semi-Auto:** AI posts on schedule, user reviews batches
- **Fully Autonomous:** AI posts + engages without approval (Premium)

Safety controls:
- Global kill switch
- Daily summary emails
- First 5 posts require approval
- Content preview mode (24 hours ahead)

#### 2. Advanced Analytics Dashboard
- Post performance tracking (engagement rate, sentiment)
- Tone evolution visualization
- AI recommendations (best times, topics, formats)
- Trend detection

#### 3. Gamification
- Achievement badges (First Post, 10 Posts, 100 Reactions, 7-Day Streak)
- Streak counter (consecutive posting days)
- Milestone celebrations (confetti animations)

**Phase 4 Success Criteria:**
- 30%+ of Premium users enable AI Intern
- 60%+ of Premium users access analytics weekly
- Streak feature increases posting frequency by 25%+

---

### Phase 5: Polish & OpenAI Review

- Complete OpenAI Apps SDK compliance checklist
- Accessibility audit (WCAG 2.1 AA)
- Performance optimization (Lighthouse >95)
- Security penetration testing
- Production deployment
- OpenAI Apps SDK review submission

---

## Technical Architecture

### Frontend Stack
- **Framework:** Next.js 15 (App Router, React 18)
- **Language:** TypeScript 5.3+ (strict mode)
- **Styling:** Tailwind CSS + custom components
- **Animation:** Framer Motion
- **State:** React Context + Hooks

### Backend Stack
- **API:** Next.js API Routes (serverless)
- **Database:** Supabase PostgreSQL + Prisma ORM
- **AI:** OpenAI GPT-5-mini API (gpt-5-mini-2025-08-07)
- **Auth:** Supabase Auth + OAuth 2.1 (PKCE)
- **Payments:** Stripe (Checkout + Webhooks)
- **MCP Server:** Node.js + Fastify (or Next.js routes)

### Infrastructure
- **Hosting:** Vercel (Edge Network)
- **Database:** Supabase (managed PostgreSQL)
- **Monitoring:** Sentry (errors) + Vercel Analytics (performance)
- **CI/CD:** GitHub Actions

### Security
- **Encryption:** AES-256-GCM for OAuth tokens
- **Validation:** Zod runtime + TypeScript compile-time
- **Content Moderation:** OpenAI Moderation API
- **Auth:** OAuth 2.1 with PKCE/DCR
- **Database:** Row-Level Security (RLS) policies

### Type-Safety Approach

**Core Principles:**
1. TypeScript strict mode everywhere (no `any` types)
2. Runtime validation with Zod on all inputs
3. Branded types for security-critical data
4. Discriminated unions for state machines
5. Prisma for type-safe database queries
6. Target: 95%+ type coverage

**Example - Branded Types:**
```typescript
type GitHubToken = string & { readonly __brand: 'GitHubToken' };
type UserId = string & { readonly __brand: 'UserId' };
type StripeCustomerId = string & { readonly __brand: 'StripeCustomerId' };
```

**Example - Discriminated Unions:**
```typescript
type SubscriptionState =
  | { status: 'active'; stripeId: string; expiresAt: Date }
  | { status: 'trial'; startsAt: Date; expiresAt: Date }
  | { status: 'canceled'; canceledAt: Date }
  | { status: 'past_due'; failedPaymentAt: Date; retryAt: Date };
```

---

## Success Metrics

### MVP (Phase 1)
- **Acquisition:** 100 signups in first week
- **Activation:** 70%+ create first post within 48 hours
- **Quality:** 90%+ of posts published without heavy editing
- **Technical:** Lighthouse >95, type coverage >95%
- **Security:** Zero high/critical vulnerabilities

### AI Coach (Phase 2)
- **Engagement:** 80%+ complete brand setup
- **Quality:** NPS >50
- **Retention:** 70%+ 7-day retention rate

### Subscriptions (Phase 3)
- **Conversion:** 10%+ Free → Standard within 30 days
- **Revenue:** $500 MRR within 30 days
- **Churn:** <10% monthly churn rate

### Advanced Features (Phase 4)
- **AI Intern:** 30%+ Premium adoption
- **Multi-Platform:** 40%+ use both LinkedIn + Twitter
- **Analytics:** 60%+ Premium users access weekly

### Long-Term (90 Days)
- **Users:** 5,000 total signups
- **MRR:** $15,000 (300 Standard, 150 Premium)
- **Retention:** 40%+ 90-day retention
- **NPS:** >60

---

## Risk Mitigation

### Technical Risks

**API Rate Limits** (LinkedIn/Twitter)
- Mitigation: Queue posts, exponential backoff, user notifications

**OpenAI API Costs**
- Mitigation: Token usage tracking, 90% caching discount (GPT-5-mini), rate limiting

**Database Performance**
- Mitigation: Query optimization, indexing, connection pooling, monitor slow queries

### Business Risks

**Low Conversion (Free → Paid)**
- Mitigation: Strong value in free tier, upgrade prompts, A/B test pricing, annual discounts

**High Churn Rate**
- Mitigation: Improved onboarding, email campaigns, gamification, quarterly reviews, exit surveys

**Competitive Entry**
- Mitigation: Unique differentiation (AI Coach + MCP integration), rapid iteration, delightful UX

### Compliance Risks

**OpenAI Review Rejection**
- Mitigation: Follow guidelines from Day 1, built-in compliance checklist, demo video, expect 1-2 revisions

**GDPR Violations**
- Mitigation: Clear data retention, user-initiated deletion, audit log exports, consent storage

**Security Breach**
- Mitigation: Token encryption, RLS policies, penetration testing, regular dependency updates, incident response plan

---

## Appendix: MCP Tools Specification

### Tool 1: `generate_post`
**Purpose:** Generate professional post from user input

**Parameters:**
- `topic` (string, required): What the post should be about
- `platform` (enum, required): "linkedin" | "twitter" | "both"
- `tone` (enum, optional): "technical" | "casual" | "inspiring"

**Response:**
```typescript
{
  post: {
    content: string;
    hashtags: string[];
    characterCount: number;
    platform: 'linkedin' | 'twitter';
  };
  preview_url: string;
}
```

### Tool 2: `schedule_post`
**Purpose:** Schedule/publish post (requires consent)

**Parameters:**
- `content` (string, required): Post content
- `platform` (enum, required): "linkedin" | "twitter" | "both"
- `scheduledFor` (datetime, optional): When to publish (ISO 8601)
- `hashtags` (array, optional): Max 30 items

**Consent Flow:**
1. API returns `{ status: 'pending_consent', preview: '...' }`
2. ChatGPT shows preview to user
3. User confirms → ChatGPT calls with `consent: true`
4. API publishes → `{ status: 'published', url: '...', undo_available_until: '...' }`

### Tool 3: `list_posts`
**Purpose:** View user's posts (drafts, scheduled, published)

**Parameters:**
- `status` (enum, optional): "draft" | "scheduled" | "published" | "failed" | "all"
- `platform` (enum, optional): "linkedin" | "twitter" | "all"
- `limit` (integer, optional): 1-50, default 10

**Response:**
```typescript
{
  posts: Array<{
    id: string;
    content: string;
    platform: 'linkedin' | 'twitter';
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    published_at?: string;
    analytics?: {
      views: number;
      likes: number;
      comments: number;
      engagement_rate: number;
    };
  }>;
  total: number;
  has_more: boolean;
}
```

### Tool 4: `brand_profile`
**Purpose:** Read user's professional brand profile

**Parameters:**
- `action` (enum, required): "read" (write support in Phase 2)

**Response:**
```typescript
{
  brand: {
    tone: string[]; // ["technical", "approachable", "concise"]
    topics: string[]; // ["API design", "GraphQL", "microservices"]
    career_goals: string;
    preferred_style: string;
    last_review: string; // ISO 8601
  };
}
```

---

**Next Steps:** See `ROADMAP.md` for implementation timeline and `ARCHITECTURE.md` for technical details.
