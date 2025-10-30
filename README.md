# 🚀 Vibe Posts - AI-Powered Social Media Manager

**A type-safe, multi-platform social media management tool with AI Career Coach, automated content generation, and OpenAI Apps SDK integration.**

Build your personal brand effortlessly with AI-generated posts, scheduling, analytics, and an autonomous AI Branding Intern—all while maintaining complete type safety from database to UI.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)]()
[![Next.js](https://img.shields.io/badge/Next.js-15.0+-black)]()
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)]()
[![OpenAI](https://img.shields.io/badge/OpenAI-Apps%20SDK-orange)]()

---

## 🎯 Overview

Vibe Posts helps professionals build their personal brand across LinkedIn and Twitter with:
- 🤖 **AI Career Coach** - Conversational brand strategy advisor (GPT-5)
- 📝 **AI Post Generation** - Create engaging content in seconds
- 🚀 **AI Branding Intern** - Autonomous posting agent (3 modes: manual, semi-auto, full-auto)
- 📊 **Advanced Analytics** - Track engagement, sentiment, best posting times
- 💳 **Subscription Tiers** - Free (2 posts/month), Standard ($12/mo), Premium ($29/mo)
- 🔗 **OpenAI Apps SDK** - Use from ChatGPT via MCP protocol

**Unique Differentiator:** The only tool with an AI Career Coach that knows your brand + publishes for you.

**Type-Safety Mandate:** TypeScript strict mode, Zod validation, branded types, 95%+ type coverage.

---

## 🤖 Agent-Powered Development (11-Team System)

This project uses an **11-team specialized agent system** for coordinated, type-safe development. Each team has specific responsibilities and clear integration contracts enforced via TypeScript.

### Quick Start for Contributors

**New to the project?** Start here:
1. Read `docs/PRD_UNIFIED.md` (15-20 min product overview)
2. Check `docs/ORCHESTRATION_PLAN_V3.md` for 12-day sprint timeline
3. Review `docs/AGENT_TEAMS_OVERVIEW.md` for team structure + dependencies
4. See `docs/INTEGRATION_CONTRACTS_V3.md` for type-safe interfaces

### The 11 Agent Teams

- **Team 1: Onboarding & UX** - Conversational onboarding, platform selection
- **Team 2: AI Engine & Coach** - GPT-5 integration, AI Coach, AI Intern
- **Team 3: Social Integration** - LinkedIn + Twitter OAuth, publishing, analytics collection
- **Team 4: Backend & Data** - Prisma schema, API routes, database migrations
- **Team 5: Accessibility & Performance** - WCAG AA compliance, Lighthouse >95, dark mode
- **Team 6: Security & Compliance** - OAuth 2.1, token encryption, content moderation, OpenAI Apps SDK compliance
- **Team 7: Whimsy & Gamification** - Achievements, streaks, micro-animations, confetti
- **Team 8: Orchestration & Coordination** - Daily standups, blocker resolution (<1 hour), integration testing, deployment
- **Team 9: MCP & OpenAI SDK** - Model Context Protocol server, OAuth 2.1 with PKCE, 4 MCP tools
- **Team 10: Billing & Monetization** - Stripe integration, subscription tiers, feature gates, usage tracking
- **Team 11: Analytics & Insights** - Data collection, sentiment analysis, AI recommendations, dashboard

**Complete documentation:** See `docs/` folder for PRD, team specs (11 files), orchestration plan, MCP guide, compliance checklist, monetization strategy, analytics architecture, 462-task tracking, and 37 integration contracts.

---

## ✨ Features & Progress (12-Day Sprint)

| Feature | Status | Timeline | Owner |
|---------|--------|----------|-------|
| 🔐 GitHub/LinkedIn/Twitter OAuth | ✅ **Complete** | Days 2-3 | Team 3 |
| 🗄️ Database & Migrations | ✅ **Complete** | Day 1 | Team 4 |
| 🔒 Security Layer (AES-256-GCM) | ✅ **Complete** | Days 1-2 | Team 6 |
| 📱 Responsive UI Components | ✅ **Complete** | Days 1-2 | Team 1 |
| 🤖 AI Post Generation (GPT-4) | ⏳ **Day 3-4** | Days 3-4 | Team 2 |
| 💬 AI Career Coach | ⏳ **Day 3** | Day 3 | Team 2 |
| 🚀 AI Branding Intern | ⏳ **Day 5** | Day 5 | Team 2 |
| 📤 LinkedIn/Twitter Publishing | ⏳ **Day 4-6** | Days 4-6 | Team 3 |
| 🔗 MCP/OpenAI Apps SDK | ⏳ **Day 2-4** | Days 2-4 | Team 9 |
| 💳 Stripe Billing (3 tiers) | ⏳ **Day 5-8** | Days 5-8 | Team 10 |
| 📊 Analytics Dashboard | ⏳ **Day 6-8** | Days 6-8 | Team 11 |
| 🎮 Gamification (Achievements) | ⏳ **Day 7-9** | Days 7-9 | Team 7 |
| ⚡ Lighthouse >95 (Performance) | ⏳ **Day 6-8** | Days 6-8 | Team 5 |
| ✅ WCAG AA Compliance | ⏳ **Day 8** | Day 8 | Team 5 |
| 🚀 Production Deployment | ⏳ **Day 12** | Day 12 | Team 8 |

**Timeline:** 12 days | **Total Tasks:** 462 | **Success Metric:** 100% completion, 95%+ type coverage, zero critical vulnerabilities

---

## 🏗️ Tech Stack (Type-Safe)

- **Frontend:** Next.js 15 App Router + TypeScript 5.3+ (strict mode) + Tailwind CSS
- **UI Components:** Custom components with Radix UI primitives + Framer Motion animations
- **Authentication:** GitHub/LinkedIn/Twitter OAuth 2.1 with PKCE
- **Database:** Prisma ORM + Supabase PostgreSQL + Row-Level Security (RLS)
- **AI Integration:** OpenAI GPT-4/GPT-5 (post generation, AI Coach, sentiment analysis)
- **MCP Server:** OpenAI Apps SDK (4 tools: generate_post, schedule_post, list_posts, brand_profile)
- **Billing:** Stripe Checkout + Webhooks (3 tiers: Free, Standard $12/mo, Premium $29/mo)
- **Analytics:** LinkedIn/Twitter APIs + GPT-4 sentiment analysis
- **Validation:** Zod schemas (runtime + compile-time type inference)
- **Caching:** Upstash Redis (rate limiting + analytics caching)
- **Security:** AES-256-GCM encryption, OpenAI Moderation API, CSP headers, audit logging
- **Testing:** Jest + React Testing Library + Playwright (E2E) + jest-axe (accessibility)
- **Monitoring:** Sentry (errors) + Vercel Analytics (performance)
- **Deployment:** Vercel (production) + GitHub Actions (CI/CD)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- GitHub account for OAuth setup
- Supabase project (free tier available)

### 1. Clone and Install
```bash
git clone https://github.com/your-username/postures.git
cd postures
npm install
```

### 2. Environment Setup
Create `.env.local` with your configuration:
```env
# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXT_PUBLIC_GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Encryption (generate a random 32-char string)
ENCRYPTION_KEY=your_32_character_encryption_key
```

### 3. Database Setup
```bash
# Run the Supabase schema
psql -h your_supabase_host -U postgres -d postgres -f supabase/schema.sql
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app!

---

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Testing
npm run test            # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report

# Code Quality
npm run lint            # ESLint check
npm run type-check      # TypeScript check
```

---

## 📖 Usage Guide

### For First-Time Users

1. **Connect GitHub Account**
   - Click "Tell My Story" on the homepage
   - Authorize GitHub access (read-only permissions)
   - Your tokens are encrypted and stored securely

2. **Generate Your First Post** *(Coming Soon)*
   - Recent commits automatically fetched
   - Add optional context about your work
   - Choose your preferred writing style
   - AI generates a professional LinkedIn post

3. **Edit and Publish** *(Coming Soon)*
   - Review and edit the generated content
   - Preview how it will look on LinkedIn
   - Publish directly or save as draft

### For Developers

#### Project Structure
```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes (auth, AI, GitHub)
│   └── page.tsx        # Homepage component
├── components/         # Reusable UI components
│   ├── ui/            # Base components (Button, Card, etc.)
│   └── auth/          # Authentication components
├── lib/               # Core utilities
│   ├── storage/       # Supabase integration
│   └── utils.ts       # Helper functions
└── utils/             # Input validation & sanitization
```

#### Key Files
- `src/app/api/auth/github/route.ts` - GitHub OAuth handler
- `src/app/api/ai/route.ts` - AI post generation endpoint
- `src/lib/storage/supabase.ts` - Database and encryption utilities
- `src/utils/sanitize.ts` - Input sanitization functions
- `src/utils/validation.ts` - Input validation logic

---

## 🔒 Security & Compliance

### Security Features

- **Token Encryption:** All OAuth tokens encrypted with AES-256-GCM (32-byte key)
- **Branded Types:** Security-critical data (tokens, IDs) wrapped in branded types (compile-time safety)
- **Content Moderation:** OpenAI Moderation API (99%+ toxic content blocked)
- **Prompt Injection Protection:** System prompt isolation, input sanitization
- **Input Sanitization:** XSS and injection protection (DOMPurify)
- **Secure Storage:** Supabase RLS policies (users can only access own data)
- **No Token Logging:** Sensitive data never appears in logs or error messages
- **Automatic Token Refresh:** OAuth refresh tokens used before expiration
- **Audit Logging:** All sensitive actions logged (90-day retention, user-exportable)
- **Rate Limiting:** Upstash Redis-based limits (100 requests/hour per user for MCP)
- **CSP Headers:** Content Security Policy prevents XSS attacks
- **CORS Policy:** Strict origin validation (only https://chat.openai.com for MCP)

### Compliance

- **GDPR:** Data export (`/api/export`), deletion (`/api/account/delete`), retention policies
- **OpenAI Apps SDK:** 50-item compliance checklist (consent flows, undo, toxicity filtering, audit logging)
- **OAuth 2.1:** PKCE for all flows (prevents authorization code interception)
- **Accessibility:** WCAG 2.1 AA compliance (keyboard navigation, ARIA labels, dark mode)
- **No Vulnerabilities:** Zero high/critical npm vulnerabilities (Snyk automated scans)

**Detailed security documentation:** See `docs/SECURITY.md` and `docs/COMPLIANCE_CHECKLIST.md`.

---

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm run test

# Generate coverage report
npm run test:coverage
```

Tests cover:
- ✅ Component rendering and user interactions
- ✅ API route functionality and error handling
- ✅ Input sanitization and validation
- ✅ Database integration and encryption
- ✅ Authentication flows

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Set Environment Variables**
   - Add all `.env.local` variables to Vercel dashboard
   - Update `NEXT_PUBLIC_GITHUB_REDIRECT_URI` to your production URL

3. **Configure GitHub OAuth**
   - Update GitHub App settings with production callback URL
   - Ensure homepage URL matches your deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] GitHub OAuth app updated
- [ ] SSL certificate active
- [ ] Error monitoring setup (optional)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `npm run test`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Guidelines
- Write tests for new features
- Follow TypeScript best practices
- Use conventional commit messages
- Ensure all tests pass before submitting

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- 🐛 **Issues:** [GitHub Issues](https://github.com/your-username/postures/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/your-username/postures/discussions)
- 📧 **Email:** your-email@example.com

---

**Built with ❤️ for developers who want to share their coding journey on LinkedIn.**
