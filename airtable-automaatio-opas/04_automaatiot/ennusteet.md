# Ennusteet — päätöspäivän ennustelogiikka

Skripti, joka päivittää kaikkien hakemusten arvioidun päätöspäivän automaattisesti.

> Linkit: [00 README](../README.md) · [01 Base-rakenne](../01_base_rakenne.md) · [02 Scripting-käytännöt](../02_scripting_kaytannot.md) · [03 Tarkistuslista](../03_ai_agentti_checklista.md) · [04 Automaatiot](README.md)

---

## Skripti

**`paatospaiva_ennuste_update`** — älykäs päätöspäivän ennustelaskenta.

Aikataulutettu skripti (suositus: päivittäin) tai manuaalisesti ajettava.

### Setup

| Asetus | Arvo |
|--------|------|
| Trigger | "At a scheduled time" → päivittäin (suositus) TAI Scripting-laajennus |
| Action | Run script |

---

## Mitä tekee

Päivittää kentän **`Päätöspäivä, ennuste`** asiakas/komissio-hakemuksille seuraavin perustein:

- Hakemuksen status
- Lähetys-/valmistumispäivä
- Rahoitusinstrumentti (ELY vs muut)
- Hakemussumma (eurokorit)
- Historiallinen käsittelyaika

---

## Ennustelogiikka

### 1. Statuksen mukainen ankkuripäivä

**Status `Lähetetty` / `Täydennys`:**
1. Ensisijainen: `Valmistuminen/Lähetys`
2. Vara: `Arvioitu valmistuminen`
3. Lopullinen vara: `Aloituspäivä + 30 päivää`

**Status `Tulossa` / `Työn alla`:**
1. Ensisijainen: `Arvioitu valmistuminen`
2. Vara: `Aloituspäivä + 30 päivää`

### 2. Eurokorit

`Laskutusennuste`-arvon mukaan:

| Kori | Raja-arvo |
|------|-----------|
| **Low** | ≤ 2 619,36 € |
| **Mid** | 2 619,37 € – 5 770,80 € |
| **High** | > 5 770,80 € |

### 3. Käsittelyaikaoffsetit (päivinä)

**ELY-instrumentit:**

| Kori | Offset |
|------|--------|
| Low | +28 päivää |
| Mid | +21 päivää |
| High | +49 päivää |
| Fallback | +42 päivää |

**Muut (ei-ELY) instrumentit:**

| Kori | Offset |
|------|--------|
| Low | +21 päivää |
| Mid | +35 päivää |
| High | +56 päivää |
| Fallback | +35 päivää |

### 4. Lähitulevaisuussuoja

Jos laskettu ennustepäivä on **alle 3 päivää nykyhetkestä**, työnnä eteenpäin:

| Instrumentti | Siirto |
|--------------|--------|
| ELY | +28 päivää tästä päivästä |
| Muu | +14 päivää tästä päivästä |

Tämä varmistaa, ettei ennuste päädy lähimenneisyyteen tai välittömään tulevaisuuteen.

### 5. Menneiden päivien korjaus

**`Arvioitu valmistuminen`:**
- Jos `Status ∈ {Tulossa, Työn alla}` JA arvio on menneisyydessä
- → resetoi: tänään + 7 päivää

**`Päätöspäivä, ennuste`:**
- Jos ennuste on menneisyydessä TAI alle 3 päivää
- → siirrä eteenpäin offsetin mukaan (ELY: +28, Muut: +14)

---

## Esimerkkilaskelmia

### Esimerkki 1 — pieni ELY-hakemus (Lähetetty)

```
Laskutusennuste:        2 000 €      → Low-kori
Instrumentti:           "ELY EAKR"
Valmistuminen/Lähetys:  2026-01-15
Status:                 Lähetetty

Ankkuri:    2026-01-15
Offset:     +28 päivää (ELY Low)
Ennuste:    2026-02-12
```

### Esimerkki 2 — suuri ei-ELY-hakemus (Tulossa)

```
Laskutusennuste:        10 000 €     → High-kori
Instrumentti:           "Business Finland"
Arvioitu valmistuminen: 2026-02-01
Status:                 Tulossa

Ankkuri:    2026-02-01
Offset:     +56 päivää (Non-ELY High)
Ennuste:    2026-03-29
```

### Esimerkki 3 — menneisyydessä oleva arvio

```
Status:                 Tulossa
Arvioitu valmistuminen: 2025-12-01    (menneisyydessä!)
Tänään:                 2026-01-13

Toiminta:
  Resetoi Arvioitu valmistuminen: 2026-01-20  (tänään + 7)
  Laske ennuste uudelleen uudesta ankkurista
```

---

## Konfigurointivakiot (skriptin alussa)

```javascript
// Eurokorien rajat
const Q33 = 2619.36;
const Q66 = 5770.80;

// Käsittelyaikaoffsetit (päivinä)
const OFFSETS = {
    ely: { low: 28, mid: 21, high: 49, fallback: 42 },
    non: { low: 21, mid: 35, high: 56, fallback: 35 }
};

// Lähitulevaisuussuoja
const NEAR_THRESHOLD_DAYS = 3;
const SHIFT_ELY = 28;
const SHIFT_NON = 14;
```

---

## Output ja loggaus

Konsoliin tulee tilastot:

```
Total records: 1523
Komissio candidates (new forecast): 234
Shifted existing forecasts (past/near): 45
Skipped (no anchor): 189
Updates applied: 279
```

---

## Käsiteltävät statukset

Skripti käsittelee VAIN seuraavat statukset:
- `Lähetetty`
- `Täydennys`
- `Tulossa`
- `Työn alla`

Muut statukset (`Hyväksytty`, `Hylätty`, `Peruttu`, `Tauolla`, ...) **ohitetaan**.

---

## Idempotenssi

- Ei ylikirjoita ennustetta, joka on **≥ 3 päivää tulevaisuudessa**
- Päivittää vain:
  - Tyhjät ennusteet
  - Menneisyyden ennusteet
  - Ennusteet < 3 päivää
- Voi ajaa montaa kertaa peräkkäin → sama lopputulos

---

## Suoritus ja batch

Päivitykset 50 tietueen erissä (Airtablen raja). Soveltuu suurille datasetteille.

---

## Yleisimmät ongelmat

### Ennusteet eivät päivity
- Tarkista että status on yksi neljästä tuetusta
- Varmista että ankkuripäivä on olemassa (`Valmistuminen/Lähetys` / `Arvioitu valmistuminen` / `Aloituspäivä`)
- Tarkista ettei nykyinen ennuste ole jo validi (≥ 3 päivää tulevaisuudessa)

### Väärä offset
- Varmista että `Instrumentti` sisältää sanan "ELY" jos kyse on ELY-instrumentista
- Tarkista että `Laskutusennuste` osuu odotettuun korien rajaan
- Lue konsoliin tulleet lasketut arvot

### Ennusteet menneisyydessä
- Skripti estää tämän erityisesti lähitulevaisuussuojalla
- Jos tapahtuu yhä, säädä `NEAR_THRESHOLD_DAYS` ja siirtoarvoja
- Varmista että skripti ajetaan säännöllisesti (päivittäin suositeltu)

---

## Liittyy

- Asiantuntijat-taulun pvm-kentät → [01_base_rakenne.md](../01_base_rakenne.md) → "Päivämäärät"
- Statukset → [01_base_rakenne.md](../01_base_rakenne.md) → "Kategoriat ja status"
- Yleinen scripting-malli → [02_scripting_kaytannot.md](../02_scripting_kaytannot.md) → "Skriptin rakennemalli"
