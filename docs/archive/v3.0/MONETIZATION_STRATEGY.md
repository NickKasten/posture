# Monetization Strategy

**Version:** 3.0
**Owner:** Team 10 (Billing & Monetization)
**Timeline:** Days 5-8
**Revenue Target:** $50K MRR by Month 6

---

## Table of Contents

1. [Pricing Tiers](#pricing-tiers)
2. [Feature Gates](#feature-gates)
3. [Stripe Integration](#stripe-integration)
4. [Upsell & Retention](#upsell--retention)
5. [Pricing Psychology](#pricing-psychology)
6. [Financial Projections](#financial-projections)
7. [Churn Mitigation](#churn-mitigation)
8. [Competitive Analysis](#competitive-analysis)

---

## Pricing Tiers

### Overview

Vibe Posts uses a **freemium + two paid tiers** model to balance user acquisition (free tier) with revenue growth (Standard/Premium).

| Tier | Price | Target User | Key Value Proposition |
|------|-------|-------------|----------------------|
| **Free** | $0/month | Individual experimenting | "Try before you buy" (2 posts/month) |
| **Standard** | $12/month | Active professional | "AI-powered consistency" (unlimited posts + AI Coach) |
| **Premium** | $29/month | Thought leader/brand | "Full automation" (AI Branding Intern + analytics) |

**Annual Discount:** 20% off (2 months free)
- Standard Annual: $115/year ($9.58/month effective)
- Premium Annual: $278/year ($23.17/month effective)

---

### Free Tier

**Target Persona:** Sarah, marketing coordinator exploring AI tools

**Limits:**
- **2 posts/month** (LinkedIn OR Twitter)
- **3 AI generation attempts/month**
- **Basic analytics** (views, likes only)
- **No AI Coach**
- **No AI Branding Intern**
- **No multi-platform scheduling**
- **Community support only**

**Conversion Strategy:**
- Show "2/2 posts used this month" banner on Day 15 (mid-cycle pressure)
- Upsell modal: "Unlock unlimited posts with Standard ($12/mo)"
- Trial extension: Offer 1 extra post if user refers a friend

**Type-Safe Implementation:**
```typescript
// lib/billing/gates.ts
export async function canPublishPost(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const subscription = await db.subscription.findUnique({ where: { userId } });

  if (subscription?.tier === 'FREE') {
    if (subscription.postsThisMonth >= 2) {
      return {
        allowed: false,
        reason: 'You've reached your Free tier limit (2 posts/month). Upgrade to Standard for unlimited posts.',
      };
    }
  }

  return { allowed: true };
}
```

**Success Metrics:**
- **Free → Paid conversion rate:** 5% (Industry standard: 2-5%)
- **Time to conversion:** 21 days (3 weeks of testing)
- **Free tier CAC:** $0 (organic + referrals)

---

### Standard Tier ($12/month)

**Target Persona:** Alex, startup founder building personal brand

**Features:**
- ✅ **Unlimited posts** (LinkedIn + Twitter)
- ✅ **AI Career Coach** (2 sessions/month, 10 messages each)
- ✅ **Advanced analytics** (engagement rate, sentiment, best posting times)
- ✅ **Post templates** (save 5 templates)
- ✅ **Scheduling** (unlimited scheduled posts)
- ✅ **Email support** (48-hour response time)
- ❌ **No AI Branding Intern**

**Value Proposition:**
> "Post consistently without the effort. Our AI Coach helps you craft authentic content that resonates."

**Pricing Rationale:**
- **Comparable tools:** Buffer ($12/mo), Hootsuite ($49/mo), Later ($18/mo)
- **Value anchor:** AI Coach alone worth $20/mo (saves 2 hours/week at $10/hr)
- **Sweet spot:** Affordable for individuals, high perceived value

**Conversion Triggers:**
- Free user attempts 3rd post → "Upgrade to Standard" modal
- Free user requests AI Coach → "Unlock with Standard" paywall
- Day 14 email: "You published 2 posts this month. Imagine 10x that with Standard."

**Type-Safe Implementation:**
```typescript
export type SubscriptionTier =
  | { type: 'free'; postsRemaining: number; maxPosts: 2 }
  | { type: 'standard'; coachSessionsRemaining: number; maxSessions: 2 }
  | { type: 'premium'; internEnabled: boolean; analyticsEnabled: true };

export function canAccessFeature(tier: SubscriptionTier, feature: Feature): boolean {
  switch (feature) {
    case 'unlimited_posts':
      return tier.type !== 'free';
    case 'ai_coach':
      return tier.type === 'standard' || tier.type === 'premium';
    case 'ai_intern':
      return tier.type === 'premium';
    default:
      const _exhaustive: never = feature;
      return false;
  }
}
```

**Success Metrics:**
- **ARPU (Average Revenue Per User):** $12/month
- **LTV (Lifetime Value):** $144 (assuming 12-month retention)
- **Churn rate:** <5%/month

---

### Premium Tier ($29/month)

**Target Persona:** Jordan, executive coach with 10K+ followers

**Features:**
- ✅ **Everything in Standard**
- ✅ **AI Branding Intern** (3 modes: manual, semi-auto, full-auto)
- ✅ **Unlimited AI Coach sessions**
- ✅ **Advanced analytics dashboard** (competitor analysis, trend predictions)
- ✅ **Priority support** (24-hour response time)
- ✅ **Unlimited templates**
- ✅ **Multi-platform cross-posting** (LinkedIn + Twitter simultaneously)
- ✅ **White-label reports** (export analytics as PDF for clients)

**Value Proposition:**
> "Run your personal brand on autopilot. Our AI Intern researches trends, drafts posts, and publishes while you sleep."

**Pricing Rationale:**
- **Comparable tools:** SocialBee ($29/mo), Agorapulse ($79/mo)
- **Value anchor:** AI Intern saves 5 hours/week = $200/mo value (at $10/hr)
- **2.4x Standard price** (anchoring makes Standard look affordable)

**Conversion Triggers:**
- Standard user manually posts 5+ times/week → "Let AI Intern handle this" banner
- Standard user views competitor with AI Intern → Feature showcase
- Day 30 email: "You've published 40 posts this month. Save 10 hours with Premium."

**Type-Safe Implementation:**
```typescript
export async function canAccessAIIntern(userId: string): Promise<boolean> {
  const subscription = await db.subscription.findUnique({ where: { userId } });
  return subscription?.tier === 'PREMIUM';
}

export async function runIntern(userId: string, mode: 'manual' | 'semi_auto' | 'full_auto') {
  const hasAccess = await canAccessAIIntern(userId);

  if (!hasAccess) {
    throw new Error('AI Branding Intern requires Premium tier. Upgrade at /pricing');
  }

  // ... intern logic
}
```

**Success Metrics:**
- **ARPU:** $29/month
- **LTV:** $348 (assuming 12-month retention)
- **Churn rate:** <3%/month (higher value = stickier)

---

## Feature Gates

### Type-Safe Feature Gating

```typescript
// lib/billing/features.ts
export enum Feature {
  UNLIMITED_POSTS = 'unlimited_posts',
  AI_COACH = 'ai_coach',
  AI_INTERN = 'ai_intern',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  PRIORITY_SUPPORT = 'priority_support',
  TEMPLATES = 'templates',
  SCHEDULING = 'scheduling',
  MULTI_PLATFORM = 'multi_platform',
  WHITE_LABEL_REPORTS = 'white_label_reports',
}

export const FEATURE_MATRIX: Record<SubscriptionTier['type'], Feature[]> = {
  free: [Feature.SCHEDULING],
  standard: [
    Feature.UNLIMITED_POSTS,
    Feature.AI_COACH,
    Feature.ADVANCED_ANALYTICS,
    Feature.TEMPLATES,
    Feature.SCHEDULING,
    Feature.MULTI_PLATFORM,
  ],
  premium: [
    Feature.UNLIMITED_POSTS,
    Feature.AI_COACH,
    Feature.AI_INTERN,
    Feature.ADVANCED_ANALYTICS,
    Feature.PRIORITY_SUPPORT,
    Feature.TEMPLATES,
    Feature.SCHEDULING,
    Feature.MULTI_PLATFORM,
    Feature.WHITE_LABEL_REPORTS,
  ],
};

export function hasFeature(tier: SubscriptionTier, feature: Feature): boolean {
  return FEATURE_MATRIX[tier.type].includes(feature);
}
```

### Usage Tracking

```typescript
// Reset monthly usage on 1st of month (cron job)
export async function resetMonthlyUsage() {
  await db.subscription.updateMany({
    where: { tier: 'FREE' },
    data: { postsThisMonth: 0 },
  });

  await db.subscription.updateMany({
    where: { tier: 'STANDARD' },
    data: { coachSessionsThisMonth: 0 },
  });
}

// Increment usage after action
export async function incrementPostCount(userId: string) {
  await db.subscription.update({
    where: { userId },
    data: { postsThisMonth: { increment: 1 } },
  });
}
```

---

## Stripe Integration

### Product & Price Setup

```bash
# Create Stripe products (run once in production)
stripe products create --name "Vibe Posts Standard" --description "Unlimited posts + AI Coach"
stripe prices create --product prod_XXX --unit-amount 1200 --currency usd --recurring.interval month

stripe products create --name "Vibe Posts Premium" --description "AI Branding Intern + Advanced Analytics"
stripe prices create --product prod_YYY --unit-amount 2900 --currency usd --recurring.interval month

# Annual prices (20% discount)
stripe prices create --product prod_XXX --unit-amount 11520 --currency usd --recurring.interval year
stripe prices create --product prod_YYY --unit-amount 27840 --currency usd --recurring.interval year
```

### Checkout Flow

```typescript
// lib/stripe/checkout.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export async function createCheckoutSession(
  userId: string,
  tier: 'standard' | 'premium',
  interval: 'month' | 'year'
): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId } });

  const priceId = getPriceId(tier, interval);

  const session = await stripe.checkout.sessions.create({
    customer_email: user!.email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?upgrade=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    metadata: { userId, tier, interval },
    allow_promotion_codes: true, // Enable coupon codes
  });

  return session.url!;
}

function getPriceId(tier: 'standard' | 'premium', interval: 'month' | 'year'): string {
  const priceMap = {
    standard_month: process.env.STRIPE_PRICE_STANDARD_MONTHLY!,
    standard_year: process.env.STRIPE_PRICE_STANDARD_YEARLY!,
    premium_month: process.env.STRIPE_PRICE_PREMIUM_MONTHLY!,
    premium_year: process.env.STRIPE_PRICE_PREMIUM_YEARLY!,
  };

  return priceMap[`${tier}_${interval}`];
}
```

### Webhook Handling

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await db.subscription.update({
        where: { userId: session.metadata!.userId },
        data: {
          tier: session.metadata!.tier.toUpperCase() as SubscriptionTier['type'],
          status: 'ACTIVE',
          stripeCustomerId: session.customer as string,
          stripePriceId: session.line_items?.data[0].price.id,
          currentPeriodEnd: new Date(session.expires_at! * 1000),
        },
      });
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await db.subscription.update({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
          status: subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await db.subscription.update({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
          tier: 'FREE',
          status: 'CANCELED',
          postsThisMonth: 0,
        },
      });
      break;
    }
  }

  return Response.json({ received: true });
}
```

---

## Upsell & Retention

### In-App Upsell Triggers

**1. Usage-Based Triggers**
```typescript
// When user reaches limit
if (postsThisMonth >= 2 && tier === 'FREE') {
  showUpgradeModal({
    title: "You're on a roll! 🎉",
    message: "You've published 2 posts this month. Upgrade to Standard for unlimited posts.",
    cta: "Unlock Unlimited Posts ($12/mo)",
  });
}

// When user tries locked feature
if (requestedFeature === 'ai_coach' && tier === 'FREE') {
  showFeaturePaywall({
    feature: 'AI Career Coach',
    description: "Get personalized content advice from our AI Coach.",
    tierRequired: 'Standard',
    price: '$12/mo',
  });
}
```

**2. Time-Based Triggers**
```typescript
// Day 7: First week nudge
sendEmail({
  to: user.email,
  subject: "You published 1 post this week. Imagine 10x that.",
  body: "Standard users publish 10+ posts/month with AI assistance. Upgrade for $12/mo.",
});

// Day 21: Trial extension offer
if (postsThisMonth === 2) {
  showBanner({
    message: "Out of posts? Refer a friend for 1 bonus post, or upgrade for unlimited.",
    cta: "Refer a Friend",
  });
}
```

**3. Social Proof Triggers**
```typescript
// Show upgrade banner after user views analytics
if (viewedAnalytics && tier === 'FREE') {
  showBanner({
    message: "74% of Standard users see 3x engagement within 30 days.",
    cta: "Join Standard ($12/mo)",
  });
}
```

### Retention Strategies

**1. Onboarding Excellence**
- **Day 1:** Conversational onboarding (no friction)
- **Day 3:** First post published (quick win)
- **Day 7:** First analytics viewed (value demonstrated)
- **Day 14:** AI Coach conversation (emotional connection)

**2. Habit Formation**
- **Weekly digest email:** "Your week in posts" (engagement summary)
- **Streak tracker:** "7-day posting streak! 🔥" (gamification)
- **Achievement badges:** "Unlock '10 Posts' badge" (dopamine hit)

**3. Cancellation Flow**
```typescript
// app/settings/billing/cancel/page.tsx
export default function CancelPage() {
  const [reason, setReason] = useState<string | null>(null);

  const handleCancel = async () => {
    // Offer alternatives based on reason
    if (reason === 'too_expensive') {
      return showOffer({
        title: "We'd hate to lose you!",
        message: "How about 50% off for 3 months?",
        code: 'COMEBACK50',
      });
    }

    if (reason === 'not_using') {
      return showOffer({
        title: "Pause instead of cancel?",
        message: "Keep your data for 6 months, no charge.",
        cta: "Pause Subscription",
      });
    }

    // Proceed with cancellation
    await cancelSubscription();
  };

  return (
    <form onSubmit={handleCancel}>
      <h1>We're sorry to see you go</h1>
      <select onChange={(e) => setReason(e.target.value)}>
        <option value="too_expensive">Too expensive</option>
        <option value="not_using">Not using enough</option>
        <option value="missing_features">Missing features</option>
        <option value="switching">Switching to competitor</option>
      </select>
      <button>Cancel Subscription</button>
    </form>
  );
}
```

**4. Win-Back Campaign**
```typescript
// 30 days after cancellation
sendEmail({
  to: user.email,
  subject: "We miss you! Here's 50% off for 3 months.",
  body: "We've added new features: AI Branding Intern, advanced analytics. Come back for $6/mo (first 3 months).",
  coupon: 'WINBACK50',
});
```

---

## Pricing Psychology

### Anchoring

**Premium tier anchors Standard tier:**
- Premium ($29) makes Standard ($12) look affordable
- "Save $17/month by choosing Standard" (loss aversion)

**Annual anchoring:**
- Show annual price with "2 months free" badge (gain framing)
- Monthly: $12/mo × 12 = $144
- Annual: $115/year = $29 savings (20% off)

### Decoy Effect

**Add "Teams" tier (future):**
- Teams: $99/month (5 users)
- Makes Premium ($29) look like a steal for individuals

### Value Perception

**Feature breakdown on pricing page:**
```
Standard ($12/mo)
- Unlimited posts → $20 value (vs. Buffer)
- AI Coach → $30 value (vs. Jasper)
- Advanced analytics → $15 value (vs. Sprout Social)
= $65 total value for $12 (81% savings!)
```

### Urgency

**Limited-time offers:**
- Launch promo: "50% off first 3 months (ends Nov 1)"
- Seasonal: "Black Friday: 30% off annual plans"
- Scarcity: "Only 50 Premium spots left at this price"

---

## Financial Projections

### Revenue Model Assumptions

| Metric | Value | Source |
|--------|-------|--------|
| **Total users (Month 6)** | 5,000 | Marketing projections |
| **Free tier %** | 70% (3,500 users) | Industry standard |
| **Standard tier %** | 25% (1,250 users) | 5% conversion × 6 months |
| **Premium tier %** | 5% (250 users) | 1% conversion × 6 months |
| **Avg churn rate** | 4%/month | SaaS benchmark |
| **Avg LTV (Standard)** | $144 (12 months) | $12 × 12 months |
| **Avg LTV (Premium)** | $348 (12 months) | $29 × 12 months |

### Month 6 MRR Calculation

```
Standard MRR: 1,250 users × $12 = $15,000
Premium MRR: 250 users × $29 = $7,250
Total MRR: $22,250
```

**ARR (Annual Recurring Revenue):** $267,000

### 12-Month Projection

| Month | Free Users | Standard | Premium | MRR | Total Revenue |
|-------|------------|----------|---------|-----|---------------|
| 1 | 500 | 25 | 5 | $605 | $605 |
| 2 | 800 | 60 | 10 | $1,010 | $1,615 |
| 3 | 1,200 | 120 | 20 | $2,020 | $3,635 |
| 4 | 2,000 | 250 | 50 | $4,450 | $8,085 |
| 5 | 3,000 | 600 | 100 | $10,100 | $18,185 |
| 6 | 5,000 | 1,250 | 250 | $22,250 | $40,435 |
| 7 | 6,500 | 1,750 | 350 | $31,150 | $71,585 |
| 8 | 8,000 | 2,500 | 500 | $44,500 | $116,085 |
| 9 | 10,000 | 3,500 | 700 | $62,300 | $178,385 |
| 10 | 12,000 | 4,800 | 960 | $85,440 | $263,825 |
| 11 | 15,000 | 6,500 | 1,300 | $115,700 | $379,525 |
| 12 | 20,000 | 9,000 | 1,800 | $160,200 | $539,725 |

**Year 1 Total Revenue:** $539,725

### Unit Economics

**Customer Acquisition Cost (CAC):**
- Organic (SEO, content): $10/user
- Paid (Google Ads, LinkedIn): $50/user
- Blended CAC: $30/user

**Payback Period:**
- Standard: $30 CAC / $12 MRR = 2.5 months
- Premium: $30 CAC / $29 MRR = 1.0 month

**LTV/CAC Ratio:**
- Standard: $144 LTV / $30 CAC = 4.8 (healthy: >3)
- Premium: $348 LTV / $30 CAC = 11.6 (excellent)

---

## Churn Mitigation

### Churn Prediction

```typescript
// lib/analytics/churn.ts
export async function calculateChurnRisk(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      posts: { where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      coachSessions: { where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
    },
  });

  let churnScore = 0;

  // Low usage (no posts in 30 days)
  if (user!.posts.length === 0) churnScore += 30;

  // No AI Coach usage (Standard/Premium users)
  if (user!.coachSessions.length === 0 && user!.subscription?.tier !== 'FREE') churnScore += 20;

  // No logins in 14 days
  const daysSinceLogin = (Date.now() - user!.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLogin > 14) churnScore += 25;

  // Payment failed (past_due status)
  if (user!.subscription?.status === 'PAST_DUE') churnScore += 40;

  return churnScore; // 0-100 (higher = more likely to churn)
}
```

### Intervention Strategies

**High churn risk (score >60):**
```typescript
// Send re-engagement email
sendEmail({
  to: user.email,
  subject: "We noticed you haven't posted lately. Need help?",
  body: "Book a free 15-min strategy session with our team to get unstuck.",
  cta: "Book Session",
});
```

**Medium churn risk (score 40-60):**
```typescript
// Send value reminder email
sendEmail({
  to: user.email,
  subject: "Your AI Coach misses you! Here's a free post idea.",
  body: "We generated a post idea based on your profile: [AI-generated idea]",
  cta: "Publish This Idea",
});
```

**Low churn risk (score <40):**
```typescript
// Encourage upgrade
if (tier === 'FREE') {
  showBanner({
    message: "You're crushing it! Upgrade to Standard to publish 10x more.",
    cta: "Upgrade Now",
  });
}
```

---

## Competitive Analysis

| Competitor | Price | Key Features | Vibe Posts Advantage |
|------------|-------|--------------|---------------------|
| **Buffer** | $12/mo | Scheduling, analytics | ❌ No AI generation, ❌ No coaching |
| **Hootsuite** | $49/mo | Multi-platform, team collab | ❌ Expensive, ❌ No AI content creation |
| **Jasper (AI writing)** | $39/mo | AI content generation | ❌ No publishing, ❌ No scheduling |
| **SocialBee** | $29/mo | AI posting, scheduling | ❌ No coaching, ❌ Generic AI |
| **Later** | $18/mo | Visual planning, scheduling | ❌ No AI, ❌ Instagram-focused |
| **Vibe Posts** | $12-$29/mo | **AI generation + coaching + publishing + analytics** | ✅ All-in-one, ✅ Personalized AI |

**Unique Positioning:**
> "The only social media tool with an AI Career Coach that knows your brand and publishes for you."

---

## Conclusion

### Key Takeaways

1. **Freemium drives acquisition:** 70% free users = top-of-funnel (5% convert → 25% paid)
2. **Standard is the sweet spot:** $12/mo affordable, high perceived value (AI Coach)
3. **Premium is the profit center:** $29/mo, low churn (3%), high LTV ($348)
4. **Upsell in-app:** Usage-based triggers convert 5% → 10% (2x revenue)
5. **Annual plans reduce churn:** 20% discount = 12-month commitment

### Success Metrics (Month 6)

- **MRR:** $22,250 (Target: $20K+)
- **ARPU:** $17.80 (Blended)
- **Churn rate:** <4%/month
- **LTV/CAC:** >4 (Standard + Premium blended)
- **Free → Paid conversion:** 5%

### Next Steps

- **Day 5:** Integrate Stripe checkout (Team 10)
- **Day 6:** Test all feature gates (Team 10 + Team 8)
- **Day 8:** Launch pricing page (Team 1 + Team 10)
- **Day 12:** Production billing live (Team 10)

**Ownership:** Team 10 (Billing & Monetization)
**Dependencies:** Team 4 (Database schema), Team 1 (Pricing page UI)
**Timeline:** Days 5-8

---

**Last Updated:** Day 0 (Pre-execution)
**Next Review:** Day 8 (Major Checkpoint)
**Target:** $50K MRR by Month 6
