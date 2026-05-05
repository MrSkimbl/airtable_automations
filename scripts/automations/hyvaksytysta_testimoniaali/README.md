# Hyväksytystä testimoniaali

**Workflow ID:** `wflLTC3dGCNkQ4s34`
**Status:** deployed
**Tarkoitus:** Luo automaattisesti rivi `Testimonialit`-tauluun kun Komissio-rivi saa hyväksyvän rahoituspäätöksen.

## Trigger
- Tyyppi: When record matches conditions
- Taulu: Asiantuntijat
- Ehdot:
  - `Status` = `Hyväksytty`
  - `Kategoria` = `Komissio`
  - `Haettu tukisumma` ≥ €1

## Toiminnot
1. **Create record** Testimonialit-tauluun, kentät:
   - `Asiakas` ← Asiakas
   - `Y-Tunnus` ← Y-Tunnus
   - `Status` ← Status (single-select)
   - `Instrumentti` ← Instrumentti (single-select)
   - `Projektin koko` ← Projektin koko
   - `Haettu tukisumma` ← Haettu tukisumma
   - `Asiantuntija` ← Asiantuntija.Name

## Havainnot
- Hyvä esimerkki "matches conditions" -triggeristä — laukaisee kerran kun rivi täyttää ehdot. Sama malli kannattaa siirtää muihinkin Hyväksytty-pohjaisiin automaatioihin.
- `Asiantuntija` kohdistetaan nimellä — Testimonialit-taulun `Asiantuntija` on `multipleCollaborators`, joten tämä saattaa epäonnistua jos nimivertailu ei matchaa. Tarkista logista että rivit luodaan oikein eikä asiantuntija jää tyhjäksi.
