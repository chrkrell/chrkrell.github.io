import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os

from app.config import APP_HOST, APP_PORT
from app.models import IdeaCreate, ReservationRequest
from app.services.idea_service import (
    get_all_ideas,
    create_idea,
    like_idea,
    unlike_idea,
    reserve_idea,
    unreserve_idea,
    get_idea_by_id,
)
from app.services.prompt_builder import build_suggestion_prompt
from app.services.llm_service import get_suggestion

app = FastAPI(title="Team RIF idébank")

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
async def index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.get("/api/ideas")
async def api_get_ideas():
    return get_all_ideas()


@app.post("/api/ideas", status_code=201)
async def api_create_idea(body: IdeaCreate):
    try:
        return create_idea(body.text)
    except Exception:
        raise HTTPException(status_code=500, detail="Vi kunne ikke gemme dit ønske lige nu.")


@app.post("/api/ideas/{idea_id}/like")
async def api_like_idea(idea_id: str):
    idea = like_idea(idea_id)
    if not idea:
        raise HTTPException(status_code=404, detail="Ønsket blev ikke fundet.")
    return idea


@app.post("/api/ideas/{idea_id}/unlike")
async def api_unlike_idea(idea_id: str):
    idea = unlike_idea(idea_id)
    if not idea:
        raise HTTPException(status_code=404, detail="Ønsket blev ikke fundet.")
    return idea


@app.post("/api/ideas/{idea_id}/reserve")
async def api_reserve_idea(idea_id: str, body: ReservationRequest):
    idea = reserve_idea(idea_id, body.name)
    if not idea:
        raise HTTPException(status_code=404, detail="Ønsket blev ikke fundet.")
    return idea


@app.post("/api/ideas/{idea_id}/unreserve")
async def api_unreserve_idea(idea_id: str):
    idea = unreserve_idea(idea_id)
    if not idea:
        raise HTTPException(status_code=404, detail="Ønsket blev ikke fundet.")
    return idea


class SuggestionRequest(BaseModel):
    previous_titles: list[str] = []


@app.post("/api/ideas/{idea_id}/suggestions")
async def api_get_suggestions(idea_id: str, body: SuggestionRequest = SuggestionRequest()):
    idea = get_idea_by_id(idea_id)
    if not idea:
        raise HTTPException(status_code=404, detail="Ønsket blev ikke fundet.")

    prompt = build_suggestion_prompt(idea["text"], body.previous_titles)
    result = await get_suggestion(prompt)

    if "error" in result:
        raise HTTPException(status_code=502, detail=result["error"])

    return result


if __name__ == "__main__":
    uvicorn.run("main:app", host=APP_HOST, port=APP_PORT, reload=True)
