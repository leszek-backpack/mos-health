# IC Project — Gold Standard Messages (M1)

Reference document for prompt optimization. Each message follows Josh Braun's 4T framework:
**T1 (Trigger)** → **T2 (Think)** → **T3 (Third-party)** → **T4 (Talk)**

Rules applied:
- 50-100 words, 1 sentence per paragraph
- Formal Polish: Dzień dobry, u Was (no Cześć, no Ty)
- No product name in M1
- Hook in genitive (dopełniacz) — works after "przeczytałem o..."
- Poke question about DAILY project management, not about the signal event
- Binary choice (A or B) in poke for easy response
- "Pozdrawiam" closing

---

## 1. FOGO (P1 | Projektowa | event)

**Company:** Largest Polish generator manufacturer, 60 employees. Building new production hall in Wilkowice (8-37M PLN). Launching new products (inverter generator F 5001 iSG).

**Scorer output:**
- signal_type: `event`
- personalization_hook: `rozbudowie hali produkcyjno-magazynowej w Wilkowicach`
- poke_question: `Przy takim wzroście — koordynacja projektów między R&D a produkcją to jedno narzędzie, czy raczej Excel i spotkania?`

**Assembled M1:**

> Dzień dobry, przeczytałem o rozbudowie hali w Wilkowicach — dużo się u Was dzieje.
>
> Przy takim wzroście — koordynacja projektów między R&D a produkcją to jedno narzędzie, czy raczej Excel i spotkania?
>
> Współpracujemy m.in. z Wawelem (200+ projektów rocznie) i VOX Meble — to temat, który wraca w każdej rozmowie.
>
> Czy u Was wygląda to podobnie? Pozdrawiam

**Word count:** 55
**Why it works:** Signal is the REASON to reach out (hall expansion), but the question is about DAILY coordination (R&D vs production). Binary choice makes it easy to answer. No assumptions, no teaching.

---

## 2. EMBS (P1 | Montażowa | event)

**Company:** Advanced battery systems manufacturer, 104 employees. Opened new 10,000m² plant in Greenville, USA. Custom battery solutions for e-bikes, power tools, appliances.

**Scorer output:**
- signal_type: `event`
- personalization_hook: `otwarciu zakładu produkcyjnego w Greenville w USA`
- poke_question: `Przy dwóch zakładach na dwóch kontynentach — statusy projektów widać w jednym miejscu, czy każdy zespół prowadzi to po swojemu?`

**Assembled M1:**

> Dzień dobry, przeczytałem o otwarciu zakładu w Greenville — sporo się u Was zmienia.
>
> Przy dwóch zakładach na dwóch kontynentach — statusy projektów widać w jednym miejscu, czy każdy zespół prowadzi to po swojemu?
>
> Firmy produkcyjne, z którymi współpracujemy — jak Wawel czy VOX Meble — mierzyły się z tym samym pytaniem.
>
> Ciekaw jestem, jak to wygląda u Was. Pozdrawiam

**Word count:** 57
**Why it works:** The two-continent angle makes the coordination question feel natural and specific. "Prowadzi po swojemu" vs "jedno miejsce" is a real operational dilemma.

---

## 3. KB Folie (P1 | Konsumpcyjnych | event)

**Company:** Flexible packaging producer, 73 employees. Two plants (Warsaw + Halinów), 7 printers, 6 laminators, 16 converting machines. Custom packaging for clients.

**Scorer output:**
- signal_type: `event`
- personalization_hook: `skali produkcji w dwóch zakładach — Warszawie i Halinowie`
- poke_question: `Przy dwóch lokalizacjach — planowanie zleceń to jeden system, czy informacja krąży między zakładami?`

**Assembled M1:**

> Dzień dobry, przeczytałem o skali produkcji w dwóch zakładach — Warszawie i Halinowie.
>
> Przy dwóch lokalizacjach — planowanie zleceń to jeden system, czy informacja krąży między zakładami?
>
> Pracujemy m.in. z Wawelem, który koordynuje setki wdrożeń produktowych rocznie — to ich stały temat.
>
> Czy u Was wygląda to podobnie? Pozdrawiam

