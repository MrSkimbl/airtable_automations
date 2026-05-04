# Airtable-automaatiot — projektin juuri

Tämä on työkansio Grants Funding Oy:n Airtable-basen ("Asiakas & hakemuskanta - AT") automaatioiden kehittämiseen ja korjaamiseen.

> **Base ID:** `app5bwxdTTUmbSyUK`
> **Status:** alustus käynnissä — pohjatyö 2026-05-04

---

## Kansiorakenne

```
Airtable automaatiot/
├── .env                       ← API-tunnukset (EI commitoida — ks. .gitignore)
├── .env.example               ← Esimerkki ympäristömuuttujista
├── .gitignore
├── README.md                  ← Tämä tiedosto
│
├── airtable-automaatio-opas/  ← Pääasiallinen dokumentaatio (portable-paketti)
│   ├── README.md              ← Oppaan oma indeksi
│   ├── 01_base_rakenne.md     ← Basen rakenne (API-pohjainen, 11 taulua)
│   ├── 02_scripting_kaytannot.md
│   ├── 03_ai_agentti_checklista.md
│   └── 04_automaatiot/        ← Olemassa olevien automaatioiden kuvaukset
│
├── schema/                    ← Raaka schema-data API:sta
│   └── base_schema_full.json  ← Snapshot: kaikki taulut + kentät + valinnat
│
└── scripts/                   ← Tähän tulevat varsinaiset .js-skriptit
                                  (Airtable Scripting -laajennus & Automation actions)
```

---

## Pikastartti

1. **Lue dokumentaatio järjestyksessä:** `airtable-automaatio-opas/README.md` → `01_base_rakenne.md` → muut.
2. **Tarkista schema:** `schema/base_schema_full.json` sisältää API:n viimeisimmät kentät, tyypit ja choice-ID:t.
3. **Tunnukset:** kopioi `.env.example` → `.env` ja täytä `AIRTABLE_TOKEN`. Tokenia ei jaeta repo-historiaan.

---

## Schema-päivitys

Kun base muuttuu Airtablen UI:ssa (uusia kenttiä tai valintoja), päivitä snapshot:

```bash
curl -s -H "Authorization: Bearer $AIRTABLE_TOKEN" \
  "https://api.airtable.com/v0/meta/bases/$AIRTABLE_BASE_ID/tables" \
  -o schema/base_schema_full.json
```

Päivitä sen jälkeen `airtable-automaatio-opas/01_base_rakenne.md` jos rakenne muuttui.

---

## Automaatiolista

Airtable Meta API **paljastaa automaatioiden rakenteen** (`/v0/meta/bases/{baseId}/automations`) — nimet, deployment-status, trigger- ja action-tyypit. **EI** scriptien sisältöä eikä trigger/action-konfiguraatiota.

> **Inventaario API:sta:** [`airtable-automaatio-opas/04_automaatiot/_API_inventaario.md`](airtable-automaatio-opas/04_automaatiot/_API_inventaario.md) — 31 työnkulkua (22 deployattu, 9 undeployed).

**Päivitys:** `node scripts/build_automations_doc.js` (lukee `schema/automations.json`).

### Vanhasta dokumentaatiosta tunnistetut, kuvaukset löytyvät:

| Tunnistettu nimi | API-vastine | Dokumentti |
|-----------------|------------|-----------|
| `liikevaihdon_kirjaukset_automaatio` | `Liikevaihdon kirjaukset` (deployed) | [liikevaihto.md](airtable-automaatio-opas/04_automaatiot/liikevaihto.md) |
| `komissiot_kuukausisarakkeisiin` | `komissiot kuukausisarakkeisiin` (deployed) | [komissiot_kuukausisarakkeisiin.md](airtable-automaatio-opas/04_automaatiot/komissiot_kuukausisarakkeisiin.md) |
| `tilikausi_update` / `bonusraja_tavoite_update` | `Tilikauden laskenta` + `Bonusrajat` (deployed) | [tilikausi.md](airtable-automaatio-opas/04_automaatiot/tilikausi.md) |
| `paatospaiva_ennuste_update` | `Päätöspäivä, ennusteet refresh` (deployed) | [ennusteet.md](airtable-automaatio-opas/04_automaatiot/ennusteet.md) |
| `data_bug_bot` | `data_bug_bot` (deployed) | [data_bug_bot.md](airtable-automaatio-opas/04_automaatiot/data_bug_bot.md) |
| `tilikausi_manuaalinen` | (manuaalinen Scripting-extension, ei automaatio) | [tilikausi.md](airtable-automaatio-opas/04_automaatiot/tilikausi.md) |
| `luo_liikevaihtorivit_uudelleen` | (manuaalinen Scripting-extension) | [liikevaihto.md](airtable-automaatio-opas/04_automaatiot/liikevaihto.md) |

**Lisää API:ssa, ei vielä dokumentoituna:** `Tilikauden laskenta, scheduled`, `Toimenpideviestit (slack/email × ma/ti-pe)`, `Hyväksytty/Hylätty/Lähetetty rahoituspäätös Slackiin`, `Hyväksytystä testimoniaali`, `Vanhentuneiden toimenpiteiden poistaminen`, `Palvelupaketit`, `asiakasrivien linkitys`, `Toimenpiteet1` / `Toimenpiteet taulun muutokset`, `Viestiasetus-taulun muutokset`, `Airtable row value created` — ks. inventaario.

---

## Schema-yhteenveto (API)

**11 taulua:**

| # | Taulu | Table ID | Tärkein muutos vs. v1.0-doks |
|---|-------|----------|-----------------------------|
| 1 | Asiantuntijat | `tblRdgQNtY3sZT0lV` | +tilikausi 26-27 -kuukausikentät, useat formula-korjaukset |
| 2 | Myynti | `tbluPmvPs96wU9Y1G` | — |
| 3 | Toimenpiteet | `tblQEz11Y4292qMEu` | — |
| 4 | Viestiasetukset | `tblIreGdZWiBmqHLd` | `AT` on formula, ei text |
| 5 | Tilikauden laskenta | `tblOQQPDlygvvKWvL` | — |
| 6 | Bonusrajat ja tavoitteet | `tblowAb5HFB58EHNS` | — |
| 7 | **Testimonialit** | `tblzY57V6vBfVna2e` | **uusi** dokumentaatiossa |
| 8 | **Laskutus** | `tblsaXpNYmIKEvz0P` | **uusi** dokumentaatiossa |
| 9 | **Palvelupaketit** | `tblsvpyvxgPjUwCRb` | **uusi** dokumentaatiossa |
| 10 | **Y-tunnus avain** | `tblcliFXQYxtNqHIh` | **uusi** dokumentaatiossa |
| 11 | **Instrumenttiavain** | `tblMRfTR4opM2pg5n` | **uusi** dokumentaatiossa |

Vanha "Komissiot API-kutsua varten" -taulu ei enää löydy basesta — todennäköisesti poistettu.

---

## Seuraavat askeleet

- [ ] Listaa kaikki Airtablen Automations-välilehden automaatiot manuaalisesti ja vertaa `04_automaatiot/`-kansioon.
- [ ] Selvitä mitkä automaatiot tällä hetkellä **eivät toimi** (käyttäjän korjauspyyntö).
- [ ] Lisää tarvittaessa skriptit `scripts/`-kansioon versionhallintaan.
