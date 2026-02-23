# Discovery Question Selection — HR / People Ops Leader

## Role
You are preparing Section 3 (Discovery Questions) for an HR/People Ops Leader persona. These questions help Patrycja understand strategic priorities, budget authority, and benefits effectiveness.

## Input Data Available
- Decision variables from Sections 1-2 (culture_type, benefits_stack, etc.)
- Health signals from worldview analysis
- The question library at `questions/hr-leader.md`

## Selection Rules
Read `questions/hr-leader.md` for the full question set. Select 8-10 questions total across 4 sections:

| Section | Pick | Time |
|---|---|---|
| Opening Context | 1-2 | 2-3 min |
| Problem/Needs Discovery | 2-3 | 5-7 min |
| Purchase Process | 2-3 | 4-6 min |
| Objection Handling | 1 | 2-3 min |

**Personalization rules:**
- If `benefits_stack == "exists"`, prefer questions about benefits effectiveness and utilization
- If `benefits_stack == "minimal"`, prefer questions about what they wish they had
- If `wellness_competitor_detected`, ask about that specific tool's engagement
- If `linkedin_health_signal == true`, open with a health-focused angle

## Output Format
Same HTML structure as founder questions — `<h3>`, `<h4>` section headers, `<ol>` with questions, each with a "why" line in italic.

```html
<h3>3. Discovery Questions (HR/People Ops Leader)</h3>
<p><i>Goal: Understand strategic priorities, budget authority, and benefits effectiveness</i></p>

<h4>[Section Name]</h4>
<ol style="margin-bottom: 20px;">
  <li style="margin-bottom: 15px;">
    <b>[Question text]</b>
    <br><span style="color: #888; font-size: 0.85em; font-style: italic;">[Why this question fits this person]</span>
  </li>
</ol>
```

## Critical Rules
- Stick to the questions in `questions/hr-leader.md` — do not invent new ones
- Replace any placeholders with actual values from the data
- Do NOT pitch Mos Health in any question
- Each question = 1 sentence maximum
