# Decision Variables Reference

All conditional variables used across prompts for dynamic question selection and content routing.

## Classification Variables

| Variable | Source | Values | Used By |
|---|---|---|---|
| `meetingType` | Persona Classifier | "sales" \| "relationship" \| "vc" | Pipeline routing |
| `persona` | Persona Classifier | "founder" \| "hr_leader" \| "employee_champion" | Question prompt selection |

## Worldview Variables

| Variable | Source | Values | Used By |
|---|---|---|---|
| `psychographic_summary` | Worldview Analysis | 2-3 sentence profile | Section 2 (Psychographics) |
| `linkedin_health_signal` | Worldview Analysis | true \| false | Opener selection, Section 2 |
| `linkedin_health_detail` | Worldview Analysis | Specific description \| null | Opener personalization, Section 2 |

## Decision Variables (from Sections 1-2 generation)

| Variable | Values | Description | Used By |
|---|---|---|---|
| `culture_type` | "Goal-Oriented" \| "People-Oriented" \| "Mix" \| "Unknown" | Company culture classification | Opening question selection |
| `benefits_stack` | "minimal" \| "exists" | "minimal" if score ≤ 1 or list empty | Purchase Process question |
| `benefits_includes_food` | true \| false | Catered lunch, free food, snacks detected | Conditional question trigger |
| `benefits_includes_wellness_stipend` | true \| false | Wellness stipend or LSA detected | Conditional question trigger |
| `wellness_competitor_detected` | true \| false | Lyra, Gympass, etc. found in benefits | Wellness Competitor section |
| `wellness_competitor_name` | string \| null | Exact name of competitor | Question text substitution |
| `recent_achievement` | string \| null | Most notable recent achievement | Personalized question, rapport |
| `stress_test_signal` | true \| false | Evidence of polite non-commitment | Stress Test section inclusion |

## How Variables Flow

```
LinkedIn Data + WebSearch
  │
  ├── Worldview Analysis → linkedin_health_signal, linkedin_health_detail, psychographic_summary
  │
  ├── Sections 1-2 (brief-sales.md) → culture_type, benefits_stack, benefits_includes_food,
  │     benefits_includes_wellness_stipend, wellness_competitor_detected, wellness_competitor_name,
  │     recent_achievement, stress_test_signal
  │
  └── All variables → Section 3 (persona-specific questions prompt)
```

## Condition Examples from Question Library

- `linkedin_health_signal == true` → Use health-signal opener variant
- `linkedin_health_signal == false` → Use no-signal opener variant
- `culture_type == 'Goal-Oriented'` → Use output/bottleneck framing
- `culture_type == 'People-Oriented'` → Use people/scaling framing
- `benefits_stack == 'minimal'` → Ask about last tool purchase process
- `benefits_includes_food == true` → Ask about what else keeps team sharp beyond food
- `wellness_competitor_detected == true` → Ask about competitor utilization
- `stress_test_signal == true` → Include 1 stress test question
