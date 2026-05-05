# Hyväksytty rahoituspäätös Slackiin

**Workflow ID:** `wflOgjAhpXQdra5Fz`
**Status:** deployed
**Tarkoitus:** Slack-tiedote rahoituspäätöksen saamisesta (juhlistava sävy).

## Trigger
*(ei vielä jaettu — täydennetään)*

## Toiminnot
1. **Generate text (AI)** — ks. [`ai_prompt.md`](ai_prompt.md)
   - Filtteri: Status ∈ {Ehdollinen päätös, Hyväksytty} JA Kategoria ∈ {Komissio, Projekti, EU-Komissio}
   - Malli: GPT-5 mini, Randomness: Low
2. **Send Slack message** — *(kanava: ei vielä jaettu)*

## Havainnot / parannusehdotukset
- Trigger-konfiguraatio ei ole vielä jaettu — täydennetään kun saadaan.
- Yhdistettävissä Lähetetty + Hylätty Slack-automaatioihin (Status-pohjainen haarautus).
