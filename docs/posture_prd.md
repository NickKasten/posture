# Product Requirements Document (PRD): Posture

## Overview
**Posture** is a professional branding automation platform that helps users establish, enhance, and maintain their digital career presence through AI-driven content creation and personalized brand management. Integrating directly with **LinkedIn** and **X (formerly Twitter)**, Posture provides adaptive tools to craft and schedule authentic, career-oriented content with the help of a personal AI career coach and branding intern.

The platform features a multi-tier subscription system, a professional yet enjoyable UX/UI, and full SEO/GEO optimization. It will also support **OpenAI Apps SDK integration** via an MCP server, enabling users to access Posture’s features directly through OpenAI interfaces.

---

## Goals
- Simplify personal brand management and professional content creation.
- Empower users to project authentic, career-aligned digital personas.
- Automate social media posting, engagement, and audience growth with human-like AI behavior.
- Deliver a professional yet delightful UX that builds trust and engagement.
- Integrate seamlessly into the OpenAI ecosystem through the Apps SDK.

---

## Target Users
- Early-career professionals and students growing their online presence.
- Experienced professionals maintaining consistent personal branding.
- Career coaches, marketing consultants, and social media managers seeking scalable automation tools.

---

## Core Features

### MVP Features (Realistic for Phase 1–3)

#### 1. **Adaptive Career Content Generator**
- Short, adaptive questionnaire for content context (e.g., recent wins, goals, industry insights).
- AI generates posts aligned with the user’s tone, goals, and brand style.
- Built-in editor for users to refine and schedule posts.
- Integration with LinkedIn and X APIs for seamless publishing.

#### 2. **Post History & Scheduler**
- Dashboard for viewing **past**, **scheduled**, and **draft** posts.
- Edit, reschedule, or delete posts easily.
- Smart scheduling suggestions based on optimal engagement times.

#### 3. **Career Brand Manager (AI Coach)**
- Conversational AI coach helps users define and refine their professional identity.
- Stores brand personality traits to guide future post generation.
- Periodic “brand review” sessions (twice/month for standard users).

#### 4. **Subscription & Billing System**
- Stripe integration for tiered subscriptions.
- Admin dashboard for user management and billing analytics.

#### 5. **OpenAI MCP Integration (v1 endpoint)**
- MCP server exposes endpoints for basic post generation and scheduling via OpenAI Apps SDK.

---

### Stretch / V2 Features (Phase 4–5)

#### 6. **AI Branding & Publicity Intern (Autonomous Agent)**
- Fully autonomous AI agent that can:
  - Draft, schedule, and post on the user’s behalf.
  - Engage with relevant posts and create authentic comments.
  - Suggest trending topics or connection opportunities.
- Adjustable autonomy modes (manual assist → semi-auto → fully autonomous).

#### 7. **Analytics & Brand Insights Dashboard**
- Post-performance analytics, sentiment scoring, and tone evolution visualization.
- AI-driven recommendations for improving engagement.

#### 8. **Gamified Progress Tracker**
- Rewards users for consistent posting and engagement milestones.
- Badge and streak systems to encourage long-term use.

#### 9. **AI Voice Customization**
- Users personalize their AI intern/coach personas (e.g., tone, name, style).

#### 10. **Chrome Extension & Quick-Post Widget**
- Allow users to generate and post directly from LinkedIn/X feeds.

#### 11. **Community Discovery Feed**
- Optional social layer for sharing and learning from other users’ AI-generated content.

---

## Subscription Tiers

| Tier | Access | Description |
|------|---------|-------------|
| **Free** | Basic access to (1) & (2) | 2 post generations/month with scheduling. |
| **Standard** | Full access to (1)–(3) | Unlimited posts, 2 brand coaching sessions/month. |
| **Premium** | Full access to all features | Includes AI intern, analytics, and engagement automation. |

---

## Technical Architecture

### Frontend
- **Framework:** Next.js / React (SSR-ready for SEO)
- **UI Library:** TailwindCSS + Framer Motion (interactive UI)
- **Auth:** Supabase Auth / OAuth for LinkedIn & X

### Backend
- **Server:** Node.js or FastAPI
- **Database:** PostgreSQL (Supabase)
- **AI Layer:** OpenAI GPT-5 + fine-tuned “brand-coach” model
- **MCP Server:** Modular endpoints (`/coach`, `/scheduler`, `/intern`) implementing **MCP** (Model Context Protocol) with JSON-schema tools, metadata, and error surfaces so ChatGPT can reason about capabilities.
- **Scheduler:** Supabase Edge Functions or CRON jobs
- **Telemetry & Audit:** Structured logs for tool invocations, write actions, and failures (PII-scrubbed), exportable by user.

### Integrations
- **LinkedIn & X APIs:** Posting, fetching metrics, and engagement tracking.
- **Stripe:** Subscription management.
- **Supabase Storage:** User data and post history.
- **OpenAI Apps SDK:** For discoverability and in-ChatGPT usage.

---

## Apps SDK Compliance & Review Checklist
> Essential requirements drawn from OpenAI **App Design Guidelines** and **App Developer Guidelines**.

### Purpose & Quality
- Clear, narrow purpose; avoid generic or duplicative functionality. No impersonation of OpenAI; no spam or promotional copy.
- UI components and conversational turns must feel **native to ChatGPT**; keep responses concise, scannable, and context-driven. 

### Safety, Privacy, and Consent
- **Explicit consent gates** for any write-action (post, comment, follow). Provide preview + confirmation and an **Undo** within a short window.
- **Least-privilege scopes** for OAuth; request only what is required for the chosen tier (read-only by default, elevate for scheduling/posting).
- **Data handling:** disclose what we store, retention windows, and how to delete. Respect user deletions across caches and logs where feasible.
- **Guardrails:** toxicity, harassment, and brand-safety filters on generated content and AI comments before any write action.
- **No dark patterns:** clear opt-ins for automation; visible status indicators when the “AI Intern” is active.

