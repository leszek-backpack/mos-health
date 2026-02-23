# Benefits Dictionary & Scoring Rubric

## Benefits Categories

### Basic Benefits
- 401k / Retirement
- Medical insurance
- Dental insurance
- Vision insurance
- Unlimited PTO
- Equity / Stock options

### Premium Benefits
- LSA (Lifestyle Spending Account)
- Wellness Stipend
- Mental Health Benefits (therapy, EAP)
- Gym membership / On-site gym
- Free Lunch / Catered meals
- Snacks / Stocked kitchen
- Commuter Benefits

### Ultra-Premium Benefits
- Sabbaticals
- Fertility support (Carrot, Maven, Progyny)
- Student Loan Repayment
- 100% Paid Family Healthcare
- Extended parental leave (beyond legal minimum)

### Wellness Validation Signals
If any of these appear, it signals existing wellness investment:
- Lyra Health
- Spring Health
- One Medical
- Modern Health
- Headspace for Work
- Gympass / Wellhub
- BetterHelp (employer plan)

## Benefits Score (0-5)

| Score | Criteria |
|---|---|
| 0 | No benefits detected |
| 1 | Basic benefits only (401k, medical, dental, vision) |
| 2 | Basic + 1 premium perk |
| 3 | Basic + 2-3 premium/in-office perks |
| 4 | Basic + 4 premium perks |
| 5 | Basic + 5+ premium perks OR any ultra-premium benefit |
| +1 | Wellness validation signal detected (max total: 5) |

## Benefits Classification
- **Basic Benefits:** Only basic tier benefits exist
- **Premium Benefits:** At least 2 premium benefits detected
- **Ultra-Premium Benefits:** At least 1 ultra-premium benefit detected
- **Unknown:** No benefits data found

## Tier Assignment

| Tier | Criteria |
|---|---|
| Tier 1 | USA presence + Hybrid/In-Office + Benefits Score ≥ 5 |
| Tier 2 | USA presence + Hybrid/In-Office + Benefits Score < 5 |
| Tier 3 | USA presence + Unknown work model OR missing data |
| Disqualified | Remote-first OR Zombie Office (0 active jobs/employees) |

## Physical Office Proof Signals
These perks prove physical office presence (even if work model policy is unclear):
- Catered lunch / Free food
- Stocked kitchen / Snacks
- Commuter benefits / Clipper card
- Parking benefits
- On-site gym
- Dog-friendly office
- Team happy hours (in-person)

If these are found but work model says "Unknown", override to "Hybrid" (inferred from perks).

## HR Investment Score (0-10)

### Part 1: Benefits Stack (0-5 points)
Use the Benefits Score directly.

### Part 2: Leadership Noise (0-5 points)

| Points | Signal |
|---|---|
| 0 | No news about culture, OR CEO only discusses product/mission |
| 2 | External validation: "Best Place to Work" awards, generic culture mentions |
| 5 | Internal manifesto: CEO/HR publishes about management philosophy, hiring, "How we work" |

**Total = Part 1 + Part 2** (max 10)
