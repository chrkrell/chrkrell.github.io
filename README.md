# Team RIF idébank

Et lille internt værktøj til fredagsmøder. Kollegaer kan tilføje ønsker til, hvad de gerne vil høre eller lave på kommende teammøder, like andres ønsker og reservere dem – og få AI-genererede forslag til, hvordan et ønske kan blive et 15–30 minutters indslag.

---

## Kom i gang

### 1. Opret et virtuelt miljø

```bash
python -m venv .venv
```

### 2. Aktivér det

**Mac / Linux:**
```bash
source .venv/bin/activate
```

**Windows (PowerShell):**
```powershell
.venv\Scripts\Activate.ps1
```

**Windows (cmd):**
```cmd
.venv\Scripts\activate.bat
```

### 3. Installér afhængigheder

```bash
pip install -r requirements.txt
```

### 4. Opret din `.env`-fil

```bash
cp .env.example .env
```

Åbn `.env` og udfyld dine værdier (se nedenfor).

### 5. Kør appen

```bash
python main.py
```

### 6. Åbn i browseren

```
http://127.0.0.1:8000
```

---

## Miljøvariabler

| Variabel        | Beskrivelse                                                      | Eksempel                          |
|-----------------|------------------------------------------------------------------|-----------------------------------|
| `LLM_API_KEY`   | Din API-nøgle til LLM-udbyderen                                  | `sk-...`                          |
| `LLM_MODEL`     | Hvilken model der bruges (standard: `gpt-4o-mini`)               | `gpt-4o-mini`                     |
| `LLM_BASE_URL`  | Base URL til OpenAI-kompatibel API (standard: OpenAI)            | `https://api.openai.com/v1`       |
| `APP_HOST`      | Host at binde til (standard: `127.0.0.1`)                        | `127.0.0.1`                       |
| `APP_PORT`      | Port (standard: `8000`)                                          | `8000`                            |

Appen virker med OpenAI eller enhver OpenAI-kompatibel API (fx Azure OpenAI, Groq, Mistral osv.).

---

## Mappestruktur

```
/app
  main.py          – FastAPI-opsætning og routes
  config.py        – Miljøvariabler
  models.py        – Pydantic-modeller
  storage.py       – JSON-filpersistens
  services/
    idea_service.py   – CRUD, likes, reservationer
    prompt_builder.py – Opbygning af LLM-prompt
    llm_service.py    – API-kald og parsing
  data/
    ideas.json     – Oprettes automatisk
/static
  index.html
  styles.css
  app.js
```

---

## Data

Alle ønsker gemmes i `app/data/ideas.json`. Filen oprettes automatisk første gang appen kører.
