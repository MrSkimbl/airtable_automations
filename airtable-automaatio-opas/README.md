# Airtable-automaatio-opas

Itsenäinen dokumentaatiopaketti, joka sisältää kaiken tarpeellisen Airtable-automaatioiden kirjoittamiseen **"Asiakas & hakemuskanta"** -basea vasten.

> **Kohderyhmä:** AI-agentit (Cursor, Claude, ChatGPT) sekä kehittäjät, jotka kirjoittavat tai ylläpitävät tämän basen JavaScript-automaatioita ja skriptejä.

---

## ⛔ LUE TÄMÄ ENSIMMÄISENÄ – ÄLÄ KOSKAAN OHITA

**Ennen kuin kirjoitat YHTÄÄN riviä koodia, tee tämä järjestyksessä:**

1. Lue **[01_base_rakenne.md](01_base_rakenne.md)** → opit tarkat taulu- ja kenttänimet
2. Lue **[02_scripting_kaytannot.md](02_scripting_kaytannot.md)** → opit pakolliset kuviot ja sudenkuopat
3. Lue **[03_ai_agentti_checklista.md](03_ai_agentti_checklista.md)** → varmista että et tee tyypillisiä virheitä
4. Avaa **[04_automaatiot/](04_automaatiot/README.md)** → katso miten samanlaisia automaatioita on jo tehty

**Jos hyppäät kohdan 1 yli, koodisi kaatuu varmasti virheeseen `No table matching ... found` tai `Field "..." does not exist`.**

---

## Paketin sisältö

```
airtable-automaatio-opas/
│
├── README.md                          ← Tämä tiedosto (yleisindeksi)
│
├── 01_base_rakenne.md                 ← Basen koko rakenne (11 taulua, ~130 kenttää päätaulussa)
│                                        Tarkat nimet, tyypit, arvot, riippuvuudet (API-pohjainen, päivitetty 2026-05-04)
│
├── 02_scripting_kaytannot.md          ← Pakolliset JavaScript-kuviot
│                                        safeString, batch, return-kielto, jne.
│
├── 03_ai_agentti_checklista.md        ← AI-agenttikohtainen tarkistuslista
│                                        Yleisimmät virheet ja niiden estäminen
│
└── 04_automaatiot/                    ← Olemassa olevien automaatioiden selitteet
    ├── README.md                       ← Yleiskuva ja päätösmatriisi
    ├── liikevaihto.md                  ← Liikevaihdon kirjaukset (4 skriptiä)
    ├── tilikausi.md                    ← Tilikauden laskenta + bonukset
    ├── ennusteet.md                    ← Päätöspäivän ennustelogiikka
    ├── data_bug_bot.md                 ← Slack-raportointi datavirheistä
    └── komissiot_kuukausisarakkeisiin.md
                                         Hyväksytty komissio → kuukausisarakkeeseen
```

Kaikki linkit tässä paketissa ovat **suhteellisia ja sisäisiä** — paketin voi siirtää mihin tahansa toiseen projektiin ilman, että dokumentaatio rikkoutuu.

---

## Pikaopas: työnkulku uutta automaatiota tehdessä

```
┌─────────────────────────────────────────────────────┐
│ 1. YMMÄRRÄ TEHTÄVÄ                                  │
│    Mitä taulua/kenttiä tämä koskee?                 │
│    Milloin sen pitää laueta?                        │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│ 2. ETSI TARKAT NIMET                                │
│    → 01_base_rakenne.md                             │
│    Kopioi taulun ja kenttien nimet sanasta sanaan   │
│    (huomioi pilkut, isot kirjaimet, välimerkit)     │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│ 3. KATSO ESIMERKKI                                  │
│    → 04_automaatiot/                                │
│    Onko vastaavaa logiikkaa jo tehty? Lainaa        │
│    kuvio sieltä, älä keksi pyörää uudelleen.        │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│ 4. KÄYTÄ OIKEITA KUVIOITA                           │
│    → 02_scripting_kaytannot.md                      │
│    safeString, safeNumber, batch (max 50),          │
│    NESTED IF (ei return), kuukausikenttien nollaus  │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│ 5. TARKISTA CHECKLISTASTA                           │
│    → 03_ai_agentti_checklista.md                    │
│    Käy läpi joka kohta ennen koodin lähetystä.      │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│ 6. TESTAA ENSIN SCRIPTING-LAAJENNUKSESSA            │
│    Vasta sen jälkeen siirrä Automation-actioniksi.  │
└─────────────────────────────────────────────────────┘
```

---

## Basen ydinkonseptit (lyhyesti)

Tarkemmat selitykset, kentät ja kaavat löytyvät [01_base_rakenne.md](01_base_rakenne.md):sta.

