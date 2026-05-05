// Automation: "Airtable row value updated"  (wflZKFBYRMjJrTsSI)
// Status: undeployed
// Trigger: When record updated (Asiantuntijat)
// Toiminto: POST Azure Functioniin gdatafetch-prod-fa
//
// HUOM:
//  - functionKey haetaan input.secret() -mekanismilla (Airtable secret store)
//  - Logaa funktioavaimen — poista tuotantoversiosta (console.log("functionkey: ...")).

const inputConfig = input.config();
const table = base.getTable("Asiantuntijat");

console.log(inputConfig);

const record = await table.selectRecordAsync(inputConfig.recordId);

if (record) {
    console.log(`Successfully fetched record: ${record.name}`);

    const functionKey = input.secret("functionKey");
    const recordId = record.id;
    const tableId = table.id;
    console.log("functionkey: ", functionKey); // ⚠️ poista tuotannosta
    console.log("table", tableId);

    const url = `https://gdatafetch-prod-fa.azurewebsites.net/api/airtable/records/${tableId}/${recordId}?code=${functionKey}`;
    console.log(url);

    const postBody = {};

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postBody),
        });

        if (response.ok) {
            console.log("HTTP POST request successful!");
        } else {
            let errorBody = "No response body available or could not be parsed.";
            try {
                errorBody = await response.json();
            } catch (e) {
                errorBody = await response.text();
            }

            console.error(`HTTP POST request failed with status: ${response.status} - ${response.statusText}`);
            console.error("API Error Body:", errorBody);
        }
    } catch (error) {
        console.error("An error occurred during the fetch operation:", error);
    }
} else {
    console.error(`Error: Could not find record with ID: ${inputConfig.recordId}`);
}
