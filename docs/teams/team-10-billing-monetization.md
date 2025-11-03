# Team 10: Billing & Monetization

**Team Lead:** Billing Specialist Agent
**Timeline:** Days 7-8 (implementation), ongoing (maintenance)
**Dependencies:** Team 4 (database), Team 6 (security)
**Provides To:** All teams (subscription tier enforcement)

---

## 🎯 Role & Expertise

Build and maintain the subscription billing system using Stripe, implement type-safe feature gates, and provide admin tools for user/revenue management.

### Required Expertise
- Stripe API integration (subscriptions, webhooks, billing)
- TypeScript discriminated unions for subscription states
- Feature gate implementation (compile-time type safety)
- Admin dashboard UI (React, data visualization)
- Revenue analytics & reporting

---

## 📋 Primary Objectives

### Phase 3: Subscriptions & Billing (Days 7-8)

#### Objective 3.1: Stripe Integration (Day 7 Morning)
**Goal:** Set up Stripe for subscription management

**Tasks:**
- [ ] Create Stripe account, get API keys (test mode)
- [ ] Install Stripe SDK: `npm install stripe @stripe/stripe-js`
- [ ] Create Stripe products (Free, Standard, Premium)
- [ ] Create Stripe prices ($0, $12/mo, $29/mo)
- [ ] Implement Stripe Checkout (pre-built UI)

**Type-Safe Stripe Integration:**
```typescript
// src/lib/billing/stripe-client.ts
import Stripe from 'stripe';
import { z } from 'zod';

// Initialize Stripe with API key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true, // Enable TypeScript definitions
});

// Product IDs (branded types)
type ProductId = string & { readonly __brand: 'ProductId' };
type PriceId = string & { readonly __brand: 'PriceId' };
type CustomerId = string & { readonly __brand: 'CustomerId' };

// Subscription tier enum
export enum SubscriptionTier {
  FREE = 'free',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

// Price IDs for each tier
export const PRICE_IDS: Record<SubscriptionTier, PriceId> = {
  [SubscriptionTier.FREE]: '' as PriceId, // No Stripe price for free tier
  [SubscriptionTier.STANDARD]: process.env.STRIPE_PRICE_STANDARD! as PriceId,
  [SubscriptionTier.PREMIUM]: process.env.STRIPE_PRICE_PREMIUM! as PriceId,
};
```

**Deliverables:**
- Stripe products created (visible in Stripe Dashboard)
- Stripe SDK installed and configured
- Test API call successful (list products)

**🔍 User Verification (Day 7, 10 AM):**
- Log into Stripe Dashboard → verify 3 products exist
- Run `npm run stripe:test` (test API connection)

---

#### Objective 3.2: Checkout Flow (Day 7 Afternoon)
**Goal:** Allow users to upgrade to paid tiers

**Tasks:**
- [ ] Create checkout session endpoint (`/api/billing/checkout`)
- [ ] Implement checkout UI (redirect to Stripe Checkout)
- [ ] Handle success/cancel redirects
- [ ] Store customer ID in database (Prisma)

**Checkout Implementation:**
```typescript
// src/app/api/billing/checkout/route.ts
import { stripe, PRICE_IDS, SubscriptionTier } from '@/lib/billing/stripe-client';
import { z } from 'zod';

const CheckoutRequestSchema = z.object({
  tier: z.nativeEnum(SubscriptionTier),
  userId: z.string().uuid(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const { tier, userId } = CheckoutRequestSchema.parse(body);

  if (tier === SubscriptionTier.FREE) {
    return Response.json({ error: 'Cannot checkout for free tier' }, { status: 400 });
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: PRICE_IDS[tier],
        quantity: 1,
      },
    ],
    metadata: {
      userId, // Link to our user
      tier,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=canceled`,
  });

  return Response.json({ checkoutUrl: session.url });
}
```

**UI Component:**
```typescript
// src/components/billing/UpgradeButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SubscriptionTier } from '@/lib/billing/stripe-client';

interface UpgradeButtonProps {
  tier: SubscriptionTier;
  userId: string;
}

