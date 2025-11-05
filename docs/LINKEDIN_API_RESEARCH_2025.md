# LinkedIn API Research 2025: Post Publishing Requirements

**Research Date**: November 3, 2025
**Status**: Current and Comprehensive

---

## Executive Summary

LinkedIn API access for post publishing is **highly restricted** and requires partnership approval for most use cases. However, the `w_member_social` scope is available to all developers without approval, enabling basic member posting functionality. The platform has transitioned from the legacy `ugcPosts` API to the modern `Posts API`.

---

## Partner Program Requirement

### Status
**Yes - Required for Most Production Use Cases**

### Details

- **w_member_social** (member posting): **OPEN PERMISSION** - Available to all developers without special approval
  - Allows posting on behalf of authenticated members
  - Must be added via "Share on LinkedIn" product in Developer Portal
  - No approval needed

- **w_organization_social** (company page posting): **RESTRICTED** - Requires Marketing Developer Program approval
  - Used for posting on behalf of LinkedIn organization/company pages
  - Approval timeline: 3-6 months average
  - Approval rate: Less than 10% of applications
  - Requires: Existing product, proven user base, clear value proposition, privacy compliance, technical capabilities

### Current Status (2025)

Since 2015, all LinkedIn API access requires joining the LinkedIn Partner Program. However, basic "Open Permissions" are available to all developers:

1. **profile** - Retrieve name, headline, photo
2. **email** - Retrieve primary email address
3. **w_member_social** - Post on behalf of member (NO APPROVAL NEEDED)

### Recommendation for This Project

If posting on behalf of authenticated users (personal profiles):
- **Use w_member_social** (open permission - approved immediately)
- **No partnership approval required**
- Ideal for MVP and initial launch

If posting on behalf of company/organizational pages:
- **Must apply for Marketing Developer Program**
- Expected wait time: 3-6 months
- Higher barrier to entry

---

## OAuth Flow: Step-by-Step Authentication Process

### Step 1: Register Your Application

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers)
2. Create a new app
3. Add products:
   - "Sign In with LinkedIn using OpenID Connect"
   - "Share on LinkedIn" (to get w_member_social scope)

### Step 2: Obtain Authorization Code

**Request Method**: GET
**URL**: `https://www.linkedin.com/oauth/v2/authorization`

**Query Parameters**:
```
client_id={YOUR_CLIENT_ID}
redirect_uri={YOUR_REDIRECT_URI}
response_type=code
scope=w_member_social email openid profile
state={RANDOM_STRING}
```

**Scopes Breakdown**:
- `w_member_social` - Post on behalf of member
- `email` - Access email
- `openid` - OpenID Connect
- `profile` - Access profile data

**User Flow**:
1. Redirect user to authorization URL
2. User logs into LinkedIn
3. User grants permissions
4. LinkedIn redirects to your `redirect_uri` with `code` parameter

### Step 3: Exchange Code for Access Token

**Request Method**: POST
**URL**: `https://www.linkedin.com/oauth/v2/accessToken`

**Headers**:
```
Content-Type: application/x-www-form-urlencoded
```

**Body Parameters**:
```
grant_type=authorization_code
code={AUTHORIZATION_CODE}
client_id={YOUR_CLIENT_ID}
client_secret={YOUR_CLIENT_SECRET}
redirect_uri={YOUR_REDIRECT_URI}
```

**Response**:
```json
{
  "access_token": "YOUR_ACCESS_TOKEN",
  "expires_in": 5184000,
  "token_type": "Bearer"
}
```

**Token Lifespan**: 60 days (5,184,000 seconds)

### Step 4: Use Access Token for API Requests

All subsequent API calls include:
```
Authorization: Bearer {ACCESS_TOKEN}
```

### PKCE Flow (For Native/Desktop Apps)

**Important**: Contact LinkedIn to enable PKCE for your application

**Key Points**:
- Use alternative authorization URL: `https://www.linkedin.com/oauth/native-pkce/authorization`
- LinkedIn only communicates with loopback IPs (127.0.0.1)
- Must open local HTTP server on random port
- Include `code_challenge` and `code_challenge_method=S256`
- Send `code_verifier` when exchanging code for token

