# 🤖 Agent Teams Overview - Posture v3.0

**Project:** Posture Professional Branding Platform
**Version:** 3.0
**Last Updated:** October 9, 2025
**Teams:** 11 Specialized Agents

---

## 📋 Quick Reference

This document provides a high-level overview of all 11 agent teams working on Posture. For detailed specifications, see individual team files in `docs/teams/`.

---

## Team Structure

### Foundation Teams (Days 1-4)

**Team 4: Backend & Data**
- Database schema (Prisma), API scaffolding, analytics pipeline
- **File:** `teams/team-04-backend-data.md`

**Team 5: Accessibility & Performance**
- WCAG compliance, keyboard navigation, Core Web Vitals, SEO
- **File:** `teams/team-05-accessibility-performance.md`

**Team 6: Security & Compliance**
- OAuth 2.1, toxicity filters, consent flows, OpenAI compliance
- **File:** `teams/team-06-security-compliance.md`

**Team 9: MCP Server & OpenAI SDK** ⭐ NEW
- MCP protocol, JSON schemas, ChatGPT integration
- **File:** `teams/team-09-mcp-openai-sdk.md`

---

### Core UX Teams (Days 2-6)

**Team 1: Onboarding & UX**
- Conversational onboarding, multi-platform selection, progressive disclosure
- **File:** `teams/team-01-onboarding-ux.md`

**Team 2: AI Engine & Coach**
- GPT-5 integration, AI Career Coach, autonomous AI Intern
- **File:** `teams/team-02-ai-engine-coach.md`

---

### Publishing Teams (Days 3-11)

**Team 3: Social Integration**
- LinkedIn + X/Twitter OAuth, publishing, thread generation
- **File:** `teams/team-03-social-integration.md`

**Team 10: Billing & Monetization** ⭐ NEW
- Stripe integration, subscription tiers, feature gates, admin dashboard
- **File:** `teams/team-10-billing-monetization.md`

---

### Enhancement Teams (Days 3-11)

**Team 7: Whimsy & Gamification**
- Micro-animations, achievements, streaks, celebrations
- **File:** `teams/team-07-whimsy-gamification.md`

**Team 11: Analytics & Insights** ⭐ NEW
- Performance dashboard, sentiment analysis, AI recommendations
- **File:** `teams/team-11-analytics-insights.md`

---

### Coordination Team (Days 1-12)

**Team 8: Orchestration**
- Daily standups, integration testing, deployment, user verification
- **File:** `teams/team-08-orchestration.md`

---

## Team Dependencies

```
FOUNDATION LAYER (Parallel - Days 1-4):
┌─────────────────────────────────────────────┐
│ Team 6: Security Baseline                   │
│ Team 5: Accessibility Infrastructure        │
│ Team 4: Database + API Scaffolding          │
│ Team 9: MCP Server Skeleton                 │
└─────────────────────────────────────────────┘
            ↓
CORE UX LAYER (Sequential - Days 2-6):
┌─────────────────────────────────────────────┐
│ Team 1: Onboarding Flow                     │
│    ↓                                        │
│ Team 2: AI Engine + AI Coach                │
└─────────────────────────────────────────────┘
            ↓
PUBLISHING LAYER (Mixed - Days 3-11):
┌─────────────────────────────────────────────┐
│ Team 3: LinkedIn + X/Twitter Integration    │
│ Team 10: Billing & Subscriptions            │
└─────────────────────────────────────────────┘
            ↓
ENHANCEMENT LAYER (Parallel - Days 3-11):
┌─────────────────────────────────────────────┐
│ Team 7: Whimsy & Gamification               │
│ Team 11: Analytics & Insights               │
└─────────────────────────────────────────────┘
            ↓
INTEGRATION LAYER (All Teams - Day 12):
┌─────────────────────────────────────────────┐
│ Team 8: Integration Testing & Deployment    │
└─────────────────────────────────────────────┘
```

---

## Critical Path (12 Days)

```
Team 6 (Security) →
Team 9 (MCP Server) →
Team 1 (Onboarding) →
Team 2 (AI Engine) →
Team 3 (Social Integration) →
Team 10 (Billing) →
Team 8 (Deployment)
```

**Timeline:** 12 days minimum
**Optimization:** Teams 4, 5, 7, 11 work in parallel wherever possible

---

## Dependency Matrix

