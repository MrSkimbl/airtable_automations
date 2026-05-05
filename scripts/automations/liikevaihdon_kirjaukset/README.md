# Liikevaihdon kirjaukset

**Workflow ID:** `wfl8vwXu6wHI5QLTC`
**Status:** deployed
**Tarkoitus:** Kaksisuuntainen synkronointi Komissio-rivin ja siihen linkitetyn Liikevaihto-rivin välillä. Komissio-puolella muutos → laskee LV-rivin kuukausijaksotus uudelleen + synkkaa metadatan. LV-rivin muutos → synkkaa metadatan takaisin Komissioon (mutta ei kosketa kuukausisummiin).

## Trigger
- Tyyppi: When record updated
- Taulu: Asiantuntijat
- Watched fields: `Asiakas`, `Asiantuntija`, `Instrumentti`, `Status`, `Valmistuminen/Lähetys`, `Projektin koko`, `Komissio%`, `Laskutusennuste`, `Päätöspäivä, toteutunut`, `Myönnetty tukisumma`, `laskutettusumma`, `Haettu tukisumma`

## Toiminnot
1. **Run script** — ks. [`script.js`](script.js)

## Logiikka

### Case 1: Liikevaihto-rivi muuttuu → metadata Komissioon
- Hae linkattu Komissio-rivi (`Liikevaihto-rivi`)
- Synkkaa Asiakas, Asiantuntija, Instrumentti, Status, Valmistuminen/Lähetys, Päätöspäivä, Myönnetty tukisumma, Komissio%, Projektin koko, Haettu tukisumma

### Case 2: Komissio-rivi muuttuu → LV-rivi (kuukausijaksotus + metadata)
1. Tarkista että on **päätös > 31.8.2024** TAI Status = Lähetetty/Täydennys/Hyväksytty/Hylätty + Valmistuminen
2. Lähetyskuukausi: 50 % × Laskutusennuste = **varovaisuus** kirjataan lähetyskuukauteen
3. Päätöskuukausi:
   - **Hyväksytty:** loput (laskutettusumma − varovaisuus) kirjataan päätöskuukauteen
   - **Hylätty:** varovaisuus vähennetään päätöskuukaudesta (nettovaikutus 0)
4. Nollaa kaikki kuukausikentät, kirjoita uudet arvot
5. Jos LV-riviä ei ole → luo + linkitä **molempiin suuntiin** (CRITICAL BACKLINK FIX)
6. Jos on → päivitä

## Looppiestopolut
- ⚠️ **Looppirisiki:** automaatio päivittää LV-rivin → trigger laukeaa LV-rivistä → ajaa skriptin → päivittää Komission → trigger laukeaa Komissiosta → loop. Skriptin kommentissa mainitaan ehto `Last modified by IS NOT Automation` triggerille — **varmista että UI:ssa on tämä ehto** triggerin ehdoissa, muuten loop syntyy.

## Havainnot
- Kuukausikentissä mukana sekä legacy 1-12 että 9-25 … 8-26 (tilikausi 25-26). Tilikausi 26-27 (9-26 … 8-27) **puuttuu** — täydennettävä ennen 1.9.2026.
- Threshold-päivämäärä `2024-08-31` kovakoodattu — vanhempia rivejä ei kosketa.
- `parseMoney` puhdistaa euromerkit ja desimaalierottimet — robusti.
- Käyttää `getMonthField`-funktiota joka mappaa päivämäärän kenttänimeen — pitää päivittää tilikausien lisäyksessä.
