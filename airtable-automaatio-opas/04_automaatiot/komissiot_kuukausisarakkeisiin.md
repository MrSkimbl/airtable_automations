# Komissiot kuukausisarakkeisiin

Pieni real-time-automaatio, joka kirjaa hyväksytyn komission summan oikeaan kuukausisarakkeeseen Asiantuntijat-taulussa.

> Linkit: [00 README](../README.md) · [01 Base-rakenne](../01_base_rakenne.md) · [02 Scripting-käytännöt](../02_scripting_kaytannot.md) · [03 Tarkistuslista](../03_ai_agentti_checklista.md) · [04 Automaatiot](README.md)

---

## Tarkoitus

Kun komission `Status` muuttuu `Hyväksytty`-tilaan ja siinä on `Päätöspäivä, toteutunut` + `laskutettusumma`, kirjaa summa oikean kuukauden sarakkeeseen Asiantuntijat-taulussa.

**Esimerkki:** päätös 15.10.2025, summa 5 000 € → kenttä `10-25` saa arvon `5000`.

---

## Setup

| Asetus | Arvo |
|--------|------|
| Trigger | "When record updated" → taulu **Asiantuntijat** |
| Trigger field (suositus) | `Status` |
| Condition | **`Last modified by IS NOT Automation`** ⚠️ |
| Action | Run script |
| Input variable | `recordId` → triggerin Record ID |

---

## Logiikka (askel askeleelta)

```
1. Hae triggerin recordId inputista
2. Lataa Asiantuntijat-taulun rivi
3. Jos rivi löytyy:
     Lue Päätöspäivä, toteutunut + laskutettusumma
     Jos molemmat olemassa:
       Muodosta kentän nimi muodossa "KK-VV"
       Tarkista try/catch että kenttä on olemassa
       Päivitä rivi: { [fieldName]: amount }
       output.set("result", "Päivitetty kenttä XX-YY arvolla NNN")
     Muuten:
       output.set("result", "Päätöspäivä tai laskutettusumma puuttuu")
   Muuten:
     output.set("result", "Rivi ID:llä XXX ei löytynyt")
```

---

## Pseudo-koodi (rakennemalli)

```javascript
// --- 1. INPUT JA TAULU ---
let recordId = input.config().recordId;
let table    = base.getTable("Asiantuntijat");

// --- 2. HAE RIVI ---
let query  = await table.selectRecordsAsync({
    fields: ["Päätöspäivä, toteutunut", "laskutettusumma"]
});
let record = query.getRecord(recordId);

// --- 3. NESTED IF (ei return!) ---
if (record) {
    let decisionDate = record.getCellValue("Päätöspäivä, toteutunut");
    let amount       = record.getCellValue("laskutettusumma");

    if (decisionDate && amount != null) {
        // Muodosta kentän nimi "KK-VV"
        let d         = new Date(decisionDate);
        let month     = d.getMonth() + 1;
        let yearShort = d.getFullYear().toString().slice(-2);
        let fieldName = month + "-" + yearShort;

        // --- 4. KIRJOITUS (kentän olemassaolo varmistettu try/catch) ---
        try {
            table.getField(fieldName);
            await table.updateRecordAsync(recordId, { [fieldName]: amount });
            output.set("result", "Päivitetty kenttä " + fieldName + " arvolla " + amount);
        } catch (e) {
            output.set("result", "Kenttää '" + fieldName + "' ei löytynyt.");
        }
    } else {
        output.set("result", "Päätöspäivä tai laskutettusumma puuttuu.");
    }
} else {
    output.set("result", "Rivi ID:llä " + recordId + " ei löytynyt.");
}
```

> ⚠️ **Älä lisää `safeNumber`/`safeString`-funktioita tähän skriptiin sen yli muiden** — tämä on jo niin pieni että suora käsittely riittää. Mutta jos lisäät, käytä [02_scripting_kaytannot.md](../02_scripting_kaytannot.md):n malleja.

---

## Mitä tämä **ei** tee

- **Ei** poista vanhoja arvoja muista kuukausikentistä → jos `Päätöspäivä, toteutunut` muuttuu, vanha arvo jää roikkumaan vanhassa kuukaudessa.
  - Jos tämä on ongelma, käytä [liikevaihto.md](liikevaihto.md):n logiikkaa, joka nollaa kaikki kuukausikentät ennen kirjoitusta.
- **Ei** tarkista kategoriaa → toimii vain jos triggerin condition (esim. Status → Hyväksytty) takaa, että kategoria on Komissio.
- **Ei** käsittele negatiivisia korjauksia (esim. summa muuttuu 5 000 → 4 000 → vanha 5 000 jää, koska tehdään pelkkä päivitys).

---

## Yleisimmät ongelmat

### "Kenttää 'XX-YY' ei löytynyt"
**Syy:** Päätöspäivä on vanhalla tilikaudella, jonka kuukausikenttiä ei ole olemassa muodossa `KK-VV`.
**Ratkaisu:** Jos vanhempaa tilikautta tarvitsee päivittää, lisää kenttä baseen tai käytä vanhaa numeroformaattia (`9`, `10`, ...). Älä luo kenttää lennossa.

### Vanha arvo jää vanhaan kuukauteen
**Syy:** Skripti ei nollaa kuukausikenttiä.
**Ratkaisu:** Jos haluat nollata, lisää sama logiikka kuin [liikevaihto.md](liikevaihto.md) → "KRIITTINEN: nollaus".

### Skripti laukeaa vahingossa muista muutoksista
**Syy:** Trigger ei suodata kentän mukaan.
**Ratkaisu:** Aseta Trigger field = `Status` ja lisää tarvittaessa Condition: `Status IS Hyväksytty`.

---

## Liittyy

- Asiantuntijat-taulun kuukausikentät → [01_base_rakenne.md](../01_base_rakenne.md) → "Kuukausikentät"
- Tarkemmat liikevaihtorivit (varovaisuusjako) → [liikevaihto.md](liikevaihto.md)
