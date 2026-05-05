// Automation: "Tilikauden laskenta, scheduled"  (wflA62AwiIZgrtccL)
// Status: deployed
// Trigger: At scheduled time (daily 1:00am EEST)
// Toiminto: aggregoi Asiantuntijat-taulun rivit Tilikauden laskenta -tauluun.
//
// EROAA button-versiosta:
//  - vaatii expertsCell.length === 1 (button: hyväksyy useita, ottaa ensimmäisen)
//  - EI mrrAsiakkaat-laskuria
//  - EI Lähtevät-arvon 5000€ minimiä

let srcTable = base.getTable("Asiantuntijat");
let dstTable = base.getTable("Tilikauden laskenta");
let bonusTable = base.getTable("Bonusrajat ja tavoitteet");

let months = [
    "9-25","10-25","11-25","12-25",
    "1-26","2-26","3-26","4-26",
    "5-26","6-26","7-26","8-26"
];

let srcQuery = await srcTable.selectRecordsAsync();
let dstQuery = await dstTable.selectRecordsAsync();
let bonusQuery = await bonusTable.selectRecordsAsync();

function safeString(v) {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (v.name) return v.name;
    return String(v);
}

function safeNumber(v) {
    return (typeof v === "number" && !isNaN(v)) ? v : 0;
}

function monthNameFromDate(dateValue) {
    if (!dateValue) return "";
    if (typeof dateValue === "string" && dateValue.includes("/")) {
        let [d,m,y] = dateValue.split("/");
        let dt = new Date(Number(y), Number(m)-1, Number(d));
        if (!isNaN(dt)) return (dt.getMonth()+1) + "-" + dt.getFullYear().toString().slice(-2);
    }
    let dt = new Date(dateValue);
    if (isNaN(dt)) return "";
    return (dt.getMonth()+1) + "-" + dt.getFullYear().toString().slice(-2);
}

function isMonthCompleted(monthString) {
    if (!monthString || !monthString.includes("-")) return false;
    let [m, y] = monthString.split("-");
    let month = Number(m);
    let year = 2000 + Number(y);
    let monthEnd = new Date(year, month, 0, 23, 59, 59);
    let now = new Date();
    return now > monthEnd;
}

let bonusRajat = {};
for (let rec of bonusQuery.records) {
    let expertRef = rec.getCellValue("Asiantuntija");
    if (!Array.isArray(expertRef) || expertRef.length !== 1) continue;
    let expertName = safeString(expertRef[0]?.name);
    let bonusRaja = safeNumber(rec.getCellValue("Bonusraja"));
    if (expertName && bonusRaja) bonusRajat[expertName] = bonusRaja;
}

let totals = {};
let forecastTotals = {};
let lahetetytTotals = {};
let lahtevätTotals = {};
let mrrTotals = {};
let projektitTotals = {};
let komissiotTotals = {};
let komissiotEnnusteTotals = {};
let komissiotLiikevaihtoTotals = {};
let hakemusKplCounts = {};
let hakemusKplEnnusteCounts = {};
let expertIds = {};

