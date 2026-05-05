// Automation: "data_bug_bot"  (wflu0DbPt7knMYoiz)
// Status: deployed
// Trigger: At scheduled time (Mon 8:45am EEST weekly)
// Output: slackId1/expertName1/message1/hasMessage1 (+ 2-versio testikäyttöön)
//
// TESTIVAIHE: kovakoodattu TEST_EXPERTS = ["Lauri Böök", "Kimmo Louhelainen"]
// TODO TUOTANTOON:
//   1) Poista TEST_EXPERTS-filtteri
//   2) Vaihda outputiin slackMessages JSON-arrayna ja käytä Repeating-actionia
//   3) Slack-action kanavaksi {slackId} per viesti

function safeString(v) {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (v.name) return v.name;
    return String(v);
}

function safeNumber(v) {
    return (typeof v === "number" && !isNaN(v)) ? v : 0;
}

function formatDate(dateValue) {
    if (!dateValue) return "";
    let dt = new Date(dateValue);
    if (isNaN(dt)) return "";
    let d = String(dt.getDate()).padStart(2, '0');
    let m = String(dt.getMonth() + 1).padStart(2, '0');
    let y = dt.getFullYear();
    return `${d}.${m}.${y}`;
}

function formatEuro(value) {
    if (!value || value < 1) return "€0";
    return "€" + Math.round(value);
}

