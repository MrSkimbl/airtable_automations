# Viestiasetus-taulun muutokset

**Workflow ID:** `wflRivYJdK69rhZo1`
**Status:** deployed
**Tarkoitus:** Kun Viestiasetukset-rivi muuttuu, propagoi `Slack ID` ja `Ilmoitus` (kanavat) ko. asiantuntijan kaikkiin Toimenpide-rivihin Asiantuntijat-taulussa.

## Trigger
- Tyyppi: When record updated
- Taulu: Viestiasetukset
- Watched fields: *(ei kerrottu — todennäköisesti Slack ID + Ilmoitus + Asiantuntija)*

## Toiminnot
1. **Run script** — ks. [`script.js`](script.js)
   - Input: `recordId` = triggeröivän Viestiasetus-rivin id

## Logiikka

1. Hae Viestiasetus-rivi (Slack ID, Ilmoitus, Asiantuntija)
2. Hae kaikki Asiantuntijat-rivit joissa Kategoria=Toimenpide ja Asiantuntija = sama nimi (string-match lowercase)
3. Päivitä jokaiselle: SlackId-text-kenttään ja Kanava-multipleSelects-kenttään (channelValueOrSkip-validointi varmistaa että vain valid select-arvot menevät)
4. Skip lukitut rivit
5. Batch 50 kerrallaan

## Havainnot

- Viestiasetuksen päivitys **ei propagoidu lähde-rivihin** — vain toimenpiderivihin. Lähde-rivit saavat asetukset vain Toimenpiteet1-automaatiosta kun ne päivittyvät.
- Asiantuntija-matchaus stringillä — toimii vain täydellisellä nimimatchilla. Jos Asiantuntija on multipleCollaborators ja siellä useampi → ei matchia.
- ⚠️ Script ei suodata Toimenpide-rivien luettelua trigger-kentällä — kaikki toimenpiderivit ko. asiantuntijalle päivitetään, myös vanhat / valmiit. Voi olla turhaa kirjoitusta jos asetus ei ole muuttunut.
