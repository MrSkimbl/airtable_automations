// Automation: "Päätöspäivä, ennusteet refresh"  (wfl4bYDFg7UWppASo)
// Trigger: Schedule (cron, päivittäin)
// Toiminto: Run script
//
// Päivittää Asiantuntijat-taulun riveille:
//   - Arvioitu valmistuminen: Tulossa/Työn alla -rivit, joilla estimate on menneisyydessä → +7 pv
//   - Päätöspäivä, ennuste:
//       A) jos tyhjä ja ankkuri löytyy → ankkuri + bucket-päivät (ELY/non-ELY × low/mid/high)
//       B) jos olemassa mutta menneisyydessä tai < 3 pv → "tänään + siirto"
//
// Korjaus 2026-05-04: yhdistetään saman rivin moninkertaiset päivitykset Mapilla,
// koska updateRecordsAsync ei salli samaa recordId:tä kahdesti samassa pyynnössä.
// Ennen korjausta: "Error: Record \"recXXX\" was specified twice in this request."

console.log("Scripti käynnistyi klo:", new Date().toLocaleTimeString());

const table = base.getTable("Asiantuntijat"); // tblRdgQNtY3sZT0lV

const FIELD_CATEGORY   = "Kategoria";
const FIELD_STATUS     = "Status";
const FIELD_START      = "Aloituspäivä";
const FIELD_SENT       = "Valmistuminen/Lähetys";
const FIELD_ESTIMATE   = "Arvioitu valmistuminen";
const FIELD_FORECAST   = "Päätöspäivä, ennuste";
const FIELD_INSTRUMENT = "Instrumentti";
const FIELD_EURO       = "Laskutusennuste";

const forecastField = table.getField(FIELD_FORECAST);
const forecastIsDate = String(forecastField.type || "").toLowerCase().includes("date");

const Q33 = 2619.36;
const Q66 = 5770.80;

const OFFSETS = {
    ely: { low: 28, mid: 21, high: 49, fallback: 42 },
    non: { low: 21, mid: 35, high: 56, fallback: 35 },
};

const NEAR_THRESHOLD_DAYS = 3;
const SHIFT_ELY = 28;
const SHIFT_NON = 14;

// ----------------- Helpers -----------------
function toNumber(v) {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    if (typeof v === "string") {
        const s = v.replace("€", "").replace(/\s/g, "").replace(",", ".").trim();
        const n = Number(s);
        return isFinite(n) ? n : 0;
    }
    return 0;
}
function isDate(d) {
    return d instanceof Date && !isNaN(d.getTime());
}
function parseDateFlexible(v) {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v === "string") {
        const s = v.trim();
        const iso = new Date(s);
        if (iso instanceof Date && !isNaN(iso.getTime())) return iso;
        let m = s.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/);
        if (m) {
            const dt = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12, 0, 0, 0);
            return isNaN(dt.getTime()) ? null : dt;
        }
        m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (m) {
            const dt = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12, 0, 0, 0);
            return isNaN(dt.getTime()) ? null : dt;
        }
    }
    return null;
}
function addDays(d, days) {
    const x = new Date(d);
    x.setHours(12, 0, 0, 0);
    x.setDate(x.getDate() + days);
    return x;
}
function daysDiff(a, b) {
    const au = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const bu = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((bu - au) / 86400000);
}
function bucketForEuro(euro) {
    if (euro <= Q33) return "low";
    if (euro <= Q66) return "mid";
    return "high";
}
function isELY(instr) {
    if (!instr) return false;
    const name = typeof instr === "object" && instr.name ? instr.name : String(instr);
    return name.toLowerCase().includes("ely");
}
function safeName(v) {
    if (!v) return "";
    if (typeof v === "object" && v.name) return v.name;
    if (typeof v === "string") return v;
    return String(v);
}

// Per-record update merger — varmistaa että jokainen rivi on listassa vain kerran.
const pending = new Map();
function queueFields(id, fields) {
    const existing = pending.get(id);
    if (existing) {
        Object.assign(existing.fields, fields);
    } else {
        pending.set(id, { id, fields: { ...fields } });
    }
}
// -------------------------------------------

const query = await table.selectRecordsAsync({
    fields: [
        FIELD_CATEGORY, FIELD_STATUS, FIELD_START, FIELD_SENT,
        FIELD_ESTIMATE, FIELD_FORECAST, FIELD_INSTRUMENT, FIELD_EURO,
    ],
});

const now = new Date();
now.setHours(12, 0, 0, 0);

