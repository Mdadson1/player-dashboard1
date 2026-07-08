"""
Player Dashboard — FastAPI backend
Serves player data from src/data/players.json with filtering, sorting and
position-aware team generation.

Run with:
    uvicorn api.main:app --reload --port 8000
"""

from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Data ──────────────────────────────────────────────────────────────────────

DATA_FILE = Path(__file__).parent.parent / "src" / "data" / "players.json"

def _load() -> list[dict]:
    with DATA_FILE.open(encoding="utf-8") as f:
        return json.load(f)

ALL_PLAYERS: list[dict] = _load()

# ── Models ────────────────────────────────────────────────────────────────────

class Player(BaseModel):
    name: str
    photo: str
    position: Optional[str] = None
    age: Optional[int] = None
    citizenship: Optional[str] = None
    height: Optional[int] = None
    club: Optional[str] = None
    rating: Optional[float] = None

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="Player Dashboard API", version="1.0.0")

# Allow the React dev server (port 3000) to call us during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ── Sort helpers ──────────────────────────────────────────────────────────────

SortKey = Literal[
    "name-asc", "name-desc",
    "rating-desc", "rating-asc",
    "age-asc", "age-desc",
]

def _sort(players: list[dict], key: SortKey) -> list[dict]:
    if key == "name-asc":
        return sorted(players, key=lambda p: p["name"])
    if key == "name-desc":
        return sorted(players, key=lambda p: p["name"], reverse=True)
    if key == "rating-desc":
        return sorted(players, key=lambda p: p.get("rating") or -1, reverse=True)
    if key == "rating-asc":
        return sorted(players, key=lambda p: p.get("rating") or -1)
    if key == "age-asc":
        return sorted(players, key=lambda p: p.get("age") or 0)
    if key == "age-desc":
        return sorted(players, key=lambda p: p.get("age") or 0, reverse=True)
    return players

# ── Formation roles ───────────────────────────────────────────────────────────

FORMATIONS: dict[str, list[str]] = {
    "4-4-2": ["Attacker","Attacker","Midfielder","Midfielder","Midfielder","Midfielder","Defender","Defender","Defender","Defender","Goalkeeper"],
    "4-3-3": ["Attacker","Attacker","Attacker","Midfielder","Midfielder","Midfielder","Defender","Defender","Defender","Defender","Goalkeeper"],
    "3-5-2": ["Attacker","Attacker","Midfielder","Midfielder","Midfielder","Midfielder","Midfielder","Defender","Defender","Defender","Goalkeeper"],
    "5-3-2": ["Attacker","Attacker","Midfielder","Midfielder","Midfielder","Defender","Defender","Defender","Defender","Defender","Goalkeeper"],
}

ROLE_MAP: dict[str, list[str]] = {
    "Goalkeeper": ["Goalkeeper"],
    "Defender":   ["Defender"],
    "Midfielder": ["Midfielder"],
    "Attacker":   ["Attacker", "Forward"],
}

def _generate_team(players: list[dict], roles: list[str]) -> list[dict]:
    """Pick players by position to fill the given slot roles."""
    pools: dict[str, list[dict]] = {}
    for role, accepted in ROLE_MAP.items():
        pool = [p for p in players if p.get("position") in accepted]
        random.shuffle(pool)
        pools[role] = pool

    used: set[str] = set()
    team: list[dict] = []
    remaining = [p for p in players]
    random.shuffle(remaining)

    for role in roles:
        pool = pools.get(role, [])
        match = next((p for p in pool if p["name"] not in used), None)
        if match:
            used.add(match["name"])
            team.append(match)
        else:
            fallback = next((p for p in remaining if p["name"] not in used), None)
            if fallback:
                used.add(fallback["name"])
                team.append(fallback)

    return team

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/players", response_model=list[Player], summary="List players")
def list_players(
    search:   str      = Query("",          description="Filter by name or club (case-insensitive)"),
    position: str      = Query("",          description="Filter by position"),
    sort:     SortKey  = Query("name-asc",  description="Sort order"),
):
    """
    Return the full player list, optionally filtered by search term and/or
    position, and sorted by the given key.
    """
    result = ALL_PLAYERS

    if position:
        result = [p for p in result if p.get("position") == position]

    if search:
        q = search.lower()
        result = [
            p for p in result
            if q in p["name"].lower() or q in (p.get("club") or "").lower()
        ]

    return _sort(result, sort)


@app.get("/api/players/{name}", response_model=Player, summary="Get one player")
def get_player(name: str):
    """Return a single player by exact name."""
    player = next((p for p in ALL_PLAYERS if p["name"] == name), None)
    if not player:
        raise HTTPException(status_code=404, detail=f"Player '{name}' not found")
    return player


@app.get("/api/team", response_model=list[Player], summary="Generate a team")
def generate_team(
    formation: Literal["4-4-2", "4-3-3", "3-5-2", "5-3-2"] = Query(
        "4-4-2", description="Tactical formation"
    ),
):
    """
    Return 11 randomly selected players matching the position requirements
    of the chosen formation.
    """
    roles = FORMATIONS.get(formation)
    if not roles:
        raise HTTPException(status_code=400, detail=f"Unknown formation '{formation}'")
    return _generate_team(ALL_PLAYERS, roles)


@app.get("/api/positions", response_model=list[str], summary="List distinct positions")
def list_positions():
    """Return the sorted list of distinct player positions in the dataset."""
    positions = sorted({p["position"] for p in ALL_PLAYERS if p.get("position")})
    return positions


@app.get("/health", summary="Health check")
def health():
    return {"status": "UP", "players": len(ALL_PLAYERS)}
