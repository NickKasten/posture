# Vibe Posts Documentation

**Welcome to the Vibe Posts documentation!**

This is your central hub for understanding, building, and deploying the AI-powered social media manager.

---

## Quick Start

**New to the project?** Start here (30 minutes):

1. **[PRD.md](./PRD.md)** (15 min) - Product vision, features, subscription tiers
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** (10 min) - Technical stack and design decisions
3. **[DEVELOPMENT.md](./DEVELOPMENT.md)** (5 min) - Setup and development workflow

**Ready to code?**

4. Follow [DEVELOPMENT.md](./DEVELOPMENT.md) setup instructions
5. Check [ROADMAP.md](./ROADMAP.md) for current phase
6. Reference [API_CONTRACTS.md](./API_CONTRACTS.md) for type-safe interfaces

---

## Documentation Index

### Core Documents

| Document | Purpose | Length | When to Read |
|----------|---------|--------|--------------|
| **[PRD.md](./PRD.md)** | Product requirements and vision | ~400 lines | First read, feature planning |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Technical design and stack | ~600 lines | Understanding implementation |
| **[DEVELOPMENT.md](./DEVELOPMENT.md)** | Setup and contribution guide | ~400 lines | Before starting development |
| **[ROADMAP.md](./ROADMAP.md)** | Implementation timeline | ~300 lines | Sprint planning |
| **[API_CONTRACTS.md](./API_CONTRACTS.md)** | Type-safe API/database contracts | ~500 lines | Building features, API integration |
| **[SECURITY.md](./SECURITY.md)** | Security practices and compliance | ~300 lines | Implementing auth, handling tokens |

**Total:** ~2,500 lines (was ~20,000 before cleanup)

---

## What's in Each Document?

### PRD.md - Product Requirements

**Read this first!**

- Executive summary (what, why, for whom)
- Target users and personas
- Core features across 5 phases
- Technical architecture overview
- Subscription tiers (Free, Standard, Premium)
- Success metrics and risk mitigation
- MCP tools specification (ChatGPT integration)

**When to use:** Feature planning, understanding product vision, onboarding new contributors

---

### ARCHITECTURE.md - Technical Design

**Deep dive into implementation**

- Tech stack (Next.js 15, TypeScript 5.3, Supabase, OpenAI)
- Project structure and file organization
- Database schema (current and planned tables)
- Security architecture (token encryption, OAuth 2.1, RLS)
- Type-safety approach (branded types, discriminated unions, Zod)
- API routes (current and planned endpoints)
- Testing strategy and deployment process

**When to use:** Understanding code organization, implementing new features, debugging

---

### DEVELOPMENT.md - Developer Guide

**Practical setup and workflow**

- Prerequisites and quick start
- Environment variable configuration
- GitHub OAuth setup
- Development commands (`dev`, `build`, `test`)
- Testing guide with examples
- Code style and naming conventions
- Debugging tips and common issues
- Contribution guidelines

**When to use:** Setting up local environment, writing tests, contributing code

---

### ROADMAP.md - Implementation Timeline

**Where we are and where we're going**

- **Phase 0 (Complete):** Foundation and core infrastructure
- **Phase 1 (Current):** MVP - AI post generation & publishing
- **Phase 2 (Planned):** AI Career Coach & personalization
- **Phase 3 (Planned):** Subscriptions & monetization
- **Phase 4 (Planned):** Advanced features (AI Intern, analytics, gamification)
- **Phase 5 (Planned):** Polish & launch prep

Plus success criteria for each phase, milestones, and risk mitigation.

**When to use:** Sprint planning, understanding current priorities, tracking progress

---

### API_CONTRACTS.md - Type-Safe Contracts

**The single source of truth for data structures**

- Branded types (GitHubToken, UserId, PostId, etc.)
- Discriminated unions (PostState, SubscriptionTier)
- Database models (user_tokens, posts, user_profiles, etc.)
- API endpoints (request/response types, error codes)
- MCP tools (4 ChatGPT integration tools)
- Frontend-backend contracts (React props, API client)

**When to use:** Building features, integrating APIs, ensuring type safety

---

### SECURITY.md - Security Practices

**Implementation-focused security guide**

