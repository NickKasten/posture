# Team 2: AI Engine & Coach

**Timeline:** Days 2-6 (AI Engine), Days 9-11 (AI Intern)
**Dependencies:** Teams 1, 6 (context, security)
**Provides To:** Teams 3, 4 (post content)

## Primary Objectives

### Days 2-4: AI Post Generation
- Integrate GPT-5 API with structured prompts (Zod validation)
- Build split-pane editor (post editor + AI chat)
- Implement tone adjustment (technical/casual/inspiring)
- Add version history for posts
- Implement AI provider fallback (OpenAI → Groq)

### Days 5-6: AI Career Coach
- Build conversational brand manager (15-20 questions)
- Store brand profile (tone embeddings, topics, style)
- Implement bi-monthly review sessions
- Adaptive learning from user edits

### Days 9-11: AI Intern (Autonomous Agent)
- Implement 3 autonomy modes (manual, semi-auto, full-auto)
- Add global kill switch (emergency stop)
- Build autonomous posting + engagement logic
- Daily summary emails

## Type-Safe Implementation

```typescript
// Brand profile
interface BrandProfile {
  tone: string[];
  topics: string[];
  styleExamples: string[];
  toneEmbedding?: number[];
}

// AI Intern state machine
type InternState =
  | { mode: 'manual'; approvalsRequired: number }
  | { mode: 'semi-auto'; batchSize: number }
  | { mode: 'fully-auto'; trustLevel: number; killSwitch: boolean };
```

## Success Criteria
- [ ] >90% of AI-generated posts published unedited
- [ ] AI Coach NPS >50
- [ ] AI Intern enabled by 30% of Premium users

## User Verification
- **Day 4 End:** Generate post, verify quality
- **Day 6 End:** Complete AI Coach session, verify tone accuracy
- **Day 11 End:** Test AI Intern semi-auto mode, verify kill switch

---

**See full spec:** Complete implementation in ORCHESTRATION_PLAN_V3.md Days 2-6, 9-11.