let candidates = 0;
let skippedNoAnchor = 0;
let shiftedExisting = 0;
let estimateBumped = 0;

for (const r of query.records) {
    const category = safeName(r.getCellValue(FIELD_CATEGORY));
    if (category !== "Komissio") continue;

    const status = safeName(r.getCellValue(FIELD_STATUS));
    if (!["Lähetetty", "Täydennys", "Tulossa", "Työn alla"].includes(status)) continue;

    const id       = r.id;
    const start    = parseDateFlexible(r.getCellValue(FIELD_START));
    const sent     = parseDateFlexible(r.getCellValue(FIELD_SENT));
    const estimate = parseDateFlexible(r.getCellValue(FIELD_ESTIMATE));
    const forecast = parseDateFlexible(r.getCellValue(FIELD_FORECAST));
    const instr    = r.getCellValue(FIELD_INSTRUMENT);
    const euro     = toNumber(r.getCellValue(FIELD_EURO));
    const ely      = isELY(instr);

    // 1) Tulossa/Työn alla + Arvioitu valmistuminen menneisyydessä → siirrä today+7
    let estimateForAnchor = estimate;
    if ((status === "Tulossa" || status === "Työn alla") && estimate && daysDiff(now, estimate) < 0) {
        const newEstimate = addDays(now, 7);
        queueFields(id, { [FIELD_ESTIMATE]: newEstimate });
        estimateBumped++;
        estimateForAnchor = newEstimate; // käytä päivitettyä arvoa ennusteen laskennassa
    }

    // Päätä ankkuri statuksen mukaan
    let anchor = null;
    if (status === "Lähetetty" || status === "Täydennys") {
        if (isDate(sent)) anchor = sent;
        else if (isDate(estimateForAnchor)) anchor = estimateForAnchor;
        else if (isDate(start)) anchor = addDays(start, 30);
    } else if (status === "Tulossa" || status === "Työn alla") {
        if (isDate(estimateForAnchor)) anchor = estimateForAnchor;
        else if (isDate(start)) anchor = addDays(start, 30);
    }

    // A) Ennuste tyhjä ja ankkuri löytyi → laske bucket + offset
    if (anchor && !forecast) {
        const bucket = bucketForEuro(euro);
        const baseDays =
            (ely ? OFFSETS.ely[bucket] : OFFSETS.non[bucket]) ??
            (ely ? OFFSETS.ely.fallback : OFFSETS.non.fallback);

        let newDate = addDays(anchor, baseDays);
        if (daysDiff(now, newDate) < NEAR_THRESHOLD_DAYS) {
            newDate = addDays(now, ely ? SHIFT_ELY : SHIFT_NON);
        }
        const outVal = forecastIsDate ? newDate : newDate.toISOString().slice(0, 10);
        queueFields(id, { [FIELD_FORECAST]: outVal });
        candidates++;
        continue;
    }

    // B) Ennuste olemassa mutta menneisyydessä tai < 3 pv → siirrä eteenpäin
    if (isDate(forecast)) {
        if (daysDiff(now, forecast) < NEAR_THRESHOLD_DAYS) {
            const pushed = addDays(now, ely ? SHIFT_ELY : SHIFT_NON);
            const outVal = forecastIsDate ? pushed : pushed.toISOString().slice(0, 10);
            queueFields(id, { [FIELD_FORECAST]: outVal });
            shiftedExisting++;
        }
    } else if (!anchor) {
        skippedNoAnchor++;
    }
}

// Batch-päivitys (50 kpl erissä)
const updates = Array.from(pending.values());
let applied = 0;
for (let i = 0; i < updates.length; i += 50) {
    const chunk = updates.slice(i, i + 50);
    await table.updateRecordsAsync(chunk);
    applied += chunk.length;
}

console.log("Total records:", query.records.length);
console.log("Komissio candidates (new forecast):", candidates);
console.log("Shifted existing forecasts (past/near):", shiftedExisting);
console.log("Estimate bumped (Tulossa/Työn alla, past):", estimateBumped);
console.log("Skipped (no anchor, no forecast):", skippedNoAnchor);
console.log("Unique records updated:", updates.length);
console.log("Update calls applied:", applied);
console.log("Q33/Q66:", Q33, Q66);
console.log("Offsets:", OFFSETS);
console.log("Near-term rule:", { NEAR_THRESHOLD_DAYS, SHIFT_ELY, SHIFT_NON });
console.log("Scripti päättyi klo:", new Date().toLocaleTimeString());