**Note**: OAuth 2.1 requires PKCE for all authorization code flows (becomes mandatory, not optional)

---

## Publishing Endpoint

### Endpoint Details

**Modern API (Recommended)**:
```
POST https://api.linkedin.com/rest/posts
```

**Legacy API (Deprecated)**:
```
POST https://api.linkedin.com/v2/ugcPosts
```

### Required Headers

```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
Linkedin-Version: {YYYYMM}
X-Restli-Protocol-Version: 2.0.0
```

**Version Header Important Notes**:
- Format: `202510` (October 2025), `202511` (November 2025), etc.
- Versions are supported for minimum 12 months
- LinkedIn sunsets versions as early as 12 months after release
- Each new version releases monthly
- Using deprecated versions will cause errors
- Always use the latest available version

### Request Body Format

**Minimal Example** (Text Only):
```json
{
  "author": "urn:li:person:{personId}",
  "commentary": {
    "text": "Your post text here"
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  },
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetAudiences": []
  },
  "lifecycleState": "PUBLISHED"
}
```

**With Image Example**:
```json
{
  "author": "urn:li:person:{personId}",
  "commentary": {
    "text": "Check out this image"
  },
  "content": {
    "media": {
      "id": "urn:li:digitalmediaAsset:IMAGE_URN"
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  },
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetAudiences": []
  },
  "lifecycleState": "PUBLISHED"
}
```

**Required Fields**:
- `author` - URN of person or organization (required)
- `commentary` - Post text (required for text posts)
- `visibility` - Audience visibility (required)
- `distribution` - Feed distribution settings (required)
- `lifecycleState` - Usually "PUBLISHED" (required)

**Content Types Supported**:
- Text only
- Images (max 9 per post)
- Videos
- Documents
- Articles
- Carousels
- Multi-image posts
- Polls

### Response Format

**Success (201 Created)**:
```json
{
  "id": "7123456789"
}
```

Returns URN: `urn:li:ugcPost:7123456789` or `urn:li:share:7123456789`

**Getting Author URN**:

Make a GET request to retrieve authenticated user's ID:
```
GET https://api.linkedin.com/v2/me
Authorization: Bearer {ACCESS_TOKEN}
```

Response:
```json
{
  "id": "XXXXXXXXXXXXX"
}
```

Use this as: `urn:li:person:XXXXXXXXXXXXX`

---

## Rate Limits and Constraints

### Daily Rate Limiting

**Structure**: Two-tier system
- Application-level: Total daily API calls
- Member-level: Per-user daily calls

**Enforcement**:
- Rate limits reset at **midnight UTC**
- Exceeding limit returns **HTTP 429** status code
- Email alerts sent to developer admins at **75% threshold**
- Alert delay: 1-2 hours

### Finding Your Specific Limits

Standard rate limits are **NOT publicly documented**. To find your limits:

1. Go to LinkedIn Developer Portal
2. Select your application
3. Navigate to "Analytics" tab
4. Check usage and rate limits for each endpoint
5. **Important**: Analytics only shows data for endpoints you've made at least 1 request to that day (UTC)

### Best Practices for Rate Limiting

- Space out requests evenly throughout each hour
- Avoid high queries-per-second (QPS) bursts
- Monitor `X-RateLimit-Remaining` header in responses
- Implement exponential backoff for 429 responses
- Cache responses when possible

### Posting Constraints

**Text Limits**:
- Maximum 3,000 characters per post

**Image Limits**:
- Maximum 9 images per single post
- Image requirements via API may differ from web UI
- Supported formats: JPG, PNG, GIF

**Posting Frequency**:
- No documented strict limit, but LinkedIn uses spam filters
- Excessive posting may trigger filters and reduce reach
- Company pages have stricter limits than individual profiles

**Geotargeting Constraint**:
- When using geotargeting on company pages, audience must have minimum 300 followers

---

## Required Scopes for Posting

### Open Permissions (No Approval Needed)

