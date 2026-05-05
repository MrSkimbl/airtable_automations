# Airtable row value updated

**Workflow ID:** `wflZKFBYRMjJrTsSI`
**Status:** **undeployed** (ei tuotannossa)
**Tekijä:** CTO-viritys
**Tarkoitus:** Lähettää Airtable-rivin päivityksestä webhook Azure Functioniin, joka käsittelee tiedon muualla (esim. ulkoisen järjestelmän synkronointi).

## Trigger
- Tyyppi: When record updated
- Taulu: Asiantuntijat
- Watched fields: *(ei jaettu — todennäköisesti laajempi joukko)*

## Toiminnot
1. **Run script** — ks. [`script.js`](script.js)
   - Hakee päivitetyn rivin
   - Lähettää `POST` Azure Function -endpointtiin: `gdatafetch-prod-fa.azurewebsites.net/api/airtable/records/{tableId}/{recordId}`
   - Käyttää Airtable-secrettiä `functionKey` (auth Azure Functioniin)

## Havainnot
- **Hyvä:** secret on tallennettu Airtablen `input.secret()`-mekanismiin, ei kovakoodattuna.
- Status undeployed — ehkä testivaiheessa tai pysäytetty.
- Skripti logaa avaimen (`console.log("functionkey: ", functionKey)`) — **poista tuotantoversiosta**, ettei se vuoda lokeihin.
- Pari paste-artifaktia (`[record.name](http://record.name)` jne.) — varmista että Airtablessa oleva versio on puhdas (vain `record.name`, `record.id`, `table.id`).

## Pari/sisarautomaatio
- `Airtable row value created` (`wflKRfZ14GrixR0Dp`, deployed) — sama mutta create-eventille. Tarkasta kannattaako pitää erillään vai yhdistää.
