# Team 4: Backend & Data

**Timeline:** Days 1-8 (ongoing)
**Dependencies:** None (foundation team)
**Provides To:** All teams (database, APIs)

## Primary Objectives

### Days 1-2: Database Foundation
- Design Prisma schema (10+ models: User, Post, Subscription, BrandProfile, etc.)
- Apply migrations to Supabase
- Configure Row-Level Security (RLS) policies
- Scaffold API routes (CRUD for all models)

### Days 3-8: Feature Development
- Post management endpoints (create, list, update, delete)
- Subscription tier logic (usage tracking)
- Analytics data pipeline (daily aggregation)
- Template library (save/apply templates)

## Type-Safe Implementation

```typescript
// Prisma models (key ones)
model User {
  id           String        @id @default(uuid())
  email        String        @unique
  githubId     String?       @unique
  subscription Subscription?
  brandProfile BrandProfile?
  posts        Post[]
}

model Post {
  id           String     @id @default(uuid())
  userId       String
  content      String     @db.Text
  platform     Platform
  status       PostStatus
  scheduledFor DateTime?
  publishedAt  DateTime?
  analytics    PostAnalytics?
}
```

## Success Criteria
- [ ] All Prisma migrations applied (zero errors)
- [ ] API response time p95 <200ms
- [ ] RLS policies enforced (users can only access own data)
- [ ] Type coverage >95% in database module

## User Verification
- **Day 1 End:** Review schema in Prisma Studio, test migrations
- **Day 8 End:** Run API integration tests, verify CRUD operations

---

**See full spec:** ORCHESTRATION_PLAN_V3.md Days 1-8.
