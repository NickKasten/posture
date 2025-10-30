# Analytics Architecture

**Version:** 3.0
**Owner:** Team 11 (Analytics & Insights)
**Timeline:** Days 6-8
**Success Metric:** 98%+ data accuracy, <200ms query time

---

## Table of Contents

1. [Overview](#overview)
2. [Data Collection](#data-collection)
3. [Metrics & KPIs](#metrics--kpis)
4. [Dashboard Design](#dashboard-design)
5. [AI-Powered Insights](#ai-powered-insights)
6. [Type-Safe Implementation](#type-safe-implementation)
7. [Performance Optimization](#performance-optimization)
8. [Privacy & GDPR](#privacy--gdpr)

---

## Overview

Vibe Posts analytics provides **actionable insights** to help users optimize their social media performance. The system collects data from LinkedIn and Twitter APIs, processes it with AI-powered sentiment analysis, and presents it through an intuitive dashboard.

**Key Features:**
- **Real-time analytics** (6-hour refresh cycle)
- **Engagement metrics** (views, likes, comments, shares, engagement rate)
- **Sentiment analysis** (GPT-4 powered, -1 to +1 scale)
- **Best posting times** (ML-based recommendations)
- **Competitor benchmarking** (Premium tier only)
- **AI recommendations** (GPT-4 actionable tips)
- **White-label reports** (PDF export for Premium users)

**Architecture Principles:**
- **Type-safe data models** (Prisma + Zod validation)
- **Incremental aggregation** (efficient cron jobs)
- **Cached queries** (Redis for dashboard speed)
- **GDPR-compliant** (user-exportable, deletable)

---

## Data Collection

### LinkedIn API Integration

**Endpoint:** `https://api.linkedin.com/v2/socialActions/{urn}/statistics`

**Rate Limits:**
- 500 requests/day per user
- 100 requests/minute (burst)

**Data Points:**
```typescript
interface LinkedInStatistics {
  impressionCount: number;       // Views
  likeCount: number;             // Likes
  commentCount: number;          // Comments
  shareCount: number;            // Reshares
  clickCount: number;            // Link clicks (if post has URL)
  engagement: {
    numLikes: number;
    numComments: number;
    numShares: number;
  };
}
```

**Collection Strategy:**
```typescript
// lib/analytics/collect.ts
import { db } from '@/lib/db';
import { decryptToken } from '@/lib/security/tokens';

export async function collectLinkedInAnalytics(postId: string): Promise<void> {
  const post = await db.post.findUnique({
    where: { id: postId },
    include: { user: true },
  });

  if (post.status !== 'PUBLISHED' || !post.publishedUrl) {
    return; // Skip non-published posts
  }

  const token = decryptToken(post.user.linkedinTokenEncrypted!);
  const urn = extractUrnFromUrl(post.publishedUrl);

  const response = await fetch(
    `https://api.linkedin.com/v2/socialActions/${urn}/statistics`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    console.error(`LinkedIn API error: ${response.status}`);
    return;
  }

  const stats = await response.json();

  const engagementRate = calculateEngagementRate(
    stats.impressionCount,
    stats.likeCount + stats.commentCount + stats.shareCount
  );

  // Upsert analytics
  await db.postAnalytics.upsert({
    where: { postId },
    create: {
      postId,
      platform: 'LINKEDIN',
      views: stats.impressionCount,
      likes: stats.likeCount,
      comments: stats.commentCount,
      shares: stats.shareCount,
      engagementRate,
    },
    update: {
      views: stats.impressionCount,
      likes: stats.likeCount,
      comments: stats.commentCount,
      shares: stats.shareCount,
      engagementRate,
    },
  });
}

function calculateEngagementRate(impressions: number, engagements: number): number {
  if (impressions === 0) return 0;
  return (engagements / impressions) * 100;
}

function extractUrnFromUrl(url: string): string {
  // LinkedIn URL format: https://www.linkedin.com/feed/update/urn:li:share:12345
  const match = url.match(/urn:li:[^\/]+$/);
  return match ? match[0] : '';
}
```

### Twitter API Integration

**Endpoint:** `https://api.twitter.com/2/tweets/{id}?tweet.fields=public_metrics`

**Rate Limits:**
- 300 requests/15 minutes per user (v2 API)

**Data Points:**
```typescript
interface TwitterPublicMetrics {
  impression_count: number;      // Views
  like_count: number;            // Likes
  reply_count: number;           // Replies
  retweet_count: number;         // Retweets
  quote_count: number;           // Quote tweets
}
```

**Collection Strategy:**
```typescript
export async function collectTwitterAnalytics(postId: string): Promise<void> {
  const post = await db.post.findUnique({
    where: { id: postId },
    include: { user: true },
  });

  if (post.status !== 'PUBLISHED' || !post.publishedUrl) {
    return;
  }

  const token = decryptToken(post.user.twitterTokenEncrypted!);
  const tweetId = extractTweetIdFromUrl(post.publishedUrl);

  const response = await fetch(
    `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    console.error(`Twitter API error: ${response.status}`);
    return;
  }

  const { data } = await response.json();
  const metrics = data.public_metrics;

  const engagementRate = calculateEngagementRate(
    metrics.impression_count,
    metrics.like_count + metrics.reply_count + metrics.retweet_count + metrics.quote_count
  );

  await db.postAnalytics.upsert({
    where: { postId },
    create: {
      postId,
      platform: 'TWITTER',
      views: metrics.impression_count,
      likes: metrics.like_count,
      comments: metrics.reply_count,
      shares: metrics.retweet_count + metrics.quote_count,
      engagementRate,
    },
    update: {
      views: metrics.impression_count,
      likes: metrics.like_count,
      comments: metrics.reply_count,
      shares: metrics.retweet_count + metrics.quote_count,
      engagementRate,
    },
  });
}

function extractTweetIdFromUrl(url: string): string {
  // Twitter URL format: https://twitter.com/username/status/1234567890
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : '';
}
```

### Cron Job Schedule

```typescript
// vercel.json (Vercel Cron)
{
  "crons": [
    {
      "path": "/api/cron/analytics",
      "schedule": "0 */6 * * *"
    }
  ]
}

// app/api/cron/analytics/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all published posts from last 30 days
  const posts = await db.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  // Collect analytics for each post
  for (const post of posts) {
    if (post.platform === 'LINKEDIN') {
      await collectLinkedInAnalytics(post.id);
    } else if (post.platform === 'TWITTER') {
      await collectTwitterAnalytics(post.id);
    }

    // Rate limit: 100ms delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return Response.json({ processed: posts.length });
}
```

---

## Metrics & KPIs

### Primary Metrics

**1. Total Views**
```typescript
export async function getTotalViews(userId: string): Promise<number> {
  const result = await db.postAnalytics.aggregate({
    where: { post: { userId } },
    _sum: { views: true },
  });

  return result._sum.views || 0;
}
```

**2. Average Engagement Rate**
```typescript
export async function getAvgEngagementRate(userId: string): Promise<number> {
  const result = await db.postAnalytics.aggregate({
    where: { post: { userId } },
    _avg: { engagementRate: true },
  });

  return result._avg.engagementRate || 0;
}
```

**3. Total Posts Published**
```typescript
export async function getTotalPosts(userId: string): Promise<number> {
  return db.post.count({
    where: { userId, status: 'PUBLISHED' },
  });
}
```

**4. Best Performing Post**
```typescript
export async function getBestPost(userId: string): Promise<Post | null> {
  return db.post.findFirst({
    where: { userId, status: 'PUBLISHED' },
    include: { analytics: true },
    orderBy: { analytics: { engagementRate: 'desc' } },
  });
}
```

### Secondary Metrics (Premium Tier)

**5. Sentiment Score**
```typescript
export async function analyzeSentiment(postId: string): Promise<number> {
  const post = await db.post.findUnique({
    where: { id: postId },
    include: { analytics: true },
  });

  if (!post.publishedUrl) return 0;

  // Fetch comments from platform
  const comments = await fetchComments(post.publishedUrl, post.platform);

  if (comments.length === 0) return 0;

  // Analyze sentiment with GPT-4
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a sentiment analysis expert. Analyze the overall sentiment of these comments on a scale from -1 (very negative) to +1 (very positive). Respond with only a number.',
      },
      {
        role: 'user',
        content: comments.map((c, i) => `${i + 1}. ${c}`).join('\n'),
      },
    ],
    temperature: 0,
  });

  const sentiment = parseFloat(response.choices[0].message.content || '0');

  // Update analytics
  await db.postAnalytics.update({
    where: { postId },
    data: { sentiment },
  });

  return sentiment;
}

