# Persona & Meeting Type Classifier

Classify the prospect into a meeting type and (for sales meetings) a buyer persona.

## Input Data Available
You have the full LinkedIn data from `output/linkedin-data.json`:
- Profile: name, title, headline, location
- Experience: full work history with company names and descriptions
- Company profile: name, description, industry, employee count, website
- Posts and comments: recent LinkedIn activity

## Step 1: Meeting Type Classification

Classify based on the **prospect's company**:

**"relationship"** — if the prospect's company is:
- A benefits broker or benefits consulting firm
- An HR consulting or HR advisory firm
- A wellness vendor, wellness platform, or health benefits provider
- Any B2B service company that sells to HR/People teams at other companies
- A business partner, agency, or advisor in the HR/benefits/wellness space

**"vc"** — if the prospect's company is:
- A venture capital firm or VC fund
- An angel investor or angel fund
- A family office doing investment activity
- An accelerator or incubator (e.g. Y Combinator, Techstars)
- A corporate venture arm or strategic investment division
- Any investment firm, regardless of stage or focus

**"sales"** — if the prospect's company is:
- A standard business (startup, scaleup, enterprise, SMB)
- A potential customer for Mos Health (in-office team that could benefit from workplace supplementation)
- Any company that does NOT match the relationship or vc criteria above

**Priority order when ambiguous:** relationship > vc > sales
If the company type is unclear or data is missing, default to "sales".

## Step 2: Persona Classification (Sales Meetings Only)

If meeting type is "sales", classify the buyer persona:

**FOUNDER** — if:
- Title contains: "Founder", "Co-Founder", "CEO", "Chief Executive"
- AND employee count < 100
- AND title does NOT contain: "HR", "People", "Talent", "CHRO", "Chief People Officer"

**HR/PEOPLE OPS LEADER** — if:
- Title contains: "HR", "People", "Talent", "CHRO", "Chief People Officer", "VP People", "Head of People", "Director of People", "People Operations", "Human Resources"
- OR title contains: "Chief of Staff" (often handles HR in startups)

**EMPLOYEE CHAMPION** — if:
- Does NOT match Founder criteria
- Does NOT match HR Leader criteria
- Title contains: "Manager", "Lead", "Head of", "Director", "VP" (but NOT in HR/People function)
- OR title is an individual contributor role

**Important:** Always anchor evaluation to the CURRENT company. "CEO" of a side project but IC at the target = use the IC role.

## Output

Produce your classification as structured data:
- `meetingType`: "sales" | "relationship" | "vc"
- `persona` (sales only): "founder" | "hr_leader" | "employee_champion"
- `confidence`: "high" | "medium" | "low"
- `reasoning`: 1-2 sentences explaining why
