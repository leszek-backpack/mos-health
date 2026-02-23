# Full Pipeline Decision Tree

This document describes the complete flow for generating a pre-call brief.

## Pipeline Steps

```
Input: LinkedIn URL
  │
  ├── Step 1: Fetch LinkedIn Data (script)
  │     └── profile, experience, posts, comments, company, jobs
  │
  ├── Step 2: Classify Meeting Type + Persona
  │     ├── relationship → Relationship Brief
  │     ├── vc → VC Brief
  │     └── sales → Persona Classification
  │           ├── founder → Founder Brief
  │           ├── hr_leader → HR Leader Brief
  │           └── employee_champion → Employee Champion Brief
  │
  ├── Step 3: Worldview Analysis
  │     ├── Psychographic profile
  │     └── Sport & health signal detection
  │
  ├── Step 4: Web Research
  │     ├── Careers page & benefits
  │     ├── Job listings benefits
  │     ├── Company news & culture
  │     └── Prospect personal intel
  │
  ├── Step 5: Generate Brief
  │     ├── Sales: Sections 1-2 (brief-sales.md) → Decision Variables → Section 3 (persona-specific)
  │     ├── VC: All 3 sections (brief-vc.md)
  │     └── Relationship: All 4 sections (brief-relationship.md)
  │
  ├── Step 6: Write HTML file
  │
  └── Step 7: Create Google Doc (script)
        └── Return URL
```

## Meeting Type → Brief Mapping

| Meeting Type | Persona | Brief Prompt | Questions Source |
|---|---|---|---|
| sales | founder | brief-sales.md + brief-questions-founder.md | questions/founder.json |
| sales | hr_leader | brief-sales.md + brief-questions-hr.md | questions/hr-leader.md |
| sales | employee_champion | brief-sales.md + brief-questions-champion.md | questions/employee-champion.md |
| vc | n/a | brief-vc.md | (talking points built in) |
| relationship | n/a | brief-relationship.md | questions/relationship.md |

## Decision Variable Flow

```
LinkedIn Data + WebSearch Research
  │
  └── Prompt A (brief-sales.md) produces:
        ├── HTML Sections 1 & 2
        └── Decision Variables JSON:
              ├── culture_type
              ├── benefits_stack
              ├── benefits_includes_food
              ├── benefits_includes_wellness_stipend
              ├── wellness_competitor_detected
              ├── wellness_competitor_name
              ├── recent_achievement
              └── stress_test_signal

Worldview Analysis produces:
  ├── psychographic_summary
  ├── linkedin_health_signal
  └── linkedin_health_detail

All variables → Prompt B (persona-specific questions prompt)
  └── HTML Section 3 (Discovery Questions)
```
