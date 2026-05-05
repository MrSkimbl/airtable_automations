# Toimenpideviestit, email (ti-pe) copy

**Workflow ID:** `wflsdoGlLlhdXNJ58`
**Status:** deployed
**Tarkoitus:** Lähettää tänään ajankohtaisten toimenpiderivien sähköpostimuistutukset asiantuntijoille tiistai–perjantai aamuisin.

## Trigger
- Tyyppi: At scheduled time
- Aikataulu: viikoittain Tue, Wed, Thu, Fri **8:00am EEST**, alkaen 13.9.2025

## Toiminnot
1. **Find records** — Asiantuntijat-taulu, ehdot:
   - `Kategoria` = Toimenpide
   - `Toimenpide, pvm` is **today** (EEST)
   - `Viesti toimenpiteestä` = kyllä
   - `Kanava` has any of: **Email**
   - `Status` is none of: Hylätty, Peruttu
   - `Toimenpide tehty` = false
2. **Send email** (per löytynyt rivi)
   - To: `{{Asiantuntija.List of 'email'}}`
   - Subject: `Toimenpide: {{Asiakas}}, {{Toimenpide, pvm}}`
   - Body: ks. [`email_message.md`](email_message.md)

## Havainnot
- Workflow nimessä "copy" — todennäköisesti aiemman duplikointi. Nimeä uudelleen.
- Pari toimenpideviestit_slack_ti_pe -automaation kanssa (sama trigger, eri kanava).
