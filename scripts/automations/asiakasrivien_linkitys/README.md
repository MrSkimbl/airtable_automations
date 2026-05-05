# asiakasrivien linkitys, jatkuva

**Workflow ID:** `wflngJYnS4G7GBlSG`
**Status:** deployed
**Tarkoitus:** Linkittää saman asiakasnimen Asiantuntijat-rivit toisiinsa `Asiakas-linkki`-kentän kautta. Kun asiakas esiintyy useammalla rivillä, kaikki ryhmän rivit linkittyvät toisiinsa.

## Trigger
- Tyyppi: When record updated
- Taulu: Asiantuntijat
- Watched fields: `Asiakas`, `Asiantuntija (Vanha)`

## Toiminnot
1. **Run script** — ks. [`script.js`](script.js)

## Logiikka
1. Lukee KAIKKI Asiantuntijat-rivit
2. Normalisoi `Asiakas`-nimen (poistaa `*` alusta ja `Oy/Ltd/Inc/AB/AS/GmbH` lopusta)
3. Ryhmittelee asiakasnimen mukaan
4. Päivittää jokaisen rivin `Asiakas-linkki`:
   - Jos ryhmässä > 1 riviä → linkit kaikkiin ryhmän riveihin
   - Muuten tyhjäksi
5. Batch-päivitys 50 kerrallaan

## Havainnot
- Triggeri laukeaa AINA kun joku muuttaa Asiakas- tai Asiantuntija (Vanha) -kenttää → koko taulu prosessoidaan uudelleen joka kerta. Jos rivejä on tuhansia, ajo kestää.
- Watch-kentässä `Asiantuntija (Vanha)` — tämä on legacy-kenttä. Tarvitseeko sitä yhä seurata?
- `Asiakas-linkki`-kenttä päivitetään myös niille riveille joilla nimi on uniikki → tyhjennetään listä joka ajossa. Hieman turhaa kirjoitusta jos arvo on jo tyhjä.
- Mahdollinen optimointi: lue olemassa oleva linkki ja päivitä vain jos eroaa.
