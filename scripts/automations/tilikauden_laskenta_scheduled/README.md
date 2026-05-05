# Tilikauden laskenta, scheduled

**Workflow ID:** `wflA62AwiIZgrtccL`
**Status:** deployed
**Tarkoitus:** Sama kuin button-versio mutta laukeaa joka yö. Pitää Tilikauden laskenta -taulun aggregaatit ajan tasalla.

## Trigger
- Tyyppi: At scheduled time
- Aikataulu: päivittäin **1:00am EEST**, alkaen 24.11.2025

## Toiminnot
1. **Run script** — ks. [`script.js`](script.js) (lähes identtinen button-version kanssa)

## Erot button-versioon (`tilikauden_laskenta_button`)

- ⚠️ **Asiantuntijat-suodatus eri:** scheduled vaatii `expertsCell.length === 1` (vain 1 asiantuntija per rivi). Button-versio ottaa ensimmäisen jos useita. Tämän takia **scheduled jättää joka yö pois rivit joissa on useampi asiantuntija** → button-versio antaa eri tuloksen kuin scheduled.
- Scheduled-versiossa **ei ole** `mrrAsiakkaatCounts`-kenttää → tämä saraketta ei päivitetä yöllä, vain button-painalluksesta.
- Scheduled **ei ole** Lähtevät-arvojen min-floor 5000€ -logiikkaa.
- Hakemukset-kpl ja muut laskennat samanlaiset.

## Suositus
- **Yhdistä button + scheduled samaan skriptiin** — kopioi button-versio päälle. Eroavaisuudet ovat todennäköisesti vahingossa syntyneitä, eivät tarkoituksellisia. Ylläpidettävyys paranee.