### Reliability & UX Expectations
- Deterministic error messages with recovery actions (re-auth, increase permissions, retry later, contact support).
- Loading states, progress for long operations, and empty states that explain next steps.
- **Offline/Degraded mode:** graceful fallback when LinkedIn/X APIs throttle or fail (queue + notify).
- **Human-in-the-loop:** editor required before first posts; fully autonomous mode is a Premium opt-in with global kill switch.

### Identity, Branding, and Disclosure
- Make it clear Posture is a third-party app, **not built or endorsed by OpenAI**. Link to Privacy Policy & Terms from all surfaces.
- Provide support email, app description, and category per review requirements; include a test account for review.

### MCP/Authentication Requirements
- Implement MCP tool metadata (names, descriptions, JSON schemas, examples) for `/generate_post`, `/schedule_post`, `/list_posts`, `/brand_profile.read|update`.
- **OAuth 2.1 with PKCE/DCR** to allow ChatGPT to register as a client; map tokens to per-user tenants; store short-lived tokens; refresh securely.
- Enforce per-scope authorization at the MCP layer (e.g., `post:write`, `post:read`, `brand:write`).

### Content & Tone
- ChatGPT sets the overall voice; our outputs should be concise, non-promotional, and context-first. Offer brand flavor without overshadowing clarity.

---

## Design & UX Principles
- **Professional aesthetic:** “LinkedIn meets Notion” — clean, modern, minimal.
- **Native-to-Chat UX:** Components and copy adhere to Apps SDK design guidance (concise, scannable, context-driven).
- **Humanized AI:** Conversational onboarding, natural tone, and adaptive visuals.
- **Guided flow:** Step-based interactions and contextual help; preview + confirm for all write actions; global kill switch for automation.
- **Accessibility:** WCAG 2.1 AA compliant.
- **Delightful UX:** Micro-animations and instant visual feedback.
- **Clear disclosures:** App identity, data use, and permission scopes visible where relevant.

---

## SEO & GEO Optimization
- Automatic meta-tagging and schema markup for user content.
- Multilingual and region-aware SEO support.
- Dedicated landing pages optimized for career-related search terms (e.g., “AI LinkedIn post generator”).
- Structured content feeds for discoverability.

---

## Success Metrics
- **Acquisition:** Monthly user growth and OpenAI app activations.
- **Engagement:** Posts created per user per month.
- **Retention:** Conversion rates across subscription tiers.
- **Quality:** Average AI satisfaction rating and manual post edits per session.

---

## Risks & Caveats
- **API Rate Limits:** Manage LinkedIn/X limits with efficient queuing and caching; backoff and partial retries.
- **Trust & Transparency:** Users must approve automation; clear opt-in/out for AI engagement; autonomous mode off by default.
- **Compliance:** Strict adherence to LinkedIn/X policies, OAuth 2.1, and OpenAI usage policies; avoid misleading claims or promotional spam.
- **Brand Safety:** Toxicity/tone filters and policy checks on all AI-generated content and comments.
- **Data Privacy:** Minimize data collection; configurable retention and full delete; do not store credentials; encrypt tokens at rest; scope-permissioned access.
- **OpenAI Review:** Provide privacy policy, terms, support contact, demo credentials, and pass design/safety review.

---

## Roadmap

| Phase | Goal | Deliverables |
|--------|------|---------------|
| **Phase 1** | MVP & Compliance Foundations | Post generation, scheduling, LinkedIn auth; MCP server with read-only + `post:write` scope; preview/confirm flows; basic moderation; privacy/terms/support ready |
| **Phase 2** | AI Coach & Personalization | Brand manager, tone embedding storage, consented data retention controls, analytics baselines |
| **Phase 3** | Subscriptions | Stripe tiers, permission elevation per tier, admin console, audit logs export |
| **Phase 4** | AI Intern & Advanced Analytics | Autonomous agent behind explicit opt-in + kill switch; comment writing with pre-publish review or trusted-mode; rate-limit handling and queue UX |
| **Phase 5** | SDK Expansion & Review | Deep MCP metadata, OAuth DCR/PKCE hardening, full review checklist, example flows, test account; resubmission as needed |

--------|------|---------------|
| **Phase 1** | MVP | Post generation, scheduling, LinkedIn auth, minimal UI |
| **Phase 2** | AI Coach | Conversational brand manager and profile storage |
| **Phase 3** | Subscriptions | Stripe integration, tier logic, admin dashboard |
| **Phase 4** | AI Intern & Analytics | Autonomous posting agent and analytics dashboard |
| **Phase 5** | SDK Expansion | Full MCP integration and OpenAI approval |

---

## Enhancement Opportunities
- **Brand Personality Engine:** Train the AI with user-submitted post examples for tone accuracy.
- **Feedback Loop Learning:** Adjust model output based on engagement data and analytics.
- **Collaborative Mode:** Enable shared branding sessions for mentors or teams.
- **Posture AI Index:** Weekly insight reports summarizing personal brand evolution.
- **Referral Program:** Incentivize user growth via invites.

---

**Next Steps:**
- Implement MCP tools with JSON Schemas and permission scopes; wire to OAuth 2.1 (PKCE/DCR) and token storage.
- Add content moderation + brand-safety checks pre-write; instrument audit logs and undo.
- Update UI copy and components to the Apps SDK design guidance (concise, context-first, non-promotional).
- Finalize Privacy Policy, Terms, and Support pages; surface in-app and in the app manifest for review.
- Create reviewer test account + sandbox data; run end-to-end tests for degraded API states.

