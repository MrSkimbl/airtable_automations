# Tilikausi — kuukausilaskenta ja bonukset

Skriptit, jotka laskevat ja aggregoivat asiantuntijoiden kuukausittaiset liiketoimintatulokset ja bonukset Tilikauden laskenta -tauluun.

> Linkit: [00 README](../README.md) · [01 Base-rakenne](../01_base_rakenne.md) · [02 Scripting-käytännöt](../02_scripting_kaytannot.md) · [03 Tarkistuslista](../03_ai_agentti_checklista.md) · [04 Automaatiot](README.md)

---

## Yleiskuva

Tilikausijärjestelmä:
- Laskee asiantuntijakohtaisen suorituksen **kuukausittain**
- Aggregoi tiedot kaikista kategorioista (komissiot, projektit, MRR, tarjouspyynnöt)
- Laskee bonukset **vain päättyneille kuukausille**
- Päivittää `Tilikauden laskenta` -taulun, jossa on yksi rivi per asiantuntija per kuukausi

---

## Sisällysluettelo

1. [Skriptit](#skriptit)
2. [Pikaviite (kaavat)](#pikaviite-kaavat)
3. [Kohdetaulu — Tilikauden laskenta](#kohdetaulu--tilikauden-laskenta)
4. [Liiketoimintalogiikka tarkemmin](#liiketoimintalogiikka-tarkemmin)
5. [Manuaaliskriptin ajaminen](#manuaaliskriptin-ajaminen)
6. [Yleisimmät ongelmat](#yleisimmät-ongelmat)

---

## Skriptit

| Skripti | Tyyppi | Trigger |
|---------|--------|---------|
| **tilikausi_update** | Real-time | Bonusrajat ja tavoitteet -taulun rivi muuttuu |
| **bonusraja_tavoite_update** | Real-time | Bonusrajat ja tavoitteet -taulun rivi muuttuu |
| **tilikausi_manuaalinen** | Manuaalinen / aikataulutettu | Scripting-laajennus |

### tilikausi_update / bonusraja_tavoite_update

**Mitä tekee:** Päivittää bonusrajat ja tavoitteet `Tilikauden laskenta` -tauluun, kun niitä muokataan `Bonusrajat ja tavoitteet` -taulussa.

**Setup:**

| Asetus | Arvo |
|--------|------|
| Trigger | "When record updated" → taulu **Bonusrajat ja tavoitteet** |
| Condition | **`Last modified by IS NOT Automation`** ⚠️ |
| Action | Run script |

**Logiikka:**

```
1. Lue triggerin asiantuntijan Bonusraja ja Tavoite (vuositaso)
2. Jaa molemmat 12:lla → kuukausitaso
3. Päivitä KAIKKI sen asiantuntijan rivit Tilikauden laskenta -taulussa:
   - Bonusraja  ← vuosiraja / 12
   - Tavoite    ← vuositavoite / 12
```

**Esimerkki:**

```
Vuositason Bonusraja: 200 000 €  →  Kuukausitasolla 16 666,67 €
Vuositason Tavoite:   250 000 €  →  Kuukausitasolla 20 833,33 €
```

### tilikausi_manuaalinen

**Mitä tekee:** Laskee koko `Tilikauden laskenta` -taulun uudelleen alusta.

**Milloin ajetaan:**

- Kun aggregaatit eivät täsmää lähdedataan
- Suuren datapäivityksen jälkeen
- Rakenteellisen muutoksen jälkeen
- Kuukausittain / kvartaaleittain täydellinen tarkistus

**Vaiheet:**

1. **Datankeruu:** Hae kaikki rivit `Asiantuntijat`-taulusta
2. **Kategorisointi:** Ryhmittele asiantuntijan, kategorian, statuksen ja NB/EB:n mukaan
3. **Kuukausiaggregointi:** Summaa arvot kuukausikenttiä kohden (`9-25`, `10-25`, ...)
4. **Bonuslaskenta:** Päättyneille kuukausille laske bonus
5. **Batch-päivitys:** Kirjoita `Tilikauden laskenta` -tauluun (max 50 / batch)

**Output:** Yksi rivi per asiantuntija per kuukausi. Päivittää myös ne rivit, joilla ei enää ole dataa → asetetaan 0:ksi.

---

## Pikaviite (kaavat)

### Toteuma
```
Toteuma = Komissiot (Hyväksytty) + Projektit (¬NB) + MRR (¬NB)
```

### Ennuste
```
Ennuste = MRR (NB) + Hakemukset (Lähetetty / Tulossa / Työn alla / Täydennys)
```

### Bonus per kuukausi
```
Kuukausibonus = (Toteuma - Bonusraja) × 0,15
                ─────────────────────────
                vain jos Toteuma > Bonusraja
                vain päättyneille kuukausille
```

### Kumulatiivinen bonus
```
Bonus_kum(N) = SUM(Bonus(1...N) päättyneille kuukausille)
```

### NB / EB
- **NB** = Not Booked (ennuste, EI Toteumaan)
- **EB / tyhjä** = Booked (Toteumaan)

---

## Kohdetaulu — Tilikauden laskenta

> Kentät kerrotaan tarkemmin → [01_base_rakenne.md](../01_base_rakenne.md) → "Taulu 2 — Tilikauden laskenta"

**Yksi rivi = yksi asiantuntija + yksi kuukausi.**

Kentät jakautuvat:

- **Tunnistetiedot:** `Asiantuntija`, `Kuukausi` (esim. `10-25`), `Tilikausi`
- **Liikevaihto:** `Toteuma`, `Ennuste`, `MRR`, `Projektit`, `Komissiot`, `Komissiot, ennuste`, `Komissiot, liikevaihto`, `Lähetetyt`, `Lähtevät`
- **Tavoitteet:** `Bonusraja`, `Tavoite`
- **Lukumäärät:** `Hakemukset, kpl`, `Hakemukset, kpl ennuste`, `MRR asiakkaita, kpl`
- **Bonus:** `Bonus, kuukausi`, `Bonus, kumulatiivinen`
- **Metatiedot:** `Toteutunut` (Checkbox), `Viimeisin päivitys`

> ⚠️ Kaikki kentät nollataan ennen uutta laskentaa, jotta vanhat arvot eivät kasaudu.

---

## Liiketoimintalogiikka tarkemmin

### 1. Toteuma — toteutunut liikevaihto

**Määritelmä:** Tosiasiallisesti kirjattu, varmistunut liikevaihto.

**Komponentit:**

#### 1.1 Hyväksytyt komissiot
- `Kategoria = "Komissio"`
- `Status = "Hyväksytty"`
- **Summa:** `laskutettusumma`
- **Päivämäärä:** `Päätöspäivä, toteutunut` (määrittää kuukauden)
- **Kirjauslogiikka:**
  - Varovaisuuskirjaus (50 % lähetyskuukaudelle) + lopullinen päätöskuukaudelle
  - Esim. päätös 15.11.2025 → summa kuukauteen `11-25`

#### 1.2 Kirjatut projektit
- `Kategoria = "Projekti"`
- `NB / EB`: tyhjä TAI `EB`
- **Summa:** kuukausikenttä-arvot (`10-25`, `11-25`, ...)
- Esim. 5 000 €/kk jatkuvasta projektista

#### 1.3 Kirjattu MRR
- `Kategoria = "MRR"`
- `NB / EB`: tyhjä TAI `EB`
- **Summa:** kuukausikenttä-arvot
- Toistuva kuukausittainen liikevaihto (esim. 2 000 €/kk asiakkaalta X)

### 2. Ennuste — odotettu tuleva liikevaihto

**Määritelmä:** Arvioitu tuleva liikevaihto, joka ei ole vielä varmistunut.

**Komponentit:**

#### 2.1 Ennuste MRR (NB)
- `Kategoria = "MRR"`, `NB/EB = "NB"`
- Uudet asiakkaat, jotka tulevat voimaan
- Esim. 3 000 €/kk alkaa 12/2025 → ennusteeseen

#### 2.2 Ennuste Projektit (NB)
- `Kategoria = "Projekti"`, `NB/EB = "NB"`
- Tulevat projektit, joita ei vielä varmistunut

#### 2.3 Lähetetyt hakemukset
- `Kategoria = "Komissio"`, `Status ∈ {Lähetetty, Täydennys, Hyväksytty}`
- **Päivämäärä:** `Päätöspäivä, ennuste`
- **Summa:**
  - Jos `Status = Hyväksytty` → `laskutettusumma`
  - Muuten → `Laskutusennuste`
- Esim. lähetetty 15.10, päätös odotetaan 15.12 → ennusteeseen `12-25`

#### 2.4 Lähtevät hakemukset
- `Kategoria = "Komissio"`, `Status ∈ {Tulossa, Työn alla}`
- **Päivämäärä:** `Arvioitu valmistuminen` TAI `Päätöspäivä, ennuste`
- **Summa:** `Laskutusennuste`
- **Erityislogiikka:** Jos `Laskutusennuste < 100 €` → asetetaan **5 000 €** (varovaisuusarvo, jotta hakemus näkyy ennusteessa)

### 3. Bonuslaskenta

**Perusperiaate:** Bonus maksetaan vain toteutuneesta liikevaihdosta, joka ylittää bonusrajan.

#### Kuukausibonus

```javascript
if (Toteuma > Bonusraja) {
    Kuukausibonus = (Toteuma - Bonusraja) * 0.15;   // 15 % ylittävästä
} else {
    Kuukausibonus = 0;
}
```

**Esimerkki (lokakuu 2025):**
```
Toteuma:    25 000 €
Bonusraja:  16 667 €  (= 200 000 / 12)
Ylitys:      8 333 €
Bonus:       1 250 €  (8 333 × 0,15)
```

#### Kumulatiivinen bonus

```
Kumulatiivinen_bonus = 0
for kuukausi in päättyneet_kuukaudet:
    Toteuma_kum    = SUM(Toteuma[1...kuukausi])
    Bonusraja_kum  = (Vuosiraja / 12) × kuukausi
    if Toteuma_kum > Bonusraja_kum:
        Kumulatiivinen_bonus = (Toteuma_kum - Bonusraja_kum) × 0.15
```

**Esimerkki (3 kuukautta toteutunut, vuosiraja 200 000 €):**
```
Syyskuu:   18 000 €  →  bonus 200 €
Lokakuu:   25 000 €  →  bonus 1 250 €
Marraskuu: 22 000 €  →  bonus 800 €

Kumulatiivinen yhteensä: 2 250 €
```

#### Päättynyt vs. tuleva kuukausi

| Tila | Määritelmä | Bonuslaskenta |
|------|------------|---------------|
| **Päättynyt** | nykyhetki > kuukauden viimeinen päivä | Kyllä |
| **Tuleva** | kuukausi ei ole päättynyt | Ei |

> ⚠️ **Ennusteet eivät vaikuta bonukseen.** Vain Toteuma päättyneiltä kuukausilta.

### 4. Muut mittarit

#### Hakemukset (kpl)
- **Lähetetyt:** Status `Lähetetty / Täydennys / Hyväksytty / Hylätty`, kuukausi `Valmistuminen/Lähetys`
- **Ennuste:** Status `Tulossa / Työn alla`, kuukausi `Arvioitu valmistuminen`

#### MRR-asiakkaita (kpl)
- Kirjattujen (`¬NB`) MRR-rivien määrä per kuukausi
- Jos asiakkaalla on arvoa MRR-sarakkeessa → +1 asiakas

#### Tavoite
- Vuositavoite jaettu 12:lla (kuten bonusraja)
- Vertailukohta — ei vaikuta bonukseen

### 5. Duplikaattien esto

**Useampi asiantuntija samalla rivillä:**
- Jos `Asiantuntija`-kenttä sisältää useamman henkilön
- Laskenta tehdään VAIN ensimmäiselle
- Estää saman liikevaihdon laskemisen useaan kertaan

**Ratkaisu:** Luo erillinen rivi jokaiselle asiantuntijalle.

---

## Manuaaliskriptin ajaminen

1. Avaa Airtable Scripting-laajennus
2. Kopioi `tilikausi_manuaalinen.js` sisältö
3. Klikkaa **Run**
4. Seuraa konsolista edistymistä
5. Varmista tulokset `Tilikauden laskenta` -taulusta

**Odotettu output:**

```
Haetaan data...
Löytyi X riviä

Käsitellään asiantuntijat...
  Asiantuntija 1: 12 kuukautta
  Asiantuntija 2: 12 kuukautta
  ...

Päivitetään rivejä (batch 1/X)...
✅ VALMIS!
```

**Suoritusaika:** Tyypillisesti 30–120 s. Suurilla dataseteillä pitempi.

---

## Yleisimmät ongelmat

### Summat eivät täsmää lähdedataan

**Oire:** `Toteuma` tai `Ennuste` ei vastaa sitä mitä `Asiantuntijat`-taulussa näkyy.

**Syyt:**
- Vanhentunut data `Tilikauden laskenta` -taulussa
- Väärät NB/EB-arvot lähdedatassa
- Kategoria väärin asetettu
- Useampi asiantuntija samalla rivillä (lasketaan vain ensimmäiselle)

**Korjaus:**
1. Tarkista lähdedatan kategoriat ja NB/EB
2. Aja `tilikausi_manuaalinen` uudelleen
3. Tarkista että päivämäärät vastaavat odotettuja kuukausia
4. Tarkista Status-arvot

### Bonus on 0 vaikka pitäisi olla isompi

**Oire:** Odotetaan bonusta, näkyy 0 €.

**Syyt:**
- Kuukausi ei ole vielä päättynyt
- `Bonusraja` ei asetettu oikein
- `Toteuma` < `Bonusraja` (ei bonusta)
- Vuosiraja ei jaettu 12:lla oikein

**Tarkistuslista:**
1. `nykyhetki > kuukauden viimeinen päivä`?
2. `Bonusraja` `Bonusrajat ja tavoitteet` -taulussa?
3. Kuukausi-bonusraja = vuosiraja / 12 (esim. 16 666,67 jos vuosi 200 000)?
4. `Toteuma > Bonusraja`?
5. Kaava: `(Toteuma − Bonusraja) × 0,15`?

### Kuukausia puuttuu asiantuntijalta

**Oire:** Joitain kuukausia puuttuu `Tilikauden laskenta` -taulusta yhdeltä asiantuntijalta.

**Syyt:**
- Asiantuntija lisätty tilikauden alkamisen jälkeen
- `tilikausi_manuaalinen` ei ajettu lisäyksen jälkeen
- Asiantuntijalla ei rivejä `Asiantuntijat`-taulussa

**Korjaus:**
1. Aja `tilikausi_manuaalinen` → luo KAIKKI kuukaudet KAIKILLE asiantuntijoille
2. Varmista että asiantuntija on olemassa
3. Tarkista että hänellä on vähintään yksi rivi (vaikka kaikki nollia)

### `Hakemukset, kpl ennuste` näyttää väärän määrän

**Juurisyy:**
Skripti käsittelee Komissio-hakemuksia useissa lohkoissa:
1. **HAKEMUS ENNUSTE -lohko:** Käsittelee `Päätöspäivä, ennuste`-perusteella
2. **KOMISSIO-lohko:** Käsittelee `Lähtevät`-osiot ja laskee `Arvioitu valmistuminen`-perusteella

**Kriittinen detalji:** Jos HAKEMUS ENNUSTE -lohko käyttää `continue`-lauseita, jotkin rivit eivät päädy KOMISSIO-lohkoon → alilaskenta.

**Ratkaisu:** Skriptin pitää käyttää sisäkkäisiä `if`-rakenteita `continue`n sijaan, jotta kaikki rivit pääsevät kaikkiin tarvittaviin lohkoihin.

### `Lähtevät`-osiossa odottamattomat 5 000 € -merkinnät

**Oire:** Hakemus näkyy 5 000 €:llä `Lähtevät`-osiossa, mutta `Laskutusennuste` on eri.

**Tämä on tarkoituksellista:**

```
Jos Laskutusennuste < 100 €  (käytännössä tyhjä)
JA Status ∈ {Tulossa, Työn alla}
→ järjestelmä asettaa arvoksi 5 000 €
```

**Syy:** Varmistaa että kaikki työn alla olevat hakemukset näkyvät ennusteessa, vaikka tarkka summa ei ole tiedossa.

**Korjaus:** Päivitä `Laskutusennuste` todellisella arvolla. Kun arvo ≥ 100 €, järjestelmä käyttää sitä.

### Kaksinkertainen laskenta

**Oire:** Liikevaihto näkyy korkeampana kuin pitäisi.

**Syy:** Useampi asiantuntija samalla rivillä `Asiantuntijat`-taulussa.

**Toivottu käyttäytyminen:**
- Esim. rivillä `"Jaakko Ojanen, Teija Metso"` → lasketaan VAIN Jaakkolle
- Estää saman liikevaihdon laskemisen kahteen kertaan

**Ratkaisu (jos molempien pitäisi saada osansa):**
- Rivi 1: Jaakko Ojanen | 50 % summasta
- Rivi 2: Teija Metso | 50 % summasta

### Skripti ei päivitä mitään

**Oire:** Skripti ajetaan onnistuneesti, mutta data ei muutu.

**Syyt:**
- Väärä base
- Taulun nimi väärin
- Kentän nimi muuttunut
- Oikeudet väärin

**Korjaus:**
1. Varmista oikea base
2. Tarkista taulujen nimet: `Asiantuntijat`, `Tilikauden laskenta`
3. Tarkista kenttänimet kirjaintarkasti → [01_base_rakenne.md](../01_base_rakenne.md)
4. Tarkista että API-tokenilla on kirjoitusoikeudet
5. Lue konsolista virheilmoitukset

### Suorituskyky / aikakatkaisu

**Oire:** Skripti kestää erittäin pitkään.

**Syyt:**
- Iso datasetti (1 000+ riviä)
- Monimutkaiset formula-kentät lähdetaulussa
- Verkkoviive

**Korjaus:**
1. Aja ruuhkahuippujen ulkopuolella
2. Käsittele pienemmissä erissä
3. Tarkista että batch-koko on 50
4. Jos jatkuvaa, harkitse tilikauden pilkkomista

---

## Avainkonseptit

| Termi | Selitys |
|-------|---------|
| **Tilikausi** | 9/YYYY → 8/(YYYY+1), esim. 9/2025 – 8/2026 |
| **Päättynyt kuukausi** | Kuukausi on päättynyt → bonus lasketaan |
| **NB / EB** | NB = Not Booked (ennuste), EB / tyhjä = Booked (toteuma) |
| **Kumulatiivinen** | Lasketaan tilikauden alusta, ei yksittäisistä kuukausista |
| **Varovaisuus (5 000 €)** | Oletusarvo tuntemattomille hakemuksille `Lähtevät`-osiossa |

---

## Liittyy

- Lähdetaulu **Asiantuntijat** → [01_base_rakenne.md](../01_base_rakenne.md) → "Taulu 1"
- Kohdetaulu **Tilikauden laskenta** → [01_base_rakenne.md](../01_base_rakenne.md) → "Taulu 2"
- Bonusrajat **Bonusrajat ja tavoitteet** → [01_base_rakenne.md](../01_base_rakenne.md) → "Taulu 3"
- Liikevaihtokirjausten kuukausijako → [liikevaihto.md](liikevaihto.md)
- Päätöspäivän ennustelogiikka (vaikuttaa Ennusteen kuukauden määräytymiseen) → [ennusteet.md](ennusteet.md)