| Team | Depends On | Provides To | Parallel With |
|------|-----------|-------------|---------------|
| **Team 1** | Team 6 (security) | Team 2 (context) | Teams 4, 5, 9 |
| **Team 2** | Teams 1, 6 (AI security) | Teams 3, 4 (posts) | Team 5 |
| **Team 3** | Teams 2, 6 (OAuth) | Team 4 (status) | Teams 1, 5, 7, 11 |
| **Team 4** | Team 2 (post structure) | All teams (API) | Teams 1, 3, 5, 7, 9, 11 |
| **Team 5** | All teams (review) | All teams (guidelines) | All teams |
| **Team 6** | None (foundation) | All teams (security) | All teams |
| **Team 7** | Teams 1, 2, 4 (UI) | All teams (UX) | All teams |
| **Team 8** | All teams | Deployment | Coordinates all |
| **Team 9** | Team 6 (OAuth 2.1) | All teams (MCP) | Teams 1, 4, 5 |
| **Team 10** | Teams 4, 6 (DB, security) | All teams (tiers) | Teams 3, 7, 11 |
| **Team 11** | Team 4 (data pipeline) | All teams (insights) | Teams 3, 7, 10 |

---

## Type-Safety Mandate

**All teams must:**
- Use TypeScript 5.3+ strict mode
- Define Zod schemas for all external inputs
- Use branded types for sensitive data (tokens, IDs)
- Implement discriminated unions for state machines
- Generate OpenAPI specs from TypeScript types
- Achieve >95% type coverage
- Zero `any` types in new code

**Example Pattern:**
```typescript
// Branded types
type UserId = string & { readonly __brand: 'UserId' };
type GitHubToken = string & { readonly __brand: 'GitHubToken' };

// Zod schema → TypeScript type
import { z } from 'zod';

const PostSchema = z.object({
  content: z.string().max(1300),
  platform: z.enum(['linkedin', 'twitter']),
  userId: z.string().brand<UserId>(),
});

type Post = z.infer<typeof PostSchema>;

// Discriminated union
type SubscriptionTier =
  | { type: 'free'; postsRemaining: number }
  | { type: 'standard'; coachSessions: number }
  | { type: 'premium'; internEnabled: boolean };
```

---

## User Verification Checkpoints

**20 Checkpoints Across 12 Days:**

### Phase 1: MVP + MCP (Days 1-4)
1. **Day 1 End:** Review database schema, test migrations
2. **Day 2 End:** Test onboarding flow, AI prompts, OAuth
3. **Day 3 End:** Generate test post, publish to LinkedIn, test consent flow
4. **Day 4 End (MAJOR):** Test MCP endpoints, attempt toxic content, run integration tests

### Phase 2: AI Coach (Days 5-6)
5. **Day 5 End:** Complete AI Coach conversation, validate tone accuracy
6. **Day 6 End (PHASE 2 GATE):** Complete brand review, test data export

### Phase 3: Subscriptions (Days 7-8)
7. **Day 7 End:** Create test subscription, test webhooks, verify feature gates
8. **Day 8 End (PHASE 3 GATE):** Test upgrade/downgrade, review admin dashboard

### Phase 4: Advanced Features (Days 9-11)
9. **Day 9 End:** Enable AI Intern, test kill switch, publish to X/Twitter
10. **Day 10 End:** Review analytics dashboard, validate metrics
11. **Day 11 End (PHASE 4 GATE):** Unlock achievements, test streak counter

### Phase 5: Compliance (Day 12)
12. **Day 12 End (FINAL):** Run full test suite, type coverage check, penetration testing

**Approval Required:** User must approve at each phase gate (Days 4, 6, 8, 11, 12) before proceeding.

---

## Team Responsibilities Summary

### Team 1: Onboarding & UX
- Conversational AI Q&A (3-5 adaptive questions)
- Platform selection (LinkedIn/X/Both)
- Progressive disclosure patterns
- Skip functionality at every step
- Real-time context preview sidebar

### Team 2: AI Engine & Coach
- GPT-5 integration with structured prompts
- AI Career Coach (conversational brand manager)
- Tone embeddings storage & learning
- Autonomous AI Intern (3 modes: manual, semi-auto, full-auto)
- Version history for posts

### Team 3: Social Integration
- LinkedIn OAuth 2.1 with PKCE
- X/Twitter OAuth 2.0 with PKCE
- Multi-platform publishing
- Thread generation (X/Twitter)
- Post scheduling with optimal time suggestions

### Team 4: Backend & Data
- Prisma database schema (10+ models)
- API routes for all CRUD operations
- Analytics data pipeline
- Subscription tier logic
- Usage tracking & limits

### Team 5: Accessibility & Performance
- WCAG 2.1 AA compliance
- Keyboard navigation framework
- Dark mode infrastructure
- Core Web Vitals optimization (LCP <2.5s)
- SEO/GEO optimization

