# Toimenpiteet taulun muutokset

**Workflow ID:** `wflAahyro3wWNb8dQ`
**Status:** deployed
**Tarkoitus:** Kun Toimenpiteet-taulun sääntö muuttuu (esim. `Enabled` togglataan), aja sääntö KAIKKIIN Asiantuntijat-taulun lähteisiin → luo/päivittää toimenpiderivit kaikille kelvollisille lähteille kerralla.

## Trigger
- Tyyppi: When record updated
- Taulu: Toimenpiteet
- Watched fields: `Enabled`

## Toiminnot
1. **Run script** — ks. [`script.js`](script.js)
   - Input: `ruleId` = triggeröineen sääntörivin id

## Logiikka

1. Hae sääntö Toimenpiteet-taulusta
2. Skip jos `Enabled` = false
3. Lue Trigger field, Offset value, Action text, Message to customer
4. Hae kaikki Asiantuntijat-rivit
5. Erottele lähde-rivit (ei `Toimenpide-linkki`-arvoa) ja olemassa olevat toimenpiderivit (sama Rule Key)
6. Iteroi lähteet:
   - Skip jos kategoria ∉ {Komissio, MRR, Projekti}
   - Skip jos lähde lukittu
   - Skip jos trigger-kenttä tyhjä
   - Skip jos kohde-toimenpiderivi lukittu
   - Build payload (renderTemplate viesteille, addDays päivämäärälle, copyValueByType peruskentille) → upsert
7. Batch 50 kerrallaan

## Havainnot

- **Hyvä:** sääntömuutos propagoituu välittömästi kaikkiin riveihin.
- Pari `Toimenpiteet1` -automaation kanssa: Toimenpiteet1 ajaa kun **lähde-rivi** muuttuu (kaikki säännöt yhdelle riville). Tämä ajaa kun **sääntö** muuttuu (yksi sääntö kaikille riveille). Yhdessä ne pitävät toimenpiderivit ajan tasalla.
- ⚠️ Skripti ei poista toimenpiderivejä jos sääntö poistetaan tai disabloidaan — vain skipataan. Disabloidut säännöt jättävät vanhat toimenpiderivit roikkumaan kunnes Toimenpiteet1 ajaa uudelleen ja huomaa että trigger-kenttä on tyhjä.
- Ei input-validointia `recordId`/`ruleId`-kentälle (heittää erroria jos puuttuu — ok).