| Konsepti | Lyhyt selitys |
|----------|---------------|
| **Asiantuntijat** | Päätaulu — kaikki toimeksiannot (Komissiot, Projektit, MRR, Liikevaihto, Toimenpiteet) |
| **Tilikauden laskenta** | Yksi rivi per asiantuntija per kuukausi → aggregaatit, tavoitteet, bonukset |
| **Bonusrajat ja tavoitteet** | Asiantuntijakohtaiset vuositason luvut, jaetaan 12:lla kuukausitasolle |
| **Toteuma** | `Komissiot (Hyväksytty) + Projektit (¬NB) + MRR (¬NB)` |
| **Ennuste** | `MRR (NB) + Hakemukset (Lähetetty / Tulossa / Työn alla / Täydennys)` |
| **Bonus** | `(Toteuma − Bonusraja/12) × 0.15`, vain päättyneille kuukausille |
| **NB / EB** | NB = Not Booked (ennuste), EB tai tyhjä = Booked (toteuma) |
| **Tilikausi** | 1.9.YYYY → 31.8.YYYY+1 (esim. 9/2025 – 8/2026) |
| **Kuukausikentät** | Muoto `KK-VV`, esim. `9-25`, `10-25`, `1-26` |

---

## Yleisimmät virheet (5 kpl) – älä toista näitä

1. **Arvataan taulun nimi** → `base.getTable("Komissio")` ei löydy. Oikea on `Asiantuntijat`. Katso [01_base_rakenne.md](01_base_rakenne.md).
2. **Arvataan kentän nimi** → `"Päätöspäivä ennuste"` ei löydy. Oikea on `"Päätöspäivä, ennuste"` (pilkku!).
3. **Käytetään `return` automaatiossa** → epäonnistuu hiljaisesti. Käytä `if (record) { ... }`.
4. **Single select käsitellään stringinä** → `if (rec.getCellValue("Status") === "Hyväksytty")` palauttaa aina `false`, koska arvo on `{name: "Hyväksytty"}`. Käytä `safeString()`.
5. **Ei nollata kuukausikenttiä ennen kirjoitusta** → vanhat arvot jäävät kummittelemaan kun päivämäärä muuttuu.

Yksityiskohdat ja ratkaisut: [03_ai_agentti_checklista.md](03_ai_agentti_checklista.md).

---

## Olemassa olevat automaatiot (yhteenveto)

| Automaatio | Tyyppi | Trigger | Tarkemmin |
|-----------|--------|---------|-----------|
| **liikevaihdon_kirjaukset_automaatio** | Real-time | Asiantuntijat-taulun rivi muuttuu | [04_automaatiot/liikevaihto.md](04_automaatiot/liikevaihto.md) |
| **komissiot_kuukausisarakkeisiin** | Real-time | Status → Hyväksytty | [04_automaatiot/komissiot_kuukausisarakkeisiin.md](04_automaatiot/komissiot_kuukausisarakkeisiin.md) |
| **tilikausi_update** | Real-time | Bonusrajat ja tavoitteet -taulun rivi muuttuu | [04_automaatiot/tilikausi.md](04_automaatiot/tilikausi.md) |
| **bonusraja_tavoite_update** | Real-time | Bonusrajat ja tavoitteet -taulun rivi muuttuu | [04_automaatiot/tilikausi.md](04_automaatiot/tilikausi.md) |
| **paatospaiva_ennuste_update** | Aikataulutettu (päivittäin) | Cron tai manuaalinen | [04_automaatiot/ennusteet.md](04_automaatiot/ennusteet.md) |
| **data_bug_bot** | Aikataulutettu (päivittäin) | Cron | [04_automaatiot/data_bug_bot.md](04_automaatiot/data_bug_bot.md) |
| **tilikausi_manuaalinen** | Manuaalinen | Scripting-laajennus | [04_automaatiot/tilikausi.md](04_automaatiot/tilikausi.md) |
| **luo_liikevaihtorivit_uudelleen** | Manuaalinen | Scripting-laajennus, kerran | [04_automaatiot/liikevaihto.md](04_automaatiot/liikevaihto.md) |

---

## Pakettiin EI sisälly

- ❌ Itse JavaScript-skriptit (`.js`-tiedostot) — vain niiden kuvaukset ja logiikka
- ❌ Python-agentit ja bonuslaskenta — eivät ole Airtable-automaatioita vaan erilliset Python-prosessit
- ❌ `.env`-tiedostot ja API-tunnukset — pidetään aina projektikohtaisesti

Jos tarvitset itse skripteistä koodia, hae ne lähdeprojektista tai pyydä siirtämään ne myös pakettiin.

---

## Versio ja ylläpito

- **Paketin versio:** 1.1 (API-pohjainen tarkistus)
- **Lähdebase:** "Asiakas & hakemuskanta - AT" (`app5bwxdTTUmbSyUK`)
- **Tauluja yhteensä:** 11 (oli 7 v.1.0:ssa)
- **Ensisijainen kieli:** JavaScript (Airtable Scripting)
- **Viimeisin lähdetietojen kokoamispäivä:** 2026-05-04
- **Schema-snapshot:** `../schema/base_schema_full.json`

Kun base muuttuu (uusia kenttiä, tauluja, statuksia), päivitä [01_base_rakenne.md](01_base_rakenne.md) ennen kaikkea muuta — kaikki muut dokumentit nojaavat siihen.
