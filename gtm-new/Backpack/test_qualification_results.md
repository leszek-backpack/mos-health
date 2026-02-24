# Prompt C Validation - 10 Company Test

## Test Objective
Validate that Prompt C (company qualification) correctly:
1. Identifies LinkedIn-active vs LinkedIn-inactive buyer personas
2. Handles geographic market scope (domestic-only Europe → DQ)
3. Distinguishes competitors from non-competitors
4. Scores multi-dimensional fit appropriately
5. Routes edge cases to NEEDS_REVIEW

## Test Companies

### Expected Distribution
- **Should QUALIFY** (estimate 4-5): Global B2B SaaS with LinkedIn-active personas
- **Should DISQUALIFY** (estimate 4-5): Domestic-only, wrong personas, competitors, or B2C
- **Should route to NEEDS_REVIEW** (estimate 1-2): Borderline cases

---

## Company Research & Qualification Results

Awaiting research completion...

---

## Success Criteria

✅ **Precision**: All QUALIFIED companies truly fit Backpack's ICP
✅ **Recall**: No false negatives (qualified companies wrongly disqualified)
✅ **Edge Case Routing**: Ambiguous cases correctly routed to NEEDS_REVIEW
✅ **Reasoning Quality**: Specific persona mentions, evidence cited, clear logic trail
✅ **Geographic Check**: Domestic-only European companies correctly disqualified

## Scoring
- Pass rate: 8/10+ correct qualifications = GOOD
- Pass rate: 9/10+ correct = EXCELLENT
- Edge case handling: Must correctly identify any borderline cases

---

_Test run: [Date to be added]_
_Prompt version: Prompt C v1.0 with geographic market criteria_
