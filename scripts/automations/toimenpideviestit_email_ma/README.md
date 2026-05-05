# Toimenpideviestit, email (ma)

**Workflow ID:** `wflj6qmS7aKA1wjPG`
**Status:** deployed
**Tarkoitus:** Lähettää maanantaina aamulla sähköpostimuistutukset toimenpiteistä, joiden pvm on viikonlopun aikana (past 2 days).

## Trigger
- Tyyppi: At scheduled time
- Aikataulu: viikoittain Mon **8:00am EEST**, alkaen 17.9.2025

## Toiminnot
1. **Find records** — Asiantuntijat-taulu, ehdot:
   - `Kategoria` = Toimenpide
   - `Toimenpide, pvm` is within **the past 2 days** (EEST)
   - `Viesti toimenpiteestä` = kyllä
   - `Kanava` has any of: Email
   - `Status` is none of: Hylätty, Peruttu
   - `Toimenpide tehty` = false
2. **Send email** (per löytynyt rivi)
   - To/Subject/Body sama kuin ti-pe-versiossa: ks. [`../toimenpideviestit_email_ti_pe/email_message.md`](../toimenpideviestit_email_ti_pe/email_message.md)

## Havainnot
- Pari toimenpideviestit_email_ti_pe -automaation kanssa: yhdessä kattavat ma-pe.
- Yhdistettävissä: yksi cron Mon-Fri + dynaaminen window (ma → past 2 days, muut → today).