export function UpgradeButton({ tier, userId }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);

    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, userId }),
    });

    const { checkoutUrl } = await response.json();
    window.location.href = checkoutUrl; // Redirect to Stripe Checkout
  };

  return (
    <Button onClick={handleUpgrade} disabled={loading}>
      {loading ? 'Redirecting...' : `Upgrade to ${tier}`}
    </Button>
  );
}
```

**Deliverables:**
- Checkout endpoint functional
- Upgrade button redirects to Stripe Checkout
- Success/cancel redirects working

**🔍 User Verification (Day 7, 3 PM):**
- Click "Upgrade to Standard" → redirects to Stripe Checkout
- Complete test payment (Stripe test card: 4242 4242 4242 4242)
- Redirected back to dashboard with success message

---

#### Objective 3.3: Webhook Handling (Day 7 Evening)
**Goal:** Process Stripe events (subscription created, payment succeeded/failed)

**Tasks:**
- [ ] Create webhook endpoint (`/api/webhooks/stripe`)
- [ ] Verify webhook signature (Stripe signing secret)
- [ ] Handle `checkout.session.completed` event
- [ ] Handle `customer.subscription.created` event
- [ ] Handle `customer.subscription.updated` event
- [ ] Handle `invoice.payment_succeeded` event
- [ ] Handle `invoice.payment_failed` event

**Type-Safe Webhook Handler:**
```typescript
// src/app/api/webhooks/stripe/route.ts
import { stripe } from '@/lib/billing/stripe-client';
import { headers } from 'next/headers';
import { db } from '@/lib/db/prisma';
import Stripe from 'stripe';

// Webhook signature validation
async function validateWebhook(request: Request): Promise<Stripe.Event | null> {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) return null;

  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return null;
  }
}

