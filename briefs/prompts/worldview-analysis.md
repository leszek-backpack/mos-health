# Worldview & Health Signal Analysis

Analyze the prospect's LinkedIn posts, comments, headline, and bio for psychographic signals and sport/health activity.

## Input Data Available
From the LinkedIn data you already have:
- Profile: headline, bio/about section
- Posts: recent post content and engagement
- Comments: recent comments on other posts

## Part 1: Psychographic Profile

Analyze HOW this person communicates and what they care about. Look at:
- Writing style: formal vs casual, data-driven vs emotional, concise vs verbose
- Content themes: what do they post about? What do they engage with?
- Values signals: what seems to motivate them?
- Tone markers: emojis usage, humor, seriousness, brand-consciousness

Produce a 2-3 sentence psychographic summary. Examples:
- "Data-obsessed and formal — likely skeptical of soft wellness claims and will push for ROI proof"
- "Warm and brand-conscious — uses emojis, posts about team culture frequently, leads with empathy"
- "High-energy operator — posts about speed, shipping, hiring aggressively. Views team through performance lens"

## Part 2: Sport & Health Signal Detection

Scan ALL available data for evidence of personal investment in sport, fitness, or health performance.

**Look specifically for:**
- **Sports & activities:** running, cycling, CrossFit, triathlon, marathon, swimming, climbing, hiking, tennis, padel, golf, etc.
- **Race events:** mentions of specific races (Boston Marathon, Ironman, local 10k), finish times, training blocks
- **Health protocols:** supplements (protein, creatine, electrolytes, adaptogens, nootropics), intermittent fasting, carnivore/keto/nutrition tracking, sleep optimization, cold plunge, sauna, breathwork
- **Wearables:** Whoop, Oura Ring, Garmin, Polar, Apple Watch with health tracking focus, CGM
- **Fitness culture:** gym check-ins, workout posts, sports team or club involvement, coaching

**Signals that do NOT count:**
- A single generic mention of "staying healthy"
- Company wellness program posts (about their team, not themselves)
- News articles they shared about health trends

**Output:**
- `linkedin_health_signal`: true if at least one specific, concrete signal found. false otherwise.
- `linkedin_health_detail`: if true, a specific 1-2 sentence description of exactly what you found. Include the activity type, any specific event or product mentioned, and recency if available. Example: "Marathon runner — posted Berlin Marathon finish Oct 2024 (4:12), trains with Garmin, mentioned Maurten gels in a post." If false, set to null.

## Output

Produce:
1. `psychographic_summary`: 2-3 sentence profile
2. `linkedin_health_signal`: true | false
3. `linkedin_health_detail`: specific description or null