async function fetchComments(url: string, platform: Platform): Promise<string[]> {
  // Implementation depends on platform API
  // LinkedIn: /v2/socialActions/{urn}/comments
  // Twitter: /2/tweets/{id}/replies
  // Return array of comment text
}
```

**6. Best Posting Times**
```typescript
export async function getBestPostingTimes(userId: string): Promise<{ hour: number; dayOfWeek: number; avgEngagement: number }[]> {
  const posts = await db.post.findMany({
    where: { userId, status: 'PUBLISHED' },
    include: { analytics: true },
  });

  // Group by hour and day of week
  const groups: Record<string, { totalEngagement: number; count: number }> = {};

  for (const post of posts) {
    if (!post.publishedAt || !post.analytics) continue;

    const hour = post.publishedAt.getHours();
    const dayOfWeek = post.publishedAt.getDay(); // 0 = Sunday, 6 = Saturday

    const key = `${dayOfWeek}_${hour}`;

    if (!groups[key]) {
      groups[key] = { totalEngagement: 0, count: 0 };
    }

    groups[key].totalEngagement += post.analytics.engagementRate;
    groups[key].count += 1;
  }

  // Calculate averages
  const results = Object.entries(groups).map(([key, data]) => {
    const [dayOfWeek, hour] = key.split('_').map(Number);
    return {
      hour,
      dayOfWeek,
      avgEngagement: data.totalEngagement / data.count,
    };
  });

  // Sort by avg engagement (descending)
  return results.sort((a, b) => b.avgEngagement - a.avgEngagement).slice(0, 5);
}
```

**7. Competitor Benchmarking** (Premium only)
```typescript
export async function getCompetitorBenchmark(userId: string): Promise<{
  yourAvgEngagement: number;
  industryAvgEngagement: number;
  percentile: number;
}> {
  const userEngagement = await getAvgEngagementRate(userId);

  // Calculate industry average (all users in same expertise area)
  const userProfile = await db.brandProfile.findUnique({ where: { userId } });

  const industryAvg = await db.postAnalytics.aggregate({
    where: {
      post: {
        user: {
          brandProfile: {
            expertise: { hasSome: userProfile?.expertise || [] },
          },
        },
      },
    },
    _avg: { engagementRate: true },
  });

  // Calculate percentile
  const allEngagementRates = await db.postAnalytics.groupBy({
    by: ['userId'],
    _avg: { engagementRate: true },
    where: {
      post: {
        user: {
          brandProfile: {
            expertise: { hasSome: userProfile?.expertise || [] },
          },
        },
      },
    },
  });

  const sorted = allEngagementRates
    .map(g => g._avg.engagementRate || 0)
    .sort((a, b) => a - b);

  const rank = sorted.findIndex(rate => rate >= userEngagement);
  const percentile = (rank / sorted.length) * 100;

  return {
    yourAvgEngagement: userEngagement,
    industryAvgEngagement: industryAvg._avg.engagementRate || 0,
    percentile,
  };
}
```

---

## Dashboard Design

### UI Components

**1. Overview Cards (Top Row)**
```tsx
// app/analytics/page.tsx
export default async function AnalyticsPage() {
  const user = await getCurrentUser();

  const totalViews = await getTotalViews(user.id);
  const avgEngagement = await getAvgEngagementRate(user.id);
  const totalPosts = await getTotalPosts(user.id);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Views"
          value={totalViews.toLocaleString()}
          icon={EyeIcon}
          trend="+12% vs last month"
        />
        <StatCard
          title="Avg Engagement Rate"
          value={`${avgEngagement.toFixed(1)}%`}
          icon={HeartIcon}
          trend="+3.2% vs last month"
        />
        <StatCard
          title="Posts Published"
          value={totalPosts}
          icon={DocumentIcon}
          trend="+5 vs last month"
        />
      </div>

      {/* Charts */}
      <EngagementChart userId={user.id} />
      <BestPostingTimes userId={user.id} />
      <AIRecommendations userId={user.id} />
    </div>
  );
}
```

**2. Engagement Over Time Chart**
```tsx
'use client';

import { Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';

export function EngagementChart({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/analytics/engagement-over-time?userId=${userId}`)
      .then(res => res.json())
      .then(setData);
  }, [userId]);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold mb-4">Engagement Over Time</h2>
      <Line
        data={{
          labels: data.labels, // ['Jan 1', 'Jan 2', ...]
          datasets: [
            {
              label: 'Engagement Rate',
              data: data.values, // [2.5, 3.2, 4.1, ...]
              borderColor: '#0a66c2',
              backgroundColor: 'rgba(10, 102, 194, 0.1)',
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false },
          },
        }}
      />
    </div>
  );
}
```

**3. Best Posting Times Heatmap**
```tsx
export function BestPostingTimes({ userId }: { userId: string }) {
  const [times, setTimes] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/analytics/best-times?userId=${userId}`)
      .then(res => res.json())
      .then(setTimes);
  }, [userId]);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Create heatmap matrix
  const matrix: number[][] = days.map(() => hours.map(() => 0));

  times.forEach(({ dayOfWeek, hour, avgEngagement }) => {
    matrix[dayOfWeek][hour] = avgEngagement;
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold mb-4">Best Posting Times</h2>
      <div className="grid grid-cols-8 gap-1">
        <div></div>
        {days.map(day => (
          <div key={day} className="text-center text-xs">{day}</div>
        ))}
        {hours.map(hour => (
          <>
            <div key={hour} className="text-xs text-right pr-2">{hour}:00</div>
            {days.map((_, dayIndex) => {
              const engagement = matrix[dayIndex][hour];
              const color = engagement > 5 ? 'bg-green-500' : engagement > 2 ? 'bg-yellow-500' : 'bg-gray-200';
              return <div key={dayIndex} className={`h-4 ${color}`} title={`${engagement.toFixed(1)}%`}></div>;
            })}
          </>
        ))}
      </div>
    </div>
  );
}
```

**4. AI Recommendations**
```tsx
export function AIRecommendations({ userId }: { userId: string }) {
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/analytics/recommendations?userId=${userId}`)
      .then(res => res.json())
      .then(data => setRecommendations(data.recommendations));
  }, [userId]);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">AI Recommendations</h2>
      <ul className="space-y-3">
        {recommendations.map((rec, i) => (
          <li key={i} className="flex items-start">
            <span className="text-primary mr-2">💡</span>
            <p>{rec}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## AI-Powered Insights

### Recommendation Engine

```typescript
// lib/analytics/recommendations.ts
import OpenAI from 'openai';

const openai = new OpenAI();

export async function generateRecommendations(userId: string): Promise<string[]> {
  // Fetch user's analytics
  const posts = await db.post.findMany({
    where: { userId, status: 'PUBLISHED' },
    include: { analytics: true },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  const avgEngagement = await getAvgEngagementRate(userId);
  const bestTimes = await getBestPostingTimes(userId);
  const bestPost = await getBestPost(userId);

  // Construct prompt for GPT-4
  const prompt = `Analyze this social media performance data and provide 3-5 actionable recommendations:

Average engagement rate: ${avgEngagement.toFixed(1)}%
Total posts: ${posts.length}
Best posting time: ${formatBestTime(bestTimes[0])}
Best performing post: "${bestPost?.content.slice(0, 100)}..." (${bestPost?.analytics?.engagementRate.toFixed(1)}% engagement)

Recent posts (last 20):
${posts.map((p, i) => `${i + 1}. Engagement: ${p.analytics?.engagementRate.toFixed(1)}% - "${p.content.slice(0, 50)}..."`).join('\n')}

Provide specific, actionable recommendations to improve engagement. Format as a numbered list.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a social media growth expert specializing in LinkedIn and Twitter. Provide concise, actionable advice.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content!;

  // Parse numbered list
  const recommendations = content
    .split('\n')
    .filter(line => /^\d+\./.test(line))
    .map(line => line.replace(/^\d+\.\s*/, ''));

  return recommendations;
}

function formatBestTime({ hour, dayOfWeek }: { hour: number; dayOfWeek: number }): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${days[dayOfWeek]} at ${hour}:00`;
}
```

### Content Analysis

```typescript
export async function analyzeContent(postId: string): Promise<{
  readabilityScore: number;
  hashtagCount: number;
  mentionCount: number;
  linkCount: number;
  sentiment: number;
}> {
  const post = await db.post.findUnique({ where: { id: postId } });

  const hashtagCount = (post!.content.match(/#\w+/g) || []).length;
  const mentionCount = (post!.content.match(/@\w+/g) || []).length;
  const linkCount = (post!.content.match(/https?:\/\/[^\s]+/g) || []).length;

  // Calculate readability (Flesch Reading Ease)
  const readabilityScore = calculateReadability(post!.content);

  // Get sentiment from analytics
  const analytics = await db.postAnalytics.findUnique({
    where: { postId },
  });

  return {
    readabilityScore,
    hashtagCount,
    mentionCount,
    linkCount,
    sentiment: analytics?.sentiment || 0,
  };
}

function calculateReadability(text: string): number {
  // Simplified Flesch Reading Ease formula
  const sentences = text.split(/[.!?]+/).length;
  const words = text.split(/\s+/).length;
  const syllables = text.split(/\s+/).reduce((sum, word) => sum + countSyllables(word), 0);

  const avgWordsPerSentence = words / sentences;
  const avgSyllablesPerWord = syllables / words;

  return 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
}

function countSyllables(word: string): number {
  // Simple syllable counter (heuristic)
  return (word.match(/[aeiou]{1,2}/gi) || []).length;
}
```

---

## Type-Safe Implementation

### Prisma Schema

```typescript
model PostAnalytics {
  id             String   @id @default(uuid())
  postId         String   @unique
  platform       Platform
  views          Int      @default(0)
  likes          Int      @default(0)
  comments       Int      @default(0)
  shares         Int      @default(0)
  engagementRate Float    @default(0) // (likes + comments + shares) / views * 100
  sentiment      Float?   // -1 to +1 (GPT-4 powered)
  updatedAt      DateTime @updatedAt
  post           Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId])
}
```

### Zod Validation

```typescript
import { z } from 'zod';

export const AnalyticsQuerySchema = z.object({
  userId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  platform: z.enum(['linkedin', 'twitter']).optional(),
});

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
```

### API Route

```typescript
// app/api/analytics/engagement-over-time/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = AnalyticsQuerySchema.parse({
    userId: searchParams.get('userId'),
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
    platform: searchParams.get('platform'),
  });

  const posts = await db.post.findMany({
    where: {
      userId: query.userId,
      status: 'PUBLISHED',
      publishedAt: {
        gte: query.startDate ? new Date(query.startDate) : undefined,
        lte: query.endDate ? new Date(query.endDate) : undefined,
      },
      platform: query.platform?.toUpperCase() as Platform,
    },
    include: { analytics: true },
    orderBy: { publishedAt: 'asc' },
  });

  const data = posts.map(post => ({
    date: post.publishedAt!.toISOString().split('T')[0],
    engagement: post.analytics?.engagementRate || 0,
  }));

  return Response.json({ data });
}
```

---

## Performance Optimization

### Redis Caching

```typescript
// lib/cache/redis.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function getCachedAnalytics<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600 // 1 hour
): Promise<T> {
  const cached = await redis.get<T>(key);

  if (cached) {
    return cached;
  }

  const fresh = await fetcher();
  await redis.set(key, fresh, { ex: ttl });

  return fresh;
}

