// Automation: "Toimenpiteet1"  (wflHYHRgCIa8aT6kO)
// Status: deployed
// Trigger: When record updated (Asiantuntijat / Valmistuminen/Lähetys)
// Toiminto: Run script — luo/päivittää Toimenpide-rivit lähde-rivin pohjalta

/***** TAULUT *****/
const SOURCE_TABLE = "Asiantuntijat";
const RULES_TABLE  = "Toimenpiteet";
const PREFS_TABLE  = "Viestiasetukset";

/***** KENTTÄMÄÄRITYKSET *****/
const F = {
  category:    "Kategoria",
  actionText:  "Toimenpide",
  actionDate:  "Toimenpide, pvm",
  source:      "Toimenpide-linkki",
  rule:        "Toimenpide rules",
  customerMsg: "Viesti asiakkaalle"
};

const LOCK_FIELD  = "Lukittu (älä päivitä)";
const COPY_FIELDS = ["Asiakas","Y-Tunnus","Asiantuntija","NB/EB","Instrumentti","Status"];

/***** SÄÄNTÖRIVIT (TOIMENPITEET-TAULUSSA) *****/
const RF = {
  name:         "Name",
  key:          "Rule Key",
  enabled:      "Enabled",
  trigger:      "Trigger field",
  offset:       "Offset value",
  text:         "Action text",
  customerText: "Message to customer"
};

/***** VIESTIASETUKSET (match Asiantuntija-nimellä) *****/
const PF = {
  person:   "Asiantuntija",
  slackId:  "Slack ID",
  channels: "Ilmoitus"
};

const DST = {
  slackId:  "SlackId",
  channels: "Kanava"
};

/***** APUFUNKTIOT *****/
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
  if (["number","currency","percent","duration","rating"].includes(type)) return typeof val==="number"?val:undefined;
  if (["date","dateTime"].includes(type)) return new Date(val);
  if (type==="checkbox") return !!val;
  if (type==="singleSelect") return val?{name:val.name}:null;
  if (type==="multipleSelects") return Array.isArray(val)?val.map(o=>({name:o.name})):[];
  if (type==="singleCollaborator") return Array.isArray(val)&&val.length?{id:val[0].id}:(val&&val.id?{id:val.id}:null);
  if (type==="multipleCollaborators") return Array.isArray(val)?val.map(u=>({id:u.id})):[];
  if (type==="multipleRecordLinks") return Array.isArray(val)?val.map(x=>({id:x.id})):[];
  return undefined;
}

