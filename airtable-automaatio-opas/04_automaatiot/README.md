# 04 — Automaatiot (yleiskuvaus)

Tässä kansiossa on kuvaukset jokaisesta tämänhetkisestä Airtable-automaatiosta tai -skriptistä **"Asiakas & hakemuskanta"** -basessa.

> **AI-agentille:** Kun saat tehtäväksi modifioida tai kirjoittaa uuden automaation, tutki ensin tämän kansion vastaavin tiedosto. Hyvin todennäköisesti suuri osa logiikasta on jo dokumentoitu.

Kantavat dokumentit muualla paketissa:
- [00 README](../README.md) — paketin yleisindeksi
- [01_base_rakenne.md](../01_base_rakenne.md) — taulujen ja kenttien tarkat nimet
- [02_scripting_kaytannot.md](../02_scripting_kaytannot.md) — pakolliset JS-kuviot
- [03_ai_agentti_checklista.md](../03_ai_agentti_checklista.md) — tarkistuslista

---

## Automaatioiden indeksi

| Automaatio | Tyyppi | Trigger | Kohdetaulu | Dokumentti |
|-----------|--------|---------|------------|------------|
| **liikevaihdon_kirjaukset_automaatio** | Real-time | Asiantuntijat-rivi muuttuu | Liikevaihto + Asiantuntijat (linkitys) | [liikevaihto.md](liikevaihto.md) |
| **komissiot_kuukausisarakkeisiin** | Real-time | Asiantuntijat-rivi muuttuu (yleensä Status → Hyväksytty) | Asiantuntijat (kuukausikenttä) | [komissiot_kuukausisarakkeisiin.md](komissiot_kuukausisarakkeisiin.md) |
| **tilikausi_update** | Real-time | Bonusrajat ja tavoitteet -rivi muuttuu | Tilikauden laskenta | [tilikausi.md](tilikausi.md) |
| **bonusraja_tavoite_update** | Real-time | Bonusrajat ja tavoitteet -rivi muuttuu | Tilikauden laskenta | [tilikausi.md](tilikausi.md) |
| **paatospaiva_ennuste_update** | Aikataulutettu (päivittäin) | Cron / manuaalinen | Asiantuntijat (ennustepvm) | [ennusteet.md](ennusteet.md) |
| **data_bug_bot** | Aikataulutettu (päivittäin) | Cron | — (lähettää Slackin kautta) | [data_bug_bot.md](data_bug_bot.md) |
| **tilikausi_manuaalinen** | Manuaalinen | Scripting-laajennus | Tilikauden laskenta (täysi uudelleenlaskenta) | [tilikausi.md](tilikausi.md) |
| **luo_liikevaihtorivit_uudelleen** | Manuaalinen / kerran | Scripting-laajennus | Liikevaihto (täysi rebuild) | [liikevaihto.md](liikevaihto.md) |

---

## Päätösmatriisi: minkä dokumentin avaan?

**"Mitä haluat tehdä?"**

| Tehtävä | Avaa |
|---------|------|
| Komission summa pitää kirjata kuukausisarakkeeseen | [komissiot_kuukausisarakkeisiin.md](komissiot_kuukausisarakkeisiin.md) |
| Liikevaihtorivi pitää luoda/päivittää | [liikevaihto.md](liikevaihto.md) |
| Liikevaihtorivit pitää rakentaa kokonaan uudelleen | [liikevaihto.md](liikevaihto.md) → "luo_liikevaihtorivit_uudelleen" |
| Bonusrajat / tavoitteet päivittyvät → kuukausirivit pitää synkata | [tilikausi.md](tilikausi.md) → "tilikausi_update / bonusraja_tavoite_update" |
| Tilikauden laskenta on rikki tai vanhentunut | [tilikausi.md](tilikausi.md) → "tilikausi_manuaalinen" |
| Päätöspäivä-ennusteet pitää päivittää | [ennusteet.md](ennusteet.md) |
| Slack-ilmoitus virheellisistä riveistä | [data_bug_bot.md](data_bug_bot.md) |

---

## Real-time vs. aikataulutettu vs. manuaalinen

### Real-time (triggerillä)
Skripti laukeaa heti kun joku rivi muuttuu. Pakollinen ehto: **`Last modified by IS NOT Automation`** (muuten ääretön silmukka).

### Aikataulutettu
Skripti ajetaan tietyin väliajoin (esim. päivittäin klo 8). Käytetään raportointiin ja säännöllisiin päivityksiin.

### Manuaalinen (Scripting Extension)
Ajetaan kerran painikkeella. Tyypillisesti raskas uudelleenlaskenta tai kertaluonteinen rebuild.

> ⚠️ Jos sama skripti pitää toimia molemmissa konteksteissa (Automation + Scripting Extension), katso erot kohdassa "Kontekstit" → [02_scripting_kaytannot.md](../02_scripting_kaytannot.md).

---

## Yhteinen setup-malli (real-time-automaatiolle)

```
1. Avaa Airtable Automations
2. Luo uusi automaatio
3. Trigger:
   - Type:      "When record is updated"
   - Table:     <kohdetaulu>
   - Fields:    <muokattavat kentät>
4. Condition (PAKOLLINEN):
   - Field:     "Last modified by"
   - Operator:  "is not"
   - Value:     "Automation"
5. Action: "Run script"
6. Copy script
7. Input variables:
   - recordId → triggerin "Record ID"
8. Test (Run test) -> tarkista ettei punaista
9. Enable
```

---

**Avaa nyt yksittäisen automaation tiedosto:**

- [liikevaihto.md](liikevaihto.md)
- [tilikausi.md](tilikausi.md)
- [ennusteet.md](ennusteet.md)
- [data_bug_bot.md](data_bug_bot.md)
- [komissiot_kuukausisarakkeisiin.md](komissiot_kuukausisarakkeisiin.md)