- Token encryption (AES-256-CBC implementation)
- OAuth 2.1 with PKCE (flow and code examples)
- Content moderation (OpenAI Moderation API)
- Input validation and sanitization
- Database security (RLS policies, SQL injection prevention)
- Environment variable management
- GDPR compliance (data export, deletion, retention)
- Security checklists (development, pre-production, production)

**When to use:** Implementing authentication, handling sensitive data, compliance audits

---

## Current Status

**Phase:** Phase 1 - MVP
**Completed:** Phase 0 (Foundation)
**Next Milestone:** AI Post Generation

### What's Built

- ✅ Next.js 15 project with TypeScript strict mode
- ✅ Supabase database with schema
- ✅ GitHub OAuth authentication
- ✅ Token encryption (AES-256-CBC)
- ✅ Core UI components
- ✅ Comprehensive test coverage (~80%)

### What's In Progress

- ⏳ AI post generation (GPT-4)
- ⏳ LinkedIn/Twitter OAuth
- ⏳ Social media publishing
- ⏳ OpenAI Apps SDK (MCP) integration

### What's Planned

- 📋 AI Career Coach (Phase 2)
- 📋 Subscription billing (Phase 3)
- 📋 Analytics dashboard (Phase 4)
- 📋 AI Branding Intern (Phase 4)

---

## Project Principles

### 1. Type-Safety First

- TypeScript strict mode everywhere
- Runtime validation with Zod
- Branded types for security-critical data
- 95%+ type coverage target

### 2. Security by Design

- OAuth 2.1 with PKCE for all providers
- AES-256 encryption for all tokens
- Content moderation on all user-generated content
- Row-Level Security in production

### 3. User-Centric Development

- User verification checkpoints at each phase
- Progressive disclosure (reduce overwhelm)
- Accessibility (WCAG 2.1 AA compliance)
- Privacy-first (GDPR compliant, clear data policies)

### 4. Documentation-Driven

- Code and docs updated together
- Just-in-time detail (not premature planning)
- Single source of truth for contracts
- Clear, actionable guides over theory

---

## Archive

### v3.0 Planning Documents (Archived)

The `archive/v3.0/` directory contains the comprehensive planning documentation created for an ambitious 11-team, 12-day sprint approach. These documents (~8,500 lines) were archived to reduce context overhead and focus on current development needs.

**What's archived:**
- 11-team agent system specifications
- 462-task orchestration plans
- Detailed implementation guides (MCP, monetization, analytics)
- Hour-by-hour execution timelines

**When to reference:** Long-term planning, detailed feature specifications, compliance checklists

See [archive/v3.0/README.md](./archive/v3.0/README.md) for details.

---

## Getting Help

### Questions?

1. Check the relevant doc above
2. Search [GitHub Issues](https://github.com/your-username/vibe-posts/issues)
3. Ask in [GitHub Discussions](https://github.com/your-username/vibe-posts/discussions)

### Found a Bug?

1. Check existing [issues](https://github.com/your-username/vibe-posts/issues)
2. Open a new issue with reproduction steps

### Want to Contribute?

1. Read [DEVELOPMENT.md](./DEVELOPMENT.md)
2. Check [ROADMAP.md](./ROADMAP.md) for current priorities
3. Look for ["good first issue"](https://github.com/your-username/vibe-posts/labels/good%20first%20issue) labels

---

## Documentation Stats

| Metric | Before Cleanup | After Cleanup | Reduction |
|--------|----------------|---------------|-----------|
| **Total Lines** | ~20,000 | ~2,500 | **87.5%** |
| **Active Docs** | 18 files | 6 files | **67%** |
| **Average Doc Length** | ~1,100 lines | ~400 lines | **64%** |
| **Docs-to-Code Ratio** | 11:1 | 1.4:1 | **87%** |

**Result:** Faster onboarding, easier maintenance, reduced AI context usage.

---

## Next Steps

**New Contributors:**
1. Read PRD.md → ARCHITECTURE.md → DEVELOPMENT.md (30 min)
2. Follow DEVELOPMENT.md setup (30 min)
3. Run tests (`npm test`)
4. Pick a task from ROADMAP.md Phase 1

**Existing Contributors:**
1. Check ROADMAP.md for current phase
2. Reference API_CONTRACTS.md for type definitions
3. Follow DEVELOPMENT.md contribution guidelines

---

**Let's build something awesome!** 🚀

---

**Last Updated:** 2025-10-30
**Version:** 4.0 (Consolidated)
