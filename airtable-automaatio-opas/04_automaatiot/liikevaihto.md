# Liikevaihto — komissioiden kirjaus liikevaihtoriveille

Kaikki skriptit, jotka liittyvät komissioiden kirjaamiseen liikevaihtoriveille ja niiden kuukausijakaumaan.

> Linkit: [00 README](../README.md) · [01 Base-rakenne](../01_base_rakenne.md) · [02 Scripting-käytännöt](../02_scripting_kaytannot.md) · [03 Tarkistuslista](../03_ai_agentti_checklista.md) · [04 Automaatiot](README.md)

---

## Skriptien yhteenveto

| Skripti | Tyyppi | Trigger |
|---------|--------|---------|
| **liikevaihdon_kirjaukset_automaatio** | Real-time | Asiantuntijat-rivi muuttuu |
| **luo_liikevaihtorivit_uudelleen** | Manuaalinen (kerran) | Scripting-laajennus |
| **liikevaihdon_kirjaukset_vanha** | Vanha versio | (referenssi vain) |

---

## 1. liikevaihdon_kirjaukset_automaatio (päärooli)

**Kahdensuuntainen synkronointi Komissio ↔ Liikevaihto.**

### Setup

| Asetus | Arvo |
|--------|------|
| Trigger | "When record updated" → taulu **Asiantuntijat** |
| Condition | **`Last modified by IS NOT Automation`** ⚠️ |
| Action | Run script |
| Input | `recordId` → triggerin Record ID |

### Logiikka

**Komissio → Liikevaihto:**
- Luo tai päivittää **Liikevaihto-rivin** komission tiedoilla
- Jakaa summan kuukausille (varovaisuus + päätössumma)

**Liikevaihto → Komissio:**
- Synkronoi metatiedot (linkki) takaisin Komissio-rivin `Liikevaihto-rivi`-kenttään

### Kuukausijakauma

| Komponentti | Mihin kuukauteen | Summa |
|-------------|------------------|-------|
| **Varovaisuus** | Lähetyskuukauteen (`Valmistuminen/Lähetys`) | 50 % laskutusennusteesta |
| **Päätössumma** | Päätöskuukauteen (`Päätöspäivä, toteutunut`) | Loppu (`laskutettusumma − varovaisuus`) |
| **Hylätty** | Päätöskuukauteen | **Negatiivinen** varovaisuus (peruu lähetyskuukauden ennusteen) |

### Esimerkki

```
Komissio:
  Asiakas:                ACME Oy
  Status:                 Hyväksytty
  Valmistuminen/Lähetys:  2025-10-15  →  kuukausi "10-25"
  Päätöspäivä, toteutunut: 2025-12-05  →  kuukausi "12-25"
  Laskutusennuste:        4 000 €
  laskutettusumma:        5 000 €

Liikevaihto-rivi:
  10-25:  +2 000  (varovaisuus, 50 % laskutusennusteesta)
  12-25:  +3 000  (laskutettusumma − varovaisuus)
```

### Hylätty-erikoislogiikka

```
Status:  Hylätty
Lähetyskuukausi:  10-25  →  +2 000  (varovaisuus pysyy)
Päätöskuukausi:   12-25  →  −2 000  (negatiivinen varovaisuus = peruutus)
Nettovaikutus:     0 €
```

### Threshold-päivämäärä: 31.8.2024

Vain rivit, joilla on **päätöspäivä > 31.8.2024**, käsitellään. Vanhempia ei päivitetä eikä luoda.

### KRIITTINEN: nollaus ennen kirjoitusta

> **Aina** nollaa kaikki kuukausikentät (`9-25` … `8-26`) ennen uusien arvojen kirjoitusta. Muuten päivämäärän muuttuminen jättää vanhat arvot kummittelemaan eri kuukausiin.

```javascript
const MONTH_FIELDS = ["9-25","10-25","11-25","12-25",
                      "1-26","2-26","3-26","4-26","5-26","6-26","7-26","8-26"];
let monthValues = {};
MONTH_FIELDS.forEach(f => { monthValues[f] = 0; });
monthValues[sendMonthField]     += varovaisuus;
monthValues[decisionMonthField] += remaining;
```

---

## 2. luo_liikevaihtorivit_uudelleen (kertaluonteinen rebuild)

