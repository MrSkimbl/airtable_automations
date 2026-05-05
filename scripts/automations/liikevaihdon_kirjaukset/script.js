// Automation: "Liikevaihdon kirjaukset"  (wfl8vwXu6wHI5QLTC)
// Status: deployed
// Trigger: When record updated (Asiantuntijat, watched: Asiakas, Asiantuntija, Instrumentti,
//          Status, Valmistuminen/Lähetys, Projektin koko, Komissio%, Laskutusennuste,
//          Päätöspäivä, toteutunut, Myönnetty tukisumma, laskutettusumma, Haettu tukisumma)
//
// Kaksisuuntainen synkka + reaaliaikainen liikevaihtokirjaus
//
// PERUSSÄÄNNÖT:
// 1) Komissio-rivi muuttuu → laske LV-rivin kuukausijaksotus + synkkaa metadata
// 2) Liikevaihto-rivi muuttuu → synkkaa metadata takaisin Komissio-riville
// 3) LOOPPIESTO: triggerin condition "Last modified by IS NOT Automation"

let table = base.getTable("Asiantuntijat");
let recordId = input.config().recordId;
let query = await table.selectRecordsAsync({recordIds: [recordId]});
let r = query.getRecord(recordId);

const THRESHOLD = new Date("2024-08-31");
const MONTH_FIELDS = [
    "9","10","11","12",
    "1","2","3","4","5","6","7","8",
    "9-25","10-25","11-25","12-25",
    "1-26","2-26","3-26","4-26","5-26","6-26","7-26","8-26"
];
const MONTH_SET = new Set(MONTH_FIELDS);

function parseMoney(v) {
    if (!v) return 0;
    if (typeof v === "number") return v;
    let cleaned = v.replace(/[^0-9.,-]/g, "").replace(",", ".");
    let n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
}

function getMonthField(d) {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    if (y === 2024 && m >= 9 && m <= 12) return String(m);
    if (y === 2025 && m >= 1 && m <= 8) return String(m);
    if (y === 2025 && m >= 9 && m <= 12) return `${m}-25`;
    if (y === 2026 && m >= 1 && m <= 8) return `${m}-26`;
    return null;
}

function safeString(v) {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (v.name) return v.name;
    return String(v);
}

function isKomi(cat) { return cat && cat.name === "Komissio"; }
function isLV(cat) { return cat && cat.name === "Liikevaihto"; }

const linkField = table.getField("Liikevaihto-rivi");

