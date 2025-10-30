# Team 3: Social Integration

**Timeline:** Days 3-5 (LinkedIn), Days 9-10 (X/Twitter)
**Dependencies:** Teams 2, 6 (post content, OAuth)
**Provides To:** Team 4 (publish status)

## Primary Objectives

### Days 3-5: LinkedIn Integration
- Implement LinkedIn OAuth 2.1 with PKCE
- Build post publishing endpoint
- Add consent flow (preview → confirm → undo, 5 min window)
- Implement post scheduling
- Fetch post metrics (views, likes, comments)

### Days 9-10: X/Twitter Integration
- Implement Twitter OAuth 2.0 with PKCE
- Build tweet publishing endpoint
- Add thread generation (auto-split long content)
- Fetch tweet metrics (impressions, engagements)
- Support both platforms simultaneously

## Type-Safe Implementation

```typescript
// Platform enum
enum Platform {
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
}

// OAuth token (branded type)
type LinkedInToken = string & { readonly __brand: 'LinkedInToken' };
type TwitterToken = string & { readonly __brand: 'TwitterToken' };

// Post consent state
type ConsentState =
  | { status: 'pending'; preview: string; expiresAt: Date }
  | { status: 'granted'; grantedAt: Date }
  | { status: 'denied'; deniedAt: Date };
```

## Success Criteria
- [ ] OAuth success rate >98%
- [ ] Post publishing success rate >99%
- [ ] Undo functional within 5 min window
- [ ] 40% of users publish to both platforms

## User Verification
- **Day 3 End:** Publish to LinkedIn, test consent flow
- **Day 4 End:** Test MCP endpoints (ChatGPT simulation)
- **Day 9 End:** Publish to X/Twitter, test thread generation

---

**See full spec:** ORCHESTRATION_PLAN_V3.md Days 3-5, 9-10.
