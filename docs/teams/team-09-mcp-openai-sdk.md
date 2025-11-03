# Team 9: MCP Server & OpenAI SDK Integration

**Team Lead:** MCP Specialist Agent
**Timeline:** Days 1-4 (foundation), Day 12 (polish)
**Dependencies:** Team 6 (OAuth 2.1 security)
**Provides To:** All teams (ChatGPT integration)

---

## 🎯 Role & Expertise

Build the MCP (Model Context Protocol) server that enables ChatGPT to discover and invoke Posture's tools, providing seamless integration with the OpenAI Apps SDK ecosystem.

### Required Expertise
- MCP protocol implementation
- JSON Schema generation from TypeScript types
- OAuth 2.1 with PKCE & Dynamic Client Registration (DCR)
- RESTful API design (or Fastify for dedicated server)
- OpenAPI 3.1 specification
- ChatGPT conversational UX patterns

---

## 📋 Primary Objectives

### Phase 1: MVP Foundation (Days 1-4)

#### Objective 1.1: MCP Server Skeleton (Day 1)
**Goal:** Set up MCP server infrastructure with type-safe tooling

**Tasks:**
- [ ] Choose architecture: Next.js API routes vs dedicated Fastify server
- [ ] Set up TypeScript project with strict mode
- [ ] Install dependencies: `@sinclair/typebox` or `typescript-json-schema`
- [ ] Create base route structure (`/mcp/tools`, `/mcp/invoke`)
- [ ] Set up CORS for ChatGPT origin

**Type-Safe Implementation:**
```typescript
// src/mcp/types.ts
import { Type, Static } from '@sinclair/typebox';

// Define tools with TypeBox (JSON Schema + TypeScript types)
export const GeneratePostToolSchema = Type.Object({
  name: Type.Literal('generate_post'),
  description: Type.String(),
  parameters: Type.Object({
    topic: Type.String({ description: 'What the post should be about' }),
    platform: Type.Union([
      Type.Literal('linkedin'),
      Type.Literal('twitter'),
      Type.Literal('both')
    ]),
    tone: Type.Optional(Type.Union([
      Type.Literal('technical'),
      Type.Literal('casual'),
      Type.Literal('inspiring')
    ]))
  })
});

export type GeneratePostTool = Static<typeof GeneratePostToolSchema>;
```

**Deliverables:**
- Base MCP server responding to `/mcp/tools` (returns tool list)
- TypeScript types defined for all 4 tools
- CORS configured for ChatGPT origin

**🔍 User Verification (Day 1 End):**
- Access `/mcp/tools` via browser → returns JSON list of tools
- Review TypeScript types in `src/mcp/types.ts`

---

#### Objective 1.2: Tool Metadata Generation (Day 2)
**Goal:** Auto-generate JSON schemas from TypeScript types

**Tasks:**
- [ ] Implement tool discovery endpoint (`GET /mcp/tools`)
- [ ] Generate JSON Schema from TypeBox types
- [ ] Add tool examples for ChatGPT
- [ ] Add error surface metadata (deterministic error codes)

**Implementation:**
```typescript
// src/app/api/mcp/tools/route.ts
import { GeneratePostToolSchema, SchedulePostToolSchema } from '@/mcp/types';

export async function GET(request: Request) {
  const tools = [
    {
      ...GeneratePostToolSchema,
      examples: [
        {
          input: {
            topic: 'I reduced API latency by 40% using Redis caching',
            platform: 'linkedin',
            tone: 'technical'
          },
          output: {
            post: {
              content: 'Just achieved a 40% reduction in API latency...',
              hashtags: ['APIOptimization', 'Redis', 'Performance'],
              characterCount: 287
            }
          }
        }
      ],
      errors: [
        { code: 'INVALID_TOPIC', message: 'Topic must be 10-500 characters' },
        { code: 'RATE_LIMIT_EXCEEDED', message: 'Try again in 2 minutes' }
      ]
    },
    // ... other tools
  ];

  return Response.json({ tools });
}
```

**Deliverables:**
- `/mcp/tools` returns complete tool metadata (4 tools)
- Each tool has name, description, JSON schema, examples, errors
- OpenAPI 3.1 spec generated from types

**🔍 User Verification (Day 2 End):**
- Test `/mcp/tools` → validate JSON schema format
- Review examples (ensure realistic)

---

