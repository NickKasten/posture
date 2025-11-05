# Database Migrations

This directory contains SQL migrations for the Vibe Posts database.

## Applying Migrations

### Option 1: Supabase Dashboard (Recommended for MVP)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of the migration file you want to apply
5. Run the query
6. Verify tables were created in the **Table Editor**

### Option 2: Supabase CLI (Recommended for Production)

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push

# Or apply specific migration
psql $DATABASE_URL < src/lib/db/migrations/003_social_accounts_and_posts.sql
```

### Option 3: Direct PostgreSQL Connection

```bash
# Get your database connection string from Supabase Dashboard
# Project Settings > Database > Connection String (Direct connection)

# Apply migration
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres" \
  -f src/lib/db/migrations/003_social_accounts_and_posts.sql
```

## Migration History

| Migration | Description | Date | Status |
|-----------|-------------|------|--------|
| 001_initial_schema.sql | Initial user and token tables | 2025-11-01 | ✅ Applied |
| 002_github_activity.sql | GitHub activity tracking | 2025-11-02 | ✅ Applied |
| **003_social_accounts_and_posts.sql** | **Social media accounts and post management** | **2025-11-03** | ⏳ **Pending** |

## Migration 003: Social Accounts and Posts

### Tables Created
- `social_accounts` - OAuth tokens for LinkedIn/Twitter
- `post_drafts` - Draft posts with platform targeting
- `published_posts` - Published posts with engagement metrics

### Features
- ✅ Row-Level Security (RLS) enabled
- ✅ Automatic timestamp updates
- ✅ Indexed for performance
- ✅ Foreign key constraints
- ✅ Platform-specific constraints

### Verification

After applying migration 003, verify:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('social_accounts', 'post_drafts', 'published_posts');

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('social_accounts', 'post_drafts', 'published_posts');

-- Check indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('social_accounts', 'post_drafts', 'published_posts');
```

Expected output:
- 3 tables exist
- All 3 tables have `rowsecurity = true`
- 12+ indexes created

## Rollback

To rollback migration 003:

```sql
-- Drop tables (cascades to dependent objects)
DROP TABLE IF EXISTS public.published_posts CASCADE;
DROP TABLE IF EXISTS public.post_drafts CASCADE;
DROP TABLE IF EXISTS public.social_accounts CASCADE;

-- Drop trigger function if exists
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;
```

## Notes

- All migrations use `IF NOT EXISTS` for idempotency
- Migrations are safe to run multiple times
- Always backup database before applying migrations in production
- Row-Level Security isolates user data automatically
