# LinkedIn Comment Filter - Test Cases

## Purpose
Test the Ver 2.0 prompt to ensure it correctly filters posts based on "Can Backpack contribute?" logic.

## Test Structure
For each test case:
1. **Post content** (simulated LinkedIn post)
2. **Expected classification** (TIER 1/2/3)
3. **Reasoning** (why this classification)
4. **Contribution angle** (if TIER 1 or 2)

---

## Test Case 1: AI in Sales (Core Expertise)

**Post:**
```
How we used AI to increase SDR connect rates by 40%

Our team implemented AI-powered personalization across our outbound motion. Here's the exact workflow:

1. AI scrapes prospect's LinkedIn activity
2. GPT-4 generates personalized opening lines
3. AI suggests optimal outreach timing
4. Result: 40% higher connect rate

Happy to share more details in the comments.
```

**Expected Classification:** TIER 1 (GOLD)

**Reasoning:**
- Topic: AI in sales, SDR strategy, outbound - Backpack's core expertise
- Contribution Filter: IN SCOPE (Sales, GTM, AI in business)
- Can Backpack contribute? YES - this is literally what Backpack does

**Expected Contribution Angle:**
"Share Backpack's complementary LinkedIn automation workflows and specific AI prompts we use for engagement tracking"

**Engagement Level:** HIGH

---

## Test Case 2: Pharmaceutical Logistics (Out of Scope)

**Post:**
```
The future of cold chain logistics in pharmaceutical distribution

Temperature monitoring is critical for vaccine distribution. We've reduced spoilage by 25% using IoT sensors and predictive analytics. Key innovations:

- Real-time temperature tracking
- Predictive maintenance for refrigeration units
- Blockchain for supply chain transparency

Thoughts on where this industry is headed?
```

**Expected Classification:** TIER 3 (BRONZE)

**Reasoning:**
- Initial tier: TIER 2 (shows industry expertise)
- Contribution Filter: OUT OF SCOPE (pharmaceutical-specific, logistics-specific)
- Can Backpack contribute? NO - requires pharma/logistics domain expertise
- Final tier: BRONZE (downgraded)

**Expected Contribution Angle:** N/A

**Engagement Level:** LOW (if only post like this)

---

## Test Case 3: Leadership Scaling (Adjacent)

**Post:**
```
My biggest lesson from scaling our company from 10 to 100 employees in 18 months:

Hire for values, train for skills.

When we grew fast, we made the mistake of hiring "experienced" people who didn't fit our culture. Burned us badly.

Now? We hire junior people who embody our values and invest heavily in training. Retention went from 60% to 95%.

What's your take?
```

**Expected Classification:** TIER 2 (SILVER)

**Reasoning:**
- Topic: Leadership, scaling, hiring - adjacent to Backpack's expertise
- Contribution Filter: IN SCOPE (leadership, management, culture)
- Can Backpack contribute? YES - can relate to GTM team building and scaling challenges

**Expected Contribution Angle:**
"Relate to scaling GTM/sales teams specifically - how cultural fit matters even more when building high-pressure sales orgs"

**Engagement Level:** MEDIUM (if no TIER 1 posts)

---

## Test Case 4: Manufacturing Optimization (Out of Scope)

**Post:**
```
Lean manufacturing principles applied to automotive assembly lines

We reduced waste by 25% in our assembly process using:
- Just-in-time inventory
- Kaizen continuous improvement
- 5S workplace organization
- Value stream mapping

Manufacturing leaders - what's working for you?
```

**Expected Classification:** TIER 3 (BRONZE)

**Reasoning:**
- Initial tier: TIER 2 (shows expertise)
- Contribution Filter: OUT OF SCOPE (manufacturing-specific)
- Can Backpack contribute? NO - requires manufacturing domain expertise
- Final tier: BRONZE (downgraded)

**Expected Contribution Angle:** N/A

**Engagement Level:** LOW (if only post like this)

---

## Test Case 5: Politics/Economics (Adjacent - In Scope)

**Post:**
```
My take on the Fed's rate decision and what it means for startup funding in 2026

The Fed just cut rates by 50 bps. Here's what this means for B2B SaaS startups:

1. Cheaper capital = more VC activity
2. BUT: Higher bar for Series A (profitability matters)
3. Companies that delayed fundraising can now act
4. Sales cycles may speed up as budgets loosen

Bottom line: Great time to raise if you have strong unit economics.

Agree/disagree?
```

**Expected Classification:** TIER 2 (SILVER)

**Reasoning:**
- Topic: Macro economics, startup funding, business strategy
- Contribution Filter: IN SCOPE (business strategy, macro trends)
- Can Backpack contribute? YES - can relate to how funding environment affects GTM investment decisions

**Expected Contribution Angle:**
"Relate to how funding climate affects GTM budgets and sales automation priorities - when companies should invest in RevOps vs. when they pull back"

**Engagement Level:** MEDIUM (if no TIER 1 posts)

---

## Test Case 6: Conference Attendance Only (Low Value)

