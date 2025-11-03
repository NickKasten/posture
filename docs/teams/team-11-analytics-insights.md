# Team 11: Analytics & Insights

**Team Lead:** Analytics Specialist Agent
**Timeline:** Days 9-11 (implementation)
**Dependencies:** Team 4 (data pipeline), Team 3 (platform metrics)
**Provides To:** All Premium tier users (analytics dashboard)

---

## 🎯 Role & Expertise

Build the analytics dashboard that provides performance insights, sentiment analysis, AI recommendations, and trend detection for Premium tier users.

### Required Expertise
- Data visualization (D3.js, Recharts, Chart.js)
- TypeScript aggregation queries (Prisma)
- Sentiment analysis (OpenAI API or third-party)
- Statistical analysis (engagement rate, trend detection)
- React dashboard UI (responsive, real-time updates)

---

## 📋 Primary Objectives

### Phase 4: Advanced Features (Days 9-11)

#### Objective 4.1: Data Pipeline Setup (Day 9)
**Goal:** Collect and store analytics data from LinkedIn + X/Twitter

**Tasks:**
- [ ] Extend Prisma schema with `PostAnalytics` model
- [ ] Fetch post metrics from LinkedIn API (views, likes, comments, shares)
- [ ] Fetch post metrics from X/Twitter API (impressions, engagements)
- [ ] Store metrics in database (daily aggregation)
- [ ] Calculate engagement rate: (likes + comments + shares) / views

**Type-Safe Analytics Schema:**
```typescript
// Prisma schema addition
model PostAnalytics {
  id             String   @id @default(uuid())
  postId         String   @unique
  platform       Platform // LINKEDIN, TWITTER
  views          Int      @default(0)
  likes          Int      @default(0)
  comments       Int      @default(0)
  shares         Int      @default(0)
  impressions    Int      @default(0) // Twitter-specific
  engagementRate Float    @default(0) // Calculated: (likes + comments + shares) / views
  sentiment      Float?   // -1 to +1 (negative to positive)
  updatedAt      DateTime @updatedAt
  post           Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
}

// Aggregated analytics (daily rollup)
model DailyAnalytics {
  id             String   @id @default(uuid())
  userId         String
  date           DateTime // Date of metrics
  postsPublished Int      @default(0)
  totalViews     Int      @default(0)
  totalLikes     Int      @default(0)
  totalComments  Int      @default(0)
  avgEngagementRate Float @default(0)
  user           User     @relation(fields: [userId], references: [id])

  @@unique([userId, date])
}
```

**Data Fetching:**
```typescript
// src/lib/analytics/fetch-metrics.ts
import { db } from '@/lib/db/prisma';
import { linkedInClient, twitterClient } from '@/lib/social';

export async function fetchPostMetrics(postId: string): Promise<void> {
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, platform: true, platformPostId: true },
  });

  if (!post || !post.platformPostId) return;

  let metrics;

  if (post.platform === 'LINKEDIN') {
    // Fetch LinkedIn metrics
    metrics = await linkedInClient.getPostMetrics(post.platformPostId);
  } else if (post.platform === 'TWITTER') {
    // Fetch Twitter metrics
    metrics = await twitterClient.getTweetMetrics(post.platformPostId);
  }

  if (!metrics) return;

  // Calculate engagement rate
  const engagementRate = metrics.views > 0
    ? (metrics.likes + metrics.comments + metrics.shares) / metrics.views
    : 0;

  // Upsert analytics
  await db.postAnalytics.upsert({
    where: { postId: post.id },
    create: {
      postId: post.id,
      platform: post.platform,
      ...metrics,
      engagementRate,
    },
    update: {
      ...metrics,
      engagementRate,
    },
  });
}
```

**Deliverables:**
- `PostAnalytics` model added to Prisma schema
- Metrics fetching functional (LinkedIn + Twitter)
- Engagement rate calculated correctly

**🔍 User Verification (Day 9, 6 PM):**
- Publish test post to LinkedIn
- Wait 1 hour → fetch metrics
- View in Prisma Studio → verify views, likes, engagement rate

---

#### Objective 4.2: Sentiment Analysis (Day 10 Morning)
**Goal:** Analyze comment sentiment (positive/negative/neutral)

**Tasks:**
- [ ] Integrate OpenAI Moderation API (or sentiment API)
- [ ] Fetch post comments from LinkedIn/Twitter
- [ ] Analyze sentiment for each comment (-1 to +1 scale)
- [ ] Store aggregate sentiment in `PostAnalytics`

