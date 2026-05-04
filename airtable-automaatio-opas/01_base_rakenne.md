# 01 — Basen rakenne (Asiakas & hakemuskanta)

> **Tämä on tämän paketin tärkein dokumentti.** Aina kun olet kirjoittamassa skriptiä, varmista taulujen ja kenttien nimet täältä **sanasta sanaan** — erityisesti pilkut, isot kirjaimet ja välilyönnit.

> **Lähde:** Airtable Meta API (`/v0/meta/bases/app5bwxdTTUmbSyUK/tables`). Raaka-JSON on tallennettu `../schema/base_schema_full.json` jatkokäyttöä varten.
> **Päivitetty:** 2026-05-04 (API-pohjainen tarkistus)

Ks. myös:
- [02_scripting_kaytannot.md](02_scripting_kaytannot.md) — miten näitä luetaan/kirjoitetaan turvallisesti
- [03_ai_agentti_checklista.md](03_ai_agentti_checklista.md) — yleisimmät virheet kun nimet ovat väärin
- [04_automaatiot/](04_automaatiot/README.md) — esimerkit kentistä käytössä

---

## Sisällysluettelo

1. [Yleiskuva](#yleiskuva)
2. [Taulu 1 — Asiantuntijat (päätaulu)](#taulu-1--asiantuntijat-päätaulu)
3. [Taulu 2 — Myynti](#taulu-2--myynti)
4. [Taulu 3 — Toimenpiteet](#taulu-3--toimenpiteet)
5. [Taulu 4 — Viestiasetukset](#taulu-4--viestiasetukset)
6. [Taulu 5 — Tilikauden laskenta](#taulu-5--tilikauden-laskenta)
7. [Taulu 6 — Bonusrajat ja tavoitteet](#taulu-6--bonusrajat-ja-tavoitteet)
8. [Taulu 7 — Testimonialit](#taulu-7--testimonialit)
9. [Taulu 8 — Laskutus](#taulu-8--laskutus)
10. [Taulu 9 — Palvelupaketit](#taulu-9--palvelupaketit)
11. [Taulu 10 — Y-tunnus avain](#taulu-10--y-tunnus-avain)
12. [Taulu 11 — Instrumenttiavain](#taulu-11--instrumenttiavain)
13. [Loogiset yhteydet ja datan kulku](#loogiset-yhteydet-ja-datan-kulku)
14. [Liiketoimintalogiikka (Toteuma / Ennuste / Bonus)](#liiketoimintalogiikka)
15. [Tärkeät huomiot](#tärkeät-huomiot)

---

## Yleiskuva

**Base ID:** `app5bwxdTTUmbSyUK` ("Asiakas & hakemuskanta - AT")

Base sisältää **11 taulua**. Aikaisempi dokumentaatio mainitsi vain 7 taulua; uudet (Testimonialit, Laskutus, Palvelupaketit, Y-tunnus avain, Instrumenttiavain) on lisätty tähän versioon. Vanha "Komissiot API-kutsua varten" -taulu ei enää löydy API:sta.

| # | Taulu | Table ID | Tarkoitus |
|---|-------|----------|-----------|
| 1 | **Asiantuntijat** | `tblRdgQNtY3sZT0lV` | Päätaulu — kaikki toimeksiannot (Komissiot, Projektit, MRR, Liikevaihto, Toimenpiteet) |
| 2 | **Myynti** | `tbluPmvPs96wU9Y1G` | Myyntitiimin tavoitteet ja toteumat |
| 3 | **Toimenpiteet** | `tblQEz11Y4292qMEu` | Toimenpide-sääntöjen määrittelyt (automaatio-triggerit) |
| 4 | **Viestiasetukset** | `tblIreGdZWiBmqHLd` | Asiantuntijakohtaiset ilmoitusasetukset (Slack, Email) |
| 5 | **Tilikauden laskenta** | `tblOQQPDlygvvKWvL` | Aggregoitu kuukausiraportointi per asiantuntija |
| 6 | **Bonusrajat ja tavoitteet** | `tblowAb5HFB58EHNS` | Asiantuntijakohtaiset vuositavoitteet ja bonusrajat |
| 7 | **Testimonialit** | `tblzY57V6vBfVna2e` | Asiakastarinat ja referenssit |
| 8 | **Laskutus** | `tblsaXpNYmIKEvz0P` | Laskutusseuranta |
| 9 | **Palvelupaketit** | `tblsvpyvxgPjUwCRb` | Palvelupakettien tiedot |
| 10 | **Y-tunnus avain** | `tblcliFXQYxtNqHIh` | Y-tunnusten ja virallisten nimien rekisteri |
| 11 | **Instrumenttiavain** | `tblMRfTR4opM2pg5n` | Rahoitusinstrumenttien rekisteri (Airtable ↔ MCP ↔ Slack -mappaus) |

---

## Taulu 1 — Asiantuntijat (päätaulu)

`tblRdgQNtY3sZT0lV` — Pääasiallinen datataulu, joka sisältää kaikki toimeksiannot. **API-vahvistettu kenttämäärä: ~130** (sisältää myös vanhojen tilikausien kuukausikentät).

> **Primary field:** `Asiakas` (`flds2dRicSScfzRiO`)

### 1.1 Asiakas ja asiantuntija

| Kenttä | Tyyppi | Field ID | Huomiot |
|--------|--------|----------|---------|
| `Asiakas` | singleLineText | `flds2dRicSScfzRiO` | Asiakkaan nimi (primary) |
| `Asiantuntija` | multipleCollaborators | `fldoI4xIwqHGjYjNJ` | Palauttaa: `[{id: "usrXXX", email: "...", name: "Nimi"}]` |
| `Asiantuntija (Vanha)` | singleSelect | `fld70i2yzia3qM0h7` | Legacy — 24 valintaa (mm. Aki Pohjola, Teija Metso, Henrik Lähdesniemi, Mikko Hölli, ...) |
| `Y-Tunnus` | singleLineText | `fldww52AS6UH6kuwb` | Asiakkaan Y-tunnus |
| `Asiakas-linkki` | multipleRecordLinks | `fld5pydg2tTGR6PuO` | Linkki Y-tunnus avain -tauluun |
| `Asiakas (from Asiakas-linkki)` | multipleLookupValues | `fldKHcMy1XEdwMcxi` | Lookup |
| `kontaktihenkilö` | email | `fldOxhHbFH2p7dtf3` | |

### 1.2 Kategoria, Status ja NB/EB

**`Kategoria`** (`fldYAJaQLlBVH5oyD`, singleSelect) — **9 vaihtoehtoa**:

| Arvo | Choice ID | Selitys |
|------|-----------|---------|
| `MRR` | `selXiEwB5XyZZhiCy` | Kuukausittainen tulonlähde |
| `Projekti` | `sel417GCc02G1XFit` | Kertaluonteinen projektityö |
| `Komissio` | `selhi81yCAJ43lZs5` | Hakemusperusteinen provisio |
| `Toimittajapalvelu` | `selfAsuN9BIoxir8c` | Toimittajapalvelut |
| `Toimenpide` | `selunpcPnczCNPm4f` | Toimenpiderivi (linkittyy pääriviin) |
| `Tarjouspyyntö` | `sel7HDEdDQHkhDOTZ` | **(uusi 2026)** Tarjouspyyntövaiheessa oleva |
| `Liikevaihto` | `selawuWNtCu9301T4` | Erillinen — **EI** lasketa Toteumaan |
| `Raportointi` | `selJOLH1zV00oUxV9` | **(uusi 2026)** Raportointi-toimeksianto |
| `EU-Komissio` | `selUYhlKcVxiuCnL9` | **(uusi 2026)** EU-rahoitusinstrumentti |

**`Status`** (`fldZXa9oI4HQ6YQ9e`, singleSelect) — **11 vaihtoehtoa**:

| Arvo | Choice ID | Selitys |
|------|-----------|---------|
| `Tulossa` | `selbmSS2OVgyBlQ6n` | Tuleva hakemus |
| `Työn alla` | `selsCubLGFrdzpwNN` | Valmistellaan |
| `Konsultointi` | `selF7DUaRvGc4lFhz` | **(uusi 2026)** Konsultointivaihe |
| `Lähetetty` | `selaiEi9X3VD69c5k` | Hakemus lähetetty |
| `Täydennys` | `sel8qh1TWAvTGEjUR` | Täydennyspyyntö |
| `Ehdollinen päätös` | `sel4kv9jldzs5u5RD` | **(uusi 2026)** Ehdollinen rahoituspäätös |
| `Hyväksytty` | `selkyJuUFJ07Tsnsj` | Rahoituspäätös hyväksytty / projekti valmis |
| `Hylätty` | `selLnEFkVbGdPcA59` | Hylätty hakemus |
| `Peruttu` | `selGJVv0m4LmvlKfh` | Peruttu |
| `Tauolla` | `selAJ7TAKUhQ3J6Fj` | Tauolla |
| `Suunnitelma valmis` | `selFohJQHCUyCOUk5` | **(uusi 2026)** Suunnitelma valmistunut |

**`NB / EB`** (`fldsc8Lw6NcG4HZLt`, singleSelect) — **6 vaihtoehtoa**:

| Arvo | Choice ID | Selitys |
|------|-----------|---------|
| `NB` | `selbyjPN4aJu5bfRj` | New Business — toive asiakkuudesta. **EI** Toteumaan, **EI** bonukseen. |
| `SB` | `selKxumn5fKhm0j6i` | Starting Business — alkava asiakkuus, ei vielä laskutus. Ennusteeseen, ei bonukseen. |
| `EB` | `sel0aGXlGA22vXDCA` | Existing Business — laskutus käynnissä. Toteumaan ja bonukseen. |
| `LB` | `selkxqIDl7R7ZLkhs` | Lost Business — lopettamassa. Toteumaan viimeiseen laskuun asti. |
| `Toimittajapalvelu` | `selqL7Fa3l5Foim53` | **(uusi 2026)** Toimittajapalvelukategoria |
| `S` | `selHxIrV7N7yHDvH2` | **(uusi 2026)** S-luokitus |

### 1.3 Taloudelliset kentät

| Kenttä | Tyyppi (API) | Field ID | Selitys |
|--------|--------------|----------|---------|
| `tk 25-26 total` | formula | `fldSzbvwYWju7j6WG` | **Tilikauden 2025-2026 kokonaissumma** (laskettu) |
| `laskutettusumma` | **formula** | `fldFZSHY6v7T3yRC7` | Laskettu: `Myönnetty tukisumma × Komissio%` |
| `Laskutusennuste` | **formula** | `fldfeIvapsAArG3pN` | Laskettu ennuste |
| `Projektin koko` | **currency** | `fldJrpvgL2esgLgnQ` | Projektin kokonaiskoko € |
| `Haettu tukisumma` | **currency** | `fldngyhJWaugZEDUP` | Haetun tukisumman määrä |
| `Myönnetty tukisumma` | number | `fldztXFcNPLtQux6W` | Myönnetyn tukisumman määrä |
| `Komissio%` | **percent** | `fldaDYaxVFROHvqhK` | Provisioprosentti |
| `Komissio` | **percent** | `fldF48O0RtIvWxLWz` | Komissio (toinen %-kenttä) |
| `Budjetti` | **currency** | `fld3x17j5X8YHxpik` | |
| `Tapaamiskreditti` | **currency** | `fldZSFSIkK2M3peyh` | |
| `Arvo` | **currency** | `fldzJCFFJX1UpJdyd` | |
| `Realisoitunut liikevaihto` | **currency** | `flduVcbpCgKj4fc7b` | |
| `Kohdistunut kuukausiliikevaihto` | **currency** | `fldBfQEKA5gPH9SSg` | |
| `Liikevaihtopotentiaali` | formula | `fldkFkXGhdxeqZPvZ` | |
| `Liikevaihtoennuste` | formula | `fldlmrPrTBxKwIuWv` | |
| `Liikevaihdon toteutumisen ennuste %` | percent | `fld2Jh3wVKsw7xeci` | |
| `Testi: syyskuu liikevaihtokertymä` | number | `fldzdjV7uVJXLDN1u` | Tarkistuskenttä |

> ⚠️ **Korjaus aiempaan dokumenttiin**: `Laskutusennuste`, `laskutettusumma`, `MRR`, `MRR Päättyy`, `MRR päättyy päivämäärä` ja `tk 25-26 total` ovat **formula-kenttiä** — niitä ei voi suoraan kirjoittaa. Aiempi dokumentaatio merkitsi useita näistä Number- tai Text-kentiksi.

### 1.4 MRR-kentät

| Kenttä | Tyyppi (API) | Field ID | Selitys |
|--------|--------------|----------|---------|
| `MRR` | **formula** | `fldxKl0RXXu9roqeK` | Kuukausittainen MRR-arvo (€) — **laskettu** |
| `MRR Päättyy` | **formula** | `fld2MkOjWUOaugifO` | MRR-päättymisen tekstimuoto — **laskettu** |
| `MRR päättyy päivämäärä` | **formula** | `fldz5raNFqJa6aQ0g` | MRR-päättymispäivä — **laskettu** |
| `Palvelupaketti` | singleSelect | `fldKawNagWu2MfkCl` | 8 vaihtoehtoa: `Pro`, `Expert`, `EU`, `Enterprise`, `Projekti`, `Starter`, `Invest`, `Upkeep` |
| `Palvelupaketit` | multipleRecordLinks | `fldZHieB2SRr1wv0Y` | Linkki Palvelupaketit-tauluun |
| `Sopimuskauden loppu` | date | `fldPoe88IiFoh62k8` | Sopimuksen päättymispäivä |

> ⚠️ Aiempi dokumentaatio mainitsi kentät `Paketin kk arvo` ja `Paketti` — **näitä EI ole API:ssa**. Käytä `MRR` (formula) ja `Palvelupaketti` (singleSelect).

### 1.5 Päivämäärät

| Kenttä | Tyyppi | Field ID | Käyttö |
|--------|--------|----------|--------|
| `Aloituspäivä` | date | `fldqJwi1pRqJrnnfD` | Projektin/MRR:n aloituspäivä |
| `Arvioitu valmistuminen` | date | `flda7jrw3VJuNPPVj` | Arvio valmistumispäivästä |
| `Valmistuminen/Lähetys` | date | `fld3S4wu6q0tenCoP` | Hakemuksen lähetys / projektin valmistuminen |
| `Päätöspäivä, ennuste` | date | `fldxzjFOoKSPYXiHw` | **Pilkku + välilyönti!** |
| `Päätöspäivä, toteutunut` | date | `fldIvYqRx9hDbrVDr` | **Pilkku + välilyönti!** |
| `Lopetuspäivä` | date | `flduCM3hk2bmbtpBO` | Lopetuspäivä |
| `Sopimuskauden loppu` | date | `fldPoe88IiFoh62k8` | |
| `Projektin alkupäivä - raportointi` | date | `fld8DT2Xsvj8d9sjK` | Hyväksytyn rahoitusprojektin alkupäivä |
| `Projektin loppupäivä - raportointi` | date | `fld3IaRNCpyEO9niD` | Hyväksytyn rahoitusprojektin loppupäivä |
| `Loppuraportin deadline` | date | `fld11XVAqdtS3Y5vo` | |
| `Väliraportin 1 deadline` | date | `fldSfBnvKLFyw64KQ` | |
| `Väliraportin 2 deadline` | date | `fldDX3jaaHqam1T9D` | |
| `Väliraportin 3 deadline` | date | `fldYlKI3Y1baEo5bT` | |
| `Toimenpide, pvm` | date | `fldhvJi7twrgplrxf` | Toimenpiteen ajankohta |

### 1.6 Kuukausikentät (€)

**Vanhat tilikaudet (legacy 1-12, käyttötarkoitus epäselvä, säilytetty):**
`1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`

**Tilikausi 2025-2026:**

| Q1 (syksy 25) | Q2 (talvi) | Q3 (kevät 26) | Q4 (kesä 26) |
|--------------|-----------|--------------|-------------|
| `9-25` | `12-25` | `3-26` | `6-26` |
| `10-25` | `1-26` | `4-26` | `7-26` |
| `11-25` | `2-26` | `5-26` | `8-26` |

**Tilikausi 2026-2027 (uusi 2026):**

| Q1 (syksy 26) | Q2 (talvi) | Q3 (kevät 27) | Q4 (kesä 27) |
|--------------|-----------|--------------|-------------|
| `9-26` | `12-26` | `3-27` | `6-27` |
| `10-26` | `1-27` | `4-27` | `7-27` |
| `11-26` | `2-27` | `5-27` | `8-27` |

**Sisältö:** Euromääriä per kuukausi, tyyppi `number`.
**Täyttötapa:** Manuaalisesti, tai automaatio `komissiot_kuukausisarakkeisiin` (Status → Hyväksytty), tai manuaaliskripti `tilikausi_manuaalinen`.

### 1.7 Instrumentti

**`Instrumentti`** (`fldcMXhTA4XlftAqL`, singleSelect) — **34 vaihtoehtoa** (täydellinen lista API:sta):

`BF perimättäjättö`, `Coinnovation`, `EIC Interview`, `EIC Step 1`, `EIC Step 2`, `ELY EAKR`, `ELY JTF`, `ELY kansallinen TKI`, `EVK ReArm`, `Exhibition Explorer`, `Finnvera Digilaina`, `FP Liikekumppanuustuki`, `GenAI`, `Innovaatioseteli`, `Innowwide`, `Into`, `Kasvualusta- ja kuiviketuotanto`, `Kiihdyttämöt ja kansainävlistymisen valmistelu`, `Konsultointi`, `kyberturvallisuuslaki-tuki`, `Luovien alojen T&K-avustus`, `Maaseudun Investointi`, `Maaseudun kehittämistuki`, `Market Explorer`, `NIY`, `Nopef`, `Pilotointilaina`, `Sprint`, `Suunnitelma`, `T&K-laina`, `Talent`, `Tempo`, `TK-avustus`, `Työsuojelurahaston kehittämisavustus`

**Tulevat instrumentit (Lookup-kentät):**

| Kenttä | Field ID | Tyyppi |
|--------|----------|--------|
| `Seuraava, instrumentti` | `fldVAF4HFgl6RJZTQ` | multipleLookupValues |
| `Seuraavan aloitus` | `fld2hfHkWZ76XqwSq` | multipleLookupValues |
| `Viimeisin instrumentti` | `fldPT0epjlGaqFrOB` | multipleLookupValues |
| `Viimeisin lähetetty, status` | `fldH40F8DnjsFOXTC` | multipleLookupValues |
| `Viimeisin lähetys` | `fld2MoaSGEAPUQ0sA` | multipleLookupValues |

### 1.8 Toimenpiteet ja automaatio

**Toimenpide-rivit:**

| Kenttä | Tyyppi | Field ID |
|--------|--------|----------|
| `Toimenpide` | richText | `fldRoZDAzueupf9ie` |
| `Toimenpide, pvm` | date | `fldhvJi7twrgplrxf` |
| `Toimenpide tehty` | checkbox | `fldIhqK5VCsFGvbqI` |
| `Toimenpide-linkki` | multipleRecordLinks | `fld2yuhm0k6GX0O4Z` |
| `From field: Toimenpide-linkki` | multipleRecordLinks | `fldCiMdhksoXxWd1w` |
| `Toimenpide rules` | singleLineText | `fldgaI0KOR1yHAu3J` |
| `Toimenpiteet` | singleLineText | `fldmLKjhf00pY0hLE` |
| `Viesti toimenpiteestä` | singleSelect | `fldTN5Ej0VaqP8MrI` (`kyllä` / `ei`) |
| `Viesti asiakkaalle` | richText | `fldkxF3Z0yHCU4tkY` |

**Toimenpide rules -koodit:** ks. [Taulu 3 — Toimenpiteet](#taulu-3--toimenpiteet) (sääntölähde).

**Automaation kentät:**

| Kenttä | Tyyppi | Field ID | Selitys |
|--------|--------|----------|---------|
| `Lukittu (älä päivitä)` | checkbox | `fldP6RSILkIH5CX5U` | Estää automaattisen päivityksen/poiston |
| `Kanava` | multipleSelects | `fldEvpnXTqcDpj34z` | Arvot: `Slack`, `Email` (muokataan Viestiasetukset-taulusta) |
| `SlackId` | singleLineText | `fldZWRTqga5osCaHt` | Slack-kanavan ID |

**Liikevaihto-linkitys:**

| Kenttä | Tyyppi | Field ID |
|--------|--------|----------|
| `Liikevaihto-rivi` | multipleRecordLinks | `fldHFD5WLwZKWXAvK` |
| `From field: Liikevaihto-rivi` | multipleRecordLinks | `fldF9xDbThpw59Lyh` |

### 1.9 Muut kentät

| Kenttä | Tyyppi | Field ID | Selitys |
|--------|--------|----------|---------|
| `Raportin status` | singleSelect | `fldIpvtVioIDYCY89` | 6 arvoa: `Lähetetty`, `Odottaa muutospäätöstä`, `Peruttu / konkurssi / muu ongelma`, `Väliraportti työn alla`, `Loppuraportti työn alla`, `Tulossa` |
| `GAI-lisenssi` | singleSelect | `fldOkUTmooZnC0KtL` | 4 arvoa: `Ei luotu`, `Lisenssi tilattu`, `Lisenssi luotu`, `Lisenssi päätetty` |
| `kategoriat` | multipleSelects | `fldXlIWrsPzBsU2A8` | 14 palvelukategoriaa (Juridiikka, IPR, AI, Data, …) |
| `Hylkäyksen syy` | multipleSelects | `fldvAc5F2tX3NArME` | 17 syytä (mm. Verovelka, Omarahoituksen puute, …) |
| `Mätsäykset` | multipleSelects | `fldCPjnFUX9RApG5H` | 15 yritysnimeä (Advance b2b, Vuono Group, …) |
| `Aloituskuukausi` | singleSelect | `fldmhI1mbo4EZpFwC` | `9-25` … `12-26` |
| `Projektin alku` | singleSelect | `fld4LIWIbpxtWr1iF` | `8-25` … `12-26` |
| `CS-tapaaminen` | singleLineText | `fldqVPNJOvcYeWGYg` | |
| `Voitetut keissit` | singleLineText | `fldehwmtjovpU1sgk` | |
| `Tarjouspyyntö` | singleLineText | `fldhKx6bXiH7uhZ4c` | |
| `Sovitut tapaamiset` | multilineText | `fld2kmJZHXubGBwEq` | |
| `Kommentit` | multilineText | `fldhBwQ41qKk30WhM` | |
| `Huomiot` | multilineText | `fldWkG3Qj4YJrYIxk` | |
| `Kuukaudet` | singleLineText | `fldwUYl1X8XFRZdw8` | |
| `Kuukaudet 2` | singleLineText | `fldlVpjkBjQvHrHMj` | |

---

## Taulu 2 — Myynti

`tbluPmvPs96wU9Y1G` — Myyntitiimin tavoitteet ja toteumat viikko- ja kuukausitasolla.

> **Primary field:** `Viikonnumero` (`fldvG2N7Uzc439hU7`)

| Kenttä | Tyyppi | Field ID | Esimerkki / Huomiot |
|--------|--------|----------|---------------------|
| `Viikonnumero` | singleLineText | `fldvG2N7Uzc439hU7` | Muoto `"viikko-vuosi"`, esim. `"47-2025"` (primary) |
| `Myyjä` | singleSelect | `fldpP1OID3wUPDu8z` | `Aki Pohjola`, `Henrik Lähdesniemi`, `Joakim Schrey`, `Jussi Koivusaari`, `Miikka Liimatainen` |
| `TK` | singleLineText | `fldnqwNiJDbIeuAnF` | Tilikausi, esim. `"24-25"`, `"25-26"` |
| `Vuosi` | number | `fldlmZ5GYlfMXgXuM` | Esim. 2025 |
| `Kuukausi` | date | `fldrneZEo6QBqFohy` | Kuukauden ensimmäinen päivä |
| `Status` | singleSelect | `fldjs7oGKe620Yl8A` | Esim. `Done` |
| `Buukkauspalvelu` | number | `fldUPo8hMzZRw9klS` | Ulkoisen buukkauspalvelun tapaamiset |
| `Lemlist buukit` | number | `fldEZbczUn0j1lEH2` | Lemlistin kautta sovitut buukit |
| `Inbound-buukit` | number | `fldFUTnvdY3lhh1el` | Inboundin kautta sovitut |
| `1. tapaamiset (budjetti)` | number | `fldYZITHSpJ3Z79CB` | |
| `1. tapaamiset (Toteuma)` | number | `fldOyT4a0fgb7uKy5` | |
| `Tarjoukset (budjetti)` | number | `fldTBGvHTYOZXrm42` | |
| `Tarjoukset (Toteuma)` | number | `fldW2JZ5280X2VIsF` | |
| `Kaupat (budjetti)` | number | `fldt1L0gbCdcAweZD` | |
| `Kaupat (Toteuma)` | number | `fld3wJNfLL2Ya8mYL` | |
| `Myynti € (budjetti)` | **currency** | `fldPbpyVPc93YsKXJ` | |
| `Myynti € (Toteuma)` | **currency** | `fldzxtrV0MPxptSL1` | |

---

## Taulu 3 — Toimenpiteet

`tblQEz11Y4292qMEu` — Toimenpide-sääntöjen määrittelyt — määrittää, mitä toimenpiteitä luodaan automaattisesti.

> **Primary field:** `Name` (`fldtlnnG5qzE8P1lJ`)

### Säännön perustiedot

| Kenttä | Tyyppi | Field ID | Arvot |
|--------|--------|----------|-------|
| `Name` | singleLineText | `fldtlnnG5qzE8P1lJ` | esim. `Hankkeen aloitus`, `Projekti päättyy kuukauden päästä`, `Rahoituspäätös`, `Raportti`, `Väliraportti`, `4kk ennen sopimuksen loppua` |
| `Rule Key` | singleLineText | `fld86k5xJvYu0LEWd` | `HA`, `PL`, `RK`, `RL`, `RP`, `SL`, `VR1`, `VR2` |
| `Enabled` | checkbox | `fld0yLf5jYiJqFUVw` | Onko sääntö käytössä |
| `Trigger field` | singleSelect | `fldwpP1D5vcXVzEok` | esim. `Aloituspäivä`, `Päätöspäivä, toteutunut`, `Valmistuminen/Lähetys`, `MRR päättyy päivämäärä`, `Loppuraportin deadline`, `Väliraportin 1/2 deadline` |
| `Offset value` | number | `fldKJnu3P2aeyRuFs` | Päivien määrä ennen/jälkeen triggerin (negatiivinen = ennen) |
| `Action text` | richText | `fldLkZaR5L0h76iLd` | |
| `Message to customer` | richText | `fldb2X0wQarvXzEGX` | |

### Rule Key -koodit (Asiantuntijat-taulun `Toimenpide rules` -kentässä)

| Koodi | Merkitys |
|-------|----------|
| `HA` | Hakemuksen lähetyksestä 30 päivää |
| `HL` | Loppuraportin deadline 2 kk päästä |
| `PL` | Projekti päättyy 30 päivän päästä |
| `RK` | Rahoituspäätös |
| `RL` | Projektin aloituspäivään 7 päivää |
| `RP` | Päätöspäivä, toteutunut +40 päivää |
| `RP-TK` | Projektin päättyminen |
| `SL` | MRR päättymässä 4 kk päästä |
| `VL` | Väliraportin deadline |
| `VR1`-`VR3` | Väliraportit 1-3 |

---

## Taulu 4 — Viestiasetukset

`tblIreGdZWiBmqHLd` — Asiantuntijakohtaiset viestiasetukset automaatioille.

> **Primary field:** `AT` (`fldqyc9ZB1Yo2FzRY`) — formula!

| Kenttä | Tyyppi | Field ID | Selitys |
|--------|--------|----------|---------|
| `AT` | **formula** | `fldqyc9ZB1Yo2FzRY` | Asiantuntijan etunimi (laskettu primary) |
| `Asiantuntija` | singleCollaborator | `fldiroIFKVGOmRlIj` | Linkki käyttäjään |
| `Email` | email | `fldz3tfXpnQQp1jpe` | Käyttäjän ensisijainen sähköposti |
| `Kutsumanimet` | singleLineText | `fldqKQfn6r0GyCRep` | |
| `Rooli` | multipleSelects | `fldErTejYUC96jga8` | |
| `Ilmoitus` | multipleSelects | `fldWGiDFGbNQEeAbM` | Arvot: `Slack`, `Email` |
| `Slack ID` | singleLineText | `fld5cpAwKwtSozGT8` | esim. `U090XUSTMFA` |

> ⚠️ Aiemmassa dokumentaatiossa `AT` oli merkitty Text-kenttäksi — todellisuudessa se on **formula**.

**Käyttö:** Määrittää, mihin kanaviin asiantuntija saa automaatio-ilmoituksia (esim. `data_bug_bot`).

---

## Taulu 5 — Tilikauden laskenta

`tblOQQPDlygvvKWvL` — Aggregoitu näkymä kuukausikohtaisista summista per asiantuntija.

> **Yksi rivi = yksi asiantuntija + yksi kuukausi.**
> **Primary field:** `Asiakas` (`fldu69n7yobqK0U7m`)

### Peruskentät

| Kenttä | Tyyppi | Field ID | Selitys |
|--------|--------|----------|---------|
| `Asiakas` | singleLineText | `fldu69n7yobqK0U7m` | Primary |
| `Asiantuntija` | multipleCollaborators | `fldXO8crKqVPGLlKc` | |
| `Kuukausi` | singleSelect | `fldLOfkJ6qMeySBxf` | esim. `9-25`, `10-25` |
| `Tilikausi` | multilineText | `fldepe2lYxFIlFnzo` | esim. `2025–2026` |

### Toteumat (currency, €)

| Kenttä | Field ID | Sisältö |
|--------|----------|---------|
| `Toteuma` | `fldY6UMT5wLa67jD5` | Komissiot (Hyväksytty) + Projektit (¬NB) + MRR (¬NB) |
| `MRR` | `fld8QNoMCXiYDmbbw` | MRR-kategoria (¬NB) |
| `Projektit` | `fld3wzEXDQJshrhq6` | Projekti-kategoria (¬NB) |
| `Komissiot` | `fldmSNoa2UXmS2ij4` | Komissio-kategoria (Status = Hyväksytty) |
| `Komissiot, liikevaihto` | `fldLjAtr9eoVoGlzy` | Liikevaihto-kategoria (varovaisuuskirjaukset) |
| `Lähetetyt` | `fld3GAJBMU9FYSGKc` | Status = Lähetetty / Täydennys / Hyväksytty |
| `Lähtevät` | `fld3yFeGXe5zk6hl5` | Status = Tulossa / Työn alla |

### Ennusteet (currency, €)

| Kenttä | Field ID | Sisältö |
|--------|----------|---------|
| `Ennuste` | `fldl3b6fABGgI9mGz` | MRR (NB) + Hakemukset |
| `Komissiot, ennuste` | `fldFQGlXWLAoi6lzl` | Komissio-kategorian ennusteet |

### Lukumäärät (number, kpl)

| Kenttä | Field ID | Sisältö |
|--------|----------|---------|
| `Hakemukset, kpl` | `fldUnpgjEZGaTUUil` | Status: Lähetetty / Täydennys / Hyväksytty / Hylätty |
| `Hakemukset, kpl ennuste` | `fldnDiDwtYNEpjt3q` | Status: Tulossa / Työn alla |
| `MRR asiakkaita, kpl` | `fldN8MujdGJ1XMk2F` | Kirjattujen (¬NB) MRR-asiakkaiden määrä |

### Bonus ja tavoitteet

| Kenttä | Tyyppi | Field ID | Selitys |
|--------|--------|----------|---------|
| `Bonusraja` | currency | `fldPkDjaVwON7mQLD` | Kuukausittainen bonusraja (vuosiraja / 12) |
| `Tavoite` | currency | `flde5p9IwpPrMWpt9` | Kuukausittainen tavoite (vuositavoite / 12) |
| `Bonus, päättyneet kuukaudet` | **formula** | `fldMS1Sbi92oGl2eS` | `(Toteuma - Bonusraja/12) * 0.15` |
| `Bonus, kumulatiivinen` | currency | `fldqNjMEpneBvsYXu` | Tilikauden alusta, vain päättyneille kuukausille |
| `Tulossa oleva bonus` | formula | `fldmrPJBD0jlN9Xtl` | |

### Formula-kentät

| Kenttä | Field ID |
|--------|----------|
| `Toteuma + Ennuste` | `fld21vKY2aczQb5RG` |
| `Toteuma - tavoite` | `fld1P1tflY9mJOwfQ` |
| `Toteuma - bonusraja` | `fld6cZsXAKDLBsFuW` |
| `{Toteuma} + {Ennuste} - {Tavoite}` | `fldbo2u4Z0tl2BK67` |
| `{Toteuma} + {Ennuste} - {Bonusraja}` | `fldAUddmNn8isSaVf` |
| `Kuluva kuukausi, true` | `fld4GeYSpT7Z5H367` |

> ⚠️ Aiemmassa dokumentaatiossa mainittu `Toteutunut`-checkbox-kenttä **ei löydy API:sta** — käytä `Kuluva kuukausi, true` -formula-kenttää (`fld4GeYSpT7Z5H367`) sen sijaan. Myös `Viimeisin päivitys`-kenttää ei API:ssa näy.

**Päivitetään:** `tilikausi_manuaalinen.js` -skriptillä — päivittää KAIKKI rivit, myös vanhat (asettaa 0:ksi jos ei dataa).

---

## Taulu 6 — Bonusrajat ja tavoitteet

`tblowAb5HFB58EHNS` — Asiantuntijakohtaiset bonusrajat ja tavoitteet vuositasolla.

> **Yksi rivi = yksi asiantuntija + yksi tilikausi.**
> **Primary field:** `Asiakas` (`fldXPFvQSeeKak0Z4`) — huom: nimestä huolimatta tämä on rivin "label"

| Kenttä | Tyyppi | Field ID | Selitys |
|--------|--------|----------|---------|
| `Asiakas` | singleLineText | `fldXPFvQSeeKak0Z4` | Primary |
| `Asiantuntija` | multipleCollaborators | `fldWZU06DTEn2bYrH` | |
| `Bonusraja` | currency | `fldl3fgRmJKzoQisV` | Vuosittainen bonusraja, esim. 200 000 € |
| `Tavoite` | currency | `fldxn9AhMDYxOJfAB` | Vuosittainen tavoite, esim. 250 000 € |
| `Bonus tavoitteessa` | **formula** | `fldjZ73osXcJmNuZW` | `(Tavoite - Bonusraja) * 0.15` |
| `Tilikauden laskenta` | singleLineText | `fldOfgy53qt2SiyZN` | esim. `2025–2026` |

### Bonuksen kaava (kuukausitasolla)

```
Bonus per kuukausi = (Toteuma - Bonusraja/12) * 0.15
```

- Toteuma < Bonusraja/12 → bonus = negatiivinen (ei makseta)
- Toteuma > Bonusraja/12 → bonus = 15 % ylittävästä osasta

---

## Taulu 7 — Testimonialit

`tblzY57V6vBfVna2e` — **Uusi taulu (ei vanhassa dokumentaatiossa).** Asiakastarinoiden ja referenssien hallinta.

> **Primary field:** `Asiakas` (`fldCY8FR3LPA78s5s`)

| Kenttä | Tyyppi | Field ID | Selitys |
|--------|--------|----------|---------|
| `Asiakas` | singleLineText | `fldCY8FR3LPA78s5s` | Primary |
| `Y-Tunnus` | singleLineText | `fldBMAFdT8gwwx1qL` | |
| `Asiantuntija` | multipleCollaborators | `fldGq8pViUjZukDxS` | |
| `Status` | singleSelect | `fldzJgxGZsqT7P1Pc` | |
| `Yhteyshenkilön nimi` | singleLineText | `fld0GZx62NVo4ywwj` | |
| `Yhteyshenkilön email` | email | `fldkIAsTmsv0f7ywQ` | |
| `Instrumentti` | singleSelect | `fldNrcGxsza5Ew2pU` | |
| `Projektin koko` | currency | `fldfwuH0xp8f7kiSO` | |
| `Haettu tukisumma` | currency | `fldYzCsT9Ff48NPQe` | |
| `Referenssilupa` | checkbox | `fld7TRGBSaI5gDotA` | |
| `Toimiala` | multipleSelects | `fld4VgSBps12UnTeM` | |
| `Case tag` | multipleSelects | `fld4YsBYJikKy5OVp` | |
| `Asiakkaan arvio` | rating | `fldxN0JrkOL4YfnQh` | |
| `Lyhyt case kuvaus (ingressi)` | multilineText | `fldhkqwCCp8dXLdcA` | |
| `Laaja case kuvaus` | multilineText | `fldUMxAWThImbKEta` | |
| `Suora lainaus` | multilineText | `fldgKE9SMhbGvR5Tz` | |
| `Asiakkaan logo` | multipleAttachments | `fldZuy7tizyEMpliA` | |
| `Yhteyshenkilön kuva` | multipleAttachments | `fldbE5Jmlq7sWt6qS` | |
| `Sales Deck preset` | checkbox | `fldLfQXSEhF5bxsj8` | |

---

## Taulu 8 — Laskutus

`tblsaXpNYmIKEvz0P` — **Uusi taulu (ei vanhassa dokumentaatiossa).** Laskutusseuranta.

> **Primary field:** `Asiakas` (`fldN853ql0Z3E3CRa`)

| Kenttä | Tyyppi | Field ID | Selitys |
|--------|--------|----------|---------|
| `Asiakas` | singleLineText | `fldN853ql0Z3E3CRa` | Primary |
| `Asiantuntija` | singleSelect | `fldt8QVqmctjtsXB7` | |
| `Myyjä` | multipleSelects | `fld09OyMVbO1beowY` | |
| `Tilauspäivä` | date | `flddblWsoEC0gYtlm` | |
| `Status` | singleSelect | `fldbZswTkNFKOyoM0` | |
| `Kategoria` | singleSelect | `fldEZULCCcQievY5o` | |
| `Muuta` | richText | `fldKyrl4Hqpu9CksC` | |

---

## Taulu 9 — Palvelupaketit

`tblsvpyvxgPjUwCRb` — **Uusi taulu (ei vanhassa dokumentaatiossa).** Palvelupakettien rekisteri ja hinnoittelu.

> **Primary field:** `Id` (`fldBafpAWqeJQgO0W`) — autoNumber

| Kenttä | Tyyppi | Field ID | Selitys |
|--------|--------|----------|---------|
| `Id` | autoNumber | `fldBafpAWqeJQgO0W` | Primary |
| `Palvelupaketti` | singleSelect | `fldWVdykElxLP0cIm` | |
| `Sort` | number | `fldBxiedpSbz5wS4e` | |
| `Sisältö` | multipleSelects | `fldjfBN3dgqs1AAOf` | |
| `Tuotekuvaus` | multilineText | `fldgTO8DEX5mEO2Gy` | |
| `Komissio (tuki)` | singleLineText | `fldBO9OVXtXE5rShg` | |
| `Komissio (laina)` | singleLineText | `fld7Sq7Hfs2FxVr1E` | |
| `Hakemuksia` | number | `fldAcNwuoWtDupOnk` | |
| `Kuukausihinta` | number | `fldxoFFeul1SiFdL0` | |
| `Vuosihinta` | number | `fldVSODmKTYy9Nftg` | |
| `Kesto kk` | number | `fldhYH2ENFnmF2VIx` | |
| `Oletusvalinta` | checkbox | `fldPmOw651XUzi0pD` | |
| `Suosittu` | checkbox | `fld1Fc0Vq41OSogPu` | |
| `Aktiivinen` | checkbox | `fldp6Vt5AU1GLtJCG` | |
| `GAI` | checkbox | `flddmTPbEkkuq25Jh` | |
| `Rahoitussuunnitelma` | checkbox | `fldwSYCzBGuL4KixD` | |
| `Raportointi` | checkbox | `fldFvfBFbMKz8HHRo` | |
| `Optio` | checkbox | `fldfLfDj5OEXRxfi8` | |
| `Linkki Asiantuntijat-tauluun` | multipleRecordLinks | `fld3WJR0DlMApjTTZ` | |

---

## Taulu 10 — Y-tunnus avain

`tblcliFXQYxtNqHIh` — **Uusi taulu (ei vanhassa dokumentaatiossa).** Y-tunnusten ja virallisten yritysnimien rekisteri.

> **Primary field:** `Y-Tunnus` (`fldqmIHp1J3fqzxht`)

| Kenttä | Tyyppi | Field ID | Selitys |
|--------|--------|----------|---------|
| `Y-Tunnus` | singleLineText | `fldqmIHp1J3fqzxht` | Primary |
| `Virallinen nimi` | singleLineText | `fldAwmohVc3yVrbTU` | |
| `Nimivariantit` | singleLineText | `fldNALkuBSbZl3fck` | |
| `Sharepoint kansion nimi` | singleLineText | `fldtI4xAxJigkbv3W` | |
| `Sharepoint kansion linkki` | url | `fldfI8w4imDDhVkFF` | |

---

## Taulu 11 — Instrumenttiavain

`tblMRfTR4opM2pg5n` — **Uusi taulu (ei vanhassa dokumentaatiossa).** Mappaa rahoitusinstrumentit Airtable-nimen, MCP-nimen ja Slack-kutsumanimien välillä.

> **Primary field:** `MCP viralinen nimi` (`fldsXQ6ujZQQ2tuNE`)

| Kenttä | Tyyppi | Field ID | Selitys |
|--------|--------|----------|---------|
| `MCP viralinen nimi` | singleLineText | `fldsXQ6ujZQQ2tuNE` | Primary |
| `Airtable-nimi` | singleLineText | `fldEArJYrWfOAr4M6` | Instrumentin nimi Airtablen Asiantuntijat-taulussa |
| `Slack-kutsumanimet` | singleLineText | `fld7M5vqPUV9c8Glu` | Instrumentin kutsumanimet ja lyhenteet Slackissa |
| `MCP ID` | singleLineText | `fld4U00VSuWbDFxw9` | Instrumentin UUID GrantedAI MCP:ssä |
| `Rahoittaja` | singleLineText | `fldZonvZdzgO16xq3` | Rahoittajaorganisaatio |
| `Huomiot` | singleLineText | `fldZEsLe8aubWg04j` | Lisätiedot, duplikaatit, status |

---

## Loogiset yhteydet ja datan kulku

### Kuukausidatan flow

```
┌──────────────────────────────────┐
│ 1. Asiantuntijat-taulu           │
│    (raakadata)                   │
│                                  │
│ Kuukausikentät 9-25, 10-25, ...  │
│ täytetään joko:                  │
│  - manuaalisesti                 │
│  - automaatiolla                 │
│    (komissiot_kuukausisark.)     │
└─────────────┬────────────────────┘
              ▼
┌──────────────────────────────────┐
│ 2. tilikausi_manuaalinen.js      │
│    (skripti)                     │
│                                  │
│ - Lukee Asiantuntijat-taulun     │
│ - Aggregoi summat per kk         │
│ - Laskee bonukset (päättyneet)   │
│ - Kirjoittaa Tilikauden laskenta │
└─────────────┬────────────────────┘
              ▼
┌──────────────────────────────────┐
│ 3. Tilikauden laskenta -taulu    │
│    (aggregoitu data)             │
│                                  │
│ - Käytetään raportoinnissa       │
│ - Formula-kentät päivittyvät     │
│   reaaliajassa                   │
└──────────────────────────────────┘
```

### Linkkikartta

```
Asiantuntijat ──link── Y-tunnus avain (Asiakas-linkki)
Asiantuntijat ──link── Asiantuntijat (Toimenpide-linkki, Liikevaihto-rivi)
Asiantuntijat ──link── Palvelupaketit (Palvelupaketit)
Palvelupaketit ──link── Asiantuntijat (Linkki Asiantuntijat-tauluun)
Bonusrajat ja tavoitteet ──→ Tilikauden laskenta (numerojako 12:lla)
Viestiasetukset ──→ Asiantuntijat.SlackId, .Kanava (kopioi automaatiolla)
```

---

## Liiketoimintalogiikka

### Toteuma (toteutuneet tulot)

```
Toteuma = Komissiot (Hyväksytty) + Projektit (¬NB) + MRR (¬NB)
```

**Ehdot komponenteittain:**

| Komponentti | Ehdot |
|-------------|-------|
| **Komissio** | `Kategoria = "Komissio"` AND `Status = "Hyväksytty"` AND `tk 25-26 total > 0` |
| **Projekti** | `Kategoria = "Projekti"` AND `NB/EB ≠ "NB"` AND `tk 25-26 total > 0` |
| **MRR** | `Kategoria = "MRR"` AND `NB/EB ∈ {EB, LB, tyhjä}` AND `tk 25-26 total > 0` |

> Huom: `SB` (Starting Business) menee ennusteeseen, ei Toteumaan.

### Ennuste

```
Ennuste = MRR (NB/SB) + Hakemus-ennusteet
```

**Ehdot:**

| Komponentti | Ehdot |
|-------------|-------|
| **MRR NB** | `Kategoria = "MRR"` AND `NB/EB = "NB"` AND `tk 25-26 total > 0` |
| **Hakemus** | `Status ∈ {Lähetetty, Tulossa, Työn alla, Täydennys, Konsultointi, Ehdollinen päätös}` AND `Päätöspäivä, ennuste` kuukauden sisällä |

### Bonus

```
Kuukausibonus      = (Toteuma - Bonusraja/12) * 0.15
Kumulatiivinen     = SUM(Kuukausibonus) päättyneille kuukausille
```

**Päättynyt kuukausi:** Nykyhetki > kuukauden viimeinen päivä → `Kuluva kuukausi, true` = false.

**Komission kirjanpitologiikka (varovaisuus):**

- **Lähetetty:** 50 % × `Laskutusennuste` → kirjataan lähetyskuukauteen (`Valmistuminen/Lähetys`).
- **Hyväksytty:** loppusumma `laskutettusumma − varovaisuus` → kirjataan päätöskuukauteen (`Päätöspäivä, toteutunut`).
- **Hylätty:** korjauskirjaus `−50 % × Laskutusennuste` → kirjataan päätöskuukauteen. Nettovaikutus = 0 €.

### MRR-lisäbonus

100 € per asiakas joka jatkaa toiselle vuodelle (maksetaan 6. kk-maksun jälkeen).

---

## Tärkeät huomiot

### 1. NB / EB -logiikka

| Arvo | Toteumaan? | Bonukseen? | Tila |
|------|-----------|-----------|------|
| `NB` | Ei | Ei | Toive asiakkuudesta |
| `SB` | Ei (ennusteeseen) | Ei | Alkava asiakkuus |
| `EB` | Kyllä | Kyllä | Laskutus käynnissä |
| `LB` | Kyllä viimeiseen laskuun asti | Kyllä | Lopettamassa |
| _tyhjä_ | Tulkitaan kuten EB | Kyllä | Vanha rivi ilman luokitusta |

### 2. Kuukausikentät

- Muoto `KK-VV` (esim. `9-25` = syyskuu 2025)
- Tyyppi: `number` (€-määriä)
- Tilikausi 25-26: `9-25` … `8-26`. Tilikausi 26-27: `9-26` … `8-27`.
- **Aina nollaa kaikki kuukausikentät ennen kirjoitusta** — muuten vanhat arvot jäävät päivämäärän muuttuessa

### 3. Tilikausi-suodatus

- Skriptit käsittelevät vain aktiivista tilikautta (kun tämä dokumentaatio päivitettiin: 2025–2026).
- Tilikausi 2026–2027 -kentät on jo perustettu API:ssa — varmista että skriptit päivitetään ennen 1.9.2026.
- Vanhempia tilikausia EI saa ylikirjoittaa.

### 4. Bonuslaskenta

- Vain päättyneiden kuukausien Toteumasta (`Kuluva kuukausi, true` = false).
- Bonusraja jaetaan 12:lla → kuukausikohtainen raja.
- 15 % ylittävästä osasta.

### 5. Liikevaihto-kategoria

- EI lasketa Toteumaan.
- Oma kenttä `Komissiot, liikevaihto` Tilikauden laskenta -taulussa.

### 6. Toimenpide-rivit

- Erillinen kategoria — älä sekoita muihin kategorioihin.
- Linkittyvät pääriveihin `Toimenpide-linkki`-kentän kautta.

### 7. Useampi asiantuntija samalla rivillä

- Jos `Asiantuntija`-kenttä sisältää useamman henkilön, laskenta tehdään VAIN ensimmäiselle.
- Estää saman liikevaihdon laskemisen useaan kertaan.
- Ratkaisu: luo erillinen rivi jokaiselle asiantuntijalle.

### 8. Threshold-päivämäärä 31.8.2024

- Liikevaihtorivien luonti vain rivien jälkeen, joiden päivämäärä on > 31.8.2024.

### 9. Päätöspäivän pilkku

- `Päätöspäivä, toteutunut` ja `Päätöspäivä, ennuste` — **muista pilkku ja välilyönti**.

### 10. Formula-kenttiin EI saa kirjoittaa

API torjuu kaikki kirjoitukset näihin (mm. `MRR`, `MRR Päättyy`, `MRR päättyy päivämäärä`, `Laskutusennuste`, `laskutettusumma`, `tk 25-26 total`, `Bonus, päättyneet kuukaudet`, `Liikevaihtopotentiaali`, `Liikevaihtoennuste`, `AT`):

```
422 Unprocessable Entity — Cannot write to a computed field
```

Päivitä alkuperäisiä lähdekenttiä, ei laskettuja.

### 11. Status- ja Kategoria-arvot päivittyneet 2026

Uudet `Status`-arvot (`Konsultointi`, `Ehdollinen päätös`, `Suunnitelma valmis`) ja `Kategoria`-arvot (`Tarjouspyyntö`, `Raportointi`, `EU-Komissio`) on lisätty 2026 alussa. Vanhat skriptit, jotka oletivat suljettua arvojoukkoa (esim. `if (status === "Hyväksytty" || status === "Hylätty") {...}`), saattavat antaa odottamattomia tuloksia uusien arvojen kohdalla. **Audita Status- ja Kategoria-haarautukset** ennen tuotantoajoa.

---

**Seuraava askel:** Kun olet löytänyt tarvitsemasi taulun ja kentän, lue [02_scripting_kaytannot.md](02_scripting_kaytannot.md) miten käsitellä niitä turvallisesti JavaScriptillä.
