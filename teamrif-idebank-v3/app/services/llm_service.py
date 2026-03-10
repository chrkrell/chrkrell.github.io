import json
import logging
import httpx
from app.config import LLM_API_KEY, LLM_MODEL, LLM_BASE_URL

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 30
FALLBACK_ERROR = "Der opstod en fejl, da vi hentede forslag. Prøv igen om lidt."
REQUIRED_FIELDS = {"title", "description", "how_to_run", "why_it_fits", "follow_up_prompt"}


async def get_suggestion(prompt: str) -> dict:
    url = f"{LLM_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": LLM_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.9,
        "max_tokens": 1000,
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException:
        logger.error("LLM request timed out")
        return {"error": FALLBACK_ERROR}
    except httpx.HTTPStatusError as e:
        logger.error(f"LLM HTTP error: {e.response.status_code} – {e.response.text}")
        return {"error": FALLBACK_ERROR}
    except Exception as e:
        logger.error(f"LLM unexpected error: {e}")
        return {"error": FALLBACK_ERROR}

    raw_text = _extract_text(data)
    if not raw_text:
        logger.error("LLM returned empty content")
        return {"error": FALLBACK_ERROR}

    return _parse_json(raw_text)


def _extract_text(data: dict) -> str:
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        return ""


def _parse_json(text: str) -> dict:
    clean = text.strip()
    if clean.startswith("```"):
        lines = clean.splitlines()
        clean = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        parsed = json.loads(clean)
        if REQUIRED_FIELDS.issubset(parsed.keys()):
            return parsed
        logger.error(f"Unexpected JSON structure: {parsed}")
        return {"error": FALLBACK_ERROR}
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}\nRaw text: {text}")
        return {"error": FALLBACK_ERROR}
