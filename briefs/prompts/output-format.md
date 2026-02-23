# HTML Output Format — Quality Rules

## Structure
All briefs must follow this HTML structure:

```html
<h1>MEETING BRIEF</h1>
<!-- or: MEETING BRIEF — INVESTOR CALL / MEETING BRIEF — RELATIONSHIP CALL -->

<h3>1. [Section Name]</h3>
<ul style="margin-bottom: 20px;">
  <li style="margin-bottom: 10px;"><b>Field:</b> Value</li>
</ul>

<h3>2. [Section Name]</h3>
<ul style="margin-bottom: 20px;">
  <li style="margin-bottom: 12px;"><b>Field:</b> Value</li>
</ul>

<h3>3. [Section Name]</h3>
<!-- Questions use <ol> with <h4> sub-sections -->
```

## Formatting Rules

1. **Output raw HTML only.** No markdown. No preamble text outside HTML tags.
2. **Keep spacing tight.** Use `<ul>` and `<li>` for data. Do NOT use `<p>` tags inside lists.
3. **Section headers:** `<h3>` for main sections, `<h4>` for sub-sections.
4. **Links:** All LinkedIn URLs, company websites, and news sources must be clickable `<a href>` tags.
5. **News citations:** Every news item must include `(Source: <a href="URL">Source Name</a>)`.
6. **Bold field names:** Use `<b>Field:</b>` for each data point.
7. **Nested lists:** Use `<ul>` inside `<li>` for sub-points (e.g., Relevance bullets, news items).
8. **Questions format:**
   - `<ol>` for numbered questions
   - `<b>` for question text
   - `<span style="color: #888; font-size: 0.85em; font-style: italic;">` for "why" line
   - GREEN questions get ✦ appended inside `<b>` tag
9. **Follow-up questions (relationship briefs):** Use `<ul><li><i>Follow-up:</i> ...</li></ul>` inside the `<li>`

## Quality Checklist

Before finalizing any brief, verify:
- [ ] Every field has a specific value (not "standard package" or "typical startup")
- [ ] "Not found" is used where data is genuinely missing (never generic filler)
- [ ] All links are clickable
- [ ] All news items have source URLs
- [ ] Question count is within target range for the persona
- [ ] At least one GREEN question (✦) per applicable section
- [ ] No Mos Health pitch language in discovery questions
- [ ] HTML is well-formed (all tags properly closed)

## Style Inline CSS Reference

```
Section list items: style="margin-bottom: 10px;"
Person overview items: style="margin-bottom: 12px;"
Question list items: style="margin-bottom: 15px;"
Section bottom: style="margin-bottom: 20px;"
Nested list top: style="margin-top: 5px;"
Nested list items: style="margin-bottom: 5px;"
Why text: style="color: #888; font-size: 0.85em; font-style: italic;"
Talking point detail: style="color: #555; font-size: 0.9em;"
```
