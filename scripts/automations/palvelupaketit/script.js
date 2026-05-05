// Automation: "Palvelupaketit"  (wflgaKuv2QGlh94Kw)
// Status: deployed
// Trigger: When record updated (Asiantuntijat)
// Input: recordId
// Toiminto: asettaa Palvelupaketti-kentän automaattisesti MRR-arvon mukaan, jos kenttä on tyhjä.

function safeString(v) {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (v.name) return v.name;
    return String(v);
}

function safeNumber(v) {
    return (typeof v === "number" && !isNaN(v)) ? v : 0;
}

let recordId = input.config().recordId;
let table = base.getTable("Asiantuntijat");

let query = await table.selectRecordsAsync();
let record = query.getRecord(recordId);

if (!record) {
    output.set("result", "Rivi ID:llä " + recordId + " ei löytynyt.");
}

if (record) {
    let kategoria = safeString(record.getCellValue("Kategoria"));
    let palvelupaketti = safeString(record.getCellValue("Palvelupaketti"));
    let mrr = safeNumber(record.getCellValue("MRR"));

    if (!palvelupaketti) {
        let newPaketti = "";

        if (kategoria === "Projekti") {
            newPaketti = "Projekti";
        } else if (kategoria === "MRR" && mrr > 0) {
            if (mrr > 2000) {
                newPaketti = "EU";
            } else if (mrr > 700) {
                newPaketti = "Enterprise";
            } else if (mrr > 400) {
                newPaketti = "Expert";
            } else if (mrr >= 260) {
                newPaketti = "Pro";
            } else if (mrr >= 200) {
                newPaketti = "Starter";
            } else if (mrr >= 150) {
                newPaketti = "Invest";
            } else if (mrr >= 100) {
                newPaketti = "Upkeep";
            }
        }

        if (newPaketti) {
            await table.updateRecordAsync(record.id, {
                "Palvelupaketti": { name: newPaketti }
            });
            output.set("result", "Päivitetty: Palvelupaketti = " + newPaketti);
        } else {
            output.set("result", "Ei päivitetty (ei sopivia ehtoja)");
        }
    } else {
        output.set("result", "Palvelupaketti on jo asetettu, ei päivitetä");
    }
}
