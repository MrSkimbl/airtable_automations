# Bonusrajat

**Workflow ID:** `wflnssQKhF7xBWg6a`
**Status:** deployed
**Tarkoitus:** Kun asiantuntijan vuositason `Bonusraja` tai `Tavoite` muuttuu Bonusrajat ja tavoitteet -taulussa, propagoi /12-jaettu kuukausiarvo kaikkiin Tilikauden laskenta -rivihin tälle asiantuntijalle.

## Trigger
- Tyyppi: When record updated
- Taulu: Bonusrajat ja tavoitteet
- Watched fields: *(ei kerrottu — todennäköisesti Bonusraja, Tavoite, Asiantuntija)*

## Toiminnot
1. **Run script** — ks. [`script.js`](script.js)
   - Input: `recordId` = triggeröineen Bonusrajat-rivin id

## Logiikka
1. Hae Bonusrajat-rivi (Asiantuntija, Bonusraja, Tavoite)
2. Vaadi täsmälleen 1 asiantuntija (skip jos 0 tai useampi)
3. Hae kaikki Tilikauden laskenta -rivit
4. Suodata vain ne joissa `Asiantuntija[0].id` täsmää
5. Päivitä `Bonusraja = vuosi/12`, `Tavoite = vuosi/12` jokaiselle löytyneelle riville
6. Batch 50 kerrallaan

## Havainnot
- Skripti kovakoodaa jaon /12. Jos tilikauteen kuuluisi vähemmän/enemmän kuukausia (esim. uusi asiantuntija aloittaa kesken vuoden), tämä antaa väärän kuukausirajan.
- Heittää erroria jos `recordId` puuttuu tai useampi asiantuntija — hyvä early-exit.
- Ei suodata Tilikausi-kentällä → päivittää myös vanhojen tilikausien rivejä jos asiantuntija on sama. Saattaa olla bugi: `Bonusraja` 25-26-tilikauden rivillä päivittyy mutta vanhojen tilikausien rivit myös. Suositus: lisää suodatus `Tilikausi == "2025–2026"`.
