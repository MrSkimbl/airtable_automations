// Automation: "Toimenpiteet taulun muutokset"  (wflAahyro3wWNb8dQ)
// Status: deployed
// Trigger: When record updated (Toimenpiteet / Enabled)
// Input: ruleId = Record (ID) (Step 1)
// Toiminto: ajaa yhden säännön kaikille Asiantuntijat-lähteille (upsert toimenpiderivit)

const SOURCE_TABLE = "Asiantuntijat";
const RULES_TABLE  = "Toimenpiteet";

const F = {
  category:    "Kategoria",
  actionText:  "Toimenpide",
  actionDate:  "Toimenpide, pvm",
  source:      "Toimenpide-linkki",
  rule:        "Toimenpide rules",
  customerMsg: "Viesti asiakkaalle"
};
const LOCK_FIELD = "Lukittu (älä päivitä)";

const COPY_FIELDS = ["Asiakas","Y-Tunnus","Asiantuntija","NB/EB","Instrumentti","Status"];

const RF = {
  name:         "Name",
  key:          "Rule Key",
  enabled:      "Enabled",
  trigger:      "Trigger field",
  offset:       "Offset value",
  text:         "Action text",
  customerText: "Message to customer"
};

function addDays(v,n){ const d=new Date(v); d.setDate(d.getDate()+n); d.setHours(0,0,0,0); return d; }
const linkTo = id => [{ id }];

function renderTemplate(tpl, rec){
  return (tpl||"").replace(/\{\{\s*([^}]+)\s*\}\}/g,(_,k)=>rec.getCellValueAsString(String(k).trim())||"");
}

function copyValueByType(table, rec, fieldName){
  let field; try { field = table.getField(fieldName); } catch { return undefined; }
  const type = field.type, val = rec.getCellValue(fieldName);
  if (val == null) return undefined;
  const NON = ["formula","rollup","lookup","createdTime","lastModifiedTime","autoNumber"];
  if (NON.includes(type)) return undefined;
  if (["singleLineText","multilineText","richText","email","url","phoneNumber"].includes(type)) return String(val);
  if (["number","currency","percent","duration","rating"].includes(type)) return (typeof val==="number") ? val : undefined;
  if (["date","dateTime"].includes(type)) return new Date(val);
  if (type==="checkbox") return !!val;
  if (type==="singleSelect")            return val ? { name: val.name } : null;
  if (type==="multipleSelects")         return Array.isArray(val) ? val.map(o => ({ name:o.name })) : [];
  if (type==="singleCollaborator")      return Array.isArray(val)&&val.length ? { id: val[0].id } : (val&&val.id ? { id: val.id } : null);
  if (type==="multipleCollaborators")   return Array.isArray(val) ? val.map(u => ({ id:u.id })) : [];
  if (type==="multipleRecordLinks")     return Array.isArray(val) ? val.map(x => ({ id:x.id })) : [];
  return undefined;
}

const { ruleId } = input.config();
if (!ruleId) { throw new Error("ruleId puuttuu – lisää Run script → Input: ruleId = Record (ID) (Step 1)."); }

const sourceTable = base.getTable(SOURCE_TABLE);
const rulesTable  = base.getTable(RULES_TABLE);

const ruleRec = await rulesTable.selectRecordAsync(ruleId);
if (!ruleRec){ console.log("❌ Rule not found"); return; }
if (!ruleRec.getCellValue(RF.enabled)){ console.log("⏭️ Rule not enabled"); return; }

const ruleKey = ruleRec.getCellValue(RF.key);
const trigCell = ruleRec.getCellValue(RF.trigger);
const triggerField = (typeof trigCell === "string") ? trigCell : trigCell?.name;
const offsetDays = ruleRec.getCellValue(RF.offset) ?? 0;
const actionTpl  = ruleRec.getCellValue(RF.text) || "";
const customerTpl= ruleRec.getCellValue(RF.customerText) || "";

if (!ruleKey){ console.log("❌ Rule Key puuttuu"); return; }
if (!triggerField){ console.log("❌ Trigger field puuttuu"); return; }
try { sourceTable.getField(triggerField); } catch { console.log(`❌ Lähdetaulussa ei kenttää: ${triggerField}`); return; }

const all = await sourceTable.selectRecordsAsync();

const sources = [];
const existingBySource = new Map();

for (const r of all.records){
  const link = r.getCellValue(F.source);
  const isGenerated = Array.isArray(link) && link.length > 0;

  if (!isGenerated){
    sources.push(r);
  } else if (r.getCellValue(F.rule) === ruleKey){
    const srcId = link[0].id;
    if (!existingBySource.has(srcId)) existingBySource.set(srcId, r);
  }
}

const creates = [];
const updates = [];
let skippedLocked = 0, skippedNoTrigger = 0, skippedTargetLocked = 0, skippedCategory = 0;

for (const rec of sources){
  const kategoria = rec.getCellValue("Kategoria");
  const kategoriaName = kategoria?.name || kategoria || "";
  const allowedCategories = ["Komissio", "MRR", "Projekti"];
  if (!allowedCategories.includes(kategoriaName)){ skippedCategory++; continue; }

  let locked = false;
  try { locked = !!rec.getCellValue(LOCK_FIELD); } catch {}
  if (locked){ skippedLocked++; continue; }

  const trigVal = rec.getCellValue(triggerField);
  if (!trigVal){ skippedNoTrigger++; continue; }

  const existing = existingBySource.get(rec.id);

  if (existing){
    try {
      if (sourceTable.getField(LOCK_FIELD) && existing.getCellValue(LOCK_FIELD)) {
        skippedTargetLocked++;
        continue;
      }
    } catch {}
  }

  const payload = {
    [F.category]:    { name: "Toimenpide" },
    [F.actionText]:  renderTemplate(actionTpl, rec),
    [F.customerMsg]: renderTemplate(customerTpl, rec),
    [F.actionDate]:  addDays(trigVal, offsetDays),
    [F.rule]:        ruleKey,
    [F.source]:      linkTo(rec.id)
  };

  const reserved = new Set([F.category,F.actionText,F.customerMsg,F.actionDate,F.rule,F.source]);
  for (const n of COPY_FIELDS){
    if (reserved.has(n)) continue;
    const v = copyValueByType(sourceTable, rec, n);
    if (v !== undefined) payload[n] = v;
  }

  if (existing){
    updates.push({ id: existing.id, fields: payload });
  } else {
    creates.push({ fields: payload });
  }
}

async function runBatches(fn, arr){ for (let i=0;i<arr.length;i+=50){ await fn(arr.slice(i, i+50)); } }
if (creates.length) await runBatches(batch => sourceTable.createRecordsAsync(batch), creates);
if (updates.length) await runBatches(batch => sourceTable.updateRecordsAsync(batch), updates);

console.log(`✅ Apply done for rule ${ruleKey}. Created: ${creates.length}, Updated: ${updates.length}, Skipped category: ${skippedCategory}, Skipped locked source: ${skippedLocked}, Skipped locked target: ${skippedTargetLocked}, Skipped no trigger: ${skippedNoTrigger}`);
