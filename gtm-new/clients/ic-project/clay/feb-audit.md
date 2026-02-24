# IC Project — February 2026 Audit

**Date:** February 24, 2026

---

## The Numbers

| Metric | February | Benchmark |
|--------|----------|-----------|
| Connections Sent | 506 | — |
| Accepted | 112 (22%) | 25-35% |
| Messages Sent | 115 | — |
| Replies | 37 (32%) | 15-25% |
| **Positive Replies** | **3** (2.6%) | 5-8% |
| **Demos Booked** | **0** | **10 target** |

### SDRs

| SDR | Conn Sent | Accepted | Messages | Replies |
|-----|-----------|----------|----------|---------|
| Marcin | 240 | 48 (20%) | 56 | 8 |
| Wojtek | 226 | 52 (23%) | 59 | 13 |
| Mateusz | 40 | 4 (10%) | 0 | 0 |

Mateusz launched Feb 20. Zero messages. Not contributing.

### Acceptance Rate Dying

Jul 52% → Aug 43% → Sep 26% → **Feb 22%**

---

## Reply Breakdown

**3 demo-ready** — all fumbled:
1. **Sławomir @ FRIZO** — requested demo, sent Calendly, went cold. No phone follow-up.
2. **Katarzyna @ MARION** — strongest lead (3000 briefs/year, wants off Asana). No meeting locked.
3. **Anna @ Balton** — agreed to meet, email never arrived twice. No backup channel tried.

**4 referrals** — Tomasz→Dawid (REMAK), Marek→Magdalena (Masterpress), Artur→Paweł (Kospel), Wacław→Sławomir (FRIZO). Were any actioned?

**2 deferred** — Mariusz (MTS Żory, "odezwę się"), Ziemowit (Taskoprojekt, wants materials)

**5 rejections, 2 timing, 1 unclear** — normal attrition.

---

## What's Wrong With The Copy

Every AI-generated message has the same problems:

1. **"Domyślam się, że..."** in 100% of Message 1s. AI spam fingerprint.
2. **"Cześć" + "Ty"** — too casual for manufacturing directors (45-60yr old, formal culture). Should be "Dzień dobry" + Pan/Pani.
3. **IC Project named in Message 1** — violates the gradual reveal rule.
4. **"Skąd wiesz, że..." / "Jak sprawdzacie, że..."** — passive-aggressive interrogation. Makes recipients defensive. Bolesław's reply: "Da się to ogarniać nawet w zeszycie w kratkę."
5. **No "Pozdrawiam"** — messages end abruptly. Signals automated system.
6. **PS social proof line missing** in ~60% of messages.
7. **Identical structure** across all prospects — recipients who know each other will notice.

The AI pipeline costs $15-30/run on copy generation and produces copy that sounds like a robot wrote it.

---

## The Fix: Template Copy + AI Personalization

**Kill the 3-step AI copy pipeline. Replace with templates + 1 AI-generated question per prospect.**

How it works:
1. **Scorer** (1 × gemini-2.5-flash per company) generates: qualified, tier, `personalization_hook`, `poke_question`
2. **Templates** provide the message structure (greeting, social proof, CTA, closing)
3. **Clay formulas** assemble the final message by inserting AI fields into templates

What changes:
- "Domyślam się" → "Przeczytałem o [specific fact]" (observation, not assumption)
- "Cześć" → "Dzień dobry" (formal, appropriate for directors)
- "Skąd wiesz, że..." → "Macie jedno narzędzie, czy zbieracie z kilku źródeł?" (curious binary choice)
- No IC Project in M1 → revealed in M2 only
- Always ends with "Pozdrawiam"
- Social proof with specific numbers: "Wawel (200+ projektów rocznie)"

**Example — Saferoad Production (Signal: new hall in Inowrocław):**

> Dzień dobry, przeczytałem o budowie nowej, zautomatyzowanej hali w Inowrocławiu — dużo się u Was dzieje.
>
> Przy takiej inwestycji — macie jedno narzędzie do budżetów i harmonogramów, czy zbieracie to z kilku miejsc?
>
> Współpracujemy z firmami z branży produkcyjnej, m.in. Wawelem (200+ projektów rocznie) i VOX Meble — to temat, który wraca w każdej rozmowie.
>
> Czy u Was wygląda to podobnie? Pozdrawiam

See `optimized-copy-schema.json` for all templates and `clay-table-schema.json` for Clay implementation.

---

## Immediate Actions

| # | Action | Why |
|---|--------|-----|
| 1 | Call Anna @ Balton | Email failed twice. Use phone/voice. |
| 2 | Voice message Sławomir @ FRIZO | Text isn't working. Propose specific time. |
| 3 | Send 2-min Loom to Katarzyna @ MARION | She's comparing tools. Show don't tell. |
| 4 | Message Dawid Jakubiak @ REMAK | CTO referral. Warmest possible intro. |
| 5 | Message Paweł Dobrzański @ Kospel | CEO referral. |
| 6 | Message Magdalena Walczuk @ Masterpress | Referral. |
| 7 | Follow up Mariusz @ MTS Żory Feb 27 | He said "odezwę się." |
| 8 | Send one-pager to Ziemowit @ Taskoprojekt | He asked for materials. Send them. |

---

## Cost Savings (Corrected)

| What | Before | After |
|------|--------|-------|
| Qualification scoring (2 × Pro) | $26.68/run | $0.13/run (1 × Flash) |
| Copy generation (3 AI steps) | $15-30/run | $0 (templates) |
| **Total per run (325 companies)** | **$42-57** | **$0.13** |
| **Annual savings (12 runs)** | — | **~$500-680/year** |

The $0.13/run was measured from actual test (20 companies, 28K tokens, extrapolated to 325). Not an estimate.

---

## Deliverables

| File | What |
|------|------|
| `optimized-copy-schema.json` | Template-based copy system — all M1/M2/M3 templates with natural Polish |
| `optimized-qualification-schema.json` | Scorer prompt — qualified + tier + hook + poke question |
| `clay-table-schema.json` | Complete Clay column definitions with formulas |
| `test-scorer.py` | Test harness — run against OpenRouter to validate scorer |
| `test-data/sample-companies.json` | 20 test companies from CSV |
| `test-results.md` | Detailed test results and v3→v4 comparison |
