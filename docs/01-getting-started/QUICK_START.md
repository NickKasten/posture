# Quick Start Guide

Get Vibe Posts running locally in **15 minutes** with this streamlined setup guide.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase account** (free tier works - [sign up](https://supabase.com/))
- **OpenAI API key** ([get one](https://platform.openai.com/api-keys))
- **GitHub OAuth app** (for authentication)

---

## Step 1: Clone & Install (2 min)

```bash
# Clone the repository
git clone https://github.com/your-org/vibe-posts.git
cd vibe-posts

# Install dependencies
npm install

# This installs ~870 packages and takes about 40 seconds
```

---

## Step 2: Environment Setup (5 min)

### 2.1 Copy Environment Template

```bash
cp .env.example .env
```

### 2.2 Configure Required Variables

Open `.env` and fill in these **critical** variables:

#### **Supabase Configuration**

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project (or select existing)
3. Go to **Settings → API**
4. Copy your credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Encryption Key**

Generate a secure 32-character key:

```bash
# On macOS/Linux:
openssl rand -base64 32

# Or use this command to set it directly:
echo "ENCRYPTION_KEY=$(openssl rand -base64 32 | head -c 32)" >> .env
```

```bash
ENCRYPTION_KEY=your_32_character_key_here_exactly
SESSION_SECRET=$(openssl rand -base64 32 | head -c 32)
```

#### **OpenAI API Key**

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new secret key
3. Copy and paste:

```bash
OPENAI_API_KEY=sk-proj-...
```

#### **GitHub OAuth App**

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** Vibe Posts (Local)
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/github/callback`
4. Click **Register application**
5. Copy Client ID and generate Client Secret:

```bash
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXT_PUBLIC_GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github/callback
```

#### **App Configuration**

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 3: Database Setup (5 min)

### 3.1 Run Migrations

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### 3.2 Execute Migration Files

Run these SQL files **in order**:

**Migration 1: Core Schema**

```sql
-- Copy contents from: src/lib/db/migrations/003_social_accounts_and_posts.sql
-- Paste into SQL Editor and click "Run"
```

**Migration 2: LinkedIn Support**

```sql
-- Copy contents from: src/lib/db/migrations/004_add_linkedin_member_id.sql
-- Paste into SQL Editor and click "Run"
```

**Migration 3: Twitter Support**

```sql
-- Copy contents from: src/lib/db/migrations/005_add_twitter_user_id.sql
-- Paste into SQL Editor and click "Run"
```

### 3.3 Verify Setup

Run this verification query in SQL Editor:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('social_accounts', 'post_drafts', 'published_posts');

-- Expected output: 3 rows (social_accounts, post_drafts, published_posts)
```

---

## Step 4: Start Development Server (1 min)

```bash
npm run dev
```

You should see:

```
   ▲ Next.js 15.5.6
   - Local:        http://localhost:3000
   - Environments: .env

 ✓ Starting...
 ✓ Ready in 2.3s
```

**Open http://localhost:3000** in your browser.

---

## Step 5: Test the App (2 min)

### 5.1 Sign In with GitHub

1. Click **"Sign in with GitHub"**
2. Authorize the app
3. You should be redirected to the dashboard

### 5.2 Generate Your First Post

1. On the dashboard, enter a topic: `"Launched my first feature today - excited to see it in production!"`
2. Select platform: **LinkedIn**
3. Choose tone: **Casual**
4. Click **Generate Post**

**You should see:** An AI-generated LinkedIn post with hashtags!

---

## What's Working Now

✅ **GitHub Authentication** - Sign in/out working
✅ **AI Post Generation** - GPT-5-mini creating posts
✅ **Database Storage** - Drafts and posts saving
✅ **Type-Safe API** - All routes compile successfully

---

## What's NOT Working Yet (Expected)

❌ **LinkedIn Publishing** - Needs LinkedIn OAuth setup
❌ **Twitter Publishing** - Needs Twitter OAuth setup
❌ **Rate Limiting** - Needs Upstash Redis (optional for dev)

These require additional OAuth apps. See **Step 6 (Optional)** below.

---

## Step 6: Optional - Enable Publishing (10 min)

To actually publish to LinkedIn/Twitter, you need OAuth apps for each platform.

### 6.1 LinkedIn OAuth App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click **Create app**
3. Fill in app details:
   - **App name:** Vibe Posts
   - **LinkedIn Page:** (select or create one)
   - **Privacy policy URL:** `http://localhost:3000/privacy` (temp)
   - **App logo:** Upload any image
4. Click **Create app**
5. Go to **Auth** tab
6. Under **OAuth 2.0 settings:**
   - Add redirect URL: `http://localhost:3000/api/auth/linkedin/callback`
7. Go to **Products** tab
8. Request access to **Sign In with LinkedIn using OpenID Connect**
9. Request access to **Share on LinkedIn**
10. Copy credentials to `.env`:

```bash
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback
```

### 6.2 Twitter OAuth App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create new project (if needed)
3. Create new app
4. Go to app settings → **User authentication settings**
5. Click **Set up**
6. Configure OAuth 2.0:
   - **App permissions:** Read and write
   - **Type of App:** Web App
   - **Callback URL:** `http://localhost:3000/api/auth/twitter/callback`
   - **Website URL:** `http://localhost:3000`
7. Save and copy credentials:

```bash
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/twitter/callback
```

### 6.3 Upstash Redis (Optional - for rate limiting)

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create Redis database (free tier)
3. Copy REST URL and token:

```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### 6.4 Restart Server

```bash
# Stop the dev server (Ctrl+C)
npm run dev
```

Now you can connect LinkedIn/Twitter and publish posts!

---

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Fix:** Double-check your `.env` file has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

Restart the dev server after adding them.

### Issue: "Database error" or "relation does not exist"

**Fix:** You haven't run the migrations yet. Go back to **Step 3** and run all 3 migration files in Supabase SQL Editor.

### Issue: GitHub OAuth fails

**Fix:**
1. Check your callback URL in GitHub OAuth app settings: `http://localhost:3000/api/auth/github/callback`
2. Verify `NEXT_PUBLIC_GITHUB_REDIRECT_URI` in `.env` matches exactly

### Issue: AI generation fails

**Fix:**
1. Verify `OPENAI_API_KEY` is set correctly
2. Check you have credits in your OpenAI account
3. Check console logs for specific error messages

### Issue: TypeScript errors on build

**Fix:** This was resolved! If you see errors:
```bash
# Clean rebuild
rm -rf node_modules .next
npm install
npm run build
```

---

## Next Steps

Now that you're running locally:

1. **Read the docs:** Check out `/docs/02-product/PRD.md` for product vision
2. **Explore the code:** Start with `/src/app/dashboard/page.tsx`
3. **Test the API:** Try the API routes in `/src/app/api/`
4. **Enable publishing:** Complete **Step 6** to connect LinkedIn/Twitter
5. **Run tests:** `npm test` to run the 157+ test suite

---

## Common Development Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## Project Structure

```
vibe-posts/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes
│   │   ├── dashboard/    # Main UI
│   │   └── page.tsx      # Landing page
│   ├── components/       # React components
│   ├── lib/              # Core logic
│   │   ├── ai/           # OpenAI integration
│   │   ├── db/           # Database operations
│   │   ├── linkedin/     # LinkedIn API client
│   │   └── twitter/      # Twitter API client
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── docs/                 # Documentation
├── tests/                # Test files
└── .env                  # Your secrets (DO NOT COMMIT)
```

---

## Getting Help

- **Documentation:** `/docs/` folder
- **Database Schema:** `/docs/03-technical/DATABASE_SCHEMA.md`
- **Setup Guide:** `/docs/01-getting-started/SETUP_GUIDE.md` (detailed version)
- **Issues:** Check console logs and error messages

---

## Security Reminders

🔒 **Never commit `.env` to git** - It's already in `.gitignore`
🔒 **Use different credentials for production** - These are dev-only
🔒 **Rotate keys regularly** - Especially if exposed
🔒 **Keep dependencies updated** - Run `npm audit` occasionally

---

**You're all set!** 🎉

You now have Vibe Posts running locally with AI-powered post generation. Start building!

---

**Need more details?** See the comprehensive [SETUP_GUIDE.md](./SETUP_GUIDE.md) for advanced configuration.

**Last Updated:** November 6, 2025
