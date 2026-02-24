# LinkedIn Comment Filter: Ver 1.0 vs Ver 2.0 Comparison

## Overview

This document compares the two versions of the LinkedIn post classification prompt, showing what changed and why.

---

## High-Level Changes

| Aspect | Ver 1.0 | Ver 2.0 |
|--------|---------|---------|
| **Core Philosophy** | Classify by content type | Classify by **"Can we contribute?"** |
| **TIER 2 Definition** | Any industry expertise | Only adjacent topics Backpack understands |
| **Niche Industry Posts** | Classified as SILVER | Downgraded to BRONZE (filtered out) |
| **Output Fields** | 3 fields per post | 4 fields per post (+ `contribution_angle`) |
| **Filter Steps** | 2 steps | 3 steps (+ Contribution Scope Filter) |

---

## Detailed Comparison

### 1. TIER 1 (GOLD) Definition

#### Ver 1.0:
> "Posts where the prospect shares advice, philosophy, or deep thoughts on: Sales Strategy, Leadership, Personal Productivity, AI applied to Business Strategy"

#### Ver 2.0:
> "Posts where prospect shares advice/philosophy on topics where **Backpack is a recognized expert**: Sales Strategy, SDR/BDR, GTM, AI in Sales/Marketing/Business, RevOps, CRM, Sales automation, Lead gen, Sales leadership"

**Change:** More specific scope, explicitly lists Backpack's core expertise domains.

**Impact:** ✅ Same classification in practice, more clarity.

---

### 2. TIER 2 (SILVER) Definition - **MAJOR CHANGE**

#### Ver 1.0:
> "Posts where the prospect analyzes **market trends** or **specific domain challenges outside of Sales**. Examples: 'Impact of World Cup on Payments,' 'Future of Logistics in 2026,' 'Regulatory changes in Pharma.'"

**Problem:** This catches ANY industry expertise, even if Backpack can't credibly comment (pharma, manufacturing, logistics, etc.)

#### Ver 2.0:
> "Posts on business/leadership topics where Backpack can contribute a **credible, valuable perspective** even if not a primary expert: Business strategy, growth scaling, leadership, tech trends (SaaS, AI), politics/macro trends, work culture, hiring (in-scope roles), conference insights (if GTM/Sales/AI)"

**Explicit exclusions added:**
- ❌ Pharma R&D, clinical practices
- ❌ Manufacturing processes
- ❌ Logistics specifics (cold chain, warehousing)
- ❌ Engineering (CAD/CAM, machinery)
- ❌ Legal/regulatory deep-dives (non-GTM)
- ❌ Hospitality operations

**Change:** TIER 2 now requires "can we add credible value?" check. Niche industry posts filtered out.

**Impact:** 🎯 Filters out 30-50% of Ver 1.0 SILVER posts that were outside Backpack's credible scope.

---

### 3. NEW: Contribution Scope Filter (Step 2.5)

#### Ver 1.0:
*Does not exist*

#### Ver 2.0:
```
**Step 2.5: Contribution Scope Filter (NEW)**

For each post classified as TIER 1 or TIER 2, apply this filter:

Ask: "Can Backpack add CREDIBLE, VALUABLE insight to this post?"

✅ IN SCOPE (Keep):
- Core: Sales, GTM, RevOps, AI in business
- Adjacent: Strategy, leadership, tech, politics, culture

❌ OUT OF SCOPE (Downgrade to TIER 3):
- Niche industry-specific: Pharma, manufacturing, logistics, clinical, legal, engineering, hospitality
```

**Change:** Entirely new filtering step that downgrades posts Backpack can't credibly comment on.

**Impact:** 🚫 Prevents commenting on posts where Backpack would sound generic or inauthentic.

---

### 4. Output Format Changes

#### Ver 1.0:
```json
{
  "tier": "Gold",
  "post_link": "URL or null",
  "post_summary": "One-sentence summary"
}
```

#### Ver 2.0:
```json
{
  "tier": "Gold",
  "post_link": "URL or null",
  "post_summary": "One-sentence summary",
  "contribution_angle": "Specific angle for Backpack's comment"
}
```

**Change:** Added `contribution_angle` field with specific suggestions for HOW to comment.

**Impact:** ✅ Makes commenting easier - gives you a starting angle instead of staring at a blank comment box.

---

## Example Classification Changes

### Example 1: Pharmaceutical Post ❌→✅ FIXED

**Post:** "The future of cold chain logistics in pharmaceutical distribution"

| Version | Classification | Engagement | Issue |
|---------|----------------|------------|-------|
| **Ver 1.0** | TIER 2 (SILVER) | MEDIUM | ❌ Backpack can't comment on pharma logistics |
| **Ver 2.0** | TIER 3 (BRONZE) | LOW | ✅ Correctly filtered out as "out of scope" |

**Ver 2.0 Reasoning:**
- Initial tier: SILVER (shows industry expertise)
- Contribution Filter: OUT OF SCOPE (pharma-specific)
- Final tier: BRONZE (downgraded)
- Result: No comment attempted