if (r) {
    // CASE 1: LIIKEVAIHTO → KOMISSIO
    if (isLV(r.getCellValue("Kategoria"))) {
        const linked = r.getCellValue(linkField);
        if (linked && linked.length > 0) {
            let komissioId = linked[0].id;
            let metaUpdate = {
                "Asiakas": r.getCellValue("Asiakas"),
                "Asiantuntija": r.getCellValue("Asiantuntija"),
                "Instrumentti": r.getCellValue("Instrumentti"),
                "Status": r.getCellValue("Status"),
                "Valmistuminen/Lähetys": r.getCellValue("Valmistuminen/Lähetys"),
                "Päätöspäivä, toteutunut": r.getCellValue("Päätöspäivä, toteutunut"),
                "Myönnetty tukisumma": r.getCellValue("Myönnetty tukisumma"),
                "Komissio%": r.getCellValue("Komissio%"),
                "Projektin koko": r.getCellValue("Projektin koko"),
                "Haettu tukisumma": r.getCellValue("Haettu tukisumma")
            };
            await table.updateRecordAsync(komissioId, metaUpdate);
        }

    // CASE 2: KOMISSIO → LIIKEVAIHTO
    } else if (isKomi(r.getCellValue("Kategoria"))) {
        const rawDecision = r.getCellValue("Päätöspäivä, toteutunut");
        const rawSending = r.getCellValue("Valmistuminen/Lähetys");
        let status = safeString(r.getCellValue("Status"));

        const isLahetetty = ["Lähetetty", "Täydennys", "Hyväksytty", "Hylätty"].includes(status);

        let hasValidDecision = false;
        let monthDecision = null;

        if (rawDecision) {
            let decisionDate = new Date(rawDecision);
            if (decisionDate > THRESHOLD) {
                monthDecision = getMonthField(decisionDate);
                hasValidDecision = true;
            }
        }

        let hasValidSending = false;
        if (rawSending && isLahetetty) {
            let sendDate = new Date(rawSending);
            if (sendDate > THRESHOLD) {
                hasValidSending = true;
            }
        }

        if (hasValidDecision || hasValidSending) {
            let invoice = parseMoney(r.getCellValue("laskutettusumma"));
            const linkedLV = r.getCellValue(linkField);
            let sendMonthField = null;
            let varovaisuus = 0;

            if (rawSending && isLahetetty) {
                let sendDate = new Date(rawSending);
                if (sendDate > THRESHOLD) {
                    sendMonthField = getMonthField(sendDate);
                    let ennuste = parseMoney(r.getCellValue("Laskutusennuste"));
                    if (sendMonthField && MONTH_SET.has(sendMonthField) && ennuste > 0) {
                        varovaisuus = ennuste * 0.5;
                    }
                }
            }

            // Lasketaan kuukausisummat
            let monthValues = {};
            MONTH_FIELDS.forEach(f => { monthValues[f] = 0; });

            if (!monthDecision) {
                if (varovaisuus > 0 && sendMonthField && MONTH_SET.has(sendMonthField)) {
                    monthValues[sendMonthField] += varovaisuus;
                }
            } else if (status === "Hylätty") {
                if (varovaisuus > 0 && sendMonthField && MONTH_SET.has(sendMonthField)) {
                    monthValues[sendMonthField] += varovaisuus;
                    if (MONTH_SET.has(monthDecision)) {
                        monthValues[monthDecision] -= varovaisuus;
                    }
                }
            } else {
                let loput = invoice - varovaisuus;
                if (varovaisuus > 0 && sendMonthField && MONTH_SET.has(sendMonthField)) {
                    monthValues[sendMonthField] += varovaisuus;
                }
                if (monthDecision && MONTH_SET.has(monthDecision)) {
                    monthValues[monthDecision] += loput;
                }
            }

            let monthUpdate = {};
            MONTH_FIELDS.forEach(f => monthUpdate[f] = monthValues[f]);

            let meta = {
                "Asiakas": r.getCellValue("Asiakas"),
                "Y-Tunnus": r.getCellValue("Y-Tunnus"),
                "Asiantuntija": r.getCellValue("Asiantuntija"),
                "Instrumentti": r.getCellValue("Instrumentti"),
                "NB / EB": r.getCellValue("NB / EB"),
                "Valmistuminen/Lähetys": r.getCellValue("Valmistuminen/Lähetys"),
                "Päätöspäivä, toteutunut": r.getCellValue("Päätöspäivä, toteutunut"),
                "Status": r.getCellValue("Status"),
                "Projektin koko": r.getCellValue("Projektin koko"),
                "Haettu tukisumma": r.getCellValue("Haettu tukisumma"),
                "Komissio%": r.getCellValue("Komissio%"),
                "Myönnetty tukisumma": r.getCellValue("Myönnetty tukisumma")
            };

            // LUODAAN TAI PÄIVITETÄÄN LV-RIVI
            if (!linkedLV || linkedLV.length === 0) {
                let fields = {
                    "Kategoria": { name: "Liikevaihto" },
                    ...monthUpdate,
                    ...meta
                };
                let newId = await table.createRecordAsync(fields);
                await table.updateRecordAsync(recordId, {
                    [linkField.id]: [{ id: newId }]
                });
                // ★ CRITICAL BACKLINK FIX
                await table.updateRecordAsync(newId, {
                    [linkField.id]: [{ id: recordId }]
                });
            } else {
                let lvId = linkedLV[0].id;
                await table.updateRecordAsync(lvId, {
                    ...monthUpdate,
                    ...meta
                });
            }
        }
    }
}
