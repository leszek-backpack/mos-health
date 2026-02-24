# IC Project — Personalization Brief

**Client:** IC Project (icproject.com)
**Market:** Polish SMEs — Construction & Manufacturing
**Language:** Polish (all personalization copy in Polish)

---

## Signal Buckets

Four prioritized buckets determine the personalization approach for each prospect. Always use the highest-quality signal available.

### Bucket A: Major Business Event

**Quality Score: 5/5** — Highest. Specific, timely, and directly relevant.

| Vertical | Signal Examples |
|---|---|
| Construction | Recently won a large contract (new development, infrastructure project, public tender) |
| Manufacturing | Launching new product line, new production capacity |

**Detection sources:** Press releases, KRS filings, public tender databases (TED, BZP), company news, industry portals

**Personalization formula:**
1. **Observation** — "Widziałem, że [company] wygrał przetarg na [project]..."
2. **Implication** — "Koordynacja [X] podwykonawców na [Y] obiektach to wyzwanie..."
3. **Bridge** — Connect the implication to IC Project's value proposition

**Example (Construction):**
> Widziałem, że {{company_name}} wygrał przetarg na {{recent_project}} — gratulacje. Koordynacja kilkunastu podwykonawców na projekcie tej skali to moment, kiedy Excel i email zazwyczaj przestają wystarczać. Firmy takie jak ATAL rozwiązały to z IC Project...

**Example (Manufacturing):**
> Zauważyłem, że {{company_name}} uruchamia nową linię produkcyjną {{recent_project}}. Koordynacja R&D, produkcji i logistyki w fazie launchu to dokładnie scenariusz, w którym Wawel zaczął korzystać z IC Project...

---

### Bucket B: Hiring Signal

**Quality Score: 4/5** — Strong signal but less specific than a contract win.

| Vertical | Signal Examples |
|---|---|
| Construction | Hiring Project Managers, Site Coordinators, Planning Engineers |
| Manufacturing | Hiring Operations Managers, Production Planners, Quality Directors |

**Detection sources:** LinkedIn job postings, Pracuj.pl, company career pages, GoldenLine

**Personalization formula:**
> "Zauważyłem, że szukacie [role title] — to często sygnał, że koordynacja projektów staje się wyzwaniem..."

**Example (Construction):**
> Zauważyłem, że {{company_name}} szuka {{hiring_role}} — zatrudnianie na te stanowiska to często sygnał, że liczba projektów przerosła dotychczasowe narzędzia. Zanim nowy kierownik wdroży własne metody, warto mieć wspólny standard...

**Example (Manufacturing):**
> Widzę, że szukacie {{hiring_role}} w {{city}}. Firmy produkcyjne na etapie rozbudowy zespołu operacyjnego najczęściej odkrywają, że brak jednego narzędzia do koordynacji kosztuje ich 5-10h tygodniowo na każdego managera...

---

### Bucket C: Expansion / Multi-site Growth

**Quality Score: 4/5** — Strong, implies scaling pain.

| Vertical | Signal Examples |
|---|---|
| Construction | Opening new regional offices, starting projects in new cities |
| Manufacturing | New plant construction, additional production lines, warehouse expansion |

**Detection sources:** KRS filings, construction permits, local press, company announcements

**Personalization formula:**
> "Ekspansja [company] do [new city/region] to ekscytujący krok — widzieliśmy, jak firmy na tym etapie potrzebują..."

**Example (Construction):**
> Ekspansja {{company_name}} do {{city}} to ekscytujący krok. Kiedy ATAL rozszerzał się na 7 miast, koordynacja między biurami stała się ich największym wyzwaniem — rozwiązali to wdrażając IC Project jako centralną platformę projektową...

**Example (Manufacturing):**
> Rozbudowa zakładu {{company_name}} w {{city}} to duży krok naprzód. Widzieliśmy, jak producenci na tym etapie tracą kontrolę nad projektami wdrożeniowymi — 3-6 miesięcy koordynacji między działami, gdzie każdy tydzień opóźnienia kosztuje...

---

### Bucket D: No Signal (Generic Industry Pain)

**Quality Score: 2/5** — Generic. Use only for Tier 2-3 accounts when no trigger is available.

| Vertical | Generic Pain Angle |
|---|---|
| Construction | "Firmy budowlane zarządzające 5+ projektami jednocześnie zazwyczaj tracą X godzin tygodniowo na raportowanie..." |
| Manufacturing | "Producenci z 3+ liniami produkcyjnymi często zgłaszają, że koordynacja międzydziałowa to ich największe wyzwanie..." |