---

### Example 2: Politics/Economics Post ✅→✅ KEPT

**Post:** "My take on the Fed's rate decision and what it means for startup funding"

| Version | Classification | Engagement | Quality |
|---------|----------------|------------|---------|
| **Ver 1.0** | TIER 2 (SILVER) | MEDIUM | ✅ Works, but no guidance on HOW to comment |
| **Ver 2.0** | TIER 2 (SILVER) | MEDIUM | ✅ Works + `contribution_angle` provided |

**Ver 2.0 Output:**
```json
{
  "tier": "Silver",
  "post_link": "...",
  "post_summary": "Discusses Fed rate cuts impact on startup funding environment",
  "contribution_angle": "Relate to how funding climate affects GTM investment decisions and sales automation priorities for startups"
}
```

**Ver 2.0 Reasoning:**
- Initial tier: SILVER (macro trends, startup context)
- Contribution Filter: IN SCOPE (relates to business strategy)
- Final tier: SILVER (kept)
- **NEW**: Gives you an angle to comment from

---

### Example 3: AI in Sales Post ✅→✅ KEPT

**Post:** "How we used AI to increase SDR connect rates by 40%"

| Version | Classification | Engagement | Quality |
|---------|----------------|------------|---------|
| **Ver 1.0** | TIER 1 (GOLD) | HIGH | ✅ Works |
| **Ver 2.0** | TIER 1 (GOLD) | HIGH | ✅ Works + contribution angle |

**Ver 2.0 Output:**
```json
{
  "tier": "Gold",
  "post_link": "...",
  "post_summary": "Shares AI workflow for boosting SDR connect rates",
  "contribution_angle": "Share Backpack's complementary LinkedIn automation workflows and AI prompts we use"
}
```

---

### Example 4: Manufacturing Post ❌→✅ FIXED

**Post:** "Lean manufacturing principles applied to automotive assembly lines"

| Version | Classification | Engagement | Issue |
|---------|----------------|------------|-------|
| **Ver 1.0** | TIER 2 (SILVER) | MEDIUM | ❌ Backpack has zero credibility in manufacturing |
| **Ver 2.0** | TIER 3 (BRONZE) | LOW | ✅ Correctly filtered out |

**Ver 2.0 Reasoning:**
- Initial tier: SILVER (shows expertise)
- Contribution Filter: OUT OF SCOPE (manufacturing-specific)
- Final tier: BRONZE (downgraded)
- Result: No comment attempted

---

### Example 5: Conference Post (Attendance Only) ✅→✅ KEPT CONSISTENT

**Post:** "Had a great time at SaaStr! #SaaStr2026"

| Version | Classification | Engagement |
|---------|----------------|------------|
| **Ver 1.0** | TIER 3 (BRONZE) | LOW |
| **Ver 2.0** | TIER 3 (BRONZE) | LOW |

**Reasoning:** Both versions correctly classify attendance-only as BRONZE.

---

### Example 6: Conference Post (With Insights) ✅→✅ IMPROVED

**Post:** "3 GTM lessons from SaaStr: 1) Personalization beats volume 2) Timing matters more than message 3) Persistence wins. Here's how we applied each..."

| Version | Classification | Engagement | Quality |
|---------|----------------|------------|---------|
| **Ver 1.0** | TIER 3 (BRONZE) | LOW | ❌ Misclassified - has valuable insights |
| **Ver 2.0** | TIER 2 (SILVER) | MEDIUM | ✅ Correctly classified + contribution angle |

**Ver 2.0 Output:**
```json
{
  "tier": "Silver",
  "post_link": "...",
  "post_summary": "Shares 3 GTM lessons from SaaStr conference with applications",
  "contribution_angle": "Add Backpack's perspective on how automation amplifies these principles"
}
```

**Ver 2.0 Reasoning:**
- Initial tier: SILVER (shares insights, GTM topic)
- Contribution Filter: IN SCOPE (GTM is core domain)
- Final tier: SILVER (kept)
- Edge case rule applied: "Conference + insights + in-scope topic → SILVER"

---

### Example 7: Hiring Post (In-Scope Role) ❌→✅ IMPROVED

**Post:** "We're hiring an SDR Team Lead - looking for someone with 5+ years experience, strong coaching skills, data-driven mindset"

| Version | Classification | Engagement | Issue |
|---------|----------------|------------|-------|
| **Ver 1.0** | TIER 3 (BRONZE) | LOW | ❌ Misclassified - this is commentable |
| **Ver 2.0** | TIER 2 (SILVER) | MEDIUM | ✅ Correctly classified + contribution angle |

**Ver 2.0 Output:**
```json
{
  "tier": "Silver",
  "post_link": "...",
  "post_summary": "Hiring SDR Team Lead with emphasis on coaching and data skills",
  "contribution_angle": "Share insights on what makes a great SDR leader - traits, pitfalls, how to evaluate coaching ability in interviews"
}
```

