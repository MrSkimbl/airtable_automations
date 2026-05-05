# AI-prompti — Hylätty rahoituspäätös Slackiin copy

**Action type:** Generate text
**Description:** Slack-automaatio
**Filtteri:** Status = `Hylätty` AND Kategoria ∈ {`Komissio`, `Projekti`, `EU-Komissio`}
**Model:** Default (GPT-4.1)
**Randomness:** Low

## Prompt

```
Tiivistä Slack kanavalle lyhyt viesti, jossa pahoittelet asiakkaan saamaa hylkäävää rahoituspäätöstä. Huomioi projektin toteuttanut asiantuntija etunimellä ja kiitä hyvästä yrityksestä.

Asiakas: {{Asiakas}}

Haettu ja hylätty rahoitusinstrumentti: {{Instrumentti}}

Projektin vastaava asiantuntija: {{Asiantuntija.Name}}

Haettu projektikoko €: {{Projektin koko}}€
```

## Esimerkkitulos
> Valitettavasti Hellonin GenAI-rahoitushakemus (834 159 €) hylättiin. Kiitos Mikko hyvästä työstä hakemuksen eteen – arvostamme panostustasi!
