import uuid
from datetime import datetime, timezone
from app import storage


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _sort_ideas(ideas: list[dict]) -> list[dict]:
    return sorted(ideas, key=lambda x: (-x["likes"], x["created_at"]), reverse=False)


def get_all_ideas() -> list[dict]:
    ideas = storage.load_all()
    return sorted(ideas, key=lambda x: (-x["likes"], x["created_at"]))


def create_idea(text: str) -> dict:
    ideas = storage.load_all()
    idea = {
        "id": str(uuid.uuid4()),
        "text": text,
        "created_at": _now_iso(),
        "likes": 0,
        "reserved_by": None,
        "reserved_at": None,
    }
    ideas.append(idea)
    storage.save_all(ideas)
    return idea


def like_idea(idea_id: str) -> dict | None:
    ideas = storage.load_all()
    for idea in ideas:
        if idea["id"] == idea_id:
            idea["likes"] += 1
            storage.save_all(ideas)
            return idea
    return None


def unlike_idea(idea_id: str) -> dict | None:
    ideas = storage.load_all()
    for idea in ideas:
        if idea["id"] == idea_id:
            idea["likes"] = max(0, idea["likes"] - 1)
            storage.save_all(ideas)
            return idea
    return None


def reserve_idea(idea_id: str, name: str) -> dict | None:
    ideas = storage.load_all()
    for idea in ideas:
        if idea["id"] == idea_id:
            if idea["reserved_by"]:
                return idea  # already reserved, return as-is
            idea["reserved_by"] = name
            idea["reserved_at"] = _now_iso()
            storage.save_all(ideas)
            return idea
    return None


def unreserve_idea(idea_id: str) -> dict | None:
    ideas = storage.load_all()
    for idea in ideas:
        if idea["id"] == idea_id:
            idea["reserved_by"] = None
            idea["reserved_at"] = None
            storage.save_all(ideas)
            return idea
    return None


def get_idea_by_id(idea_id: str) -> dict | None:
    ideas = storage.load_all()
    for idea in ideas:
        if idea["id"] == idea_id:
            return idea
    return None