#### Objective 1.3: OAuth 2.1 with PKCE Implementation (Day 3)
**Goal:** Secure authentication for ChatGPT integration

**Tasks:**
- [ ] Implement authorization endpoint (`/oauth/authorize`)
- [ ] Implement token exchange endpoint (`/oauth/token`)
- [ ] Add PKCE code challenge/verifier validation
- [ ] Implement Dynamic Client Registration (DCR)
- [ ] Store tokens with branded types (Team 6 integration)

**Type-Safe OAuth:**
```typescript
// src/mcp/oauth.ts
import { z } from 'zod';

// Branded types for security
type AuthCode = string & { readonly __brand: 'AuthCode' };
type AccessToken = string & { readonly __brand: 'AccessToken' };
type RefreshToken = string & { readonly __brand: 'RefreshToken' };
type PKCEVerifier = string & { readonly __brand: 'PKCEVerifier' };

// Zod schema for token request
const TokenRequestSchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string(),
  code_verifier: z.string().length(43), // PKCE verifier (base64url, 32 bytes)
  client_id: z.string(),
  redirect_uri: z.string().url(),
});

type TokenRequest = z.infer<typeof TokenRequestSchema>;

// OAuth state machine
type OAuthState =
  | { status: 'pending'; authCode: AuthCode; expiresAt: Date }
  | { status: 'granted'; accessToken: AccessToken; refreshToken: RefreshToken; scopes: string[] }
  | { status: 'expired'; expiredAt: Date };
```

**Implementation:**
```typescript
// src/app/api/oauth/token/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const validated = TokenRequestSchema.parse(body);

  // Validate PKCE challenge
  const isValid = await validatePKCE(
    validated.code,
    validated.code_verifier
  );

  if (!isValid) {
    return Response.json(
      { error: 'invalid_grant', error_description: 'PKCE validation failed' },
      { status: 400 }
    );
  }

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(validated.code);

  return Response.json({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: tokens.scopes.join(' ')
  });
}
```

**Deliverables:**
- OAuth 2.1 flow functional (authorize → exchange → tokens)
- PKCE validation working (code_challenge → code_verifier)
- Scoped permissions enforced (`post:read`, `post:write`, `brand:read`, `brand:write`)

**🔍 User Verification (Day 3 End):**
- Test OAuth flow: authorize → redirect → exchange → get tokens
- Verify PKCE (tamper with code_verifier → expect error)
- Check token scopes (ensure least-privilege)

---

#### Objective 1.4: Tool Invocation Endpoints (Day 4)
**Goal:** Implement 4 core MCP tools that ChatGPT can invoke

**Tasks:**
- [ ] Implement `/mcp/invoke/generate_post`
- [ ] Implement `/mcp/invoke/schedule_post`
- [ ] Implement `/mcp/invoke/list_posts`
- [ ] Implement `/mcp/invoke/brand_profile`
- [ ] Add consent flow for write actions (Team 6 integration)
- [ ] Add Zod validation for all inputs

**Tool 1: `generate_post`**
```typescript
// src/app/api/mcp/invoke/generate_post/route.ts
import { z } from 'zod';
import { generatePost } from '@/lib/ai/generate';

const GeneratePostInputSchema = z.object({
  topic: z.string().min(10).max(500),
  platform: z.enum(['linkedin', 'twitter', 'both']),
  tone: z.enum(['technical', 'casual', 'inspiring']).optional(),
});

export async function POST(request: Request) {
  // Validate OAuth token (bearer auth)
  const authHeader = request.headers.get('Authorization');
  const user = await validateBearerToken(authHeader);

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate input
  const body = await request.json();
  const input = GeneratePostInputSchema.parse(body);

  // Check subscription tier (use feature gate)
  const canGenerate = await canAccessFeature(user.tier, 'unlimited_posts');
  if (!canGenerate) {
    return Response.json(
      { error: 'TIER_LIMIT_EXCEEDED', message: 'Upgrade to Standard for unlimited posts' },
      { status: 403 }
    );
  }

  // Generate post with GPT-5
  const post = await generatePost({
    topic: input.topic,
    platform: input.platform,
    tone: input.tone || user.brandProfile?.tone || 'technical',
    userId: user.id,
  });

  return Response.json({
    post: {
      content: post.content,
      hashtags: post.hashtags,
      characterCount: post.content.length,
      platform: input.platform,
    },
    preview_url: `https://posture.ai/preview/${post.id}`,
  });
}
```

**Tool 2: `schedule_post` (with consent)**
```typescript
// src/app/api/mcp/invoke/schedule_post/route.ts
const SchedulePostInputSchema = z.object({
  content: z.string().max(1300),
  platform: z.enum(['linkedin', 'twitter', 'both']),
  scheduledFor: z.string().datetime().optional(),
  hashtags: z.array(z.string()).max(30).optional(),
  consent: z.boolean().optional(), // Consent flag
});

