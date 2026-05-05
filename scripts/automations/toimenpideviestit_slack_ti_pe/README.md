# Toimenpideviestit, slack (ti-pe)

**Workflow ID:** `wflPppOVempEBwrDH`
**Status:** deployed
**Tarkoitus:** Lähettää tänään ajankohtaisten toimenpiderivien Slack-muistutukset asiantuntijoille tiistai–perjantai aamuisin.

## Trigger
- Tyyppi: At scheduled time
- Aikataulu: viikoittain Tue, Wed, Thu, Fri **8:00am EEST**, alkaen 13.9.2025

## Toiminnot
1. **Find records** — Asiantuntijat-taulu, ehdot:
   - `Kategoria` = Toimenpide
   - `Toimenpide, pvm` is **today** (EEST)
   - `Viesti toimenpiteestä` = kyllä
   - `Kanava` has any of: Slack
   - `Status` is none of: Hylätty, Peruttu
   - `Toimenpide tehty` = false
2. **Send Slack message** (per löytynyt rivi, repeat-ryhmä)
   - Kanava: `{{SlackId}}` (henkilökohtainen)
   - Bot: Asiakkuusbotti (`:asiakkuusbotti:`)
   - Viesti: ks. [`slack_message.md`](slack_message.md)
