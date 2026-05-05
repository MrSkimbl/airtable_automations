// Automation: "Viestiasetus-taulun muutokset"  (wflRivYJdK69rhZo1)
// Status: deployed
// Trigger: When record updated (Viestiasetukset)
// Input: recordId
// Toiminto: propagoi Slack ID + Ilmoitus muutos kaikkiin asiantuntijan Toimenpide-rivihin

const SOURCE_TABLE = "Asiantuntijat";
const PREFS_TABLE  = "Viestiasetukset";

const F = {
  category: "Kategoria",
};
const LOCK_FIELD = "Lukittu (älä päivitä)";

const DST = {
  slackId:  "SlackId",
  channels: "Kanava"
};

const PF = {
  person:   "Asiantuntija",
  slackId:  "Slack ID",
  channels: "Ilmoitus"
};

function namesFromSource(srcVal){
  if (srcVal == null) return [];
  if (Array.isArray(srcVal)) return srcVal.map(v => (v?.name ?? String(v))).map(s=>String(s).trim()).filter(Boolean);
  if (typeof srcVal === "object" && srcVal?.name) return [String(srcVal.name).trim()];
  return String(srcVal).split(",").map(s=>s.trim()).filter(Boolean);
}

function channelValueOrSkip(table, fieldName, srcVal){
  let field; try { field = table.getField(fieldName); } catch { return undefined; }
  const t = field.type;
  const names = namesFromSource(srcVal);

  if (t === "singleSelect"){
    const allowed = new Set((field.options?.choices||[]).map(c=>c.name));
    const first = names.find(n => allowed.has(n));
    return first ? { name:first } : undefined;
  }
  if (t === "multipleSelects"){
    const allowed = new Set((field.options?.choices||[]).map(c=>c.name));
    const hits = names.filter(n => allowed.has(n)).map(n => ({ name:n }));
    return hits.length ? hits : undefined;
  }
  if (["singleLineText","multilineText","richText","email","url","phoneNumber"].includes(t)){
    return names.join(", ");
  }
  return undefined;
}

const { recordId } = input.config();
if (!recordId) { throw new Error("recordId puuttuu (asetetaan automaation Inputissa)."); }

const sourceTable = base.getTable(SOURCE_TABLE);
const prefsTable  = base.getTable(PREFS_TABLE);

const pref = await prefsTable.selectRecordAsync(recordId);
if (!pref){ console.log("❌ Viestiasetukset-rivi puuttuu"); return; }

const personRaw = pref.getCellValueAsString(PF.person) || "";
const personKey = personRaw.trim().toLowerCase();
const slackVal  = pref.getCellValue(PF.slackId);
const chanRaw   = pref.getCellValue(PF.channels);

if (!personKey){ console.log("ℹ️ Viestiasetukset.Asiantuntija tyhjä → ei päivitettävää"); return; }

let slackWriteAllowed = false;
try {
  const fld = sourceTable.getField(DST.slackId);
  slackWriteAllowed = ["singleLineText","multilineText","richText","email","url","phoneNumber"].includes(fld.type);
} catch {}

const chanMapped = channelValueOrSkip(sourceTable, DST.channels, chanRaw);

const fieldsToLoad = [F.category, "Asiantuntija", DST.slackId, DST.channels, LOCK_FIELD];
const all = await sourceTable.selectRecordsAsync({ fields: fieldsToLoad });

const targets = all.records.filter(r => {
  const isAction = (r.getCellValue(F.category)?.name === "Toimenpide");
  if (!isAction) return false;
  const nameKey = (r.getCellValueAsString("Asiantuntija") || "").trim().toLowerCase();
  return nameKey && nameKey === personKey;
});

const updates = [];
for (const r of targets){
  let locked = false; try { locked = !!r.getCellValue(LOCK_FIELD); } catch {}
  if (locked) continue;

  const fields = {};
  if (slackWriteAllowed && slackVal != null && slackVal !== "") fields[DST.slackId] = String(slackVal);
  if (chanMapped !== undefined) fields[DST.channels] = chanMapped;

  if (Object.keys(fields).length) updates.push({ id: r.id, fields });
}

async function runBatches(arr){ for (let i=0;i<arr.length;i+=50){ await sourceTable.updateRecordsAsync(arr.slice(i, i+50)); } }
if (updates.length) await runBatches(updates);

console.log(`✅ Päivitetty toimenpiderivejä: ${updates.length} (Asiantuntija="${personRaw}")`);
