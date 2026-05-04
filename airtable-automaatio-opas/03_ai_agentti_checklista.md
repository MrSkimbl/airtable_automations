# 03 — AI-agentin tarkistuslista

> **Käytä tätä jokaisen Airtable-automaatiokoodin viimeistelyssä.** Käy lista läpi rasti ruutuun ennen kuin lähetät koodia tai ehdotat sitä käyttäjälle.

Ks. myös:
- [01_base_rakenne.md](01_base_rakenne.md) — taulujen ja kenttien tarkat nimet
- [02_scripting_kaytannot.md](02_scripting_kaytannot.md) — pakolliset kuviot
- [04_automaatiot/](04_automaatiot/README.md) — esimerkit toteutuksista

---

## A. Ennen kuin kirjoitat YHTÄÄN riviä

- [ ] Olen lukenut [01_base_rakenne.md](01_base_rakenne.md) ja löytänyt **oikean taulun** nimen
- [ ] Olen löytänyt **kaikki tarvitsemani kentät** ja tarkistanut niiden tarkat nimet (mukaan lukien pilkut, isot kirjaimet, välilyönnit)
- [ ] Tiedän jokaisen kentän **tyypin** (Single select, User, Linked record, Number, Date, Text, Checkbox)
- [ ] Olen lukenut [02_scripting_kaytannot.md](02_scripting_kaytannot.md) → tunnen `safeString`/`safeNumber`-kuviot
- [ ] Olen tarkistanut [04_automaatiot/](04_automaatiot/README.md) → onko vastaavaa logiikkaa jo toteutettu (älä keksi pyörää)
- [ ] Tiedän, missä kontekstissa skripti ajetaan: **Automation** vai **Scripting Extension**

**Vasta tämän jälkeen aloita koodaus.**

---

## B. Kirjoituksen aikana

### B1. Turvallisuusfunktiot

- [ ] Skriptin alussa on `safeString()` ja `safeNumber()` -funktiot
- [ ] Jokainen `getCellValue()` käärittynä joko `safeString` tai `safeNumber` -kutsuun (paitsi linked record / user, joissa array-rakenne)

### B2. Kenttien luku

- [ ] Linked record / User -kentät käsitellään array-tarkistuksella:
  ```javascript
  if (Array.isArray(cell) && cell.length === 1) { ... }
  ```
- [ ] Päivämäärät parsitaan `new Date(value)` -kautta ja tarkistetaan `isNaN(dt)`
- [ ] `null` ja `0` käsitellään erikseen (`if (value == null)` vs `if (!value)`)

### B3. Kenttien kirjoitus

- [ ] **Single select** kirjoitetaan **objektina** `{ name: "arvo" }`
- [ ] **User** ja **Linked record** kirjoitetaan **arrayna** `[{ id: "..." }]`
- [ ] **Date** kirjoitetaan **ISO-merkkijonona** `"YYYY-MM-DD"`
- [ ] **Number** suoraan numeerisena
- [ ] **Tyhjennys** = `null` (ei tyhjä string)

### B4. Kuukausikentät

- [ ] Käytän muotoa `KK-VV` (esim. `9-25`, `1-26`) — **ei** `9/2025` tai `9-2025`
- [ ] Ennen kuukausikenttien kirjoitusta nollaan KAIKKI kuukausikentät:
  ```javascript
  const MONTH_FIELDS = ["9-25","10-25","11-25","12-25",
                        "1-26","2-26","3-26","4-26","5-26","6-26","7-26","8-26"];
  let monthValues = {};
  MONTH_FIELDS.forEach(f => { monthValues[f] = 0; });
  ```
- [ ] Tarkistan `try { table.getField(monthFieldName); }` että kenttä on olemassa ennen kirjoitusta

### B5. Batch-operaatiot

- [ ] Yli yhden tietueen päivitykset on käärittynä `while (arr.length > 0) { ... slice(0, 50) ... }` -looppiin
- [ ] Sama koskee `createRecordsAsync` ja `deleteRecordsAsync`

### B6. Anti-patternit (ei näitä)

- [ ] **Ei `return`-lauseita** automaatioskriptissä — kaikki logiikka on `if (record) { ... }` -sisällä
- [ ] **Ei `console.log`** -komentoja kriittisessä logiikassa (`output.set()` jos halutaan ulos)
- [ ] **Ei** arrow-funktioita top-levelillä — käytä `function`-deklaratioita
- [ ] **Ei** `selectRecordAsync` — käytä `selectRecordsAsync` (monikossa)
- [ ] **Ei** single selectin vertailua merkkijonoon ilman `safeString()`

---

## C. Ennen koodin lähetystä

### C1. Looginen tarkistus

- [ ] Skripti on **idempotentti** — sen toistaminen tuottaa saman tuloksen, ei kasaudu virheitä
- [ ] Skripti **päivittää myös vanhat rivit** (asettaa 0:ksi jos ei dataa) — ei jätä haamutietoja
- [ ] Skripti **suodattaa tilikauden mukaan** jos käsittelee kuukausikenttiä — ei ylikirjoita vanhempia tilikausia
- [ ] Skripti käsittelee **`Useampi asiantuntija`** -tapauksen oikein (yleensä = lasketaan vain ensimmäiselle)
- [ ] Lukittu-checkbox `Lukittu (älä päivitä)` huomioitu jos kohteena on Asiantuntijat-taulun rivi

### C2. Automation-konteksti (jos kohteena automation)

