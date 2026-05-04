#!/usr/bin/env node
// Lukee schema/automations.json ja kirjoittaa
// airtable-automaatio-opas/04_automaatiot/_API_inventaario.md
//
// Päivittäminen:
//   curl -s -H "Authorization: Bearer $AIRTABLE_TOKEN" \
//     "https://api.airtable.com/v0/meta/bases/$AIRTABLE_BASE_ID/automations" \
//     -o schema/automations.json
//   node scripts/build_automations_doc.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'schema', 'automations.json');
const DST = path.join(ROOT, 'airtable-automaatio-opas', '04_automaatiot', '_API_inventaario.md');

const TRIGGER_LABELS = {
  wttCRON0000000000: 'Schedule (cron)',
  wttRECORDCREATED0: 'When record created',
  wttRECORDUPDATED0: 'When record updated',
  wttRECORDMATCHES0: 'When record matches conditions',
  wttCONNECTIONINPT: 'Webhook in',
};
const ACTION_LABELS = {
  watCUSTOMSCRIPT00: 'Run script',
  watUPDATERECORD00: 'Update record',
  watCREATERECORD00: 'Create record',
  watFINDRECORDS000: 'Find records',
  watSENDTOSLACK000: 'Send Slack',
  watAIGENERATE0000: 'AI generate',
  watGSHEETSCREATE0: 'Google Sheets',
  watBETUHIcuho4hit: 'Send email (beta)',
};

const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const wfs = data.workflows;

const cmpFi = (a, b) => a.name.localeCompare(b.name, 'fi');
const deployed = wfs.filter((w) => w.deploymentStatus === 'deployed').sort(cmpFi);
const undeployed = wfs.filter((w) => w.deploymentStatus !== 'deployed').sort(cmpFi);

function trigLabel(w) {
  const t = w.trigger && w.trigger.workflowTriggerTypeId;
  return TRIGGER_LABELS[t] || t || '—';
}

function actionsLabel(w) {
  const map = (w.graph && w.graph.actionsById) || {};
  return Object.values(map)
    .map((a) => ACTION_LABELS[a.workflowActionTypeId] || a.workflowActionTypeId || '—')
    .join(' → ');
}

const lines = [];
lines.push('# Automaatio-inventaario (API-vahvistettu)');
lines.push('');
lines.push('> Lähde: `GET /v0/meta/bases/app5bwxdTTUmbSyUK/automations`');
lines.push(
  '> Snapshot: [`../../schema/automations.json`](../../schema/automations.json) — päivitetty ' +
    new Date().toISOString().slice(0, 10),
);
lines.push('');
lines.push(
  '**Yhteensä ' +
    wfs.length +
    ' automaatiota** — ' +
    deployed.length +
    ' deployattu, ' +
    undeployed.length +
    ' undeployed.',
);
lines.push('');
lines.push('## Mitä Meta API EI anna');
lines.push('');
lines.push('- Trigger-konfiguraatio (taulu / ehdot / cron-ajastus) — vain trigger-tyyppi');
lines.push('- Action-konfiguraatio (mitä kenttää päivitetään, mitä Slack-kanavaa, jne.)');
lines.push('- Scriptien lähdekoodi — tarkistettava UI:sta tai `scripts/`-kansiosta');
lines.push('- Ajohistoria / virhelogit');
lines.push('');
lines.push('Näiden tietojen päivitys vaatii Airtable-UI:n manuaalisen tarkistuksen.');
lines.push('');

lines.push('## Deployatut automaatiot (' + deployed.length + ')');
lines.push('');
lines.push('| Nimi | Trigger | Toiminnot | Live-versio | Workflow ID |');
lines.push('|------|---------|-----------|-------------|-------------|');
for (const w of deployed) {
  lines.push(
    '| ' +
      w.name +
      ' | ' +
      trigLabel(w) +
      ' | ' +
      actionsLabel(w) +
      ' | ' +
      w.liveWorkflowDeploymentVersion +
      ' | `' +
      w.id +
      '` |',
  );
}
lines.push('');

lines.push('## Undeployed / luonnokset (' + undeployed.length + ')');
lines.push('');
lines.push(
  'Nämä eivät ole tuotannossa. Voi olla wip-luonnoksia, vanhoja kokeiluja tai pysäytettyjä automaatioita.',
);
lines.push('');
lines.push('| Nimi | Trigger | Toiminnot | Status | Workflow ID |');
lines.push('|------|---------|-----------|--------|-------------|');
for (const w of undeployed) {
  lines.push(
    '| ' +
      w.name +
      ' | ' +
      trigLabel(w) +
      ' | ' +
      actionsLabel(w) +
      ' | ' +
      w.deploymentStatus +
      ' | `' +
      w.id +
      '` |',
  );
}
lines.push('');

lines.push('## Päivitysohje');
lines.push('');
lines.push('```bash');
lines.push('# .env:stä luetaan AIRTABLE_TOKEN ja AIRTABLE_BASE_ID');
lines.push('set -a; source .env; set +a');
lines.push('');
lines.push('# 1. Päivitä snapshot');
lines.push('curl -s -H "Authorization: Bearer $AIRTABLE_TOKEN" \\');
lines.push('  "https://api.airtable.com/v0/meta/bases/$AIRTABLE_BASE_ID/automations" \\');
lines.push('  -o schema/automations.json');
lines.push('');
lines.push('# 2. Generoi tämä dokumentti uudelleen');
lines.push('node scripts/build_automations_doc.js');
lines.push('```');
lines.push('');

fs.writeFileSync(DST, lines.join('\n'));
console.log('Wrote ' + DST + ' (' + lines.length + ' lines, ' + wfs.length + ' workflows)');