// Usage
export async function getTotalViews(userId: string): Promise<number> {
  return getCachedAnalytics(
    `analytics:totalViews:${userId}`,
    async () => {
      const result = await db.postAnalytics.aggregate({
        where: { post: { userId } },
        _sum: { views: true },
      });
      return result._sum.views || 0;
    },
    3600 // Cache for 1 hour
  );
}
```

### Database Indexing

```prisma
model PostAnalytics {
  // ... fields

  @@index([postId])
  @@index([platform])
  @@index([updatedAt])
}

model Post {
  // ... fields

  @@index([userId, status])
  @@index([publishedAt])
}
```

### Query Optimization

```typescript
// BAD: N+1 query problem
const posts = await db.post.findMany({ where: { userId } });
for (const post of posts) {
  const analytics = await db.postAnalytics.findUnique({ where: { postId: post.id } });
}

// GOOD: Single query with join
const posts = await db.post.findMany({
  where: { userId },
  include: { analytics: true },
});
```

---

## Privacy & GDPR

### Data Retention

**Policy:** Analytics data retained for 90 days, then aggregated and anonymized.

```typescript
// app/api/cron/cleanup/route.ts
export async function GET(request: Request) {
  // Delete analytics older than 90 days
  await db.postAnalytics.deleteMany({
    where: {
      updatedAt: {
        lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
    },
  });

  return Response.json({ success: true });
}
```

### User Export

```typescript
// lib/compliance/export.ts
export async function exportAnalytics(userId: string): Promise<any> {
  const posts = await db.post.findMany({
    where: { userId },
    include: { analytics: true },
  });

  return posts.map(post => ({
    id: post.id,
    content: post.content,
    platform: post.platform,
    publishedAt: post.publishedAt,
    analytics: {
      views: post.analytics?.views || 0,
      likes: post.analytics?.likes || 0,
      comments: post.analytics?.comments || 0,
      shares: post.analytics?.shares || 0,
      engagementRate: post.analytics?.engagementRate || 0,
      sentiment: post.analytics?.sentiment || null,
    },
  }));
}
```

### User Deletion

```typescript
// Cascade delete configured in Prisma schema
model PostAnalytics {
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
}

// When user deletes account, all analytics automatically deleted
```

---

## Conclusion

### Success Metrics

- **Data accuracy:** 98%+ (spot check 100 posts)
- **Query performance:** p95 <200ms (Redis caching)
- **Sentiment accuracy:** 85%+ (human validation)
- **Recommendation quality:** 80%+ user satisfaction (survey)

### Timeline

- **Day 6:** Implement LinkedIn/Twitter collection (Team 11)
- **Day 7:** Build analytics dashboard UI (Team 11)
- **Day 8:** Add AI recommendations (Team 11 + Team 2)

### Dependencies

- Team 3 (Social Integration): Published post URLs
- Team 2 (AI Engine): GPT-4 for sentiment + recommendations
- Team 4 (Backend & Data): Prisma schema, cron jobs

**Owner:** Team 11 (Analytics & Insights)
**Success Criteria:** Dashboard live, 98%+ data accuracy, AI recommendations functional

---

**Last Updated:** Day 0 (Pre-execution)
**Next Review:** Day 8 (Major Checkpoint)
