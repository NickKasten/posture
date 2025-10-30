# Development Guide - Vibe Posts

**Last Updated:** 2025-10-30

This guide will help you set up your local development environment and contribute to Vibe Posts.

---

## Prerequisites

- **Node.js:** 18.x or higher
- **npm:** 9.x or higher
- **Git:** Latest version
- **GitHub Account:** For OAuth testing
- **Supabase Account:** Free tier available at [supabase.com](https://supabase.com)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/vibe-posts.git
cd vibe-posts
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create `.env.local` in the project root:

```env
# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXT_PUBLIC_GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# Encryption (generate a random 32-character string)
ENCRYPTION_KEY=your_32_character_encryption_key

# Optional: AI Integration (Phase 1)
# OPENAI_API_KEY=sk-your_openai_api_key
```

**Generate Encryption Key:**
```bash
# macOS/Linux
openssl rand -base64 32 | head -c 32

# Or use any 32-character string
echo "abcdefghijklmnopqrstuvwxyz123456"
```

### 4. Set Up Supabase Database

**Option A: Using Supabase Dashboard**
1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to SQL Editor
3. Copy contents of `supabase/schema.sql`
4. Execute the SQL

**Option B: Using Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Push schema
supabase db push
```

### 5. Configure GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name:** Vibe Posts (Local Dev)
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/github`
4. Click "Register application"
5. Copy **Client ID** → `NEXT_PUBLIC_GITHUB_CLIENT_ID`
6. Generate **Client Secret** → `GITHUB_CLIENT_SECRET`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Development Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript compiler check

# Testing
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Utility
npm run clean            # Remove .next and node_modules
```

---

## Project Structure

```
vibe-posts/
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── api/               # Backend API endpoints
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   └── ui/               # Reusable UI components
│   ├── lib/                   # Core utilities & clients
│   │   └── storage/          # Database & encryption
│   ├── utils/                 # Helper functions
│   ├── types/                 # TypeScript type definitions
│   └── constants/             # Application constants
├── supabase/
│   └── schema.sql             # Database schema
├── docs/                      # Documentation
├── .env.local                 # Environment variables (create this)
├── .env.example               # Environment template
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── jest.config.js             # Jest test configuration
└── package.json               # Dependencies & scripts
```

---

## Development Workflow

### Creating a New Feature

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Write tests first** (TDD approach recommended)
   ```bash
   # Create test file
   touch src/components/NewFeature.test.tsx

   # Run in watch mode
   npm run test:watch
   ```

3. **Implement the feature**
   - Follow TypeScript strict mode (no `any` types)
   - Use existing UI components from `src/components/ui/`
   - Add proper error handling

4. **Test your changes**
   ```bash
   npm run test              # Unit tests
   npm run lint              # Linting
   npm run type-check        # TypeScript
   npm run build             # Production build
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions or changes
- `refactor:` Code refactoring
- `style:` Code style changes (formatting)
- `chore:` Build process or tooling changes

**Examples:**
```bash
git commit -m "feat: add LinkedIn OAuth integration"
git commit -m "fix: resolve token encryption edge case"
git commit -m "docs: update API documentation"
git commit -m "test: add coverage for sanitize utils"
```

---

## Testing Guide

### Running Tests

```bash
# All tests
npm run test

# Specific test file
npm run test sanitize.test.ts

# Watch mode (re-runs on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Writing Tests

**Component Test Example:**
```typescript
// src/components/ui/button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**API Route Test Example:**
```typescript
// src/app/api/example/route.test.ts
import { GET } from './route';
import { NextRequest } from 'next/server';

describe('GET /api/example', () => {
  it('returns 200 with valid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/example');
    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
  });
});
```

**Utility Test Example:**
```typescript
// src/utils/validation.test.ts
import { isValidGitHubToken } from './validation';

describe('isValidGitHubToken', () => {
  it('accepts valid GitHub token', () => {
    expect(isValidGitHubToken('ghp_1234567890abcdefghij')).toBe(true);
  });

  it('rejects invalid token format', () => {
    expect(isValidGitHubToken('invalid_token')).toBe(false);
  });
});
```

### Test Coverage Goals

- **Target:** 80%+ overall coverage
- **Critical paths:** 100% (auth, encryption, payments)
- **Utils:** 90%+
- **Components:** 70%+

---

## Code Style & Standards

### TypeScript

**Strict Mode Enabled:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

**Best Practices:**
- ✅ Use explicit types (avoid type inference where clarity helps)
- ✅ Use `const` over `let` where possible
- ✅ Prefer interfaces over types for objects
- ✅ Use discriminated unions for state machines
- ❌ Never use `any` (use `unknown` + type guards instead)
- ❌ Avoid `as` type assertions (prefer type guards)

**Example:**
```typescript
// ❌ Bad
function process(data: any) {
  return data.value;
}

// ✅ Good
interface Data {
  value: string;
}

function process(data: Data): string {
  return data.value;
}

// ✅ Better (with validation)
import { z } from 'zod';

const DataSchema = z.object({
  value: z.string(),
});

function process(data: unknown): string {
  const parsed = DataSchema.parse(data);
  return parsed.value;
}
```

### React Components

**Functional Components with TypeScript:**
```typescript
// ✅ Good
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
}
```

**Hooks:**
```typescript
// Custom hook example
import { useState, useEffect } from 'react';

export function useGitHubUser(userId: string | null) {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    fetch(`/api/github/user?id=${userId}`)
      .then(res => res.json())
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading, error };
}
```

### Naming Conventions

- **Files:** kebab-case (`user-profile.tsx`, `api-client.ts`)
- **Components:** PascalCase (`Button`, `UserProfile`)
- **Functions:** camelCase (`getUserData`, `handleClick`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRIES`)
- **Types/Interfaces:** PascalCase (`User`, `PostInput`)
- **Hooks:** camelCase with `use` prefix (`useUser`, `useAuth`)

---

## Debugging

### Next.js Debugging

**Enable Debug Mode:**
```bash
NODE_OPTIONS='--inspect' npm run dev
```

Then attach Chrome DevTools:
1. Open `chrome://inspect`
2. Click "inspect" under Remote Target

**Debug Environment Variables:**
```typescript
// Check if env vars are loaded
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('GitHub Client ID:', process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID);
```

### Common Issues

**Issue: "Missing Supabase environment variables"**
```bash
# Solution: Check .env.local exists and has correct vars
cat .env.local
```

**Issue: "ENCRYPTION_KEY must be a 32-byte string"**
```bash
# Solution: Generate proper 32-char key
openssl rand -base64 32 | head -c 32
```

**Issue: GitHub OAuth fails with "redirect_uri mismatch"**
```bash
# Solution: Ensure redirect URIs match exactly
# .env.local:     http://localhost:3000/api/auth/github
# GitHub App:     http://localhost:3000/api/auth/github
# (no trailing slash!)
```

**Issue: Database connection fails**
```bash
# Solution: Verify Supabase credentials
# 1. Check project URL in Supabase dashboard
# 2. Verify service role key (not anon key)
# 3. Run schema.sql to create tables
```

---

## Database Migrations

### Making Schema Changes

1. **Update `supabase/schema.sql`**
   ```sql
   -- Add new column
   ALTER TABLE posts ADD COLUMN published_at TIMESTAMPTZ;
   ```

2. **Test locally**
   ```bash
   # Reset local DB (destructive!)
   supabase db reset

   # Or apply migration manually
   psql -h your-project.supabase.co -U postgres -d postgres -f supabase/schema.sql
   ```

3. **Deploy to production**
   ```bash
   # Using Supabase CLI
   supabase db push

   # Or execute in Supabase dashboard SQL Editor
   ```

### Rollback Strategy

Keep migration history in comments:
```sql
-- Migration: Add published_at column
-- Date: 2025-10-30
-- Author: Nick
ALTER TABLE posts ADD COLUMN published_at TIMESTAMPTZ;

-- Rollback:
-- ALTER TABLE posts DROP COLUMN published_at;
```

---

## Performance Tips

### Development

- Use `npm run dev` (Fast Refresh enabled)
- Keep browser DevTools open (React DevTools extension)
- Use React Profiler to identify slow components

### Production

- Run `npm run build` to check bundle size
- Use Vercel Analytics to monitor performance
- Keep Lighthouse score >95

**Check Bundle Size:**
```bash
npm run build

# Analyze bundle
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build
```

---

## Contributing

### Before Submitting PR

1. ✅ All tests pass (`npm run test`)
2. ✅ No linting errors (`npm run lint`)
3. ✅ No TypeScript errors (`npm run type-check`)
4. ✅ Production build succeeds (`npm run build`)
5. ✅ Manually test your changes
6. ✅ Update documentation if needed

### PR Guidelines

- Provide clear description of changes
- Include screenshots for UI changes
- Link related issues
- Request review from maintainers
- Respond to feedback promptly

---

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Project Docs
- [PRD.md](./PRD.md) - Product requirements
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [ROADMAP.md](./ROADMAP.md) - Implementation timeline
- [SECURITY.md](./SECURITY.md) - Security practices

### Community
- [GitHub Discussions](https://github.com/your-username/vibe-posts/discussions)
- [GitHub Issues](https://github.com/your-username/vibe-posts/issues)

---

## Getting Help

**Found a bug?** [Open an issue](https://github.com/your-username/vibe-posts/issues/new)

**Have a question?** [Start a discussion](https://github.com/your-username/vibe-posts/discussions/new)

**Want to contribute?** Check out [good first issues](https://github.com/your-username/vibe-posts/labels/good%20first%20issue)

---

**Happy coding!** 🚀