for (let rec of srcQuery.records) {
    let expertsCell = rec.getCellValue("Asiantuntija");
    if (!Array.isArray(expertsCell) || expertsCell.length !== 1) continue;

    let expertObj = expertsCell[0];
    let expertName = safeString(expertObj?.name);
    let expertId = expertObj?.id;
    if (!expertId) continue;

    expertIds[expertName] = expertId;

    let category = safeString(rec.getCellValue("Kategoria"));
    let status = safeString(rec.getCellValue("Status"));
    let nbeb = safeString(rec.getCellValue("NB / EB"));
    let total = safeNumber(rec.getCellValue("tk 25-26 total"));

    let passA = category==="Komissio" && status==="Hyväksytty" && total>0;
    let passB = (category==="Projekti"||category==="MRR") && nbeb!=="NB" && total>0;

    if (passA || passB) {
        for (let m of months) {
            let val = safeNumber(rec.getCellValue(m));
            if (!val) continue;
            let key = `${expertName}__${m}`;
            totals[key] = (totals[key]||0) + val;
        }
    }

    if (category==="MRR" && nbeb!=="NB" && total>0) {
        for (let m of months) {
            let val = safeNumber(rec.getCellValue(m));
            if (!val) continue;
            let key = `${expertName}__${m}`;
            mrrTotals[key] = (mrrTotals[key]||0) + val;
        }
    }

    if (category==="Projekti" && nbeb!=="NB" && total>0) {
        for (let m of months) {
            let val = safeNumber(rec.getCellValue(m));
            if (!val) continue;
            let key = `${expertName}__${m}`;
            projektitTotals[key] = (projektitTotals[key]||0) + val;
        }
    }

    if (category==="Komissio" && status==="Hyväksytty" && total>0) {
        for (let m of months) {
            let val = safeNumber(rec.getCellValue(m));
            if (!val) continue;
            let key = `${expertName}__${m}`;
            komissiotTotals[key] = (komissiotTotals[key]||0) + val;
        }
    }

    if (category==="Liikevaihto" && total>0) {
        for (let m of months) {
            let val = safeNumber(rec.getCellValue(m));
            if (!val) continue;
            let key = `${expertName}__${m}`;
            komissiotLiikevaihtoTotals[key] = (komissiotLiikevaihtoTotals[key]||0) + val;
        }
    }

    if (category==="MRR" && nbeb==="NB" && total>0) {
        for (let m of months) {
            let val = safeNumber(rec.getCellValue(m));
            if (!val) continue;
            let key = `${expertName}__${m}`;
            forecastTotals[key] = (forecastTotals[key]||0) + val;
        }
    }

    if (["Lähetetty","Tulossa","Työn alla","Täydennys"].includes(status)) {
        let decisionDate = rec.getCellValue("Päätöspäivä, ennuste");
        let monthName = monthNameFromDate(decisionDate);
        if (!months.includes(monthName)) continue;

        let forecastVal = safeNumber(rec.getCellValue("Laskutusennuste"));
        if (!forecastVal) continue;

        let key = `${expertName}__${monthName}`;
        forecastTotals[key] = (forecastTotals[key]||0) + forecastVal;

        if (category==="Komissio") {
            komissiotEnnusteTotals[key] = (komissiotEnnusteTotals[key]||0) + forecastVal;
        }
    }

    if (category === "Komissio") {
        if (["Lähetetty", "Täydennys", "Hyväksytty"].includes(status)) {
            let sentDate = rec.getCellValue("Valmistuminen/Lähetys");
            let monthName = monthNameFromDate(sentDate);
            if (months.includes(monthName)) {
                let sumVal = status === "Hyväksytty"
                    ? safeNumber(rec.getCellValue("laskutettusumma"))
                    : safeNumber(rec.getCellValue("Laskutusennuste"));
                if (sumVal > 0) {
                    let key = `${expertName}__${monthName}`;
                    lahetetytTotals[key] = (lahetetytTotals[key]||0) + sumVal;
                }
            }
        }

        if (["Lähetetty", "Täydennys", "Hyväksytty", "Hylätty"].includes(status)) {
            let sentDate = rec.getCellValue("Valmistuminen/Lähetys");
            let monthName = monthNameFromDate(sentDate);
            if (months.includes(monthName)) {
                let key = `${expertName}__${monthName}`;
                hakemusKplCounts[key] = (hakemusKplCounts[key]||0) + 1;
            }
        }

        if (["Tulossa", "Työn alla"].includes(status)) {
            let estimateDate = rec.getCellValue("Arvioitu valmistuminen");
            let monthName = monthNameFromDate(estimateDate);
            if (months.includes(monthName)) {
                let sumVal = safeNumber(rec.getCellValue("Laskutusennuste"));
                if (sumVal > 0) {
                    let key = `${expertName}__${monthName}`;
                    lahtevätTotals[key] = (lahtevätTotals[key]||0) + sumVal;
                }
            }
        }

        if (["Tulossa", "Työn alla"].includes(status)) {
            let estimateDate = rec.getCellValue("Arvioitu valmistuminen");
            let monthName = monthNameFromDate(estimateDate);
            if (months.includes(monthName)) {
                let key = `${expertName}__${monthName}`;
                hakemusKplEnnusteCounts[key] = (hakemusKplEnnusteCounts[key]||0) + 1;
            }
        }
    }
}

let bonusCumulative = {};
for (let expertName in expertIds) {
    let bonusRajaVuosi = bonusRajat[expertName] || 0;
    let bonusRajaKk = bonusRajaVuosi / 12;
    let cumulativeToteuma = 0;
    let monthCount = 0;

    for (let m of months) {
        let key = `${expertName}__${m}`;
        if (isMonthCompleted(m)) {
            monthCount++;
            cumulativeToteuma += (totals[key] || 0);
            let cumulativeBonusRaja = bonusRajaKk * monthCount;
            let bonus = (cumulativeToteuma - cumulativeBonusRaja) * 0.15;
            bonusCumulative[key] = bonus;
        }
    }
}