| Scope | Purpose | Available |
|-------|---------|-----------|
| `w_member_social` | Post on behalf of authenticated member | YES - Open to all |
| `r_member_social` | Retrieve member posts | NO - Requires approval |

### Restricted Permissions (Approval Required)

| Scope | Purpose | Requirement |
|-------|---------|-------------|
| `w_organization_social` | Post on behalf of organization | Marketing Developer Program approval |
| `r_organization_social` | Retrieve organization posts | Marketing Developer Program approval |

### Supporting Scopes

| Scope | Purpose |
|-------|---------|
| `email` | Access member's email |
| `openid` | OpenID Connect support |
| `profile` | Access profile data (name, headline, photo) |

### Scope Request Syntax

In authorization URL, use **space-separated** values:
```
scope=w_member_social email openid profile
```

**Important**: When requesting multiple scopes, users must consent to ALL of them. Individual scope selection is not available. If user denies any scope, entire request fails.

### Adding Scopes to Your App

1. LinkedIn Developer Portal → Your App
2. Products section
3. Add product: "Share on LinkedIn"
4. Automatically grants `w_member_social` scope access

---

## Implementation Recommendation

### Recommended Approach for Vibe Posts (MVP)

**Strategy**: Use `w_member_social` (Open Permission - No Approval)

**Advantages**:
- ✅ No approval wait (3-6 months saved)
- ✅ Available immediately after adding product
- ✅ Lower complexity for MVP
- ✅ Enables user-based posting from day one
- ✅ Reduce initial barrier to market launch

**Implementation Steps**:

1. **Register App**
   - LinkedIn Developer Portal
   - Add "Share on LinkedIn" product

2. **Implement OAuth Flow**
   - Authorization endpoint for user login
   - Token exchange endpoint (backend)
   - Token refresh logic (60-day expiration)
   - Store tokens securely

3. **Implement Posting**
   - Create post data from user input
   - POST to `/rest/posts` with proper headers
   - Handle 429 rate limit errors gracefully
   - Include text length validation (max 3,000 chars)

4. **Error Handling**
   - 400: Bad request (validate body structure)
   - 401: Token expired (refresh)
   - 403: Missing permissions (request proper scopes)
   - 429: Rate limited (implement backoff)
   - Implement proper error messages for users

### Future Enhancement (After MVP)

Once you have users and usage patterns:
- Apply for Marketing Developer Program
- Gain `w_organization_social` access
- Enable company page posting

---

## API Versions and Migration

### Current Status

**Posts API** (Modern - Recommended):
- Replaces deprecated `ugcPosts` API
- Cleaner structure with less nesting
- Better documentation
- Future-proof

**ugcPosts API** (Legacy - Deprecated):
- Still functional but legacy
- Complex nested structures
- Being phased out
- **Avoid for new implementations**

### Version Header Strategy

Use latest available version in format `YYYYMM`:
```
Linkedin-Version: 202511
```

Current approach:
- Check available versions in Developer Portal
- Always use most recent version available
- Update app when new versions release (quarterly check recommended)
- Never hardcode old version numbers

### Migration Path

If using legacy `ugcPosts`:
1. Update endpoint from `/v2/ugcPosts` to `/rest/posts`
2. Restructure request body (simplified format)
3. Add `Linkedin-Version` header
4. Update error handling
5. Test thoroughly before deploying

---

## Common Pitfalls and Gotchas

### Authentication Issues

1. **Token Expiration**
   - Tokens expire after 60 days
   - Implement refresh token logic before token expires
   - Store tokens securely on backend