**Rakentaa kaikki Liikevaihto-rivit alusta.**

### Milloin käytetään

- Suuren datakorjauksen jälkeen
- Logiikkamuutoksen jälkeen, joka vaatii täyden uudelleenlaskennan
- Kun Liikevaihto-rivit ovat ristiriitaisia

### Käynnistysjärjestys

1. **DISABLE** automaatio `liikevaihdon_kirjaukset_automaatio` Airtablessa
2. **DELETE** kaikki Liikevaihto-rivit Airtablesta käsin
3. Aja `luo_liikevaihtorivit_uudelleen` Scripting-laajennuksessa
4. **ENABLE** automaatio takaisin

### Mitä tekee

- Käy läpi kaikki Komissio-rivit Asiantuntijat-taulussa
- Luo uuden Liikevaihto-rivin jokaiselle kelpoiselle riville
- Linkittää kahteen suuntaan (Komissio ↔ Liikevaihto)
- Näyttää edistymisen 10 rivin välein konsolissa

### Kelpoisuusehdot

- `Kategoria = "Komissio"` JA
- (`Päätöspäivä, toteutunut > 31.8.2024`) TAI
- (`Status ∈ {Lähetetty, Täydennys, Hyväksytty, Hylätty}` ja jokin `Valmistuminen/Lähetys` tai `Päätöspäivä, toteutunut` > 31.8.2024)

---

## 3. liikevaihdon_kirjaukset_vanha (referenssi)

Vanha versio päärole-skriptistä — säilytetty referenssinä eikä ole aktiivisessa käytössä. **Älä deployaa sitä.**

---

## Avainkonseptit

### Varovaisuus
- 50 % `Laskutusennuste`-arvosta
- Kirjataan **lähetyskuukauteen** (`Valmistuminen/Lähetys` tai `Aloituspäivä`)
- Edustaa arvioitua komissiota ennen päätöstä

### Päätössumma
- Loput laskutussummasta varovaisuuden jälkeen
- Kirjataan **päätöskuukauteen** (`Päätöspäivä, toteutunut`)
- Todellinen komissio

### Hylätty-logiikka
- Varovaisuus pysyy lähetyskuukaudessa
- Negatiivinen varovaisuus päätöskuukaudessa = peruu virheellisen ennusteen
- Nettovaikutus 0 €

### Threshold 31.8.2024
- Vain tämän jälkeen olevat rivit käsitellään

---

## Yleisimmät ongelmat

### Tuplasummat eri kuukausissa
**Syy:** Automaatio ei nollannut kuukausikenttiä kirjoitusten välillä.
**Korjaus:** Ajantasainen versio nollaa AINA kaikki ennen kirjoitusta. Aja `luo_liikevaihtorivit_uudelleen` jos data on jo kasaantunut.

### Liikevaihto-rivi puuttuu
**Syy:** Rivi ei täytä kelpoisuusehtoja.
**Tarkista:** Päätöspäivä > 31.8.2024 TAI oikea Status + lähetyspäivä.

### Linkki rikki Komission ja Liikevaihdon välillä
**Syy:** Manuaalinen poisto tai automaatiovirhe.
**Korjaus:** Aja `luo_liikevaihtorivit_uudelleen`.

---

## Testaus

1. Kopioi skripti Scripting-laajennukseen
2. Valitse testi-Komissio-rivin recordId
3. Muokkaa `recordId`-arvoa skriptissä (jos staattinen)
4. Aja, varmista konsolista:
   - Liikevaihto-rivi luotu/päivitetty
   - Kuukausikentät oikein
   - Linkit kahteen suuntaan
5. Siirrä Automationiin
6. Triggeröi pieni todellinen muutos → tarkkaile ajohistoriaa

---

## Liittyy

- Päätaulu **Asiantuntijat** ja sen `Liikevaihto-rivi`-kenttä → [01_base_rakenne.md](../01_base_rakenne.md)
- Kuukausikenttien nimeämislogiikka (`9-25`, `10-25`, …) → [01_base_rakenne.md](../01_base_rakenne.md) → "Kuukausikentät"
- Tilikauden laskenta nojaa näihin liikevaihtoriveihin → [tilikausi.md](tilikausi.md)
