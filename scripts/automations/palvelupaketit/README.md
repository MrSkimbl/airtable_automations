# Palvelupaketit

**Workflow ID:** `wflgaKuv2QGlh94Kw`
**Status:** deployed
**Tarkoitus:** Asettaa `Palvelupaketti`-kentän automaattisesti MRR-arvon perusteella, kun se on tyhjä. Käyttää portaikkoa: MRR > 2000 = EU, > 700 = Enterprise, jne.

## Trigger
- Tyyppi: When record updated
- Taulu: Asiantuntijat
- Watched fields: *(ei kerrottu — todennäköisesti MRR ja/tai Kategoria)*

## Toiminnot
1. **Run script** — ks. [`script.js`](script.js)
   - Input: `recordId`

## Logiikka
1. Hae rivi
2. Skip jos `Palvelupaketti` jo asetettu
3. Jos Kategoria = Projekti → `Palvelupaketti = Projekti`
4. Jos Kategoria = MRR ja MRR > 0 → portaat:

| MRR (€/kk) | Palvelupaketti |
|------------|----------------|
| > 2000 | EU |
| > 700 | Enterprise |
| > 400 | Expert |
| ≥ 260 | Pro |
| ≥ 200 | Starter |
| ≥ 150 | Invest |
| ≥ 100 | Upkeep |
| < 100 | (ei asetettu) |

## Havainnot
- ⚠️ **MRR on formula-kenttä** — sen arvon muutos ei aina luotettavasti laukaise "When record updated" -triggeriä. Jos trigger ei reagoi MRR:n muutokseen, paketti jää asettamatta. Vaihda watched-kentäksi MRR:n lähde-syöttökentät (esim. `Paketin kk arvo` / `Myönnetty tukisumma` jos relevantti).
- Ehdoissa pieni epäjohdonmukaisuus: `> 2000`, `> 700`, `> 400`, mutta `>= 260`, `>= 200`. Tarkoitus tarkistettava — jos pakettien rajat ovat 200, 260, 400, 700, 2000, kaikkien pitäisi olla `>=` tai kaikkien `>`.
- Skripti **ei päivitä** pakettia jos se on jo asetettu, vaikka MRR muuttuisi luokasta toiseen — jää manuaaliseksi siivousta vaativaksi.