**Sentiment Implementation:**
```typescript
// src/lib/analytics/sentiment.ts
import { openai } from '@/lib/ai/openai-client';

export async function analyzeSentiment(comments: string[]): Promise<number> {
  if (comments.length === 0) return 0;

  // Use OpenAI to analyze sentiment
  const prompt = `Analyze the sentiment of these comments on a scale from -1 (very negative) to +1 (very positive). Return only a number.

Comments:
${comments.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Sentiment score:`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0, // Deterministic
  });

  const score = parseFloat(response.choices[0].message.content || '0');
  return Math.max(-1, Math.min(1, score)); // Clamp to [-1, 1]
}

export async function updatePostSentiment(postId: string): Promise<void> {
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { platformPostId: true, platform: true },
  });

  if (!post) return;

  // Fetch comments from platform
  const comments = await fetchComments(post.platform, post.platformPostId);

  // Analyze sentiment
  const sentiment = await analyzeSentiment(comments.map(c => c.text));

  // Update analytics
  await db.postAnalytics.update({
    where: { postId },
    data: { sentiment },
  });
}
```

**Deliverables:**
- Sentiment analysis functional (OpenAI integration)
- Comments fetched from LinkedIn/Twitter
- Sentiment score stored in database (-1 to +1)

**🔍 User Verification (Day 10, 11 AM):**
- Post with positive comments → verify sentiment > 0.5
- Post with negative comments → verify sentiment < -0.5

---

#### Objective 4.3: Analytics Dashboard UI (Day 10 Afternoon)
**Goal:** Build Premium-only analytics dashboard

**Tasks:**
- [ ] Create dashboard route (`/dashboard/analytics`)
- [ ] Add feature gate (Premium tier only)
- [ ] Display key metrics (total views, engagement rate, sentiment)
- [ ] Chart: Engagement rate over time (line chart)
- [ ] Chart: Top performing posts (bar chart)
- [ ] Chart: Tone evolution (area chart)

**Dashboard Implementation:**
```typescript
// src/app/dashboard/analytics/page.tsx
import { db } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canAccessFeature } from '@/lib/billing/feature-gates';
import { LineChart, BarChart, AreaChart } from '@/components/charts';

export default async function AnalyticsDashboard() {
  const user = await getCurrentUser();

  // Feature gate: Premium only
  if (!canAccessFeature(user.subscription.tier, 'analytics')) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
        <p className="text-gray-600">Upgrade to Premium to access analytics.</p>
        <a href="/pricing" className="text-blue-600 underline">View Pricing</a>
      </div>
    );
  }

  // Fetch analytics data
  const posts = await db.post.findMany({
    where: { userId: user.id, status: 'PUBLISHED' },
    include: { analytics: true },
    orderBy: { publishedAt: 'desc' },
  });

  // Calculate aggregate metrics
  const totalViews = posts.reduce((sum, p) => sum + (p.analytics?.views || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.analytics?.likes || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.analytics?.comments || 0), 0);
  const avgEngagementRate = posts.reduce((sum, p) => sum + (p.analytics?.engagementRate || 0), 0) / posts.length;
  const avgSentiment = posts.reduce((sum, p) => sum + (p.analytics?.sentiment || 0), 0) / posts.length;

  // Top performing posts
  const topPosts = posts
    .sort((a, b) => (b.analytics?.engagementRate || 0) - (a.analytics?.engagementRate || 0))
    .slice(0, 5);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Total Views</h3>
          <p className="text-3xl font-bold">{totalViews.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Total Engagement</h3>
          <p className="text-3xl font-bold">{(totalLikes + totalComments).toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Avg Engagement Rate</h3>
          <p className="text-3xl font-bold">{(avgEngagementRate * 100).toFixed(1)}%</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Avg Sentiment</h3>
          <p className="text-3xl font-bold">{avgSentiment > 0 ? '😊' : '😐'} {avgSentiment.toFixed(2)}</p>
        </div>
      </div>

      {/* Engagement Over Time */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Engagement Rate Over Time</h3>
        <LineChart
          data={posts.map(p => ({
            date: p.publishedAt,
            engagement: p.analytics?.engagementRate || 0,
          }))}
        />
      </div>

      {/* Top Performing Posts */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Top Performing Posts</h3>
        <BarChart
          data={topPosts.map(p => ({
            title: p.content.slice(0, 50) + '...',
            engagement: p.analytics?.engagementRate || 0,
          }))}
        />
      </div>
    </div>
  );
}
```

**Deliverables:**
- Analytics dashboard live at `/dashboard/analytics`
- 4 key metrics displayed (views, engagement, rate, sentiment)
- 2 charts rendered (engagement over time, top posts)
- Feature gate enforced (Premium only)

**🔍 User Verification (Day 10 End):**
- Access dashboard as Premium user → see analytics
- Access dashboard as Free user → see upgrade prompt
- Verify metrics accuracy (manual calculation check)

---

#### Objective 4.4: AI Recommendations (Day 11)
**Goal:** Provide actionable insights to improve engagement

**Tasks:**
- [ ] Analyze user's posting patterns (best days/times)
- [ ] Identify top-performing topics (from hashtags)
- [ ] Generate recommendations (GPT-4)
- [ ] Display recommendations in dashboard

**Recommendation Engine:**
```typescript
// src/lib/analytics/recommendations.ts
import { db } from '@/lib/db/prisma';
import { openai } from '@/lib/ai/openai-client';

export async function generateRecommendations(userId: string): Promise<string[]> {
  // Fetch user's posts with analytics
  const posts = await db.post.findMany({
    where: { userId, status: 'PUBLISHED' },
    include: { analytics: true },
    orderBy: { publishedAt: 'desc' },
    take: 20, // Last 20 posts
  });

  // Analyze patterns
  const topPosts = posts.sort((a, b) => (b.analytics?.engagementRate || 0) - (a.analytics?.engagementRate || 0)).slice(0, 5);
  const worstPosts = posts.sort((a, b) => (a.analytics?.engagementRate || 0) - (b.analytics?.engagementRate || 0)).slice(0, 5);

  // Best posting times (hour of day)
  const hourCounts = new Map<number, { count: number; totalEngagement: number }>();
  posts.forEach(p => {
    const hour = new Date(p.publishedAt).getHours();
    const engagement = p.analytics?.engagementRate || 0;

    if (!hourCounts.has(hour)) {
      hourCounts.set(hour, { count: 0, totalEngagement: 0 });
    }

    const stats = hourCounts.get(hour)!;
    stats.count++;
    stats.totalEngagement += engagement;
  });

  const bestHour = Array.from(hourCounts.entries())
    .sort(([, a], [, b]) => b.totalEngagement / b.count - a.totalEngagement / a.count)[0]?.[0];

  // Generate AI recommendations
  const prompt = `Based on this user's LinkedIn posting data, provide 3-5 actionable recommendations to improve engagement:

Top performing posts (high engagement):
${topPosts.map(p => `- "${p.content.slice(0, 100)}..." (Engagement: ${(p.analytics?.engagementRate || 0) * 100}%)`).join('\n')}

Worst performing posts (low engagement):
${worstPosts.map(p => `- "${p.content.slice(0, 100)}..." (Engagement: ${(p.analytics?.engagementRate || 0) * 100}%)`).join('\n')}

Best posting time: ${bestHour}:00

Provide specific, data-driven recommendations:`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  const recommendations = response.choices[0].message.content
    ?.split('\n')
    .filter(line => line.trim().match(/^\d+\./)) || [];

  return recommendations;
}
```

**Deliverables:**
- Recommendation engine functional (AI-powered)
- 3-5 recommendations generated per user
- Recommendations displayed in dashboard

**🔍 User Verification (Day 11 End - PHASE 4 CHECKPOINT):**
- View recommendations in analytics dashboard
- Validate recommendations make sense (data-driven)
- Test with different posting patterns
- **PHASE 4 APPROVAL REQUIRED before Phase 5**

---

## 🔗 Integration Contracts

**From Team 3 (Social Integration):**
```typescript
// Platform API clients
async function fetchLinkedInMetrics(postId: string): Promise<Metrics>;
async function fetchTwitterMetrics(tweetId: string): Promise<Metrics>;
async function fetchComments(platform: Platform, postId: string): Promise<Comment[]>;
```

**To All Teams:**
```typescript
// Analytics data
interface PostAnalytics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number; // 0-1
  sentiment: number; // -1 to +1
}

async function getPostAnalytics(postId: string): Promise<PostAnalytics | null>;
```

---

## ✅ Success Criteria

- [ ] Analytics dashboard deployed (Premium tier only)
- [ ] Post metrics fetching functional (LinkedIn + Twitter)
- [ ] Sentiment analysis working (comments → score)
- [ ] 4 key metrics displayed (views, engagement, rate, sentiment)
- [ ] 2+ charts rendered (engagement over time, top posts)
- [ ] AI recommendations generated (3-5 per user, data-driven)
- [ ] Feature gate enforced (Free/Standard users see upgrade prompt)

---

**Team 11 turns data into actionable insights for Premium users.** 📊
