from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class IdeaCreate(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("Skriv lige et lidt længere ønske.")
        if len(v) > 200:
            raise ValueError("Ønsket må højst være 200 tegn.")
        return v


class ReservationRequest(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Det navn ser lidt for kort ud.")
        if len(v) > 50:
            raise ValueError("Navn må højst være 50 tegn.")
        return v


class Idea(BaseModel):
    id: str
    text: str
    created_at: str
    likes: int = 0
    reserved_by: Optional[str] = None
    reserved_at: Optional[str] = None


class Suggestion(BaseModel):
    title: str
    description: str
    how_to_run: str
    why_it_fits: str
    follow_up_prompt: str


class SuggestionsResponse(BaseModel):
    ideas: list[Suggestion]