**Ver 2.0 Reasoning:**
- Initial tier: SILVER (hiring, team building)
- Contribution Filter: IN SCOPE (SDR/sales role - Backpack's expertise)
- Final tier: SILVER (kept)
- Edge case rule applied: "Hiring for in-scope role → SILVER"

---

### Example 8: Hiring Post (Out-of-Scope Role) ✅→✅ KEPT CONSISTENT

**Post:** "Looking for a pharmaceutical chemist with 10 years drug formulation experience"

| Version | Classification | Engagement |
|---------|----------------|------------|
| **Ver 1.0** | TIER 3 (BRONZE) | LOW |
| **Ver 2.0** | TIER 3 (BRONZE) | LOW |

**Reasoning:** Both versions correctly classify out-of-scope hiring as BRONZE.

---

## Edge Case Handling Improvements

### 1. Conference Posts

| Scenario | Ver 1.0 | Ver 2.0 |
|----------|---------|---------|
| Attendance only: "Great time at XYZ Conf!" | TIER 3 ✅ | TIER 3 ✅ |
| Insights + in-scope: "3 GTM lessons from SaaStr..." | TIER 3 ❌ | TIER 2 ✅ |
| Insights + out-of-scope: "Pharma conf learnings..." | TIER 2 ❌ | TIER 3 ✅ |

**Ver 2.0 Rule:** Conference + insights + in-scope topic → TIER 2

---

### 2. Hiring Posts

| Scenario | Ver 1.0 | Ver 2.0 |
|----------|---------|---------|
| In-scope role: "Hiring SDR Team Lead" | TIER 3 ❌ | TIER 2 ✅ |
| Out-of-scope role: "Hiring pharma chemist" | TIER 3 ✅ | TIER 3 ✅ |
| Generic: "We're hiring!" (no details) | TIER 3 ✅ | TIER 3 ✅ |

**Ver 2.0 Rule:** Hiring for Sales/GTM roles Backpack understands → TIER 2

---

### 3. Promotional Posts

| Scenario | Ver 1.0 | Ver 2.0 |
|----------|---------|---------|
| Pure promo: "Check out our new feature!" | TIER 3 ✅ | TIER 3 ✅ |
| Promo + insights: "Launching X - our GTM strategy" | TIER 3 ❌ | TIER 1/2 ✅ |

**Ver 2.0 Rule:** Promotional content WITH strategic insights (GTM, lessons) → TIER 1 or TIER 2

---

## Performance Impact

### Expected Filtering Changes

**Ver 1.0 TIER 2 (SILVER) posts:**
- 100% kept (no filtering)

**Ver 2.0 TIER 2 (SILVER) posts:**
- ~50-70% kept (in-scope)
- ~30-50% downgraded to TIER 3 (out-of-scope niche industry)

**Example breakdown** (100 SILVER posts):
- 60-70 posts: Business strategy, leadership, tech trends, politics → KEPT as SILVER
- 30-40 posts: Pharma, manufacturing, logistics, clinical, engineering → DOWNGRADED to BRONZE

---

## Why This Matters

### Ver 1.0 Problem:
You'd comment on pharma posts where Backpack has zero credibility → **Damages credibility, wastes time**

### Ver 2.0 Solution:
Only comment where Backpack can add **credible, valuable insight** → **Builds credibility, saves time**

---

## Migration Guide

If you're currently using Ver 1.0:

1. **Review existing TIER 2 (SILVER) posts**: ~30-50% may now be TIER 3 (out-of-scope)
2. **Check for niche industry posts**: Pharma, manufacturing, logistics, clinical → Should be filtered out
3. **Use `contribution_angle`**: New field helps you know HOW to comment
4. **Update expectations**: MEDIUM engagement may drop (more TIER 2 posts filtered out), but quality increases

---

## Summary Table

| Feature | Ver 1.0 | Ver 2.0 |
|---------|---------|---------|
| **Core Philosophy** | Content-type classification | Can-we-contribute filter |
| **TIER 2 Scope** | Any industry expertise | Only adjacent topics |
| **Niche Industry Posts** | Classified as SILVER (❌) | Filtered to BRONZE (✅) |
| **Conference (insights)** | BRONZE (❌) | SILVER if in-scope (✅) |
| **Hiring (in-scope role)** | BRONZE (❌) | SILVER (✅) |
| **Promo (with insights)** | BRONZE (❌) | TIER 1/2 if strategic (✅) |
| **Output Guidance** | No comment guidance | `contribution_angle` field (✅) |
| **False Positives** | High (~30-50% unactionable) | Low (~5-10%) |
| **Comment Quality** | Variable (some generic) | High (credible or nothing) |

---

## Bottom Line

**Ver 1.0:** "What tier is this content?"

**Ver 2.0:** "Can Backpack credibly add value to this conversation?"

**Result:** Fewer comments, higher quality, stronger credibility.

---

**Document Version:** 1.0
**Last Updated:** February 5, 2026