export async function POST(request: Request) {
  const user = await validateBearerToken(request.headers.get('Authorization'));
  const input = SchedulePostInputSchema.parse(await request.json());

  // Check if consent granted
  if (!input.consent) {
    // Return pending consent state
    return Response.json({
      status: 'pending_consent',
      preview: input.content,
      message: 'Posture will post this to LinkedIn. Confirm to proceed.',
      consent_required: true,
    });
  }

  // Toxicity filter (Team 6)
  const moderation = await moderateContent(input.content);
  if (!moderation.safe) {
    return Response.json(
      { error: 'CONTENT_FLAGGED', reason: moderation.reason },
      { status: 400 }
    );
  }

  // Schedule/publish post
  const post = await schedulePost({
    content: input.content,
    platform: input.platform,
    scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : new Date(),
    hashtags: input.hashtags || [],
    userId: user.id,
  });

  return Response.json({
    status: 'published',
    post_id: post.id,
    platform_url: post.platformUrl,
    published_at: post.publishedAt.toISOString(),
    undo_available_until: new Date(post.publishedAt.getTime() + 5 * 60 * 1000).toISOString(),
  });
}
```

**Deliverables:**
- All 4 MCP tools functional and tested
- Consent flow working (preview → confirm → publish)
- Toxicity filtering active (Team 6 integration)
- Error handling with deterministic codes

**🔍 User Verification (Day 4 End - MAJOR CHECKPOINT):**
- Test all 4 tools via Postman (simulate ChatGPT)
- Test `/generate_post` → validate output format
- Test `/schedule_post` without consent → expect pending_consent
- Test `/schedule_post` with consent → verify publish
- Attempt toxic content → expect CONTENT_FLAGGED error
- Test `/list_posts` → validate pagination
- Test `/brand_profile` → validate brand data

---

### Phase 5: Compliance Polish (Day 12)

#### Objective 5.1: MCP Metadata Refinement
**Goal:** Perfect tool metadata for OpenAI review

**Tasks:**
- [ ] Add detailed descriptions (what, why, when to use each tool)
- [ ] Add parameter descriptions (explain each field)
- [ ] Add 3+ examples per tool (common use cases)
- [ ] Add error documentation (all possible error codes)
- [ ] Validate JSON schemas with `@apidevtools/swagger-parser`

**Enhanced Tool Example:**
```typescript
{
  name: 'generate_post',
  description: 'Generate a professional LinkedIn or Twitter post based on user input and their brand profile. Use this when the user wants to create content about their work, achievements, or insights. The AI will match the user's preferred tone and style.',
  parameters: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'What the post should be about. Can be a recent achievement (e.g., "I reduced API latency by 40%"), a project (e.g., "my new GraphQL federation implementation"), or an insight (e.g., "why type safety matters in TypeScript").',
        minLength: 10,
        maxLength: 500,
        examples: [
          'I just shipped a major feature using React Server Components',
          'Lessons learned from migrating to microservices',
          'My take on the future of AI in software development'
        ]
      },
      platform: {
        type: 'string',
        enum: ['linkedin', 'twitter', 'both'],
        description: 'Which platform to optimize for. LinkedIn allows 1300 characters with rich formatting. Twitter has a 280-character limit (will auto-thread if longer). "both" generates platform-specific versions.',
        default: 'linkedin'
      },
      tone: {
        type: 'string',
        enum: ['technical', 'casual', 'inspiring'],
        description: 'Desired tone (optional). Defaults to user's brand profile. "technical" = data-driven, specific. "casual" = conversational, approachable. "inspiring" = motivational, forward-looking.',
        default: 'User's brand profile tone'
      }
    },
    required: ['topic', 'platform']
  },
  examples: [
    {
      input: { topic: 'I reduced API latency by 40%', platform: 'linkedin', tone: 'technical' },
      output: {
        post: {
          content: 'Just achieved a 40% reduction in API latency by implementing strategic Redis caching...',
          hashtags: ['APIOptimization', 'Redis', 'Performance'],
          characterCount: 287
        }
      }
    }
  ],
  errors: [
    { code: 'INVALID_TOPIC', message: 'Topic must be 10-500 characters', recovery: 'Provide a longer description of what you want to post about' },
    { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit: 20 posts/minute', recovery: 'Wait 2 minutes and try again' },
    { code: 'TIER_LIMIT_EXCEEDED', message: 'Free tier: 2 posts/month', recovery: 'Upgrade to Standard for unlimited posts' }
  ]
}
```

**Deliverables:**
- All 4 tools have detailed descriptions
- All parameters documented with examples
- All error codes documented with recovery actions

---

#### Objective 5.2: OpenAPI Spec Generation
**Goal:** Auto-generate OpenAPI 3.1 spec from TypeScript types

**Tasks:**
- [ ] Install `typescript-json-schema` or use TypeBox's built-in generation
- [ ] Generate OpenAPI spec from all MCP tool types
- [ ] Host at `/api/openapi.json`
- [ ] Validate with `@apidevtools/swagger-parser`
- [ ] Add to OpenAI review submission

**Implementation:**
```typescript
// scripts/generate-openapi.ts
import { Type } from '@sinclair/typebox';
import { OpenApiBuilder } from 'openapi3-ts/oas31';

