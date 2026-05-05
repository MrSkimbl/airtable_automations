// Automation: "Vanhentuneiden toimenpiteiden poistaminen"  (wfljOa3Mtob2KrA1t)
// Trigger: At scheduled time (Sun 9am EEST)
// Input: recordId (Repeating group's Current item → Record ID)
// Toiminto: poista yksi toimenpiderivi

let { recordId } = input.config();

const TABLE_NAME = "Asiantuntijat";

if (!recordId) { output.set('skipped', 'missing recordId'); return; }

const table = base.getTable(TABLE_NAME);

try {
  await table.deleteRecordAsync(recordId);
  output.set('deleted', recordId);
} catch (err) {
  // Yleisin syy: rivi poistettu jo aiemmin samassa ajossa
  output.set('error', String(err));
}