export async function POST(request: Request) {
  const event = await validateWebhook(request);

  if (!event) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier as SubscriptionTier;

      if (!userId || !tier) {
        console.error('Missing metadata in checkout session');
        break;
      }

      // Create subscription in database
      await db.subscription.create({
        data: {
          userId,
          tier,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      console.log(`Subscription created for user ${userId}: ${tier}`);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      // Update subscription (payment succeeded)
      await db.subscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: 'ACTIVE' },
      });

      console.log(`Payment succeeded for subscription ${subscriptionId}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      // Update subscription (payment failed)
      await db.subscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: 'PAST_DUE' },
      });

      console.log(`Payment failed for subscription ${subscriptionId}`);
      // TODO: Send email to user (retry in 3 days)
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      // Mark subscription as canceled
      await db.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'CANCELED', canceledAt: new Date() },
      });

      console.log(`Subscription canceled: ${subscription.id}`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return Response.json({ received: true });
}
```

**Deliverables:**
- Webhook endpoint live at `/api/webhooks/stripe`
- Signature validation working
- 5 event types handled (checkout, payment success/fail, subscription deleted)

**🔍 User Verification (Day 7, 6 PM):**
- Trigger webhook via Stripe CLI: `stripe trigger checkout.session.completed`
- Verify subscription created in database (Prisma Studio)
- Trigger payment failure → verify status → PAST_DUE

---

#### Objective 3.4: Feature Gates (Day 8 Morning)
**Goal:** Enforce tier-based feature access with compile-time safety

**Tasks:**
- [ ] Define subscription tier type (discriminated union)
- [ ] Implement feature gate function (type-safe)
- [ ] Add feature checks to all relevant endpoints
- [ ] Test feature gates (free tier tries premium feature → blocked)

**Type-Safe Feature Gates:**
```typescript
// src/lib/billing/feature-gates.ts
import { SubscriptionTier } from '@prisma/client';

// Discriminated union for tier state
export type TierState =
  | { type: 'free'; postsRemaining: number; maxPosts: 2 }
  | { type: 'standard'; coachSessionsRemaining: number; maxSessions: 2 }
  | { type: 'premium'; internEnabled: boolean; analyticsEnabled: true };

// Feature enum
export type Feature =
  | 'unlimited_posts'
  | 'ai_coach'
  | 'ai_intern'
  | 'analytics'
  | 'multi_platform'
  | 'post_scheduling';

// Type-safe feature gate (compile-time checked)
export function canAccessFeature(tier: SubscriptionTier, feature: Feature): boolean {
  switch (feature) {
    case 'unlimited_posts':
      return tier !== SubscriptionTier.FREE;

    case 'ai_coach':
      return tier === SubscriptionTier.STANDARD || tier === SubscriptionTier.PREMIUM;

    case 'ai_intern':
      return tier === SubscriptionTier.PREMIUM;

    case 'analytics':
      return tier === SubscriptionTier.PREMIUM;

    case 'multi_platform':
      return tier !== SubscriptionTier.FREE; // Standard+ can use both LinkedIn & Twitter

    case 'post_scheduling':
      return tier !== SubscriptionTier.FREE;

    default:
      // Exhaustiveness check: this will error if we add a new feature
      const _exhaustive: never = feature;
      return false;
  }
}

// Runtime usage tracking
export async function checkUsageLimit(userId: string, feature: 'posts' | 'coach_sessions'): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { tier, postsThisMonth, coachSessionsThisMonth },
  });

  if (!subscription) {
    return { allowed: false, remaining: 0 };
  }

  if (feature === 'posts' && subscription.tier === SubscriptionTier.FREE) {
    const remaining = 2 - subscription.postsThisMonth;
    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
    };
  }

  if (feature === 'coach_sessions' && subscription.tier === SubscriptionTier.STANDARD) {
    const remaining = 2 - subscription.coachSessionsThisMonth;
    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
    };
  }

  // Premium tier has no limits
  return { allowed: true, remaining: Infinity };
}
```

**Usage in API Routes:**
```typescript
// src/app/api/posts/create/route.ts
import { canAccessFeature, checkUsageLimit } from '@/lib/billing/feature-gates';

export async function POST(request: Request) {
  const user = await getCurrentUser();

  // Check feature gate
  const canCreateUnlimited = canAccessFeature(user.subscription.tier, 'unlimited_posts');

  if (!canCreateUnlimited) {
    // Check usage limit (free tier: 2/month)
    const usage = await checkUsageLimit(user.id, 'posts');

    if (!usage.allowed) {
      return Response.json({
        error: 'TIER_LIMIT_EXCEEDED',
        message: `Free tier limit: 2 posts/month. You have ${usage.remaining} remaining.`,
        upgrade_url: '/pricing',
      }, { status: 403 });
    }
  }

  // Create post...
  await db.post.create({ data: { ...postData, userId: user.id } });

  // Increment usage counter (free tier only)
  if (user.subscription.tier === SubscriptionTier.FREE) {
    await db.subscription.update({
      where: { userId: user.id },
      data: { postsThisMonth: { increment: 1 } },
    });
  }

  return Response.json({ success: true });
}
```

**Deliverables:**
- Feature gate function implemented (type-safe)
- Usage tracking functional (free tier limits enforced)
- All API routes protected with feature gates

**🔍 User Verification (Day 8, 11 AM):**
- Create free tier user → create 2 posts → attempt 3rd → expect TIER_LIMIT_EXCEEDED
- Create standard tier user → create 10 posts → all succeed (unlimited)
- Free tier user tries AI Coach → expect feature gate error

---

#### Objective 3.5: Admin Dashboard (Day 8 Afternoon)
**Goal:** Internal dashboard for user/revenue management

**Tasks:**
- [ ] Create admin route (`/admin/dashboard`)
- [ ] Add RBAC (role-based access control) - only admins can access
- [ ] Display user list (email, tier, status, usage)
- [ ] Display billing analytics (MRR, churn, conversion funnel)
- [ ] Add user search/filter

**Admin Dashboard UI:**
```typescript
// src/app/admin/dashboard/page.tsx
import { db } from '@/lib/db/prisma';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

export default async function AdminDashboard() {
  // Fetch all users with subscriptions
  const users = await db.user.findMany({
    include: {
      subscription: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate MRR (Monthly Recurring Revenue)
  const mrr = users.reduce((sum, user) => {
    if (user.subscription?.tier === SubscriptionTier.STANDARD) return sum + 12;
    if (user.subscription?.tier === SubscriptionTier.PREMIUM) return sum + 29;
    return sum;
  }, 0);

  // Calculate churn rate (canceled subscriptions / total active)
  const activeSubscriptions = users.filter(u => u.subscription?.status === 'ACTIVE').length;
  const canceledSubscriptions = users.filter(u => u.subscription?.status === 'CANCELED').length;
  const churnRate = (canceledSubscriptions / (activeSubscriptions + canceledSubscriptions)) * 100;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Monthly Recurring Revenue</h3>
          <p className="text-3xl font-bold">${mrr}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Total Users</h3>
          <p className="text-3xl font-bold">{users.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Churn Rate</h3>
          <p className="text-3xl font-bold">{churnRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Tier</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Posts This Month</th>
              <th className="text-left p-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b">
                <td className="p-4">{user.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    user.subscription?.tier === 'PREMIUM' ? 'bg-purple-100 text-purple-800' :
                    user.subscription?.tier === 'STANDARD' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.subscription?.tier || 'FREE'}
                  </span>
                </td>
                <td className="p-4">{user.subscription?.status || 'N/A'}</td>
                <td className="p-4">{user.subscription?.postsThisMonth || 0}</td>
                <td className="p-4">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Deliverables:**
- Admin dashboard accessible at `/admin/dashboard`
- User list with search/filter
- Billing analytics (MRR, churn, user count)

**🔍 User Verification (Day 8 End - PHASE 3 CHECKPOINT):**
- Access `/admin/dashboard` → view user list
- Verify MRR calculation (manual check)
- Search for user by email
- Test subscription upgrade/downgrade flow (Stripe test mode)
- **PHASE 3 APPROVAL REQUIRED before Phase 4**

---

## 🔗 Integration Contracts

### Inputs from Other Teams

**From Team 4 (Database):**
```typescript
// Prisma models
model User {
  id           String        @id @default(uuid())
  email        String        @unique
  subscription Subscription?
}

model Subscription {
  id                     String             @id @default(uuid())
  userId                 String             @unique
  tier                   SubscriptionTier   // FREE, STANDARD, PREMIUM
  status                 SubscriptionStatus // ACTIVE, TRIAL, CANCELED, PAST_DUE
  stripeCustomerId       String?            @unique
  stripeSubscriptionId   String?            @unique
  currentPeriodEnd       DateTime?
  postsThisMonth         Int                @default(0)
  coachSessionsThisMonth Int                @default(0)
  canceledAt             DateTime?
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt
}
```

**From Team 6 (Security):**
```typescript
// RBAC check
async function isAdmin(userId: string): Promise<boolean>;
```

---

### Outputs to Other Teams

**To All Teams:**
```typescript
// Feature gate function
function canAccessFeature(tier: SubscriptionTier, feature: Feature): boolean;

// Usage limit check
async function checkUsageLimit(userId: string, feature: 'posts' | 'coach_sessions'): Promise<{
  allowed: boolean;
  remaining: number;
}>;
```

**To Team 8 (Orchestration):**
```typescript
// Billing health check
interface BillingHealthCheck {
  stripeConnected: boolean;
  webhooksConfigured: boolean;
  activeSubscriptions: number;
  mrr: number;
}

async function getBillingHealth(): Promise<BillingHealthCheck>;
```

---

## ✅ Success Criteria

- [ ] Stripe integration functional (checkout, webhooks, subscriptions)
- [ ] 3 tiers implemented (Free, Standard $12, Premium $29)
- [ ] Feature gates enforced (compile-time type-safe)
- [ ] Usage tracking accurate (free tier limits work)
- [ ] Admin dashboard deployed (MRR, churn, user list)
- [ ] Webhook events handled (5+ event types)
- [ ] Test payment successful (Stripe test mode)
- [ ] Type coverage >95% in billing module

---

## 📁 Files to Create

- `src/lib/billing/stripe-client.ts` - Stripe SDK setup
- `src/lib/billing/feature-gates.ts` - Type-safe feature gates
- `src/app/api/billing/checkout/route.ts` - Checkout session endpoint
- `src/app/api/webhooks/stripe/route.ts` - Webhook handler
- `src/app/admin/dashboard/page.tsx` - Admin dashboard UI
- `src/components/billing/UpgradeButton.tsx` - Upgrade CTA component

---

**Team 10 enables sustainable monetization with type-safe subscription management.** 💰
