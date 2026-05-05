# AI-prompti — Hyväksytty rahoituspäätös Slackiin

**Action type:** Generate text
**Description:** Slack-automaatio
**Filtteri:** Status ∈ {`Ehdollinen päätös`, `Hyväksytty`} AND Kategoria ∈ {`Komissio`, `Projekti`, `EU-Komissio`}
**Model:** GPT-5 mini
**Randomness:** Low

## Prompt

```
Tiivistä Slack kanavalle lyhyt viesti, jossa juhlistat asiakkaan saamaa julkisen rahoituksen rahoituspäätöstä. Jos haettu ja myönnetty rahoitusosuus eroavat merkittävästi, kerro molemmat. Hyödynnä mm hymiöitä ja huomioi projektin toteuttanut asiantuntija etunimellä.

Asiakas: {{Asiakas}}

Haettu rahoitusinstrumentti: {{Instrumentti}}

Projektin toteuttanut asiantuntija: {{Asiantuntija.Name}}

Haettu projektikoko €: {{Projektin koko}}€

Haettu rahoitusosuus €: {{Haettu tukisumma}}€

Myönnetty rahoitus €: {{Myönnetty tukisumma}} €
```

## Esimerkkitulos
> Mahtavia uutisia! 🎉 KennoTechi…
