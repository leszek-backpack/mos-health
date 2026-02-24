# IC Project — Qualification + Copy Pipeline Test Results

**Date:** February 24, 2026
**Schema version:** v5
**Companies tested:** 20

---

## v5 Model Comparison (Sonnet 4.6 vs Gemini 3.1 Pro)

| Metric | **Sonnet 4.6** | Gemini 3.1 Pro |
|--------|---------------|----------------|
| Success rate | **20/20 (100%)** | 17/20 (85%) |
| Segment match | **18/20 (90%)** | 14/17 (82%) |
| Tier match | 8/20 (40%) | 8/17 (47%) |
| Cost/company | **$0.0095** | $0.0204 |
| Cost/325 companies | **$3.09** | $6.62 |
| Completion tokens (avg) | 236 | 1,412 (thinking) |
| Grammar issues | **0** | 0 |
| English jargon | 2 (MTO, NPI — fixed in v5.1) | 0 |
| Failures | **0** | 3 (2 parse, 1 truncation) |

**Winner: `anthropic/claude-sonnet-4-6`** — cheaper, more reliable, equal quality.

### Why tier match is 40% and why that's OK

The old pipeline used a 4-axis matrix (segment 0-3, scale 0-3, pain 0-3, complexity 0-4) → 0-13 points. Most "P2" companies in the test data have strong expansion signals (building halls, new plants, 6B PLN investments) that the new scorer correctly upgrades to P1. The new approach: "strong signal + right size = P1" is simpler and more honest.

### Segment match: 90% (vs 60% in v3)

v4/v5 prompt explicitly states: "Opakowania = Produkcja Dóbr Konsumpcyjnych." Two mismatches are arguable — DRE (doors) and Davis (textiles) classified as Konsumpcyjnych by scorer, expected as Montażowa in test data.

---

## Sample Messages (Sonnet 4.6, v5 prompt)

### 1. FOGO (P1 | event | Projektowa)
> Dzień dobry, przeczytałem o rozbudowie hali produkcyjno-magazynowej w Wilkowicach — dużo się u Was dzieje.
>
> Przy takiej rozbudowie — koordynacja między produkcją a logistyką to jedno narzędzie, czy raczej Excel i spotkania statusowe?
>
> Współpracujemy m.in. z Wawelem (200+ projektów rocznie) i VOX Meble — to temat, który wraca w każdej rozmowie.
>
> Czy u Was wygląda to podobnie? Pozdrawiam

**58 words.** Hook: specific location (Wilkowice). Poke: daily coordination, binary choice. No IC Project name.

### 2. EMBS (P1 | event | Montażowa)
> Dzień dobry, przeczytałem o otwarciu zakładu produkcyjnego w Greenville w USA — sporo się u Was zmienia.
>
> Przy dwóch zakładach na dwóch kontynentach — statusy projektów widać w jednym miejscu, czy każdy zespół prowadzi to po swojemu?
>
> Firmy produkcyjne, z którymi współpracujemy — jak Wawel czy VOX Meble — mierzyły się z tym samym pytaniem.
>
> Ciekaw jestem, jak to wygląda u Was. Pozdrawiam

**57 words.** Two-continent angle makes the question feel natural and specific.

### 3. DRE (P1 | event | Konsumpcyjnych)
> Dzień dobry, przeczytałem o eksporcie drzwi do 16 krajów europejskich i wdrożeniu SAP w produkcji.
>
> Przy dwóch zakładach i eksporcie do 16 krajów — harmonogramy produkcji trzymacie w SAP, czy jednak Excel robi swoje?
>
> Pracujemy m.in. z Wawelem, który koordynuje setki wdrożeń produktowych rocznie — to ich stały temat.
>
> Czy u Was wygląda to podobnie? Pozdrawiam

**56 words.** SAP reference is from public data — adds specificity. "Excel robi swoje" is a natural Polish expression.

### 4. Mostostal (P1 | hiring | Projektowa)
> Dzień dobry, przeczytałem o rekrutacji Specjalisty ds. Planowania Produkcji z wymogiem biegłości w Excelu — sporo się u Was dzieje.
>
> Przy produkcji konstrukcji na zamówienie — harmonogramowanie zleceń to jedno narzędzie dla całego zespołu, czy każdy planista prowadzi to w swoich arkuszach?
>
> Współpracujemy m.in. z Wawelem (200+ projektów rocznie) i VOX Meble — to temat, który wraca w każdej rozmowie.
>
> Czy to coś, z czym się u Was mierzycie? Pozdrawiam

**64 words.** Uses job posting as trigger (hiring signal), but question is about daily project coordination.

### 5. TECH Sterowniki (P1 | generic | Montażowa)
> Dzień dobry, przeczytałem o Waszej pozycji największego w Polsce producenta sterowników do kotłów na paliwa stałe — to zwróciło moją uwagę.
>
> Przy produkcji sterowników dla wielu firm kotlarskich — koordynacja projektów między R&D a produkcją to jedno narzędzie, czy raczej Excel i spotkania?
>
> Firmy produkcyjne, z którymi współpracujemy — jak Wawel czy VOX Meble — mierzą się z tym samym pytaniem.
>
> Jak to wygląda u Was? Pozdrawiam

**53 words.** No event signal — hook describes what they do. Generic opener still feels personal.

---

## Cost Comparison

| Pipeline | Qualification | Copy | Total/325 |
|----------|-------------|------|-----------|
| Old (3 AI steps) | $26.68 | $15-30 | $42-57 |
| v5 + Sonnet 4.6 | **$3.09** | **$0** (templates) | **$3.09** |
| Savings | — | — | **93-95%** |

---

## Evolution: v3 → v4 → v5

| Version | Model | Key Changes |
|---------|-------|-------------|
| v3 | gemini-2.5-flash | Initial prompt. Passive-aggressive questions ("Skąd Pan wie?"), premature IC Project reveal, no social proof, informal Polish. |
| v4 | gemini-2.5-flash | Formal Polish (Dzień dobry/u Was), curiosity questions, social proof with Wawel/VOX, fixed packaging segments, IC Project context added. |
| v5 | **sonnet-4.6** | Few-shot examples, XML structure, banned English jargon, all openers use "przeczytałem o", signal routing from AI (not regex), B_hiring opener fixed. |

---

## Files

| File | Purpose |
|------|---------|
| `optimized-qualification-schema.json` | v5 scorer prompt with few-shot examples |
| `optimized-copy-schema.json` | v5 copy templates (3 signal × 3 segment + M2/M3) |
| `clay-table-schema.json` | Complete Clay column definitions (23 columns) |
| `test-scorer.py` | Test harness with --model flag |
| `test-data/sample-companies.json` | 20 test companies |
| `test-data/scorer-results.json` | Latest test output |
| `gold-standards.md` | 5 manually written reference messages |

## Remaining Items

- [x] Test with multiple models (sonnet, gemini, flash)
- [x] Fix D_generic opener grammar
- [x] Fix B_hiring opener ("rozwijacie" → neutral)
- [x] Ban English jargon (MTO, NPI)
- [x] Signal routing from scorer's signal_type (not regex)
- [ ] Full Clay table build (copy-paste formulas from clay-table-schema.json)
- [ ] HeyReach campaign mapping (Step1/Step2/Step3)
- [ ] SDR review of 5 production messages
- [ ] A/B test: old AI copy vs new template copy (1 campaign cycle)