function namesFromSource(srcVal){
  if (srcVal == null) return [];
  if (Array.isArray(srcVal)) return srcVal.map(v => (v && v.name) ? String(v.name) : String(v)).map(s=>s.trim()).filter(Boolean);
  if (typeof srcVal === "object" && srcVal && srcVal.name) return [String(srcVal.name).trim()].filter(Boolean);
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

/***** PÄÄSUORITUS *****/
const { recordId } = input.config();
const sourceTable = base.getTable(SOURCE_TABLE);
const rulesTable  = base.getTable(RULES_TABLE);

const rec = await sourceTable.selectRecordAsync(recordId);
if (!rec){
  console.log("❌ Record not found");
} else if (rec.getCellValue(F.rule)){
  console.log("⏭️ Skip: toimenpiderivi");
} else {
  const kategoria = rec.getCellValue("Kategoria");
  const kategoriaName = kategoria?.name || kategoria || "";
  const allowedCategories = ["Komissio", "MRR", "Projekti"];
  if (!allowedCategories.includes(kategoriaName)){
    console.log(`⏭️ Skip: kategoria "${kategoriaName}" ei ole sallittu (vain: ${allowedCategories.join(", ")})`);
  } else {
    let abortAll = false;
    try {
      if (sourceTable.getField(LOCK_FIELD) && rec.getCellValue(LOCK_FIELD)) {
        console.log("⏭️ Skip: source locked");
        abortAll = true;
      }
    } catch {}

    let prefSlackId;
    let prefChannelsValue;
    if (!abortAll){
      try {
        const prefsTable = base.getTable(PREFS_TABLE);
        const prefsQ = await prefsTable.selectRecordsAsync({ fields: [PF.person, PF.slackId, PF.channels] });

        const meRaw = rec.getCellValueAsString("Asiantuntija") || "";
        const me = meRaw.trim().toLowerCase();
        if (me){
          const hit = prefsQ.records.find(r => (r.getCellValueAsString(PF.person) || "").trim().toLowerCase() === me);
          if (hit){
            const sId = hit.getCellValue(PF.slackId);
            const chRaw = hit.getCellValue(PF.channels);

            try {
              const fld = sourceTable.getField(DST.slackId);
              if (["singleLineText","multilineText","richText","email","url","phoneNumber"].includes(fld.type) && sId) {
                await sourceTable.updateRecordAsync(rec.id, { [DST.slackId]: String(sId) });
                prefSlackId = String(sId);
              }
            } catch {}

            try {
              const mapped = channelValueOrSkip(sourceTable, DST.channels, chRaw);
              if (mapped !== undefined) {
                await sourceTable.updateRecordAsync(rec.id, { [DST.channels]: mapped });
                prefChannelsValue = mapped;
              }
            } catch {}
          }
        }
      } catch (e){
        console.log("⚠️ Viestiasetukset-päivitys virhe:", e?.message || e);
      }
    }

    if (!abortAll){
      const rulesQ = await rulesTable.selectRecordsAsync({ fields: Object.values(RF) });
      const existQ = await sourceTable.selectRecordsAsync({ fields: [F.source, F.rule, LOCK_FIELD] });

      for (const r of rulesQ.records){
        if (!r.getCellValue(RF.enabled)) continue;
        const ruleKey = r.getCellValue(RF.key); if (!ruleKey) continue;

        const trigCell = r.getCellValue(RF.trigger);
        const triggerField = typeof trigCell==="string" ? trigCell : trigCell?.name;
        if (!triggerField){ console.log("skip: trigger puuttuu", ruleKey); continue; }
        try { sourceTable.getField(triggerField); }
        catch { console.log(`skip: ${ruleKey} – kenttää "${triggerField}" ei ole`); continue; }

        const offsetDays  = r.getCellValue(RF.offset) ?? 0;
        const actionTpl   = r.getCellValue(RF.text) || "";
        const customerTpl = r.getCellValue(RF.customerText) || "";

        const trigVal = rec.getCellValue(triggerField);

        const existing = existQ.records.find(x=>{
          const link=x.getCellValue(F.source);
          const src=Array.isArray(link)&&link.length?link[0].id:null;
          return src===rec.id && x.getCellValue(F.rule)===ruleKey;
        });

        if (!trigVal){
          if (existing){
            try {
              if (sourceTable.getField(LOCK_FIELD) && existing.getCellValue(LOCK_FIELD)) {
                console.log("⏭️ Skip delete: target locked");
              } else {
                await sourceTable.deleteRecordAsync(existing.id);
                console.log(`🧹 deleted: ${ruleKey}`);
              }
            } catch {
              await sourceTable.deleteRecordAsync(existing.id);
              console.log(`🧹 deleted: ${ruleKey}`);
            }
          }
          continue;
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
          if (v!==undefined) payload[n]=v;
        }

        if (prefSlackId !== undefined)      payload[DST.slackId]   = prefSlackId;
        if (prefChannelsValue !== undefined) payload[DST.channels] = prefChannelsValue;

        if (existing){
          try {
            if (sourceTable.getField(LOCK_FIELD) && existing.getCellValue(LOCK_FIELD)) {
              console.log("⏭️ Skip update: target locked");
              continue;
            }
          } catch {}
          await sourceTable.updateRecordAsync(existing.id, payload);
          console.log("✅ updated:", ruleKey);
        } else {
          await sourceTable.createRecordAsync(payload);
          console.log("✅ created:", ruleKey);
        }
      }
    }
  }
}
