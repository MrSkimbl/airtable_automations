# Lähetetty hakemus Slackiin

**Workflow ID:** `wflnI2c8M9bfeEADj`
**Status:** deployed
**Tarkoitus:** Slack-tiedote #general-kanavalle kun rahoitushakemus on lähetetty rahoittajalle.

## Trigger
- Tyyppi: When record updated
- Taulu: Asiantuntijat
- Watched fields: `Status`

## Toiminnot
1. **Generate text (AI)** — ks. [`ai_prompt.md`](ai_prompt.md)
   - Filtteri: Status = `Lähetetty` JA Kategoria ∈ {Komissio, Projekti}
   - Malli: Default (GPT-4.1), Randomness: Low
2. **Send Slack message** — kanava `#general`

## Datan tarpeet promptissa
- Asiakas, Instrumentti, Asiantuntija (etunimi), Projektin koko €, Haettu tukisumma €

## Havainnot / parannusehdotukset
- Trigger laukeaa kaikissa Status-muutoksissa, mutta AI-step suoritetaan vain Lähetetty + Komissio/Projekti -ehdolla. Muut Status-muutokset ohitetaan ilman virhettä mutta turhaan.
- Suositus: vaihda triggeri "When record matches conditions" → laukaa vain kun Status = Lähetetty AND Kategoria ∈ {Komissio, Projekti} AND `Projektin koko` is not empty AND `Haettu tukisumma` is not empty.
- Yhdistettävissä Hyväksytty/Hylätty-Slack-automaatioihin yhdeksi (Status-pohjainen haarautus AI-promptissa).
