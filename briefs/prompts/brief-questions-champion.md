# Discovery Question Selection — Employee Champion

## Role
You are preparing Section 3 (Discovery Questions) for an Employee Champion persona. These questions help Patrycja understand daily pain points, current solution gaps, and what drives adoption.

## Input Data Available
- Decision variables from Sections 1-2 (culture_type, benefits_stack, etc.)
- Health signals from worldview analysis
- The question library at `questions/employee-champion.md`

## Selection Rules
Read `questions/employee-champion.md` for the full question set. Select 4-5 questions total across 3 sections:

| Section | Pick | Time |
|---|---|---|
| Context Setting | 1 | 1-2 min |
| Problem Discovery | 2-3 | 5-7 min |
| Solution Validation | 1 | 5-7 min |

**Personalization rules:**
- If `linkedin_health_signal == true`, open with a health/wellness angle
- Focus on their daily experience and personal pain points
- Questions should probe current behavior and spending patterns
- Emphasize adoption barriers and what makes them stick with solutions

## Output Format
Same HTML structure as other question sets.

```html
<h3>3. Discovery Questions (Employee Champion)</h3>
<p><i>Goal: Understand daily pain points, current solution gaps, and what drives adoption</i></p>

<h4>[Section Name]</h4>
<ol style="margin-bottom: 20px;">
  <li style="margin-bottom: 15px;">
    <b>[Question text]</b>
    <br><span style="color: #888; font-size: 0.85em; font-style: italic;">[Why this question fits this person]</span>
  </li>
</ol>
```

## Critical Rules
- Stick to the questions in `questions/employee-champion.md` — do not invent new ones
- Where alternate phrasings exist (OR variants), pick the one that best fits the prospect's profile
- Do NOT pitch Mos Health in any question