function getDaysFromNow(dateValue) {
    if (!dateValue) return null;
    let dt = new Date(dateValue);
    if (isNaN(dt)) return null;
    let now = new Date();
    let diff = dt - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isWithin30Days(dateValue) {
    let days = getDaysFromNow(dateValue);
    if (days === null) return false;
    return days >= 0 && days <= 30;
}

function getAirtableUrl(recordId, baseId, tableId) {
    return `https://airtable.com/${baseId}/${tableId}/${recordId}`;
}

function formatAsiakas(asiakas, recordId, baseId, tableId) {
    let displayName = asiakas || "(ei asiakasta)";
    if (baseId && tableId && recordId) {
        let url = getAirtableUrl(recordId, baseId, tableId);
        return `<${url}|${displayName}>`;
    }
    return displayName;
}

let asiantuntijatTable = base.getTable("Asiantuntijat");
let viestiasetuksetTable = base.getTable("Viestiasetukset");

const BASE_ID = base.id;
const TABLE_ID = asiantuntijatTable.id;

let asiantuntijatQuery = await asiantuntijatTable.selectRecordsAsync({
    fields: [
        "Asiantuntija","Asiakas","Instrumentti","Status","Kategoria",
        "Aloituspäivä","Laskutusennuste","laskutettusumma",
        "Päätöspäivä, toteutunut","Päätöspäivä, ennuste",
        "Arvioitu valmistuminen","Valmistuminen/Lähetys","NB / EB"
    ]
});

let viestiasetuksetQuery = await viestiasetuksetTable.selectRecordsAsync({
    fields: ["Asiantuntija", "Slack ID"]
});

let experts = {};
for (let rec of viestiasetuksetQuery.records) {
    let asiantuntijaCell = rec.getCellValue("Asiantuntija");
    if (!asiantuntijaCell) continue;
    let name = safeString(asiantuntijaCell);
    let slackId = safeString(rec.getCellValue("Slack ID"));
    if (name && slackId) experts[name] = slackId;
}

const TEST_EXPERTS = ["Lauri Böök", "Kimmo Louhelainen"];

let expertData = {};

for (let rec of asiantuntijatQuery.records) {
    let expertCell = rec.getCellValue("Asiantuntija");
    if (!Array.isArray(expertCell) || expertCell.length === 0) continue;

    let expertName = safeString(expertCell[0]?.name);
    if (!expertName) continue;

    if (!TEST_EXPERTS.includes(expertName)) continue; // TESTIVAIHE

    if (!expertData[expertName]) {
        expertData[expertName] = {
            errors: { työssäNoAloitus: [], laskutusennustePuuttuu: [], hyväksyttyNoLaskutettu: [] },
            lähtevät30pv: [], päätökset30pv: [], uudetAsiakkaat: []
        };
    }

    let data = expertData[expertName];
    let recordId = rec.id;
    let asiakas = safeString(rec.getCellValue("Asiakas"));
    let instrumentti = safeString(rec.getCellValue("Instrumentti"));
    let status = safeString(rec.getCellValue("Status"));
    let kategoria = safeString(rec.getCellValue("Kategoria"));
    let aloitusPv = rec.getCellValue("Aloituspäivä");
    let laskutusennuste = safeNumber(rec.getCellValue("Laskutusennuste"));
    let laskutettusumma = safeNumber(rec.getCellValue("laskutettusumma"));
    let päätösPv = rec.getCellValue("Päätöspäivä, toteutunut");
    let päätösPvEnnuste = rec.getCellValue("Päätöspäivä, ennuste");
    let valmistuminen = rec.getCellValue("Valmistuminen/Lähetys");
    let arvioituValmistuminen = rec.getCellValue("Arvioitu valmistuminen");
    let nbEb = safeString(rec.getCellValue("NB / EB"));

    if (status === "Hylätty") continue;

    let cutoffDate = new Date("2025-09-01");
    if (valmistuminen) {
        let d = new Date(valmistuminen);
        if (!isNaN(d) && d < cutoffDate) continue;
    }
    if (!valmistuminen && päätösPv) {
        let d = new Date(päätösPv);
        if (!isNaN(d) && d < cutoffDate) continue;
    }

    if (kategoria === "Komissio" && !aloitusPv &&
        !["Peruttu","Tauolla","Suunnitelma valmis","Konsultointi"].includes(status)) {
        data.errors.työssäNoAloitus.push({ recordId, asiakas, instrumentti, aloitusPv, ennuste: laskutusennuste });
    }

    if (kategoria === "Komissio" && laskutusennuste < 1 &&
        !["Peruttu","Tauolla","Suunnitelma valmis","Konsultointi"].includes(status)) {
        data.errors.laskutusennustePuuttuu.push({ recordId, asiakas, instrumentti, aloitusPv, status });
    }

    if (kategoria === "Komissio" && status === "Hyväksytty" && laskutettusumma < 1) {
        data.errors.hyväksyttyNoLaskutettu.push({ recordId, asiakas, instrumentti, päätösPv, ennuste: laskutusennuste });
    }

    let lähtöPv = valmistuminen || arvioituValmistuminen;
    if (kategoria === "Komissio" && ["Työn alla","Tulossa"].includes(status) && isWithin30Days(lähtöPv)) {
        data.lähtevät30pv.push({ recordId, asiakas, instrumentti, valmistuminen: lähtöPv, ennuste: laskutusennuste });
    }

    if (kategoria === "Komissio" && isWithin30Days(päätösPvEnnuste)) {
        data.päätökset30pv.push({ recordId, asiakas, instrumentti, päätösPvEnnuste, ennuste: laskutusennuste });
    }

    if (kategoria === "MRR" && nbEb === "NB") {
        data.uudetAsiakkaat.push({ recordId, asiakas, instrumentti, aloitusPv, laskutettusumma });
    }
}

let slackMessages = [];

for (let expertName in expertData) {
    let slackId = experts[expertName];
    if (!slackId) continue;

    let data = expertData[expertName];
    let messageParts = [];

    let hasErrors = (data.errors.työssäNoAloitus.length > 0 ||
                     data.errors.laskutusennustePuuttuu.length > 0 ||
                     data.errors.hyväksyttyNoLaskutettu.length > 0);
    let hasLähtevät = data.lähtevät30pv.length > 0;
    let hasPäätökset = data.päätökset30pv.length > 0;
    let hasUudet = data.uudetAsiakkaat.length > 0;

    if (!hasErrors && !hasLähtevät && !hasPäätökset && !hasUudet) continue;

    let errorCount = data.errors.työssäNoAloitus.length +
                     data.errors.laskutusennustePuuttuu.length +
                     data.errors.hyväksyttyNoLaskutettu.length;

    messageParts.push(`:warning: *Airtable Data Bot* - ${expertName}\n`);

    if (hasErrors) {
        messageParts.push(`*:x: Virheitä datassa (${errorCount} kpl):*\n`);

        if (data.errors.työssäNoAloitus.length > 0) {
            messageParts.push("_Työn alla, aloituspäivä puuttuu:_");
            for (let item of data.errors.työssäNoAloitus) {
                let asiakasLink = formatAsiakas(item.asiakas, item.recordId, BASE_ID, TABLE_ID);
                let display = `*${asiakasLink}*`;
                if (item.instrumentti) display += ` - ${item.instrumentti}`;
                let line = `   • ${display}`;
                if (item.ennuste > 0) line += `\n      _Ennuste: ${formatEuro(item.ennuste)}_`;
                messageParts.push(line);
            }
            messageParts.push("");
        }

        if (data.errors.laskutusennustePuuttuu.length > 0) {
            messageParts.push("_Laskutusennuste puuttuu:_");
            for (let item of data.errors.laskutusennustePuuttuu) {
                let asiakasLink = formatAsiakas(item.asiakas, item.recordId, BASE_ID, TABLE_ID);
                let display = `*${asiakasLink}*`;
                if (item.instrumentti) display += ` - ${item.instrumentti}`;
                let line = `   • ${display} _(${item.status})_`;
                if (item.aloitusPv) line += `\n      _Aloituspv: ${formatDate(item.aloitusPv)}_`;
                messageParts.push(line);
            }
            messageParts.push("");
        }

        if (data.errors.hyväksyttyNoLaskutettu.length > 0) {
            messageParts.push("_Hyväksytty, mutta ei laskutettua summaa:_");
            for (let item of data.errors.hyväksyttyNoLaskutettu) {
                let asiakasLink = formatAsiakas(item.asiakas, item.recordId, BASE_ID, TABLE_ID);
                let display = `*${asiakasLink}*`;
                if (item.instrumentti) display += ` - ${item.instrumentti}`;
                let details = [];
                if (item.päätösPv) details.push(`Päätöspv: ${formatDate(item.päätösPv)}`);
                if (item.ennuste > 0) details.push(`Ennuste: ${formatEuro(item.ennuste)}`);
                let line = `   • ${display}`;
                if (details.length > 0) line += `\n      _${details.join(" | ")}_`;
                messageParts.push(line);
            }
            messageParts.push("");
        }
    }

    if (hasLähtevät) {
        messageParts.push(`*:outbox_tray: Lähtevät seuraavan 30 päivää sisällä (${data.lähtevät30pv.length} kpl):*`);
        for (let item of data.lähtevät30pv) {
            let asiakasLink = formatAsiakas(item.asiakas, item.recordId, BASE_ID, TABLE_ID);
            let display = `*${asiakasLink}*`;
            if (item.instrumentti) display += ` - ${item.instrumentti}`;
            let details = [];
            if (item.valmistuminen) details.push(`Valmistuminen: ${formatDate(item.valmistuminen)}`);
            if (item.ennuste > 0) details.push(`Ennuste: ${formatEuro(item.ennuste)}`);
            let line = `   • ${display}`;
            if (details.length > 0) line += `\n      _${details.join(" | ")}_`;
            messageParts.push(line);
        }
        messageParts.push("");
    }

    if (hasPäätökset) {
        messageParts.push(`*:calendar: Päätökset seuraavan 30 päivää sisällä (${data.päätökset30pv.length} kpl):*`);
        for (let item of data.päätökset30pv) {
            let asiakasLink = formatAsiakas(item.asiakas, item.recordId, BASE_ID, TABLE_ID);
            let display = `*${asiakasLink}*`;
            if (item.instrumentti) display += ` - ${item.instrumentti}`;
            let details = [];
            if (item.päätösPvEnnuste) details.push(`Päätöspv: ${formatDate(item.päätösPvEnnuste)}`);
            if (item.ennuste > 0) details.push(`Ennuste: ${formatEuro(item.ennuste)}`);
            let line = `   • ${display}`;
            if (details.length > 0) line += `\n      _${details.join(" | ")}_`;
            messageParts.push(line);
        }
        messageParts.push("");
    }

    if (hasUudet) {
        messageParts.push(`*:star2: Uusien asiakkaiden tilaukset (${data.uudetAsiakkaat.length} kpl):*`);
        for (let item of data.uudetAsiakkaat) {
            let asiakasLink = formatAsiakas(item.asiakas, item.recordId, BASE_ID, TABLE_ID);
            let display = `*${asiakasLink}*`;
            if (item.instrumentti) display += ` - ${item.instrumentti}`;
            let details = [];
            if (item.aloitusPv) details.push(`Aloituspv: ${formatDate(item.aloitusPv)}`);
            if (item.laskutettusumma > 0) details.push(`Summa: ${formatEuro(item.laskutettusumma)}`);
            let line = `   • ${display}`;
            if (details.length > 0) line += `\n      _${details.join(" | ")}_`;
            messageParts.push(line);
        }
        messageParts.push("");
    }

    slackMessages.push({ slackId, expertName, message: messageParts.join("\n") });
}

if (slackMessages.length > 0) {
    let msg1 = slackMessages[0];
    output.set("slackId1", msg1.slackId);
    output.set("expertName1", msg1.expertName);
    output.set("message1", msg1.message);
    output.set("hasMessage1", true);

    if (slackMessages.length > 1) {
        let msg2 = slackMessages[1];
        output.set("slackId2", msg2.slackId);
        output.set("expertName2", msg2.expertName);
        output.set("message2", msg2.message);
        output.set("hasMessage2", true);
    } else {
        output.set("hasMessage2", false);
    }
} else {
    output.set("hasMessage1", false);
    output.set("hasMessage2", false);
}