const builder = OpenApiBuilder.create()
  .addInfo({
    title: 'Posture MCP API',
    version: '1.0.0',
    description: 'MCP endpoints for ChatGPT integration'
  })
  .addServer({
    url: 'https://posture.ai',
    description: 'Production server'
  })
  .addPath('/mcp/invoke/generate_post', {
    post: {
      summary: 'Generate a professional post',
      operationId: 'generatePost',
      requestBody: {
        content: {
          'application/json': {
            schema: GeneratePostToolSchema // TypeBox schema → JSON Schema
          }
        }
      },
      responses: {
        '200': {
          description: 'Post generated successfully',
          content: {
            'application/json': {
              schema: GeneratePostResponseSchema
            }
          }
        }
      }
    }
  });

const spec = builder.getSpec();
fs.writeFileSync('public/openapi.json', JSON.stringify(spec, null, 2));
```

**Deliverables:**
- OpenAPI 3.1 spec generated from TypeScript types
- Hosted at `/api/openapi.json`
- Validated (zero errors from swagger-parser)

**🔍 User Verification (Day 12 End):**
- Access `/api/openapi.json` → validate format
- Upload to Swagger Editor → verify no errors
- Review all tool descriptions (completeness check)

---

## 🔗 Integration Contracts

### Inputs from Other Teams

**From Team 6 (Security):**
```typescript
// OAuth validation
interface OAuthValidationResult {
  valid: boolean;
  user: User | null;
  scopes: string[];
  error?: string;
}

async function validateBearerToken(authHeader: string): Promise<User | null>;
async function validatePKCE(authCode: string, verifier: string): Promise<boolean>;

// Content moderation
interface ModerationResult {
  safe: boolean;
  reason?: string;
}

async function moderateContent(content: string): Promise<ModerationResult>;
```

**From Team 2 (AI Engine):**
```typescript
// Post generation
interface GeneratePostInput {
  topic: string;
  platform: 'linkedin' | 'twitter' | 'both';
  tone?: 'technical' | 'casual' | 'inspiring';
  userId: string;
}

interface GeneratePostOutput {
  id: string;
  content: string;
  hashtags: string[];
  platform: 'linkedin' | 'twitter';
}

async function generatePost(input: GeneratePostInput): Promise<GeneratePostOutput>;
```

**From Team 10 (Billing):**
```typescript
// Feature gates
type Feature = 'unlimited_posts' | 'ai_coach' | 'ai_intern' | 'analytics';

async function canAccessFeature(tier: SubscriptionTier, feature: Feature): Promise<boolean>;
```

---

### Outputs to Other Teams

**To All Teams (ChatGPT Integration):**
```typescript
// MCP tool metadata
interface MCPTool {
  name: string;
  description: string;
  parameters: JSONSchema;
  examples: Example[];
  errors: ErrorDefinition[];
}

interface Example {
  input: Record<string, any>;
  output: Record<string, any>;
}

