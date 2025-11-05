# Vibe Posts - Setup Guide

Complete guide to set up Vibe Posts for local development and testing.

---

## Prerequisites

- **Node.js 18+** and npm
- **Supabase account** (free tier works)
- **GitHub OAuth app** (for authentication)
- **LinkedIn Developer account** (for LinkedIn publishing)
- **Twitter Developer account** (for Twitter publishing)
- **OpenAI API key** (for AI post generation)
- **Upstash Redis account** (for rate limiting)

---

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/NickKasten/vibe-posts.git
cd vibe-posts

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

---

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose a name, database password, and region
4. Wait for project to initialize (~2 minutes)

### 2.2 Get API Credentials

1. Go to **Project Settings > API**
2. Copy these values to `.env.local`:
   - **URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: `SUPABASE_SERVICE_KEY` (⚠️ Keep secret!)

### 2.3 Run Database Migrations

1. Go to **SQL Editor** in Supabase dashboard
2. Create a new query
3. Run each migration file in order:

**Migration 003: Core Tables**
```sql
-- Copy contents from: src/lib/db/migrations/003_social_accounts_and_posts.sql
-- Paste and run in Supabase SQL Editor
```

**Migration 004: LinkedIn Member ID**
```sql
-- Copy contents from: src/lib/db/migrations/004_add_linkedin_member_id.sql
-- Paste and run
```

**Migration 005: Twitter User ID**
```sql
-- Copy contents from: src/lib/db/migrations/005_add_twitter_user_id.sql
-- Paste and run
```

### 2.4 Verify Tables Created

Run this query to verify:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

You should see:
- `social_accounts`
- `post_drafts`
- `published_posts`

---

## Step 3: Set Up GitHub OAuth

### 3.1 Create OAuth App

1. Go to https://github.com/settings/developers
2. Click **OAuth Apps > New OAuth App**
3. Fill in:
   - **Application name**: Vibe Posts (Local)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github`
4. Click **Register application**

### 3.2 Get Credentials

1. Copy **Client ID** → `NEXT_PUBLIC_GITHUB_CLIENT_ID` in `.env.local`
2. Click **Generate a new client secret**
3. Copy **Client Secret** → `GITHUB_CLIENT_SECRET` in `.env.local`

---

## Step 4: Set Up LinkedIn OAuth

### 4.1 Create LinkedIn App

1. Go to https://www.linkedin.com/developers/apps
2. Click **Create app**
3. Fill in:
   - **App name**: Vibe Posts
   - **LinkedIn Page**: (select or create one)
   - **App logo**: (upload any logo)
4. Click **Create app**

### 4.2 Add Products

1. Go to **Products** tab
2. Request access to:
   - ✅ **Sign In with LinkedIn** (instant approval)
   - ✅ **Share on LinkedIn** (instant approval)

### 4.3 Configure Auth Settings

1. Go to **Auth** tab
2. Add **Redirect URL**:
   - Development: `http://localhost:3000/api/auth/linkedin/callback`
   - Production: `https://your-domain.vercel.app/api/auth/linkedin/callback`

### 4.4 Get Credentials

1. Go to **Auth** tab
2. Copy **Client ID** → `LINKEDIN_CLIENT_ID` in `.env.local`
3. Copy **Client Secret** → `LINKEDIN_CLIENT_SECRET` in `.env.local`

### 4.5 Verify Scopes

Ensure these scopes are selected:
- `openid`
- `profile`
- `email`
- `w_member_social` (for posting)

**Note:** `w_member_social` is an OPEN permission - no Partner Program approval needed! 🎉

---

## Step 5: Set Up Twitter OAuth

### 5.1 Create Twitter App

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Click **+ Create Project** (if first time)
3. Fill in project details
4. Click **+ Add App** > **Set up** under OAuth 2.0

### 5.2 Configure OAuth 2.0

1. **App type**: Public client (with PKCE)
2. **App name**: Vibe Posts
3. **Callback URLs**:
   - Development: `http://localhost:3000/api/auth/twitter/callback`
   - Production: `https://your-domain.vercel.app/api/auth/twitter/callback`
4. **Website URL**: `https://your-github-repo-or-website.com`

### 5.3 Set Permissions

1. Go to **User authentication settings**
2. **Type of App**: Web App
3. **App permissions**: Read and Write
4. Enable **Request email from users**

### 5.4 Get Credentials

1. Go to **Keys and tokens** tab
2. Copy **Client ID** → `TWITTER_CLIENT_ID` in `.env.local`
3. Copy **Client Secret** → `TWITTER_CLIENT_SECRET` in `.env.local`

