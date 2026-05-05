# Vanhentuneiden toimenpiteiden poistaminen

**Workflow ID:** `wfljOa3Mtob2KrA1t`
**Status:** deployed
**Tarkoitus:** Siivoaa Asiantuntijat-taulusta toimenpiderivit joiden `Toimenpide, pvm` on yli 60 päivää sitten.

## Trigger
- Tyyppi: At scheduled time
- Aikataulu: viikoittain Sun **9:00am EEST**, alkaen 2.10.2025

## Toiminnot
1. **Find records** — Asiantuntijat-taulu, ehdot:
   - `Kategoria` = Toimenpide
   - `Toimenpide, pvm` is before **60 days ago** (EET)
   - max 1000
2. **Repeating group** — iteroi löydetyt rivit
   - Input: Record ID (Current item)
   - **Run script** — ks. [`script.js`](script.js) (poistaa rivin)

## Havainnot
- Skripti palauttaa siististi virheen jos rivi on jo poistettu — hyvä.
- 60 päivää saattaa olla turhan tiukka jos toimenpiteitä halutaan säilyttää historiana. Harkitse arvon nostoa tai checkbox `Toimenpide tehty` -ehtoa (poista vain valmiit).
