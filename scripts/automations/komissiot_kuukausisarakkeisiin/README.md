# komissiot kuukausisarakkeisiin

**Workflow ID:** `wfldIHYhl0767fdKE`
**Status:** deployed
**Tarkoitus:** Kun Komissio-rivi hyväksytään, kirjaa `laskutettusumma` oikeaan kuukausisarakkeeseen (esim. `4-26`) `Päätöspäivä, toteutunut` -kentän mukaan.

## Trigger
- Tyyppi: When record updated
- Taulu: Asiantuntijat
- Watched fields: `Päätöspäivä, toteutunut`, `laskutettusumma`

## Toiminnot
1. **Run script** — ks. [`script.js`](script.js)

## Bugihistoria
- 2026-05-04: error `"Could not find a field with name or ID '1-70'"` kun trigger laukesi ennen kuin Päätöspäivä oli täytetty. Korjattu: guardit palauttavat heti.

## Havainnot / parannusehdotukset
- Status ei ole watched-kenttänä → kun käyttäjä laittaa Status=Hyväksytty, mitään ei tapahdu ennen kuin Päätöspäivä tai Myönnetty tukisumma muuttuu.
- Suositus: vaihda triggeri "When record matches conditions" → Kategoria=Komissio AND Status=Hyväksytty AND Päätöspäivä,toteutunut not empty AND Myönnetty tukisumma > 0. Tällöin laukaa kerran kun kaikki ehdot täyttyvät.
- Reuna: Päätöspäivän muutos myöhemmin → uusi kuukausikenttä päivittyy mutta vanha ei tyhjenny → sama summa kahdessa kuukaudessa.