interface ErrorDefinition {
  code: string;
  message: string;
  recovery: string;
}

// Tool list endpoint
GET /mcp/tools → { tools: MCPTool[] }
```

**To Team 8 (Orchestration):**
```typescript
// Health check
interface MCPHealthCheck {
  status: 'healthy' | 'degraded' | 'down';
  tools: {
    [toolName: string]: {
      available: boolean;
      latency_ms: number;
    };
  };
}

GET /mcp/health → MCPHealthCheck
```

---

## ✅ Success Criteria

### Phase 1: MVP (Day 4)
- [ ] All 4 MCP tools functional and tested
- [ ] OAuth 2.1 with PKCE working (authorize → token exchange)
- [ ] JSON schemas valid (validated with swagger-parser)
- [ ] Consent flow implemented (preview → confirm for writes)
- [ ] Toxicity filtering active (integration with Team 6)
- [ ] Error messages deterministic (all error codes documented)

### Phase 5: Compliance (Day 12)
- [ ] OpenAPI 3.1 spec generated from types (zero drift)
- [ ] Tool metadata complete (descriptions, examples, errors)
- [ ] Type coverage >95% in MCP module
- [ ] MCP health check endpoint live
- [ ] ChatGPT integration tested (via simulator or real ChatGPT)

### User Verification Checkpoints
- **Day 1:** MCP server responds to `/mcp/tools`
- **Day 2:** Tool metadata includes examples
- **Day 3:** OAuth flow completes (tokens issued)
- **Day 4:** All 4 tools invokable via Postman
- **Day 12:** OpenAPI spec validated, ChatGPT integration tested

---

## 📁 Files to Create/Modify

### Create (New Files)
- `src/mcp/types.ts` - TypeBox schemas for all 4 tools
- `src/mcp/oauth.ts` - OAuth 2.1 PKCE implementation
- `src/app/api/mcp/tools/route.ts` - Tool discovery endpoint
- `src/app/api/mcp/invoke/generate_post/route.ts`
- `src/app/api/mcp/invoke/schedule_post/route.ts`
- `src/app/api/mcp/invoke/list_posts/route.ts`
- `src/app/api/mcp/invoke/brand_profile/route.ts`
- `src/app/api/oauth/authorize/route.ts` - OAuth authorization
- `src/app/api/oauth/token/route.ts` - OAuth token exchange
- `scripts/generate-openapi.ts` - OpenAPI spec generator

### Modify (Existing Files)
- `package.json` - Add `@sinclair/typebox`, `openapi3-ts`
- `tsconfig.json` - Ensure strict mode enabled
- `.env.example` - Add OAuth client secrets

---

## 📊 Estimated Effort

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| **Day 1:** MCP Skeleton | Setup, TypeScript types | 8 hours |
| **Day 2:** Tool Metadata | JSON schemas, examples | 8 hours |
| **Day 3:** OAuth 2.1 | PKCE, DCR, tokens | 10 hours |
| **Day 4:** Tool Invocation | 4 endpoints, consent, validation | 12 hours |
| **Day 12:** Compliance Polish | Metadata refinement, OpenAPI gen | 6 hours |
| **Total:** | 23 objectives | 44 hours |

**Agent optimization:** With parallel execution (e.g., OAuth while tool metadata in progress), compressed to **4 days**.

---

## 🚨 Risks & Mitigation

### Risk 1: OAuth 2.1 Complexity
- **Impact:** ChatGPT can't authenticate, integration fails
- **Mitigation:** Use proven library (e.g., `node-oauth2-server`), test with Postman before ChatGPT
- **Fallback:** Simplify to OAuth 2.0 with PKCE only (skip DCR if blocker)

### Risk 2: JSON Schema Drift
- **Impact:** TypeScript types ≠ JSON schemas, runtime errors
- **Mitigation:** Auto-generate schemas from TypeScript (TypeBox), validate in CI/CD
- **Monitoring:** Weekly validation check (`swagger-parser` in tests)

### Risk 3: OpenAI Review Rejection
- **Impact:** MCP integration delayed, lose ChatGPT distribution
- **Mitigation:** Follow Apps SDK guidelines precisely, test with reviewer checklist
- **Iteration:** Expect 1-2 revision rounds, allocate 2 extra days post-Day 12

---

**Team 9 is critical for OpenAI ecosystem integration. Type-safety and compliance are non-negotiable.** 🔐
