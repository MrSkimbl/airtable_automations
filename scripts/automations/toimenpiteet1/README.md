# Toimenpiteet1

**Workflow ID:** `wflHYHRgCIa8aT6kO`
**Status:** deployed
**Tarkoitus:** Luo/päivittää/poistaa Toimenpide-rivit Asiantuntijat-taulussa Toimenpiteet-taulun sääntöjen mukaan kun lähde-rivin avain-kenttä muuttuu. Lisäksi kopioi Viestiasetukset (SlackId, Kanava) Asiantuntijasta lähde- ja toimenpideriveille.

## Trigger
- Tyyppi: When record updated
- Taulu: Asiantuntijat
- Watched fields: `Valmistuminen/Lähetys` *(jaettu)*. ⚠️ Tarkista onko tämä ainoa watch-kenttä vai onko useampia (esim. Aloituspäivä, Päätöspäivä, MRR päättyy päivämäärä)

## Toiminnot
1. **Run script** — ks. [`script.js`](script.js)

## Logiikka

1. Hae lähde-rivi (Asiantuntijat)
2. Skip jos itse on Toimenpide-rivi (`Toimenpide rules` ei tyhjä)
3. Skip jos Kategoria ∉ {Komissio, MRR, Projekti}
4. Skip jos `Lukittu (älä päivitä)` = true
5. Hae Viestiasetukset matchaamalla `Asiantuntija`-nimellä (string-vertailu lowercase) ja kopioi SlackId + Kanava lähderiville
6. Käy läpi kaikki `Enabled`-säännöt Toimenpiteet-taulusta:
   - Lue rivin trigger-kenttä (Aloituspäivä / Päätöspäivä, toteutunut / Valmistuminen/Lähetys / MRR päättyy päivämäärä / Loppuraportin deadline / Väliraportin 1-2 deadline)
   - Jos trigger-kenttä **tyhjä** ja toimenpiderivi on jo olemassa → poista
   - Jos trigger-kenttä **täytetty**: laske `actionDate = triggerValue + offsetDays`, renderöi viestit Action text- ja Message to customer -templateista, kopioi peruskentät (Asiakas, Y-Tunnus, Asiantuntija, NB/EB, Instrumentti, Status), liitä Toimenpide-linkki lähderiviin → upsert

## Havainnot / parannusehdotukset

- ⚠️ **Iso miinus:** trigger watchaa todennäköisesti vain Valmistuminen/Lähetys -kenttää. Jos näin on, säännöt joiden trigger-kenttä on **toinen kenttä** (esim. `Aloituspäivä`) **eivät reagoi** kun käyttäjä muuttaa Aloituspäivää. **Vahvista watched fields -lista UI:sta.** Suositus: kaikki sääntöjen trigger-kentät pitää olla watch-listassa.
- `Asiantuntija`-matching tehdään `getCellValueAsString`-vertailulla. Asiantuntijat-taulun `Asiantuntija` on `multipleCollaborators` (palauttaa "Etunimi Sukunimi, Toinen Henkilö") ja Viestiasetukset.`Asiantuntija` on `singleCollaborator`. String-match toimii vain jos lähde-rivillä on **yksi** asiantuntija jonka nimi täsmää. Jos useita → ei matchia.
- Asiantuntija-haku tehdään joka kerta uudelleen kaikkien rivien yli — kannattaisi rakentaa Map kerran.
- `selectRecordsAsync({ fields: Object.values(RF) })` ladataan rules joka kerta — ok pienelle taululle.
- Toimenpide-rivit luodaan/poistetaan koko sääntölistan läpi — toimii, mutta jos sääntöjä on paljon, ajo kestää.