---

## Step 6: Set Up OpenAI API

### 6.1 Create API Key

1. Go to https://platform.openai.com/api-keys
2. Click **+ Create new secret key**
3. Name it "Vibe Posts - Development"
4. Copy the key → `OPENAI_API_KEY` in `.env.local`

### 6.2 Add Credits

1. Go to **Billing** > **Add payment method**
2. Add $5-10 for testing (GPT-5-mini is very cheap)

**Cost estimate**: ~$0.01-0.05 per post generated

---

## Step 7: Set Up Upstash Redis (Rate Limiting)

### 7.1 Create Redis Database

1. Go to https://upstash.com
2. Click **Create Database**
3. Choose:
   - **Name**: vibe-posts-dev
   - **Type**: Regional
   - **Region**: (closest to you)

### 7.2 Get Credentials

1. Go to **Details** tab
2. Scroll to **REST API**
3. Copy:
   - **UPSTASH_REDIS_REST_URL** → `.env.local`
   - **UPSTASH_REDIS_REST_TOKEN** → `.env.local`

---

## Step 8: Generate Encryption Keys

### 8.1 Generate Encryption Key

```bash
# Generate 32-byte base64 key for AES-256
openssl rand -base64 32
```

Copy output → `ENCRYPTION_KEY` in `.env.local`

### 8.2 Generate Session Secret

```bash
# Generate session secret
openssl rand -base64 32
```

Copy output → `SESSION_SECRET` in `.env.local`

---

## Step 9: Final Configuration

Your `.env.local` should now have all these variables filled in:

```bash
# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov...
GITHUB_CLIENT_SECRET=gho_...
NEXT_PUBLIC_GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=78...
LINKEDIN_CLIENT_SECRET=WPL_...
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback

# Twitter OAuth
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/twitter/callback

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Encryption
ENCRYPTION_KEY=... (32 chars base64)
SESSION_SECRET=... (32 chars base64)

# Environment
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=debug
```

---

## Step 10: Run the Application

```bash
# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

---

## Testing the Complete Flow

### 10.1 Sign In
1. Go to `http://localhost:3000`
2. Click "Sign in with GitHub"
3. Authorize the app
4. You should be redirected to `/dashboard`

### 10.2 Connect LinkedIn
1. On dashboard, click **"Connect"** under LinkedIn
2. Authorize LinkedIn
3. You should see ✅ "Connected" status

### 10.3 Connect Twitter
1. On dashboard, click **"Connect"** under Twitter
2. Authorize Twitter
3. You should see ✅ "Connected" status

### 10.4 Generate a Post
1. Enter context in the text area (e.g., "Just shipped a new feature")
2. Select tone (Technical, Casual, or Inspiring)
3. Select platform (LinkedIn or Twitter)
4. Click **"Generate Post"**
5. Wait ~2-5 seconds for AI generation

### 10.5 Publish a Post
1. Review the generated post
2. Edit if needed
3. Click **"Publish"**
4. Check your LinkedIn/Twitter to verify it posted

### 10.6 View History
1. Click **"History"** in navigation
2. You should see your published post
3. Click **"View Post"** to open on LinkedIn/Twitter

---

## Troubleshooting

### Database Errors
- **Error: relation "social_accounts" does not exist**
  - Solution: Run migration 003 in Supabase SQL Editor

### OAuth Errors
- **Error: redirect_uri_mismatch**
  - Solution: Verify redirect URLs match exactly in OAuth app settings

### Token Errors
- **Error: LinkedIn not connected**
  - Solution: Connect LinkedIn account on dashboard first

### Rate Limit Errors
- **Error: Rate limit exceeded**
  - Solution: Wait 1 hour or increase limits in `src/lib/rate-limit/config.ts`

### AI Generation Errors
- **Error: OpenAI API key invalid**
  - Solution: Verify `OPENAI_API_KEY` in `.env.local`

---

## Next Steps

- ✅ Explore the **Settings** page to configure preferences
- ✅ Check **Profile** page to view your stats
- ✅ Test multi-platform publishing
- ✅ Review **Analytics** (coming soon)
- ✅ Set up production deployment on Vercel

---

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup instructions.

---

## Support

- **Issues**: https://github.com/NickKasten/vibe-posts/issues
- **Docs**: https://github.com/NickKasten/vibe-posts/tree/main/docs
- **Email**: support@vibeposts.com (placeholder)

---

**Last Updated**: November 4, 2025