**Example (Construction):**
> Firmy budowlane z {{employee_count}}+ pracownikami, zarządzające kilkoma projektami jednocześnie, zazwyczaj tracą 8-12 godzin tygodniowo na raportowanie statusów i koordynację podwykonawców. IC Project automatyzuje ten proces...

**Example (Manufacturing):**
> Producenci w branży {{industry}} z kilkoma liniami produkcyjnymi najczęściej zgłaszają, że koordynacja między działami — od planowania przez produkcję po logistykę — to ich największe operacyjne wyzwanie...

---

## Variable Architecture

Three tiers of personalization variables, escalating in research effort and impact.

### Tier 1 Variables — Auto-populated (no research needed)

These come directly from the CRM or enrichment list. Zero marginal cost per prospect.

| Variable | Source | Example |
|---|---|---|
| `{{company_name}}` | CRM/list | Budimex S.A. |
| `{{first_name}}` | CRM/list | Tomasz |
| `{{title}}` | LinkedIn/CRM | Dyrektor ds. Projektów |
| `{{industry}}` | CRM segmentation | construction / manufacturing |
| `{{city}}` | Company HQ location | Kraków |
| `{{employee_count}}` | CRM enrichment | 250 |

### Tier 2 Variables — Enrichment-derived (Clay/data tools)

Require automated enrichment pipelines. Medium cost, high impact.

| Variable | Source | Example |
|---|---|---|
| `{{recent_project}}` | Press/tenders/Clay | Osiedle Botanica w Gdańsku |
| `{{tech_stack}}` | BuiltWith/Clay | Microsoft Project, Asana |
| `{{hiring_role}}` | LinkedIn Jobs/Pracuj.pl | Kierownik Budowy (3 stanowiska) |
| `{{company_news}}` | Google Alerts/Clay | Ekspansja na rynek niemiecki |
| `{{competitor_tool}}` | Clay/manual research | Planradar, Monday.com |

### Tier 3 Variables — Research-derived (manual, Tier 1 accounts only)

High-touch research for top-priority accounts. Reserved for accounts with >10k ACV potential.

| Variable | Source | Example |
|---|---|---|
| `{{specific_pain}}` | LinkedIn posts, interviews | "Nasz raport z budowy zajmuje 4h co tydzień" (LinkedIn post) |
| `{{mutual_connection}}` | LinkedIn | Jan Kowalski, VP at XYZ |
| `{{content_reference}}` | Blog/LinkedIn/conference | Wystąpienie na BUDMA 2026 o digitalizacji |
| `{{industry_benchmark}}` | IC Project data/research | Firmy budowlane Waszej wielkości oszczędzają śr. 12h/tydzień |
| `{{case_study_parallel}}` | IC Project case studies | ATAL — podobna skala, 7 miast, 200+ projektów |

---

## Quality Scoring Thresholds

Each outreach email receives a quality score (1-5) based on signal bucket + variable tier.

| Score | Label | Variables Used | Signal Bucket | Use Case |
|---|---|---|---|---|
| **5** | Custom | Tier 3 + Tier 2 + Tier 1 | Bucket A | Tier 1 accounts only |
| **4** | High | Tier 2 + Tier 1 | Bucket B or C | Standard for Tier 1-2 accounts |
| **3** | Medium | Tier 1-2 mix | Bucket B or C | Acceptable for Tier 2 accounts |
| **2** | Low | Tier 1 only | Bucket D | Only for Tier 3 or high-volume campaigns |
| **1** | None | Template only | None | Never send — requeue for enrichment |

---

## Allocation Rules

| Account Tier | Minimum Score | Target Score | Acceptable Bucket |
|---|---|---|---|
| Tier 1 (Strategic) | 4 | 5 | A, B, C |
| Tier 2 (Target) | 3 | 4 | A, B, C, D (if enriched) |
| Tier 3 (Volume) | 2 | 3 | Any |
| Any tier | — | — | **Never send Score 1** — always enrich first |

### Enforcement
- Score 1 emails are automatically held in queue, flagged for enrichment
- Score 2 emails require manual approval before sending to Tier 1-2 accounts
- Score 4-5 emails are auto-approved for send
- Weekly audit: sample 10% of sent emails, verify score accuracy
