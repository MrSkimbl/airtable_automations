# Hylätty rahoituspäätös Slackiin copy

**Workflow ID:** `wflfRx3msnYUe9HPL`
**Status:** deployed
**Tarkoitus:** Slack-tiedote #general-kanavalle kun rahoitushakemus hylätään (pahoitteleva sävy).

## Trigger
- Tyyppi: When record updated
- Taulu: Asiantuntijat
- Watched fields: `Status`

## Toiminnot
1. **Generate text (AI)** — ks. [`ai_prompt.md`](ai_prompt.md)
   - Filtteri: Status = `Hylätty` JA Kategoria ∈ {Komissio, Projekti, EU-Komissio}
   - Malli: Default (GPT-4.1), Randomness: Low
2. **Send Slack message** — kanava `#general`

## Havainnot / parannusehdotukset
- Workflow nimessä "copy" — todennäköisesti aiemman duplikointi. Nimeä uudelleen.
- Sama trigger ja kohde kuin Hyväksytty/Lähetetty — yhdistettävissä yhdeksi automaatioksi (Status-pohjainen haarautus).
