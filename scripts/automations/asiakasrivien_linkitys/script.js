// Automation: "asiakasrivien linkitys, jatkuva"  (wflngJYnS4G7GBlSG)
// Status: deployed
// Trigger: When record updated (Asiakas, Asiantuntija (Vanha))
// Toiminto: Linkittää saman asiakasnimen rivit toisiinsa Asiakas-linkki-kentän kautta

console.log("Scripti käynnistyi klo:", new Date().toLocaleTimeString());

let table = base.getTable("Asiantuntijat");

// Funktio asiakasnimien normalisointiin
function normalizeCustomerName(name) {
    if (!name) return "";

    return String(name)
        .trim()
        .replace(/^\*/, '') // Poista * alusta
        .replace(/\s+(Oy|Ltd|Inc|AB|AS|GmbH)$/i, '') // Poista yritysmuodot lopusta
        .trim();
}

// Hae kaikki rivit
let query = await table.selectRecordsAsync();
let records = query.records;

console.log(`Käsitellään ${records.length} riviä`);

// Ryhmittele vain asiakkaan mukaan
let groups = {};
for (let record of records) {
    let asiakas = record.getCellValue("Asiakas");

    if (!asiakas) continue;

    // Normalisoi asiakasnimi
    asiakas = normalizeCustomerName(asiakas);

    if (!groups[asiakas]) {
        groups[asiakas] = [];
    }
    groups[asiakas].push(record);
}

console.log(`Löytyi ${Object.keys(groups).length} asiakasta`);

// Päivitä linkitykset
let updates = [];
for (let record of records) {
    let asiakas = record.getCellValue("Asiakas");

    if (!asiakas) {
        updates.push({
            id: record.id,
            fields: { "Asiakas-linkki": [] }
        });
        continue;
    }

    // Normalisoi asiakasnimi
    asiakas = normalizeCustomerName(asiakas);
    let groupRecords = groups[asiakas];

    if (groupRecords && groupRecords.length > 1) {
        let recordIds = groupRecords.map(r => ({ id: r.id }));
        updates.push({
            id: record.id,
            fields: { "Asiakas-linkki": recordIds }
        });
    } else {
        updates.push({
            id: record.id,
            fields: { "Asiakas-linkki": [] }
        });
    }
}

console.log(`Päivitetään ${updates.length} riviä`);

// Päivitä 50 riviä kerralla
for (let i = 0; i < updates.length; i += 50) {
    let batch = updates.slice(i, i + 50);
    await table.updateRecordsAsync(batch);
}

console.log("✅ Linkitykset päivitetty!");
