# data_bug_bot

**Workflow ID:** `wflu0DbPt7knMYoiz`
**Status:** deployed
**Tarkoitus:** Maanantaiaamuisin tarkistaa data-virheet ja lähettää Slack-koosteen kullekin asiantuntijalle (testivaiheessa: Lauri Böök ja Kimmo Louhelainen). Listaa virheet, lähtevät 30 pv, päätökset 30 pv ja uudet asiakkaat.

## Trigger
- Tyyppi: At scheduled time
- Aikataulu: viikoittain Mon **8:45am EEST**, alkaen 16.1.2026

## Toiminnot
1. **Run script** — ks. [`script.js`](script.js)
   - Output: `slackId1`, `expertName1`, `message1`, `hasMessage1`, `slackId2`, `expertName2`, `message2`, `hasMessage2`
2. **Send Slack message** — kanava `Lauri`, viesti `{message1}` (tai vastaava)

## Skriptin tarkistukset

### Virheet datassa (per asiantuntija)
- **Työn alla, aloituspäivä puuttuu** — Komissio + Status ei (Peruttu/Tauolla/Suunnitelma valmis/Konsultointi) + ei Aloituspäivää
- **Laskutusennuste puuttuu** — Komissio + ennuste < 1 + ei (Peruttu/Tauolla/Suunnitelma valmis/Konsultointi)
- **Hyväksytty mutta ei laskutettua summaa** — Komissio + Hyväksytty + laskutettusumma < 1

### Lähtevät 30 pv
Komissio + Status ∈ {Työn alla, Tulossa} + (Valmistuminen/Lähetys || Arvioitu valmistuminen) ≤ 30 pv

### Päätökset 30 pv
Komissio + Päätöspäivä, ennuste ≤ 30 pv

### Uudet asiakkaat
Kategoria = MRR + NB/EB = NB

## Havainnot

- ⚠️ **TESTIVAIHE:** kovakoodattu `TEST_EXPERTS = ["Lauri Böök", "Kimmo Louhelainen"]` → muiden asiantuntijoiden virheet eivät tule lähetetyiksi. **Poista filtteri tuotantoon.**
- ⚠️ **Vain 2 viestiä outputissa** (`slackMessages[0]` ja `[1]`). Jos täysi tuotantokäyttö (kaikki asiantuntijat) → useimmat asiantuntijat eivät saa viestiä koska skripti ei iteroi yli 2:n. Korjaus: käytä Repeating group -actionia ja lähetä JSON-array.
- Slack-action lähettää vain kanavaan `Lauri` (kovakoodattu kanava!) → testissä kaikki viestit menevät yhteen kanavaan, ei henkilökohtaisille DM:ille. Tuotannossa: `{slackId1}` -dynaaminen kanava.
- Cutoff `2025-09-01` ohittaa vanhat rivit — hyvä.
- Suodattaa pois: Hylätyt, Peruttu, Tauolla.
- Slack-formaattia: tukee linkkejä Airtable-rivihin, hymiöitä, **bold**, _italic_.

## Suositus tuotantoon
1. Poista `TEST_EXPERTS`-filtteri
2. Vaihda outputiin kaikki `slackMessages` JSON-arrayna ja käytä Repeating-actionia
3. Vaihda Slack-action kanavaksi `{slackId}` (per viesti)
4. Lisää testin jälkeen kanava `#data-bug-bot` jonne kaikki viestit kopioituvat (näkyvyys)