**Post:**
```
Had a great time at SaaStr 2026! 🎉

Met so many amazing people. The energy was incredible. Can't wait for next year!

#SaaStr #SaaS #Startups
```

**Expected Classification:** TIER 3 (BRONZE)

**Reasoning:**
- Topic: Conference attendance (no insights)
- No strategic content, no learnings shared
- Can Backpack contribute? NO - nothing to add to "had a great time"

**Expected Contribution Angle:** N/A

**Engagement Level:** LOW

---

## Test Case 7: Conference WITH Insights (High Value)

**Post:**
```
3 GTM lessons from SaaStr 2026:

1. **Personalization beats volume**: 20 highly researched accounts > 200 spray-and-pray
2. **Timing matters more than message**: Reaching out when they're actively looking = 10x response rate
3. **Persistence wins**: Average deal takes 8 touchpoints, most SDRs quit after 2

We're implementing all three starting Monday. Here's how...

[Thread continues with specific tactics]
```

**Expected Classification:** TIER 2 (SILVER)

**Reasoning:**
- Topic: GTM strategy, sales tactics (from conference)
- Contribution Filter: IN SCOPE (GTM, sales - Backpack's core)
- Shares actual insights (not just attendance)
- Can Backpack contribute? YES - can add automation angle to these principles

**Expected Contribution Angle:**
"Share how automation amplifies these principles - e.g., AI helps personalize at scale, buyer intent signals improve timing"

**Engagement Level:** MEDIUM (if no TIER 1 posts) or could be argued as TIER 1 due to GTM tactics

---

## Test Case 8: Hiring In-Scope Role (Medium Value)

**Post:**
```
We're hiring an SDR Team Lead! 🚀

Looking for someone with:
- 5+ years SDR/BDR experience
- 2+ years managing/coaching teams
- Data-driven mindset (loves dashboards)
- Experience with Outreach/SalesLoft/Apollo
- Strong communication skills

DM me if interested or tag someone!
```

**Expected Classification:** TIER 2 (SILVER)

**Reasoning:**
- Topic: Hiring for Sales/GTM role
- Contribution Filter: IN SCOPE (sales role - Backpack understands)
- Can Backpack contribute? YES - can share insights on SDR leadership traits

**Expected Contribution Angle:**
"Share what makes a great SDR leader beyond experience - coaching ability, data fluency, process thinking. Suggest interview questions for evaluating these"

**Engagement Level:** MEDIUM

---

## Test Case 9: Hiring Out-of-Scope Role (Low Value)

**Post:**
```
We're hiring a Pharmaceutical Chemist! 🔬

Need someone with:
- PhD in Chemistry
- 10+ years drug formulation experience
- Experience with FDA submissions
- Knowledge of GMP regulations

Apply here: [link]
```

**Expected Classification:** TIER 3 (BRONZE)

**Reasoning:**
- Topic: Hiring (pharma role)
- Contribution Filter: OUT OF SCOPE (pharma-specific role)
- Can Backpack contribute? NO - cannot add value on pharma chemist hiring

**Expected Contribution Angle:** N/A

**Engagement Level:** LOW

---

## Test Case 10: Product Launch WITH GTM Insights (High Value)

**Post:**
```
We just launched our new AI feature! But more importantly - here's the GTM strategy that got us 500 signups in week 1:

**What we did:**
1. Pre-launch: Built waitlist via LinkedIn thought leadership (2 months)
2. Launch day: Coordinated Product Hunt + LinkedIn + Email
3. Post-launch: Personalized onboarding for every signup

**Key lesson:** The pre-launch phase was 80% of the work. We built anticipation by sharing our AI journey publicly - the "why" and "how we built it."

Result: 500 signups, 40% activation rate, $50k MRR added.

Thoughts?
```

**Expected Classification:** TIER 1 (GOLD)

**Reasoning:**
- Topic: GTM strategy, product launch tactics, growth
- Contribution Filter: IN SCOPE (GTM - Backpack's core)
- This is strategic content, not pure promotion
- Can Backpack contribute? YES - this is literally Backpack's domain

**Expected Contribution Angle:**
"Share how automation can scale the personalized onboarding aspect - how to deliver 1:1 feeling at scale"

**Engagement Level:** HIGH

---

## Test Case 11: Product Launch Pure Promo (Low Value)

**Post:**
```
Excited to announce: We just launched Feature X! 🎉

Check it out here: [link]

#ProductLaunch #AI #SaaS
```

**Expected Classification:** TIER 3 (BRONZE)

**Reasoning:**
- Pure promotion, no strategic insights
- No GTM lessons, no "how we did it"
- Can Backpack contribute? NO - nothing substantive to engage with

**Expected Contribution Angle:** N/A

**Engagement Level:** LOW

---

## Test Case 12: RevOps/CRM Setup (Core Expertise)

**Post:**
```
Spent the last 3 months rebuilding our RevOps stack. Here's what we learned:

**Before:** 5 disconnected tools, manual data entry, no pipeline visibility
**After:** Integrated HubSpot + Outreach + Clay, automated lead enrichment, real-time dashboards

**Key insights:**
1. Start with data architecture (clean CRM is foundation)
2. Automate repetitive work first (data entry, enrichment)
3. Build dashboards your team will actually use

ROI: Our AE's spend 70% more time selling vs. admin work.

Questions? Drop them below.
```

**Expected Classification:** TIER 1 (GOLD)

**Reasoning:**
- Topic: RevOps, CRM, sales automation - Backpack's CORE expertise
- Contribution Filter: IN SCOPE (RevOps, automation)
- Can Backpack contribute? YES - this is exactly what Backpack does

**Expected Contribution Angle:**
"Share Backpack's approach to RevOps stack integration and specific automation workflows we implement for clients"

**Engagement Level:** HIGH

---

## Test Case 13: CAD/CAM Engineering (Out of Scope)

**Post:**
```
Optimizing turbomachinery blade design using AxCent CAD/CAM software

We reduced simulation time by 40% and improved aerodynamic efficiency by 12% using advanced CFD modeling and 5-axis machining workflows.

Key innovations:
- Parametric blade design
- Automated mesh generation
- Integrated stress analysis

Aerospace engineers - what tools are you using?
```

**Expected Classification:** TIER 3 (BRONZE)

**Reasoning:**
- Initial tier: TIER 2 (shows expertise)
- Contribution Filter: OUT OF SCOPE (engineering-specific, CAD/CAM)
- Can Backpack contribute? NO - requires aerospace/mechanical engineering expertise
- Final tier: BRONZE (downgraded)

**Expected Contribution Angle:** N/A

**Engagement Level:** LOW

---

## Test Case 14: AI Hype vs Reality (Adjacent - Tech Trends)

**Post:**
```
Unpopular opinion: 90% of "AI implementations" are just ChatGPT wrappers

Real AI transformation requires:
- Proprietary data pipelines
- Custom model fine-tuning
- Human-in-the-loop workflows
- Change management

Don't get me wrong - ChatGPT is powerful. But calling it "AI transformation" is like calling Excel a "data science platform."

Thoughts?
```

**Expected Classification:** TIER 2 (SILVER)

**Reasoning:**
- Topic: AI trends, technology (general business lens)
- Contribution Filter: IN SCOPE (tech trends, AI in business)
- Can Backpack contribute? YES - can share practical AI use cases in sales/GTM

**Expected Contribution Angle:**
"Share Backpack's perspective on real AI implementation in sales - where it adds value vs. hype. Offer specific examples of AI + human workflows in GTM"

**Engagement Level:** MEDIUM

---

## Test Case 15: Generic Motivational Quote (Low Value)

**Post:**
```
"Success is not final, failure is not fatal: it is the courage to continue that counts."
- Winston Churchill

Happy Monday everyone! 💪

#MondayMotivation #Success
```

**Expected Classification:** TIER 3 (BRONZE)

**Reasoning:**
- Generic motivational quote, no original insight
- Can Backpack contribute? NO - nothing substantive to engage with

**Expected Contribution Angle:** N/A

**Engagement Level:** LOW

---

## Summary Statistics (Expected Results)

**Test Set:**
- 15 posts total

**Expected Classification:**
- **TIER 1 (GOLD)**: 3 posts (20%)
  - Test 1: AI in Sales
  - Test 10: Product Launch + GTM Insights
  - Test 12: RevOps/CRM Setup

- **TIER 2 (SILVER)**: 5 posts (33%)
  - Test 3: Leadership Scaling
  - Test 5: Politics/Economics
  - Test 7: Conference + Insights
  - Test 8: Hiring In-Scope Role
  - Test 14: AI Hype vs Reality

- **TIER 3 (BRONZE)**: 7 posts (47%)
  - Test 2: Pharmaceutical Logistics
  - Test 4: Manufacturing
  - Test 6: Conference Attendance Only
  - Test 9: Hiring Out-of-Scope
  - Test 11: Pure Promo
  - Test 13: CAD/CAM Engineering
  - Test 15: Generic Quote

**Engagement Levels:**
- HIGH: 3 posts (at least 1 GOLD)
- MEDIUM: 5 posts (no GOLD, but at least 1 SILVER)
- LOW: 7 posts (only BRONZE)

---

## Testing Instructions

1. Run Ver 2.0 prompt on each test case individually
2. Compare actual output to expected classification
3. Check if Contribution Filter correctly downgrades out-of-scope posts
4. Verify `contribution_angle` is specific and actionable (not generic)
5. Calculate accuracy: (Correct classifications / 15 total) × 100%

**Success Criteria:**
- Accuracy ≥ 90% (14/15 or better)
- All niche industry posts (Test 2, 4, 13) correctly downgraded to BRONZE
- All core expertise posts (Test 1, 10, 12) correctly classified as GOLD
- `contribution_angle` field is present and specific for all TIER 1/2 posts

---

**Document Version:** 1.0
**Last Updated:** February 5, 2026
**Purpose:** Validate Ver 2.0 prompt filtering logic
