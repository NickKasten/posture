# 🏗️ Project Structure

This document outlines the professional directory structure for the Postures web application.

## 📁 Directory Structure

```
postures/
├── docs/                           # Documentation
│   ├── PRD-Web.md                 # Product Requirements Document
│   ├── DEVELOPER_GUIDE.md         # Development guidelines
│   └── ...
├── public/                        # Static assets
│   ├── icons/                     # Icon assets
│   ├── images/                    # Image assets
│   └── fonts/                     # Font assets
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API routes
│   │   │   ├── ai/               # AI post generation
│   │   │   ├── auth/             # Authentication endpoints
│   │   │   └── github/           # GitHub integration
│   │   ├── dashboard/            # Dashboard pages
│   │   ├── auth/                 # Authentication pages
│   │   ├── settings/             # Settings pages
│   │   ├── profile/              # Profile pages
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   └── globals.css           # Global styles
│   ├── components/               # React components
│   │   ├── ui/                   # Reusable UI components
│   │   ├── forms/                # Form components
│   │   ├── layout/               # Layout components
│   │   ├── auth/                 # Authentication components
│   │   ├── post/                 # Post-related components
│   │   └── github/               # GitHub-related components
│   ├── lib/                      # Library configurations
│   │   ├── auth/                 # Authentication utilities
│   │   ├── api/                  # API utilities
│   │   ├── storage/              # Database/storage utilities
│   │   └── ai/                   # AI provider utilities
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   ├── constants/                # Application constants
│   └── styles/                   # Additional styles
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── .eslintrc.json               # ESLint configuration
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── tsconfig.json                # TypeScript configuration
├── jest.config.js               # Jest configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # Project documentation
```

## 🎯 Key Design Principles

### 1. **Separation of Concerns**
- **API routes**: Organized by functionality (ai, auth, github)
- **Components**: Grouped by purpose (ui, forms, layout, domain-specific)
- **Utilities**: Separated by type (auth, storage, validation)

### 2. **Scalability**
- Modular structure allows for easy addition of new features
- Clear separation between client and server code
- Organized by feature/domain rather than file type

### 3. **Developer Experience**
- Intuitive folder structure with clear naming
- Comprehensive TypeScript support
- Proper configuration for all development tools

### 4. **Security First**
- Sanitization and validation utilities in dedicated modules
- Secure token storage patterns
- Environment variable management

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Fill in your environment variables
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Run tests**:
   ```bash
   npm run test
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run type-check` - Run TypeScript type checking

## 🔧 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Testing**: Jest, TypeScript
- **Deployment**: Vercel (configured via next.config.js)

## 📚 Related Documentation

- [Product Requirements Document](./docs/PRD-Web.md)
- [Developer Guide](./docs/DEVELOPER_GUIDE.md)
- [Security Guidelines](./docs/SECURITY.md)
- [UI Flow Documentation](./docs/UI_FLOW.md)