# Team 1: Onboarding & UX

**Timeline:** Days 2-3
**Dependencies:** Team 6 (security validation)
**Provides To:** Team 2 (conversation context)

## Primary Objectives

### Day 2: Onboarding Foundation
- Build welcome screen with "Tell My Story" CTA
- Implement GitHub scan prompt ("Analyze my activity?" Yes/Skip)
- Add platform selection (LinkedIn, X/Twitter, Both)
- Create skip functionality (all steps optional)

### Day 3: AI Q&A Flow
- Implement conversational questions (3-5 adaptive based on GitHub data)
- Build real-time context preview sidebar
- Add progress indicators
- Implement responsive design (mobile + desktop)

## Type-Safe Implementation

```typescript
// Conversation state
interface OnboardingState {
  githubActivity: GitHubActivity | null;
  answers: Record<string, string>;
  platforms: ('linkedin' | 'twitter')[];
  style: 'technical' | 'casual' | 'inspiring';
  isSkipped: boolean;
}
```

## Success Criteria
- [ ] Onboarding complete in <2 minutes
- [ ] 30-40% cognitive load reduction (A/B test)
- [ ] Skip option at every step
- [ ] Mobile completion rate ≥ desktop (±5%)

## User Verification
- **Day 2 End:** Test onboarding flow, verify OAuth
- **Day 3 End:** Generate test post from conversation context

---

**See full spec:** Complete implementation details in ORCHESTRATION_PLAN_V3.md Day 2-3 section.