2. **Scope Mismatch**
   - w_member_social only allows posting on behalf of user, not organization
   - User must grant all requested scopes (can't select individual ones)
   - Missing scopes return 403 Forbidden

3. **Missing Headers**
   - `Linkedin-Version` header is REQUIRED
   - `X-Restli-Protocol-Version: 2.0.0` is REQUIRED
   - Content-Type: application/json is REQUIRED
   - Missing headers cause cryptic 400 errors

### Posting Issues

4. **Text Length**
   - Maximum 3,000 characters
   - Emoji and special characters count as multiple bytes
   - Validation should happen client-side and server-side

5. **Image Limitations**
   - Maximum 9 images per post
   - Image API requirements differ from web UI
   - Must use proper image URNs

6. **Content Type Errors**
   - Incomplete JSON causes 400 errors
   - Missing required fields (`author`, `commentary`, `visibility`, `distribution`, `lifecycleState`)
   - Empty commentary field causes errors

### Rate Limiting Gotchas

7. **Version Deprecation**
   - API versions deprecated after 12 months
   - Using old version causes failures
   - Monitor version release schedule
   - Plan quarterly updates

8. **High Burst Requests**
   - LinkedIn detects burst patterns
   - Space requests evenly throughout hour
   - Implement queuing for bulk operations

### Organization/Company Page Issues

9. **Organization Posting**
   - Requires `w_organization_social` (approval needed)
   - Cannot use `w_member_social` for company pages
   - Company page must have user set as Super Admin

10. **Geotargeting Limitations**
    - Geotargeted posts require 300+ follower audience minimum
    - Will return validation error if below threshold

---

## References and Official Documentation

### Official LinkedIn Documentation (2025)

- **Authentication Overview**
  - URL: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
  - Details: OAuth 2.0 flows, authorization codes, token exchange

- **Getting Access to APIs**
  - URL: https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access
  - Details: Open permissions vs restricted programs, partner requirements

- **Posts API (Recommended)**
  - URL: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
  - Details: Endpoint, request/response format, content types, versioning

- **UGC Post API (Legacy)**
  - URL: https://learn.microsoft.com/en-us/linkedin/compliance/integrations/shares/ugc-post-api
  - Details: Deprecated but still documented for migration purposes

- **Rate Limiting**
  - URL: https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits
  - Details: Daily limits, alert thresholds, finding your specific limits

- **Error Handling**
  - URL: https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/error-handling
  - Details: Common errors, status codes, troubleshooting

- **OAuth 2.0 Authorization Code Flow**
  - URL: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
  - Details: Step-by-step 3-legged OAuth implementation

- **OAuth 2.0 for Native Clients (PKCE)**
  - URL: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow-native
  - Details: PKCE implementation for desktop/mobile apps

### Partner Program Application

- **Apply for LinkedIn Partner Program**
  - URL: https://developer.linkedin.com/content/developer/global/en_us/index/partner-programs/apply
  - Details: Application process, requirements, approval timeline

### Community Resources

- LinkedIn Developer Community: https://community.linkedin.com/
- Stack Overflow Tag: `linkedin-api`
- Medium Articles: Various 2025 implementation guides

---

## Summary for Development Team

### Quick Reference

| Requirement | Status | Details |
|-------------|--------|---------|
| Partner Program for member posting | ❌ NO | Use open `w_member_social` permission |
| Partner Program for org posting | ✅ YES | Requires 3-6 month approval |
| OAuth 2.0 with PKCE | ✅ YES | PKCE needs manual enablement |
| Publishing Endpoint | `/rest/posts` | Use Posts API, not legacy ugcPosts |
| Version Header | Required | Format: `202511` (month) |
| Rate Limits | User-defined | Check Developer Portal Analytics |
| Required Scopes | `w_member_social` | Available immediately |
| Token Lifespan | 60 days | Implement refresh logic |
| Max Post Length | 3,000 chars | Validate before posting |

### Recommended Stack Integration

1. **Backend**
   - Store user access tokens securely (encrypted)
   - Implement token refresh before 60-day expiration
   - Call LinkedIn Posts API with proper version header
   - Log all API calls for debugging

2. **Frontend**
   - Redirect to LinkedIn OAuth authorization
   - Handle authorization code response
   - Validate post text length
   - Show proper error messages to users

3. **Monitoring**
   - Track rate limit usage
   - Set up alerts near 75% threshold
   - Monitor token expiration dates
   - Log all API errors

---

**Document Status**: Complete Research
**Last Updated**: November 3, 2025
**Confidence Level**: High - Based on official Microsoft Learn documentation and recent community sources
