// Automation: "komissiot kuukausisarakkeisiin"  (wfldIHYhl0767fdKE)
// Trigger: When record updated (Status → Hyväksytty)
// Toiminto: Run script
//
// Skripti kirjoittaa Komissio-rivin laskutettusumman oikeaan
// kuukausisarakkeeseen päätöspäivän mukaan, esim. 4-26 jos
// Päätöspäivä, toteutunut = 2026-04-30.
//
// Korjaus 2026-05-04:
//   Aiemmin guardit (`if (!decisionDate || amount == null) ...`) vain
//   kutsuivat output.set MUTTA EIVÄT PALAUTTANEET. Ajo jatkui null-arvolla
//   → `new Date(null)` = 1970-01-01 → fieldName "1-70" → ei löydy
//   → "Error: Could not find a field with name or ID '1-70'".
//   Tilanne syntyy kun Status vaihdetaan Hyväksytyksi ennen kuin
//   Päätöspäivä, toteutunut ja/tai Myönnetty tukisumma on täytetty
//   (laskutettusumma = formula = 0 jos Myönnetty puuttuu).
//
//   Korjaus: lisätty return-kutsut joka guardiin + päivämäärän validointi
//   + kentän olemassaolon tarkistus, joka myös palauttaa eikä etene.

const recordId = input.config().recordId;
const table = base.getTable("Asiantuntijat");

const query = await table.selectRecordsAsync({
    fields: ["Päätöspäivä, toteutunut", "laskutettusumma", "Status", "Kategoria"],
});
const record = query.getRecord(recordId);

if (!record) {
    output.set("result", `Riviä ID:llä ${recordId} ei löytynyt.`);
    return;
}

const decisionDate = record.getCellValue("Päätöspäivä, toteutunut");
const amount = record.getCellValue("laskutettusumma");

if (!decisionDate) {
    output.set(
        "result",
        `Päätöspäivä, toteutunut puuttuu (rec ${recordId}). ` +
            `Täytä päivämäärä ja aja automaatio uudelleen "Run automation" -napista.`,
    );
    return;
}

if (amount == null || amount === 0) {
    output.set(
        "result",
        `laskutettusumma on 0 tai puuttuu (rec ${recordId}). ` +
            `Tarkista Myönnetty tukisumma ja Komissio% — ne kertomalla saadaan summa.`,
    );
    return;
}

// Airtable date-kenttä palauttaa ISO-stringin, esim. "2026-04-30"
const d = new Date(decisionDate);
if (isNaN(d.getTime())) {
    output.set("result", `Päätöspäivä ei parse: "${decisionDate}" (rec ${recordId})`);
    return;
}

const month = d.getMonth() + 1;
const yearSuffix = d.getFullYear().toString().slice(-2);
const fieldName = `${month}-${yearSuffix}`;

// Tarkista että kuukausikenttä on basessa olemassa (esim. 4-26, 9-25, …)
let field;
try {
    field = table.getField(fieldName);
} catch (e) {
    output.set(
        "result",
        `Kenttää '${fieldName}' ei löydy taulusta. Päätöspäivä: ${decisionDate} (rec ${recordId}).`,
    );
    return;
}

await table.updateRecordAsync(recordId, {
    [fieldName]: amount,
});

output.set(
    "result",
    `Päivitetty kenttä ${fieldName} arvolla ${amount} (rec ${recordId}).`,
);
