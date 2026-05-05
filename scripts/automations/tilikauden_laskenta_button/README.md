# Tilikauden laskenta (button-triggered)

**Workflow ID:** `wflKTRdcFMFSH8j6H`
**Status:** deployed
**Tarkoitus:** Päivittää koko `Tilikauden laskenta` -taulun: aggregoi kaikki Komissio/Projekti/MRR-rivit per asiantuntija per kuukausi (toteuma, ennuste, lähetetyt, lähtevät, hakemukset kpl, MRR asiakkaat kpl, kumulatiivinen bonus). Käynnistyy interface-painikkeesta "Päivitä data".

## Trigger
- Tyyppi: When a button is clicked
- Lähde: Asiantuntijat-taulu, interface-painikkeet:
  - `Bonuslaskenta / Asiantuntijan - Käyttäjä` → Päivitä data
  - `Bonuslaskenta / Asiantuntijan Mikko` → Päivitä data

## Toiminnot
1. **Run script** — ks. [`script.js`](script.js)

## Logiikka

1. Lue lähdedata (Asiantuntijat, Tilikauden laskenta, Bonusrajat ja tavoitteet)
2. Käsittele jokainen asiantuntija (käyttää **vain ensimmäistä** asiantuntijaa monikollisilla riveillä — välttää tuplalaskenta)
3. Laske per asiantuntija + kuukausi:
   - **Toteuma:** Komissio (Hyväksytty) + Projekti (¬NB) + MRR (¬NB), summa kuukausikentistä
   - **MRR, Projektit, Komissiot, Komissiot liikevaihto** (omat sarakkeet)
   - **Ennuste:** MRR (NB) + hakemus-ennusteet (Lähetetty/Tulossa/Työn alla/Täydennys + Päätöspäivä, ennuste-kuukausi)
   - **Komissiot, ennuste:** ennuste-osasta vain Komissio-kategoria
   - **Lähetetyt:** Status Lähetetty/Täydennys = Laskutusennuste; Hyväksytty = laskutettusumma → Valmistuminen/Lähetys-kuukauteen
   - **Lähtevät:** Status Tulossa/Työn alla → Arvioitu valmistuminen-kuukauteen, jos Laskutusennuste < 100€ käytä 5000€
   - **Hakemukset, kpl:** Status Lähetetty/Täydennys/Hyväksytty/Hylätty
   - **Hakemukset, kpl ennuste:** Status Tulossa/Työn alla
   - **MRR asiakkaita, kpl:** kuukauden MRR-arvo > 0, lasketaan unikit asiakkaat
   - **Bonus, kumulatiivinen:** vain päättyneille kuukausille, `(cumulativeToteuma − bonusRajaKk × monthCount) × 0.15`
4. Suodata Tilikauden laskenta -tauluun: vain **2025–2026** tilikausi
5. Upsert: päivitä olemassa olevat (myös 0:ksi jos ei dataa), luo uudet (vain jos uutta dataa)
6. Batch 50 kerrallaan

## Havainnot
- Pari `Tilikauden laskenta, scheduled` -automaation (cron joka päivä klo 1am) kanssa — sama logiikka. Tämä button-versio antaa käyttäjälle mahdollisuuden pakottaa ajo manuaalisesti.
- Pieni ero: tämä button-versio sisältää myös `mrrAsiakkaatCounts` ja Lähtevät-arvojen min-floor 5000€ — scheduled-versio ei vielä.
- Tilikausi kovakoodattu "2025–2026". **Päivitettävä ennen 1.9.2026** kun siirrytään 2026–2027 tilikauteen.
- Kuukausilista 9-25 … 8-26. **Lisättävä 9-26 … 8-27** kun tilikausi vaihtuu.