**Word count:** 50
**Why it works:** Names specific cities (verifiable fact). Question is about information flow between locations — a real pain point for multi-site manufacturers.

---

## 4. TECH Sterowniki (P1 | Montażowa | generic)

**Company:** Largest Polish boiler controller manufacturer, 146 employees. Produces microprocessor devices for heating systems. Uses Comarch ERP XL but relies on Excel.

**Scorer output:**
- signal_type: `generic`
- personalization_hook: `Waszej specjalizacji w sterownikach do systemów grzewczych`
- poke_question: `Przy tak szerokim portfolio — koordynacja między działami to jedno miejsce na statusy, czy każdy dział prowadzi po swojemu?`

**Assembled M1:**

> Dzień dobry, przeczytałem o Waszej specjalizacji w sterownikach do systemów grzewczych — to zwróciło moją uwagę.
>
> Przy tak szerokim portfolio — koordynacja między działami to jedno miejsce na statusy, czy każdy dział prowadzi po swojemu?
>
> Firmy produkcyjne, z którymi współpracujemy — jak Wawel czy VOX Meble — mierzą się z tym samym pytaniem.
>
> Jak to wygląda u Was? Pozdrawiam

**Word count:** 53
**Why it works:** No event signal, so hook describes what the company DOES. "Tak szerokie portfolio" is a natural bridge to the coordination question. Generic signal doesn't mean generic message.

---

## 5. Alchemia (P3 | Projektowa | generic)

**Company:** Steel producer since 1811, 75 employees. Seamless pipes in 400+ steel grades. 4 plants across Poland (Chorzów, Częstochowa, Zawadzkie, Dąbrowa Górnicza).

**Scorer output:**
- signal_type: `generic`
- personalization_hook: `produkcji rur w ponad 400 gatunkach stali i czterech zakładach w Polsce`
- poke_question: `Przy czterech lokalizacjach — status każdego zlecenia widać w jednym miejscu, czy każdy zakład prowadzi to osobno?`

**Assembled M1:**

> Dzień dobry, przeczytałem o produkcji rur w ponad 400 gatunkach stali i czterech zakładach — to zwróciło moją uwagę.
>
> Przy czterech lokalizacjach — status każdego zlecenia widać w jednym miejscu, czy każdy zakład prowadzi to osobno?
>
> Współpracujemy m.in. z Wawelem (200+ projektów rocznie) i VOX Meble — to temat, który wraca w każdej rozmowie.
>
> Czy u Was wygląda to podobnie? Pozdrawiam

**Word count:** 55
**Why it works:** "400 gatunków stali, cztery zakłady" immediately establishes complexity. The coordination question follows naturally from the geographic spread.

---

## Patterns to Codify in Scorer Prompt

### Hook rules:
1. Always in genitive (dopełniacz) — must work after "przeczytałem o..."
2. Contains ONE concrete fact: location, number, product type
3. 5-15 words max
4. For events: reference the event ("rozbudowie hali w Wilkowicach")
5. For generic: reference what company does ("produkcji rur w 400 gatunkach stali")

### Poke question rules:
1. Format: "Przy [short reference, max 5 words] — [binary question about daily project management]"
2. Binary choice: "A, czy B?" or "jedno X, czy Y?"
3. About DAILY operations (coordination, visibility, status tracking) — NOT about the signal event
4. Max 25 words (1-2 sentences)
5. Common question patterns:
   - "...jedno narzędzie, czy raczej Excel i spotkania?"
   - "...statusy widać w jednym miejscu, czy każdy [dział/zakład] prowadzi po swojemu?"
   - "...jeden system, czy informacja krąży między [X]?"

### Banned phrases:
- "Domyślam się, że..." — assumes they have a problem
- "Skąd Pan wie, że..." — interrogation
- "Zauważyłem, że..." — surveillance
- "Jak Pan sprawdza..." — implies failure
- "Nie martwi Pana, że..." — fear-mongering
- Any mention of IC Project name

### Signal_type must match hook:
- If hook mentions construction/investment/expansion → signal_type = "event"
- If hook mentions recruitment/hiring → signal_type = "hiring"
- If hook describes the company's products/operations → signal_type = "generic"
