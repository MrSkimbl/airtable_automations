# Automaatio-inventaario (API-vahvistettu)

> Lähde: `GET /v0/meta/bases/app5bwxdTTUmbSyUK/automations`
> Snapshot: [`../../schema/automations.json`](../../schema/automations.json) — päivitetty 2026-05-04

**Yhteensä 23 automaatiota** — 22 deployattu, 1 undeployed.

## Mitä Meta API EI anna

- Trigger-konfiguraatio (taulu / ehdot / cron-ajastus) — vain trigger-tyyppi
- Action-konfiguraatio (mitä kenttää päivitetään, mitä Slack-kanavaa, jne.)
- Scriptien lähdekoodi — tarkistettava UI:sta tai `scripts/`-kansiosta
- Ajohistoria / virhelogit

Näiden tietojen päivitys vaatii Airtable-UI:n manuaalisen tarkistuksen.

## Deployatut automaatiot (22)

| Nimi | Trigger | Toiminnot | Live-versio | Workflow ID |
|------|---------|-----------|-------------|-------------|
| Airtable row value created | When record created | Run script | 428 | `wflKRfZ14GrixR0Dp` |
| asiakasrivien linkitys, jatkuva | When record updated | Run script | 90 | `wflngJYnS4G7GBlSG` |
| Bonusrajat | When record updated | Run script | 17 | `wflnssQKhF7xBWg6a` |
| data_bug_bot | Schedule (cron) | Send Slack → Run script | 26 | `wflu0DbPt7knMYoiz` |
| Hylätty rahoituspäätös Slackiin copy | When record updated | Send Slack → AI generate → — | 634 | `wflfRx3msnYUe9HPL` |
| Hyväksytty rahoituspäätös Slackiin | When record updated | AI generate → Send Slack → — | 656 | `wflOgjAhpXQdra5Fz` |
| Hyväksytystä testimoniaali | When record matches conditions | Create record | 51 | `wflLTC3dGCNkQ4s34` |
| komissiot kuukausisarakkeisiin | When record updated | Run script | 18 | `wfldIHYhl0767fdKE` |
| Liikevaihdon kirjaukset | When record updated | Run script | 42 | `wfl8vwXu6wHI5QLTC` |
| Lähetetty hakemus Slackiin | When record updated | Send Slack → AI generate → — | 606 | `wflnI2c8M9bfeEADj` |
| Palvelupaketit | When record updated | Run script | 16 | `wflgaKuv2QGlh94Kw` |
| Päätöspäivä, ennusteet refresh | Schedule (cron) | Run script | 16 | `wfl4bYDFg7UWppASo` |
| Tilikauden laskenta | Webhook in | Run script | 51 | `wflKTRdcFMFSH8j6H` |
| Tilikauden laskenta, scheduled | Schedule (cron) | Run script | 52 | `wflA62AwiIZgrtccL` |
| Toimenpideviestit, email (ma) | Schedule (cron) | Send email (beta) → Find records → — → — | 331 | `wflj6qmS7aKA1wjPG` |
| Toimenpideviestit, email (ti-pe) copy | Schedule (cron) | Find records → Send email (beta) → — → — | 331 | `wflsdoGlLlhdXNJ58` |
| Toimenpideviestit, slack (ma) | Schedule (cron) | Find records → Send Slack → — → — | 290 | `wflwogRWFQUxvxwgH` |
| Toimenpideviestit, slack (ti-pe) | Schedule (cron) | Find records → Send Slack → — → — | 289 | `wflPppOVempEBwrDH` |
| Toimenpiteet taulun muutokset | When record updated | Run script → — | 39 | `wflAahyro3wWNb8dQ` |
| Toimenpiteet1 | When record updated | Run script | 100 | `wflHYHRgCIa8aT6kO` |
| Vanhentuneiden toimenpiteiden poistaminen | Schedule (cron) | Find records → Run script → — → — | 96 | `wfljOa3Mtob2KrA1t` |
| Viestiasetus-taulun muutokset | When record updated | Run script | 25 | `wflRivYJdK69rhZo1` |

## Undeployed / luonnokset (1)

Nämä eivät ole tuotannossa. Voi olla wip-luonnoksia, vanhoja kokeiluja tai pysäytettyjä automaatioita.

| Nimi | Trigger | Toiminnot | Status | Workflow ID |
|------|---------|-----------|--------|-------------|
| Airtable row value updated | When record updated | Run script | undeployed | `wflZKFBYRMjJrTsSI` |

## Päivitysohje

```bash
# .env:stä luetaan AIRTABLE_TOKEN ja AIRTABLE_BASE_ID
set -a; source .env; set +a

# 1. Päivitä snapshot
curl -s -H "Authorization: Bearer $AIRTABLE_TOKEN" \
  "https://api.airtable.com/v0/meta/bases/$AIRTABLE_BASE_ID/automations" \
  -o schema/automations.json

# 2. Generoi tämä dokumentti uudelleen
node scripts/build_automations_doc.js
```
