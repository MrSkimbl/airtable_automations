# AI-prompti — Lähetetty hakemus Slackiin

**Action type:** Generate text
**Description:** Slack-automaatio
**Filtteri:** Status = `Lähetetty` AND Kategoria ∈ {`Komissio`, `Projekti`} AND `Valmistuminen/Lähetys` IS WITHIN previous 7 days
**Model:** Default (GPT-4.1)
**Randomness:** Low

## Prompt

```
Tiivistä Slack kanavalle lyhyt viesti, jossa ilmoitat lähetetystä rahoitushakemuksesta ja toivot positiivista päätöstä.

Hyödynnä mm hymiöitä ja huomioi projektin toteuttanut asiantuntija etunimellä.

Asiakas: {{Asiakas}}

Haettu rahoitusinstrumentti: {{Instrumentti}}

Projektin toteuttanut asiantuntija: {{Asiantuntija.Name}}

Haettu projektikoko €: {{Projektin koko}}€

Haettu rahoitusosuus €: {{Haettu tukisumma}}€
```

## Esimerkkitulos
> Rahoitushakemus GenAI-instrumenttiin Bo Familylle on nyt lähetetty! 🚀 Kiitos Mikko Höllille hienosta työstä projektin parissa. Toivotaan myönteistä päätöstä – peukut pystyyn! 🤞 Haettu rahoitus: 180 000 € / projektin koko: 360 000 €.
