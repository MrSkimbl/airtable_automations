# Data Bug Bot — Slack-raportointi datavirheistä

Aikataulutettu automaatio, joka tarkistaa Komissio-taulun datavirheet ja lähettää kullekin asiantuntijalle oman Slack-viestin omista virheistään ja tulevista tapahtumistaan.

> Linkit: [00 README](../README.md) · [01 Base-rakenne](../01_base_rakenne.md) · [02 Scripting-käytännöt](../02_scripting_kaytannot.md) · [03 Tarkistuslista](../03_ai_agentti_checklista.md) · [04 Automaatiot](README.md)

---

## Tarkoitus

Botti tarkistaa **päivittäin** Komissio-rivien laadun ja lähettää kullekin asiantuntijalle oman, henkilökohtaisen yhteenvedon Slackiin.

---

## Tarkistukset

### 1. Datavirheet (3 kategoriaa)

**a) Työn alla mutta ei aloituspäivää**

```
Status        ≠ Peruttu / Tauolla / Suunnitelma valmis / Konsultointi / Hylätty
Aloituspäivä  = tyhjä
Kategoria     = Komissio
```

**b) Laskutusennuste puuttuu**

```
Laskutusennuste < 1 €
Status          ≠ Peruttu / Tauolla / Suunnitelma valmis / Konsultointi / Hylätty
Kategoria       = Komissio
```

**c) Hyväksytty mutta ei laskutettua summaa**

```
Status           = Hyväksytty
laskutettusumma  < 1 €
Kategoria        = Komissio
```

### 2. Lähtevät seuraavan 30 päivän sisällä

```
Arvioitu valmistuminen / Lähetys ≤ tänään + 30 pv
Status                            ∈ {Työn alla, Tulossa}
Kategoria                         = Komissio
```

### 3. Päätökset seuraavan 30 päivän sisällä

```
Päätöspäivä, ennuste ≤ tänään + 30 pv
Kategoria             = Komissio
```

### 4. Uusien asiakkaiden tilaukset

```
Kategoria  = MRR
NB / EB    = NB
```

---

## Slack-viestin muoto

Käytetään Slack-yhteensopivaa Markdown-syntaksia.

```
⚠️ Airtable Data Bot - Asiantuntija Nimi

❌ Virheitä datassa (X kpl):

_Hyväksytty, mutta ei aloituspäivää:_
   • Asiakasnimi - Instrumentti
      _Päätöspv: XX.XX.XXXX | Ennuste: €XXX_

📤 Lähtevät seuraavan 30 päivää sisällä (X kpl):
   • Asiakasnimi - Instrumentti
      _Valmistuminen: XX.XX.XXXX | Ennuste: €XXX_

📅 Päätökset seuraavan 30 päivää sisällä (X kpl):
   • Asiakasnimi - Instrumentti
      _Päätöspv: XX.XX.XXXX | Ennuste: €XXX_

🌟 Uusien asiakkaiden tilaukset (X kpl):
   • Asiakasnimi - Instrumentti
      _Aloituspv: XX.XX.XXXX | Summa: €XXX_
```

### Muotoiluominaisuudet

- Emoji-otsikot (⚠️, ❌, 📤, 📅, 🌟)
- **Klikattava asiakasnimi** → vie suoraan Airtable-tietueeseen
- Lihavoitu asiakas/instrumentti
- Kursivoitu lisätiedot
- Määrälaskurit jokaisessa osiossa
- Asiantuntijan nimi otsikossa

---

## Setup (Airtable Automation)

### 1. Trigger
- **Type:** "At scheduled time"
- **Frequency:** Päivittäin klo 8:00 (tai haluamasi)

### 2. Action 1: Run script
- **Skripti:** `data_bug_bot.js`
- **Output:** `slackMessages` (JSON-array)

### 3. Action 2: Send Slack message (Repeating)
- **Repeat:** For each item in `{{step1.slackMessages}}`
- **Channel/User:** `{slackId}` (käyttäjän Slack ID)
- **Message:** `{message}` (muodostettu viestiteksti)

---

## Logiikka (askel askeleelta)

```
1. Hae kaikki uniikit asiantuntijat Asiantuntijat-taulusta
2. Suodata pois:
   - Status = Hylätty
   - Valmistuminen/Lähetys < 1.9.2025
   - Päätöspäivä, toteutunut < 1.9.2025 (jos ei Valmistuminen/Lähetys)
3. Kullekin asiantuntijalle:
   - Tarkista 3 virhekategoriaa
   - Tarkista lähtevät seuraavan 30 päivän sisällä
   - Tarkista päätökset seuraavan 30 päivän sisällä
   - Tarkista uudet asiakkaiden MRR-tilaukset
4. Jos virheitä/asioita löytyy:
   - Muodosta Slack-viesti
   - Lisää slackMessages-arrayhin
5. Output: slackMessages → seuraavalle actionille
```

---

## Huomioitavaa

- Botti lähettää viestin **vain jos löytyy jotain raportoitavaa** (ei tyhjiä viestejä)
- Jokainen asiantuntija saa **oman viestin** vain omista asioistaan
- Slack ID:t pitää olla tallennettu **Viestiasetukset-tauluun** (kenttä: `Slack ID`) — ks. [01_base_rakenne.md](../01_base_rakenne.md) → "Taulu 5 — Viestiasetukset"
- Päivämäärät muotoillaan suomalaiseen muotoon (`DD.MM.YYYY`)
- Eurot muodossa `€XXX` (ilman senttejä)
- **Hylätyt hakemukset jätetään pois** virheraportoinnista
- **Vanhat rivit (ennen 1.9.2025) jätetään pois** — tarkistetaan `Valmistuminen/Lähetys` ja `Päätöspäivä, toteutunut`
- Viesti on muotoiltu Slack Markdown -syntaksilla (emoji, lihavointi, kursiivi)

---

## Airtable-linkit Slackissa

**Asiakasnimet ovat automaattisesti klikattavia.** Skripti hakee Base ID:n ja Table ID:n automaattisesti ja muodostaa linkit:

```
<https://airtable.com/baseId/tableId/recordId|Asiakasnimi>
```

Slack renderöi tämän klikattavana linkkinä.

> ✅ Ei vaadi konfiguraatiota — toimii suoraan.

---

## Testaus

1. Kopioi skripti Scripting-laajennukseen
2. Aja manuaalisesti
3. Tarkista konsoli-output: pitäisi näyttää löydetyt virheet
4. Siirrä Automationiin ja testaa aikataulutuksella

---

## Liittyy

- **Asiantuntijat** (pääasiallinen lähde) → [01_base_rakenne.md](../01_base_rakenne.md)
- **Viestiasetukset** (Slack ID:t) → [01_base_rakenne.md](../01_base_rakenne.md) → "Taulu 5"
- **Statuksien arvot** → [01_base_rakenne.md](../01_base_rakenne.md) → "Kategoriat ja status"
