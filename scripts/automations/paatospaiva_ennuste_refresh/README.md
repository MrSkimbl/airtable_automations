# Päätöspäivä, ennusteet refresh

**Workflow ID:** `wfl4bYDFg7UWppASo`
**Status:** deployed
**Tarkoitus:** Päivittää Komissio-rivien `Päätöspäivä, ennuste` -kentän
- A) jos tyhjä ja ankkuri löytyy → ankkuri + bucket-päivät (ELY/non-ELY × low/mid/high)
- B) jos olemassa mutta menneisyydessä tai < 3 pv → "tänään + siirto"

Tulossa/Työn alla -rivien `Arvioitu valmistuminen` siirretään myös today+7 jos se on menneisyydessä.

## Trigger
- Tyyppi: At scheduled time
- Aikataulu: joka **3 päivän välein** klo **1:15am EEST**, alkaen 20.11.2025

## Toiminnot
1. **Run script** — ks. [`script.js`](script.js)

## Bugihistoria
- 2026-05-04: error `"Record \"recXXX\" was specified twice in this request"` kun sama rivi sai sekä estimate-bumpin että forecast-päivityksen samassa batchissa. Korjattu: per-record-merger Mapilla.