### Team 6: Security & Compliance
- OAuth 2.1 with PKCE/DCR implementation
- Toxicity filtering (OpenAI Moderation API)
- Consent flows (preview → confirm → undo)
- Audit logging (all sensitive actions)
- OpenAI Apps SDK compliance audit

### Team 7: Whimsy & Gamification
- Micro-animations (Framer Motion)
- Achievement system (badges, milestones)
- Streak counter (consecutive posting days)
- Confetti celebrations (LinkedIn blue theme)
- Loading states with personality

### Team 8: Orchestration
- Daily async standups (11 teams)
- Integration testing (end-to-end flows)
- User verification coordination (20 checkpoints)
- Deployment pipeline (Vercel)
- Production monitoring (Sentry, Vercel Analytics)

### Team 9: MCP Server & OpenAI SDK (NEW)
- MCP protocol implementation
- JSON Schema generation from TypeScript types
- 4 core endpoints (`/generate_post`, `/schedule_post`, `/list_posts`, `/brand_profile`)
- OAuth 2.1 PKCE/DCR for ChatGPT
- Tool metadata for ChatGPT discovery

### Team 10: Billing & Monetization (NEW)
- Stripe integration (checkout, webhooks)
- 3-tier subscription management (Free/$12/$29)
- Feature gates (compile-time type-safe)
- Usage tracking (posts/month, coach sessions)
- Admin dashboard (user management, billing analytics)

### Team 11: Analytics & Insights (NEW)
- Performance dashboard (views, engagement, sentiment)
- AI recommendation engine (best times, topics, formats)
- Trend detection (industry topics, connection opportunities)
- Tone evolution visualization
- Milestone tracking (streaks, achievements)

---

## Success Metrics by Team

| Team | Key Metric | Target |
|------|-----------|--------|
| **Team 1** | Time to first post | <5 minutes |
| **Team 2** | AI-generated posts published unedited | >90% |
| **Team 3** | OAuth success rate | >98% |
| **Team 4** | API response time (p95) | <200ms |
| **Team 5** | Lighthouse score | >95 |
| **Team 6** | Type coverage | >95% |
| **Team 7** | User delight score | >8/10 |
| **Team 8** | Integration test pass rate | >95% |
| **Team 9** | MCP tool invocation success | >99% |
| **Team 10** | Free → Paid conversion | >10% |
| **Team 11** | Analytics dashboard engagement | 60% weekly active Premium users |

---

## Communication Protocols

### Daily Standups (Async)
**Format:** Post in team channel by 10 AM daily
- **Yesterday:** What did you complete?
- **Today:** What are you working on?
- **Blockers:** What's blocking you? (Tag Team 8 if >1 hour)

### Phase Reviews (Live, 30 min)
**Schedule:** End of Days 4, 6, 8, 11, 12
- Demo deliverables
- User verification results
- Blocker resolution
- Approval to proceed (or iterate)

### Integration Handoffs (Async)
**Process:**
1. Team A completes feature
2. Team A notifies Team B (dependency resolved)
3. Team B validates integration contract (types match)
4. Team 8 runs integration test
5. If pass → proceed; if fail → Team A fixes

### Emergency Escalation
**Process:**
1. Critical blocker identified (blocks >2 teams)
2. Tag Team 8 immediately
3. Team 8 convenes emergency sync (15 min max)
4. Prioritize resolution (all hands if needed)

---

## File Structure

```
docs/
├── AGENT_TEAMS_OVERVIEW.md (this file)
├── teams/
│   ├── team-01-onboarding-ux.md
│   ├── team-02-ai-engine-coach.md
│   ├── team-03-social-integration.md
│   ├── team-04-backend-data.md
│   ├── team-05-accessibility-performance.md
│   ├── team-06-security-compliance.md
│   ├── team-07-whimsy-gamification.md
│   ├── team-08-orchestration.md
│   ├── team-09-mcp-openai-sdk.md (NEW)
│   ├── team-10-billing-monetization.md (NEW)
│   └── team-11-analytics-insights.md (NEW)
```

---

## Quick Links

- **PRD:** `PRD_UNIFIED.md`
- **Orchestration Plan:** `ORCHESTRATION_PLAN_V3.md`
- **Integration Contracts:** `INTEGRATION_CONTRACTS_V3.md`
- **Task Tracking:** `AGENT_TASK_TRACKING_V3.md`
- **MCP Guide:** `MCP_IMPLEMENTATION_GUIDE.md`
- **Compliance:** `COMPLIANCE_CHECKLIST.md`

---

**Ready to build! Each team has clear objectives, dependencies, and success criteria.** 🚀

**Questions?** See individual team files for detailed specifications.
