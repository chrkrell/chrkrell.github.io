def build_suggestion_prompt(idea_text: str, previous_titles: list[str] | None = None) -> str:
    exclusion = ""
    if previous_titles:
        titles = ", ".join(f'"{t}"' for t in previous_titles)
        exclusion = f"\n\nDu har allerede foreslået følgende – find på noget andet:\n{titles}\n"

    return f"""Du er en kreativ og praktisk mødefacilitator. Din opgave er at give ét konkret forslag til, hvordan følgende ønske kan omsættes til et kort, hyggeligt indslag på et fredagsteammøde.

Ønsket lyder:
"{idea_text}"

Kontekst:
- Ca. 10 deltagere
- Offentlig IT-relateret arbejdsplads
- Fredagsmøde med fokus på fællesskab og viden
- Indslaget skal vare 15–30 minutter
- Ingen forberedelse kræves af deltagerne
- Inkluderende, lavt pres, let at facilitere
- Ikke socialt eksponerende eller pinligt
- Kræver ikke specialviden fra deltagerne
{exclusion}
Returnér præcis ét forslag som JSON i dette format – og kun JSON, ingen tekst udenfor:

{{
  "title": "...",
  "description": "...",
  "how_to_run": "...",
  "why_it_fits": "...",
  "follow_up_prompt": "..."
}}

Regler for hvert felt:
- title: kort, fængende overskrift (maks 8 ord)
- description: 1–2 sætninger, skitserende og appetitlig – giv fornemmelsen, ikke detaljen
- how_to_run: 2–3 sætninger om den overordnede struktur. Ikke en komplet guide – bare nok til at facilitatoren forstår konceptet
- why_it_fits: 1 sætning om hvorfor det passer til konteksten
- follow_up_prompt: Dette er det vigtigste felt. Skriv en lang, detaljeret og handlingsorienteret prompt på dansk, som facilitatoren kan kopiere direkte ind i ChatGPT. Prompten skal indeholde: fuldt kontekst om teamet og mødet, en præcis beskrivelse af hvad der ønskes, konkrete spørgsmål ChatGPT skal besvare, og en anmodning om praktisk materiale (fx spørgsmål, struktur, eksempler, slides-forslag). Prompten skal være så god at facilitatoren kan gå direkte i gang uden yderligere forberedelse.

Svar på dansk. Returnér kun JSON."""