let existing = {};
for (let rec of dstQuery.records) {
    let tilikausi = safeString(rec.getCellValue("Tilikausi"));
    if (tilikausi !== "2025–2026") continue;

    let expertRef = rec.getCellValue("Asiantuntija");
    let expertName = (Array.isArray(expertRef) && expertRef[0]?.name) ? expertRef[0].name : "";
    let monthName = safeString(rec.getCellValue("Kuukausi"));
    if (!expertName || !monthName) continue;
    existing[`${expertName}__${monthName}`] = rec;
}

let updates = [];
let creates = [];

const allKeys = new Set([
    ...Object.keys(totals),
    ...Object.keys(forecastTotals),
    ...Object.keys(lahetetytTotals),
    ...Object.keys(lahtevätTotals),
    ...Object.keys(mrrTotals),
    ...Object.keys(projektitTotals),
    ...Object.keys(komissiotTotals),
    ...Object.keys(komissiotEnnusteTotals),
    ...Object.keys(komissiotLiikevaihtoTotals),
    ...Object.keys(hakemusKplCounts),
    ...Object.keys(hakemusKplEnnusteCounts)
]);

const allExistingKeys = new Set([...allKeys, ...Object.keys(existing)]);

for (let key of allExistingKeys) {
    if (!existing[key]) continue;

    let [expertName, monthName] = key.split("__");
    let userId = expertIds[expertName];
    if (!userId) continue;

    let bonusCumulativeVal = bonusCumulative[key];

    let fieldsToUpdate = {
        "Asiantuntija": [{ id: userId }],
        "Kuukausi": { name: monthName },
        "Toteuma": totals[key] || 0,
        "Ennuste": forecastTotals[key] || 0,
        "Lähetetyt": lahetetytTotals[key] || 0,
        "Lähtevät": lahtevätTotals[key] || 0,
        "MRR": mrrTotals[key] || 0,
        "Projektit": projektitTotals[key] || 0,
        "Komissiot": komissiotTotals[key] || 0,
        "Komissiot, ennuste": komissiotEnnusteTotals[key] || 0,
        "Komissiot, liikevaihto": komissiotLiikevaihtoTotals[key] || 0,
        "Hakemukset, kpl": hakemusKplCounts[key] || 0,
        "Hakemukset, kpl ennuste": hakemusKplEnnusteCounts[key] || 0,
        "Tilikausi": "2025–2026"
    };

    if (bonusCumulativeVal !== undefined) {
        fieldsToUpdate["Bonus, kumulatiivinen"] = bonusCumulativeVal;
    }

    updates.push({ id: existing[key].id, fields: fieldsToUpdate });
}

for (let key of allKeys) {
    if (existing[key]) continue;
    let [expertName, monthName] = key.split("__");
    let userId = expertIds[expertName];
    if (!userId) continue;

    let bonusCumulativeVal = bonusCumulative[key];

    let fieldsToCreate = {
        "Asiantuntija": [{ id: userId }],
        "Kuukausi": { name: monthName },
        "Toteuma": totals[key] || 0,
        "Ennuste": forecastTotals[key] || 0,
        "Lähetetyt": lahetetytTotals[key] || 0,
        "Lähtevät": lahtevätTotals[key] || 0,
        "MRR": mrrTotals[key] || 0,
        "Projektit": projektitTotals[key] || 0,
        "Komissiot": komissiotTotals[key] || 0,
        "Komissiot, ennuste": komissiotEnnusteTotals[key] || 0,
        "Komissiot, liikevaihto": komissiotLiikevaihtoTotals[key] || 0,
        "Hakemukset, kpl": hakemusKplCounts[key] || 0,
        "Hakemukset, kpl ennuste": hakemusKplEnnusteCounts[key] || 0,
        "Tilikausi": "2025–2026"
    };

    if (bonusCumulativeVal !== undefined) {
        fieldsToCreate["Bonus, kumulatiivinen"] = bonusCumulativeVal;
    }

    creates.push({ fields: fieldsToCreate });
}

let createdCount = 0;
while (creates.length) {
    await dstTable.createRecordsAsync(creates.slice(0, 50));
    createdCount += Math.min(50, creates.length);
    creates = creates.slice(50);
}

let updatedCount = 0;
while (updates.length) {
    await dstTable.updateRecordsAsync(updates.slice(0, 50));
    updatedCount += Math.min(50, updates.length);
    updates = updates.slice(50);
}

console.log(`Valmis: create ${createdCount}, update ${updatedCount}.`);
