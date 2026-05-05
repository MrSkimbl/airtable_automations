# Toimenpideviestit, slack (ma)

**Workflow ID:** `wflwogRWFQUxvxwgH`
**Status:** deployed
**Tarkoitus:** Lähettää maanantaina aamulla Slack-muistutukset toimenpiteistä, joiden pvm on viikonlopun aikana (past 2 days). Estää että lauantain/sunnuntain toimenpiteet jäävät huomaamatta.

## Trigger
- Tyyppi: At scheduled time
- Aikataulu: viikoittain Mon **8:00am EEST**, alkaen 13.9.2025

## Toiminnot
1. **Find records** — Asiantuntijat-taulu, ehdot:
   - `Kategoria` = Toimenpide
   - `Toimenpide, pvm` is within **the past 2 days** (EEST)
   - `Viesti toimenpiteestä` = kyllä
   - `Kanava` has any of: Slack
   - `Status` is none of: Hylätty, Peruttu
   - `Toimenpide tehty` = false
2. **Send Slack message** (per löytynyt rivi)
   - Sama viestipohja kuin ti-pe-versiossa: ks. [`../toimenpideviestit_slack_ti_pe/slack_message.md`](../toimenpideviestit_slack_ti_pe/slack_message.md)

## Havainnot
- Pari toimenpideviestit_slack_ti_pe -automaation kanssa: yhdessä kattavat ma-pe.
- Voisi yhdistää: yhdellä cron-ehdolla "Mon-Fri 8am" + dynaaminen ehto skriptissä (ma → past 2 days, muut → today). Säästäisi duplikaation.
