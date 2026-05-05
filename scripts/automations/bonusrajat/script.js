// Automation: "Bonusrajat"  (wflnssQKhF7xBWg6a)
// Status: deployed
// Trigger: When record updated (Bonusrajat ja tavoitteet)
// Input: recordId
// Toiminto: propagoi vuositason Bonusraja/Tavoite kuukausitasolle (jaettuna 12:lla)
// kaikkiin asiantuntijan Tilikauden laskenta -rivihin.

let srcTable = base.getTable("Bonusrajat ja tavoitteet");
let dstTable = base.getTable("Tilikauden laskenta");

let inputConfig = input.config();
let recordId = inputConfig.recordId;

if (!recordId) {
    console.log("recordId puuttuu inputista");
    throw new Error("recordId not found in input");
}

let srcQuery = await srcTable.selectRecordsAsync({ recordIds: [recordId] });
let srcRecord = srcQuery.records[0];

if (!srcRecord) {
    console.log("Riviä ei löytynyt:", recordId);
    throw new Error("Record not found");
}

let expertCell = srcRecord.getCellValue("Asiantuntija");
let bonusraja = srcRecord.getCellValue("Bonusraja");
let tavoite = srcRecord.getCellValue("Tavoite");

if (!Array.isArray(expertCell) || expertCell.length !== 1) {
    console.log("Asiantuntija-kenttä puuttuu tai on väärässä muodossa");
    throw new Error("Invalid Asiantuntija field");
}

let expertObj = expertCell[0];
let expertId = expertObj.id;
let expertName = expertObj.name;

console.log(`Käsitellään: ${expertName}`);
console.log(`Bonusraja: ${bonusraja}, Tavoite: ${tavoite}`);

function safeNumber(v) {
    return (typeof v === "number" && !isNaN(v)) ? v : 0;
}

let bonusrajaPerMonth = safeNumber(bonusraja) / 12;
let tavoitePerMonth = safeNumber(tavoite) / 12;

let dstQuery = await dstTable.selectRecordsAsync({
    fields: ["Asiantuntija", "Kuukausi", "Tilikausi", "Bonusraja", "Tavoite"]
});

console.log(`DEBUG: Kohdetaulussa yhteensä ${dstQuery.records.length} riviä`);

let updates = [];
let matchCount = 0;
let skipReasons = { noExpert: 0, wrongExpert: 0, wrongTilikausi: 0 };

for (let rec of dstQuery.records) {
    let dstExpertCell = rec.getCellValue("Asiantuntija");

    if (!Array.isArray(dstExpertCell) || dstExpertCell.length !== 1) {
        skipReasons.noExpert++;
        continue;
    }

    if (dstExpertCell[0].id !== expertId) {
        skipReasons.wrongExpert++;
        continue;
    }

    matchCount++;

    updates.push({
        id: rec.id,
        fields: {
            "Bonusraja": bonusrajaPerMonth,
            "Tavoite": tavoitePerMonth
        }
    });
}

console.log(`DEBUG: Löytyi ${matchCount} täsmäävää riviä`);
console.log(`DEBUG: Skip-syyt: ei asiantuntijaa=${skipReasons.noExpert}, väärä asiantuntija=${skipReasons.wrongExpert}, väärä tilikausi=${skipReasons.wrongTilikausi}`);

let updatedCount = 0;
while (updates.length > 0) {
    let batch = updates.slice(0, 50);
    await dstTable.updateRecordsAsync(batch);
    updatedCount += batch.length;
    updates = updates.slice(50);
}

console.log(`✓ Päivitetty ${updatedCount} riviä asiantuntijalle ${expertName}`);
console.log(`  Bonusraja/kk: ${bonusrajaPerMonth.toFixed(2)}`);
console.log(`  Tavoite/kk: ${tavoitePerMonth.toFixed(2)}`);