- [ ] Skripti käyttää `input.config()` -muotoa eikä `input.recordAsync()`
- [ ] `recordId` tulee triggeristä Input variable -kohdasta
- [ ] Setup-ohjeet sisältävät selvästi:
  - Trigger: ___
  - Condition: **`Last modified by IS NOT Automation`** ⚠️
  - Action: Run script
  - Input variable: recordId

### C3. Selitys käyttäjälle

- [ ] Olen kirjoittanut lyhyen selityksen mitä skripti tekee
- [ ] Olen listannut **mihin tauluihin** ja **mihin kenttiin** skripti kirjoittaa
- [ ] Olen kertonut milloin skripti laukeaa (trigger / aikataulu / manuaalinen)
- [ ] Olen huomauttanut, jos skripti **vaatii ehdon** `Last modified by IS NOT Automation`
- [ ] Olen ehdottanut testiä Scripting-laajennuksessa ennen automation-deploya

---

## D. Yleisimmät virheet ja niiden estäminen

| Virhe | Esimerkki | Ratkaisu |
|-------|-----------|----------|
| Taulun nimi väärin | `base.getTable("Komissio")` | → `base.getTable("Asiantuntijat")` (ks. [01](01_base_rakenne.md)) |
| Kentän nimi väärin (puuttuu pilkku) | `"Päätöspäivä toteutunut"` | → `"Päätöspäivä, toteutunut"` (pilkku + välilyönti) |
| Kentän nimi väärin (väärin kirjoitettu) | `"laskutettuSumma"` | → `"laskutettusumma"` (alku pienellä, summa yhteen) |
| Single select stringinä | `if (status === "Hyväksytty")` | → `if (safeString(status) === "Hyväksytty")` |
| Linked record ilman array-tarkistusta | `let id = cell.id` | → `if (Array.isArray(cell) && cell.length === 1) { let id = cell[0].id }` |
| Return-lause automaatiossa | `if (!record) return;` | → `if (record) { ... }` |
| Yli 50 tietuetta kerralla | `await table.updateRecordsAsync(allUpdates)` | → batch-loop, `slice(0, 50)` |
| Single selectin kirjoitus stringinä | `{ "Status": "Hyväksytty" }` | → `{ "Status": { name: "Hyväksytty" } }` |
| Date kirjoitus Date-objektina | `{ "Pvm": new Date() }` | → `{ "Pvm": new Date().toISOString().split("T")[0] }` |
| Kuukausikenttien jättäminen nollaamatta | Vain uusi kuukausi kirjoitetaan | → Nollaa kaikki, kirjoita vain relevantit |
| Lukko-kentän huomiotta jättäminen | Skripti yliajaa lukitut rivit | → `if (rec.getCellValue("Lukittu (älä päivitä)")) continue;` |

---

## E. Punaisen lipun tilanteet — pysähdy ja kysy

Jos koodaat ja törmäät johonkin näistä, **älä jatka** — kerro käyttäjälle ja varmista suunta:

- [ ] Tehtävä vaatii **uuden kentän tai taulun** luonnin baseen
- [ ] Tehtävä vaatii **datan tuhoamista** (delete) ilman selvää backup-strategiaa
- [ ] Tehtävä vaatii **single select -arvojen muuttamista** (esim. lisää `Status`-arvo)
- [ ] Tehtävä vaatii kentän **tyypin muuttamista** (esim. Text → Number)
- [ ] Tehtävä vaatii **uuden API-tunnuksen / .env-muutoksen**
- [ ] Tehtävä vaatii **OpenAI-mallin tai polkujen muuttamista**
- [ ] Tehtävä vaatii **mallien, API-avainten tai .env-tiedoston** päivittämistä
- [ ] Lähdedata sisältää **tuhansien rivien** käsittelyä, jolloin Scripting-laajennus saattaa aikakatkaista (suositus: Python + pyairtable)
- [ ] Logiikka koskettaa **vanhempaa kuin nykyistä tilikautta** — varmista ettei vanhoja arvoja yliajeta

---

## F. Lopullinen smoke test

Ennen kuin sanot "valmis", aja mielessäsi tämä skenaario:

1. Käyttäjä ottaa skriptin → kopioi **Scripting-laajennukseen** → ajaa
2. Tuottaako se odotetun tuloksen testidatalle?
3. Käyttäjä siirtää skriptin **Automationiin** → asettaa triggerin + conditionin
4. Käynnistyykö se oikealla triggerillä?
5. Voiko se laueta **kaksinkertaisena** (esim. oma päivitys triggeröi sen uudelleen)?
6. Onko `Last modified by IS NOT Automation` -ehto pakollinen?
7. Mitä tapahtuu, jos triggerin tietuetta **ei löydy** queryssa? → `if (record)` -tarkistus
8. Mitä tapahtuu, jos joku kenttä on **tyhjä**? → safe-funktiot
9. Mitä tapahtuu, jos kuukausikenttä **ei ole olemassa** (vanha tilikausi)? → `try/catch table.getField()`

---

## G. Pikamuistio

> **5 sääntöä, jotka et saa unohtaa:**
>
> 1. **Lue [01_base_rakenne.md](01_base_rakenne.md) ennen koodaamista** → tarkat nimet
> 2. **Käytä `safeString` ja `safeNumber`** → ei tyyppivirheitä
> 3. **Ei `return`-lauseita automaatiossa** → käytä `if (record) { ... }`
> 4. **Batch max 50 tietuetta** → `while (arr.length > 0) { slice(0, 50) }`
> 5. **Aseta `Last modified by IS NOT Automation`** → ei ääretöntä silmukkaa

Jos näistä viidestä yksikin pettää, automaatio rikkoutuu.
