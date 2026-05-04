# 02 — Airtable Scripting -käytännöt

> **AI-agentille:** Älä keksi pyörää. Tämä dokumentti listaa pakolliset kuviot, joita _kaikki_ tämän basen automaatiot käyttävät. Kun aloitat uutta skriptiä, kopioi näitä kuvioita.

Ks. myös:
- [01_base_rakenne.md](01_base_rakenne.md) — taulujen ja kenttien tarkat nimet
- [03_ai_agentti_checklista.md](03_ai_agentti_checklista.md) — tarkistuslista ennen koodin lähetystä
- [04_automaatiot/](04_automaatiot/README.md) — kokonaiset esimerkit käytössä

---

## Sisällysluettelo

1. [Kontekstit: Automation vs Scripting Extension](#1-kontekstit)
2. [Pakolliset turvafunktiot](#2-pakolliset-turvafunktiot)
3. [Datan lukeminen](#3-datan-lukeminen)
4. [Datan kirjoittaminen](#4-datan-kirjoittaminen)
5. [Batch-operaatiot (max 50)](#5-batch-operaatiot)
6. [Automaation input/output](#6-automaation-inputoutput)
7. [Päivämäärien käsittely](#7-päivämäärien-käsittely)
8. [Anti-patternit (älä koskaan tee näitä)](#8-anti-patternit)
9. [Suodatus ja optimointi](#9-suodatus-ja-optimointi)
10. [Virheenkäsittely](#10-virheenkäsittely)
11. [Yleiset sudenkuopat](#11-yleiset-sudenkuopat)
12. [Skriptin rakennemalli](#12-skriptin-rakennemalli)

---

## 1. Kontekstit

Airtable-skriptit ajetaan kahdessa eri kontekstissa, ja niillä on eroja:

| Konteksti | Trigger | API | Output |
|-----------|---------|-----|--------|
| **Automation** | Trigger (rivi muuttuu, aikataulu, ...) | `input.config()`, `selectRecordsAsync()` | `output.set()` |
| **Scripting Extension** | Manuaalinen `Run`-painallus | `input.recordAsync()`, vapaa pääsy | `console.log` |

> ⚠️ **Sama skripti EI VÄLTTÄMÄTTÄ toimi molemmissa.** Kun siirrät skriptin Scripting → Automation, käy läpi tämä lista:
> - Poista kaikki `return`-lauseet (käytä `if (...) { ... }`)
> - Vaihda `console.log` → `output.set("debug", ...)` (vain jos haluat näkyviin)
> - Käytä `input.config().recordId` triggerin tietueen hakuun (ei `input.recordAsync()`)

---

## 2. Pakolliset turvafunktiot

**Lisää nämä JOKAISEN skriptin alkuun.** Älä muokkaa niitä.

```javascript
function safeString(v) {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (v.name) return v.name;       // Single select palauttaa { name: "arvo" }
    return String(v);
}

function safeNumber(v) {
    return (typeof v === "number" && !isNaN(v)) ? v : 0;
}
```

**Miksi nämä ovat pakollisia:**

| Kenttätyyppi | Mitä `getCellValue()` palauttaa | Mitä luulet saavasi |
|--------------|--------------------------------|---------------------|
| Single select | `{ name: "Hyväksytty", id: "sel...", color: "..." }` | `"Hyväksytty"` |
| User | `[{ id: "usr...", name: "Nimi", email: "..." }]` | `"Nimi"` |
| Linked record | `[{ id: "rec...", name: "..." }]` | `"..."` |
| Number (tyhjä) | `null` | `0` |
| Date | ISO-merkkijono `"2026-01-15"` | Date-objekti |

Ilman `safeString` / `safeNumber`-funktioita vertailut (`===`, `>`, `+`) menevät rikki.

---

## 3. Datan lukeminen

### 3.1 Taulun haku ja kysely

```javascript
let table = base.getTable("Asiantuntijat");
let query = await table.selectRecordsAsync({
    fields: ["Asiantuntija", "Kategoria", "Status", "9-25"]   // suositellaan
});
```

> 💡 **Optimoi:** Anna aina `fields`-lista. Ilman sitä Airtable lataa kaikki ~100 kenttää ja skripti hidastuu merkittävästi.

### 3.2 Yksittäisen kentän luku

```javascript
let category = safeString(rec.getCellValue("Kategoria"));
let amount   = safeNumber(rec.getCellValue("laskutettusumma"));
let status   = safeString(rec.getCellValue("Status"));
```

### 3.3 User- / Linked record -kentän luku

```javascript
let expertCell = rec.getCellValue("Asiantuntija");
// Palauttaa: [{ id: "usrXXX", name: "Nimi", email: "..." }]

if (Array.isArray(expertCell) && expertCell.length === 1) {
    let expertName = safeString(expertCell[0]?.name);
    let expertId   = expertCell[0]?.id;
    // ... käytä
}
```

> ⚠️ **Useampi käyttäjä:** Jos `expertCell.length > 1`, useimmissa tämän basen skripteissä lasketaan **vain ensimmäiselle** estääksemme tuplakirjaukset. Ks. [01_base_rakenne.md](01_base_rakenne.md) → "Tärkeät huomiot".

### 3.4 Päivämäärän luku

```javascript
let dateValue = rec.getCellValue("Päätöspäivä, toteutunut");
// Palauttaa: "2026-01-15" (ISO-merkkijono)

if (dateValue) {
    let dt = new Date(dateValue);
    if (!isNaN(dt)) {
        let month = dt.getMonth() + 1;             // 1-12
        let yearSuffix = dt.getFullYear().toString().slice(-2);
        let monthFieldName = month + "-" + yearSuffix;   // esim. "1-26"
    }
}
```

---

## 4. Datan kirjoittaminen

### 4.1 Single select — anna **objekti**, ei merkkijono

```javascript
await table.updateRecordAsync(recordId, {
    "Kategoria": { name: "Komissio" }   // ✅ oikein
    // "Kategoria": "Komissio"           // ❌ virhe!
});
```

### 4.2 Numero, Text — suoraan arvo

```javascript
await table.updateRecordAsync(recordId, {
    "laskutettusumma": 1234.56,
    "Asiakas": "ACME Oy"
});
```

### 4.3 User-kenttä — array objekteja

```javascript
await table.updateRecordAsync(recordId, {
    "Asiantuntija": [{ id: userId }]
});
```

### 4.4 Linked record — array recordId-objekteja

```javascript
await table.updateRecordAsync(recordId, {
    "Liikevaihto-rivi": [{ id: liikevaihtoRecId }]
});
```

### 4.5 Date — ISO-merkkijono `"YYYY-MM-DD"`

```javascript
await table.updateRecordAsync(recordId, {
    "Päätöspäivä, ennuste": "2026-03-15"
});
```

### 4.6 Tyhjennys

```javascript
await table.updateRecordAsync(recordId, {
    "Joku kenttä": null
});
```

---

## 5. Batch-operaatiot

**Airtablen rajoitus: max 50 tietuetta per pyyntö.** Tämän rajan rikkominen aiheuttaa virheen.

### 5.1 Päivitysten batch

```javascript
let updates = [
    { id: rec1.id, fields: { "Kenttä": arvo1 } },
    { id: rec2.id, fields: { "Kenttä": arvo2 } },
    // ... mahdollisesti satoja
];

while (updates.length > 0) {
    await table.updateRecordsAsync(updates.slice(0, 50));
    updates = updates.slice(50);
}
```

### 5.2 Luontien batch

```javascript
let creates = [
    { fields: { "Asiakas": "X", "Kategoria": { name: "Komissio" } } },
    { fields: { "Asiakas": "Y", "Kategoria": { name: "Projekti" } } },
];

while (creates.length > 0) {
    await table.createRecordsAsync(creates.slice(0, 50));
    creates = creates.slice(50);
}
```

### 5.3 Poistojen batch

```javascript
while (recordIdsToDelete.length > 0) {
    await table.deleteRecordsAsync(recordIdsToDelete.slice(0, 50));
    recordIdsToDelete = recordIdsToDelete.slice(50);
}
```

---

## 6. Automaation input/output

### 6.1 Input: triggerin recordId

Aseta automaatiossa:
- Trigger: **When record is updated**
- Action: **Run script**
- Input variable: nimeä `recordId` → arvoksi triggerin **Record ID**

```javascript
let recordId = input.config().recordId;
let table    = base.getTable("Asiantuntijat");
let query    = await table.selectRecordsAsync({
    fields: ["Päätöspäivä, toteutunut", "laskutettusumma", "Status"]
});
let record = query.getRecord(recordId);
```

### 6.2 Useampi input

```javascript
let { recordId, customField, threshold } = input.config();
```

### 6.3 Output seuraavalle actionille

```javascript
output.set("status", "ok");
output.set("paivitettyKentta", "10-25");
output.set("slackMessages", JSON.stringify(messages));   // arrayt JSON-muotoon
```

> Seuraava action voi käyttää näitä esim. `{{stepX.status}}` -syntaksilla.

### 6.4 Looping-action: array → useita iteraatioita

Kun seuraava action toistuu (esim. Slack-viesti per asiantuntija), output array:

```javascript
let messages = [
    { slackId: "U123", text: "Sinulla on 3 virhettä" },
    { slackId: "U456", text: "Sinulla on 1 virhe" }
];
output.set("slackMessages", messages);
```

---

## 7. Päivämäärien käsittely

### 7.1 Date → kuukausikentän nimi (`KK-VV`)

```javascript
function monthNameFromDate(dateValue) {
    if (!dateValue) return "";

    // Käsittele "DD/MM/YYYY"-muoto (joskus tulee tällaisena)
    if (typeof dateValue === "string" && dateValue.includes("/")) {
        let [d, m, y] = dateValue.split("/");
        let dt = new Date(Number(y), Number(m) - 1, Number(d));
        if (!isNaN(dt)) {
            return (dt.getMonth() + 1) + "-" + dt.getFullYear().toString().slice(-2);
        }
    }

    // ISO-merkkijono tai Date-objekti
    let dt = new Date(dateValue);
    if (isNaN(dt)) return "";
    return (dt.getMonth() + 1) + "-" + dt.getFullYear().toString().slice(-2);
}

// monthNameFromDate("2026-01-15") → "1-26"
// monthNameFromDate("15/10/2025") → "10-25"
```

### 7.2 Tämän hetken kuukausi

```javascript
let now = new Date();
let currentMonthField = (now.getMonth() + 1) + "-" + now.getFullYear().toString().slice(-2);
```

### 7.3 Onko kuukausi päättynyt?

```javascript
function isCompleted(monthField) {
    let [m, y] = monthField.split("-").map(Number);
    let lastDay = new Date(2000 + y, m, 0);   // kuukauden viimeinen päivä
    return new Date() > lastDay;
}
```

---

## 8. Anti-patternit

> **Nämä rikkovat automaatioita. Älä koskaan tee näitä.**

### 8.1 ❌ `return`-lause automaatiossa

```javascript
// ❌ VÄÄRIN — epäonnistuu hiljaisesti
if (!record) {
    return;
}
// ... loput logiikasta

// ✅ OIKEIN — kääri NESTED IF:iin
if (record) {
    // ... kaikki logiikka tähän sisälle
}
```

### 8.2 ❌ `console.log` automaatiossa

```javascript
// ❌ Ei näy missään
console.log("Käsitelty: " + amount);

// ✅ Käytä outputia (jos haluat seuraavaan actioniin)
output.set("debug", "Käsitelty: " + amount);
```

### 8.3 ❌ Single select käsiteltynä merkkijonona

```javascript
// ❌ EI KOSKAAN palauta true
if (rec.getCellValue("Status") === "Hyväksytty") { ... }

// ✅ Käytä safeString
if (safeString(rec.getCellValue("Status")) === "Hyväksytty") { ... }
```

### 8.4 ❌ Arrow-funktio top-levelillä

```javascript
// ❌ Ei toimi automaatiokontekstissa luotettavasti
const processRecord = (rec) => { ... };

// ✅ Tavallinen function-deklaratio
function processRecord(rec) { ... }
```

### 8.5 ❌ `selectRecordAsync` (yksikössä)

Tätä **ei ole** automaatiossa. Käytä aina `selectRecordsAsync` (monikossa) ja `query.getRecord(id)`.

### 8.6 ❌ Ei nollata kuukausikenttiä ennen kirjoitusta

```javascript
// ❌ Vanhat arvot jäävät jos päivämäärä muuttuu
await table.updateRecordAsync(id, { [newMonthField]: newAmount });

// ✅ Nollaa AINA kaikki kuukausikentät ensin
const MONTH_FIELDS = ["9-25","10-25","11-25","12-25",
                      "1-26","2-26","3-26","4-26","5-26","6-26","7-26","8-26"];
let monthValues = {};
MONTH_FIELDS.forEach(f => { monthValues[f] = 0; });
monthValues[newMonthField] = newAmount;
await table.updateRecordAsync(id, monthValues);
```

### 8.7 ❌ Päivitys ilman `IS NOT Automation` -ehtoa

Kaikki real-time -automaatiot pitää konfiguroida triggeriin ehdolla:
**`Last modified by  IS NOT  Automation`**

Muuten skripti laukaisee itsensä uudelleen ja syntyy ääretön silmukka.

---

## 9. Suodatus ja optimointi

### 9.1 Hae vain tarvittavat kentät

```javascript
let query = await table.selectRecordsAsync({
    fields: ["Kategoria", "Status", "9-25", "10-25"]
});
```

### 9.2 Skip-ehto loopin alkuun

```javascript
for (let rec of query.records) {
    if (safeString(rec.getCellValue("Kategoria")) !== "Komissio") continue;
    if (safeString(rec.getCellValue("Status"))    !== "Hyväksytty") continue;

    // ... varsinainen logiikka
}
```

### 9.3 Map olemassa olevista riveistä

Kun teet "päivitä jos olemassa, muuten luo" -logiikkaa:

```javascript
let existing = {};
for (let rec of dstQuery.records) {
    let key = `${expertName}__${monthField}`;
    existing[key] = rec;
}

const allKeys = new Set([
    ...Object.keys(newData),
    ...Object.keys(existing)
]);

for (let key of allKeys) {
    if (existing[key]) {
        // päivitys (arvo || 0)
    } else {
        // uuden luonti
    }
}
```

---

## 10. Virheenkäsittely

### 10.1 Tarkista kentän olemassaolo

```javascript
let field;
try {
    field = table.getField(monthFieldName);
} catch (e) {
    output.set("error", "Kenttää ei löydy: " + monthFieldName);
}

if (field) {
    // turvallista käyttää
}
```

### 10.2 Tarkista linkityskentän rakenne

```javascript
if (!Array.isArray(expertsCell) || expertsCell.length !== 1) continue;
if (!expertsCell[0]?.id) continue;
```

### 10.3 Tarkista numero ennen vertailua

```javascript
let n = safeNumber(rec.getCellValue("Laskutusennuste"));
if (n > 0) { ... }   // toimii myös kun arvo on null tai undefined
```

---

## 11. Yleiset sudenkuopat

### 11.1 Single select vs. string
**Ongelma:** Single select palauttaa objektin.
**Ratkaisu:** `safeString()`.

### 11.2 `0` on falsy
```javascript
if (!value)              // ❌ 0 tulkitaan false:ksi
if (value === 0 || !value)  // ✅ erottelee tyhjän nollasta
if (value == null)       // ✅ pelkkä null/undefined
```

### 11.3 Batch-rajat (50)
**Ongelma:** Yli 50 tietuetta kerralla → virhe.
**Ratkaisu:** Aina `slice(0, 50)` -loop.

### 11.4 Vanhojen rivien päivittämättä jättäminen
**Ongelma:** Skripti luo uusia rivejä mutta ei nollaa vanhoja → duplikaatit / vanhentunut data.
**Ratkaisu:** Map olemassa olevista, päivitä KAIKKI (myös ne joilla ei enää dataa → asetetaan 0).

### 11.5 Tilikausi-suodatuksen unohtaminen
**Ongelma:** Skripti ylikirjoittaa myös vanhan tilikauden rivit.
**Ratkaisu:** Suodata aina tilikauden mukaan ennen päivitystä.

### 11.6 Päätöspäivän pilkku
`Päätöspäivä, toteutunut` ja `Päätöspäivä, ennuste` — pilkku + välilyönti pakollinen kentän nimessä. Ks. [01_base_rakenne.md](01_base_rakenne.md).

---

## 12. Skriptin rakennemalli

Käytä tätä rakennetta kaikissa uusissa skripteissä:

```javascript
// =====================================================================
// SKRIPTIN NIMI / TARKOITUS
// Trigger: ...
// Päivitettävä taulu: ...
// =====================================================================

// --- 0. TURVAFUNKTIOT ---
function safeString(v) { /* ... */ }
function safeNumber(v) { /* ... */ }

// --- 1. INPUT JA TAULUJEN HAKU ---
let recordId = input.config().recordId;
let srcTable = base.getTable("Asiantuntijat");
let dstTable = base.getTable("Tilikauden laskenta");

// --- 2. HAE LÄHTÖDATA ---
let srcQuery = await srcTable.selectRecordsAsync({
    fields: [/* tarvittavat kentät */]
});
let dstQuery = await dstTable.selectRecordsAsync();

// --- 3. KÄSITTELY ---
let updates = [];
for (let rec of srcQuery.records) {
    if (/* skip-ehto */) continue;

    // ... laskenta ...

    updates.push({
        id: existingRec.id,
        fields: { /* arvot */ }
    });
}

// --- 4. BATCH UPDATE ---
while (updates.length > 0) {
    await dstTable.updateRecordsAsync(updates.slice(0, 50));
    updates = updates.slice(50);
}

// --- 5. OUTPUT ---
output.set("status", "ok");
output.set("paivitetty", updates.length);
```

---

## Yhteenveto: TEE ja ÄLÄ TEE

| ✅ TEE | ❌ ÄLÄ TEE |
|--------|-----------|
| Käytä `safeString()` ja `safeNumber()` | Älä oleta että single select on string |
| Batch (max 50) | Älä lähetä yli 50 tietuetta kerralla |
| Päivitä KAIKKI olemassa olevat rivit | Älä jätä vanhoja rivejä päivittämättä |
| Nollaa kuukausikentät ennen kirjoitusta | Älä unohda nollata |
| `if (record) { ... }` | Älä käytä `return` automaatiossa |
| `output.set()` | Älä luota `console.log`:iin automaatiossa |
| Suodata `fields`-listalla | Älä lataa kaikkia kenttiä turhaan |
| Tarkista linkityskentät arrayna | Älä oleta että aina vain yksi linkki |
| Aseta `Last modified by IS NOT Automation` | Älä jätä ehtoa pois real-time-automaatiosta |

---

**Seuraava askel:** Lue [03_ai_agentti_checklista.md](03_ai_agentti_checklista.md) — tarkistuslista jonka käyt läpi ennen jokaisen skriptin lähetystä.
