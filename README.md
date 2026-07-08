# Premier League Player Dashboard

A full-stack football analytics dashboard built with **React 18** and the **IBM Carbon Design System** on the frontend, powered by a **FastAPI (Python)** backend. Browse 414 Premier League players from the 2023 season, compare stats, and visualise tactical formations on an interactive SVG pitch.

🔗 **[Live Demo](https://player-dashboard1.onrender.com)** &nbsp;|&nbsp; 🔌 **[API Docs](https://player-dashboard1-api.onrender.com/docs)**

---

## Features

### Player Browser
- **Live search** — filter by player name or club as you type
- **Position filter** — Goalkeeper, Defender, Midfielder, Attacker
- **Sort** — by name, rating (high → low), or age
- **Player card** — photo, position, age, nationality, club, form rating
- **Auto-generated summary** — grounded text description from dataset only
- **Compare mode** — view two players side-by-side with all stats

### Team Formation Visualiser
- **4 formations** — 4-4-2, 4-3-3, 3-5-2, 5-3-2
- **Position-aware generator** — picks real Goalkeepers, Defenders, Midfielders and Attackers to fill each slot
- **SVG football pitch** — official markings (penalty areas, D-rings, corner arcs, halfway line, goal nets)
- **Hover tooltips** — name, club, age and rating on mouse-over
- **Clickable tokens** — click any player to open a detail panel beside the pitch

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, IBM Carbon Design System, SCSS |
| Backend API | Python 3, FastAPI, Uvicorn |
| Hosting | Render (frontend + API) |
| Data | API-Football — 2023 Premier League season, 414 players |
| Process manager | pm2 (local) |

---

## Project Structure

```
├── api/
│   └── main.py              # FastAPI — /api/players, /api/team, /api/positions
├── scripts/
│   └── fetchPlayers.js      # One-time data fetcher (Node.js + API-Football)
├── server/
│   └── server.js            # Express — serves React build, proxies /api/* to FastAPI
├── src/
│   ├── components/
│   │   ├── CompareView/     # Side-by-side player comparison
│   │   ├── FormationBoard/  # SVG pitch, player tokens, tooltips, click panel
│   │   ├── PlayerCard/      # Player stat card
│   │   ├── PlayerSelect/    # Player dropdown
│   │   ├── PlayerSummary/   # Grounded text summary
│   │   └── PositionFilter/  # Position dropdown filter
│   ├── data/
│   │   └── players.json     # 414 Premier League players (2023 season)
│   └── utils/
│       └── teamGenerator.js # Position-aware team generation
├── requirements.txt         # Python dependencies
└── .env.production          # Production API URL (Render)
```

---

## API Endpoints

Base URL: `https://player-dashboard1-api.onrender.com`

| Method | Path | Query params | Description |
|---|---|---|---|
| GET | `/api/players` | `search`, `position`, `sort` | Full player list with optional filtering and sorting |
| GET | `/api/players/{name}` | — | Single player by exact name |
| GET | `/api/team` | `formation` | 11 position-matched players for a given formation |
| GET | `/api/positions` | — | Distinct positions in the dataset |
| GET | `/health` | — | Health check |

Interactive docs: **[/docs](https://player-dashboard1-api.onrender.com/docs)**

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.10+

### Install

```bash
# JavaScript
yarn install

# Python
pip install -r requirements.txt
```

### Run

```bash
# Terminal 1 — FastAPI backend (port 8000)
uvicorn api.main:app --reload --port 8000

# Terminal 2 — React dev server (port 3000, auto-proxies /api/* to 8000)
yarn start:dev
```

Open [http://localhost:3000](http://localhost:3000).

### Keep running with pm2

```bash
pm2 start "uvicorn api.main:app --port 8000" --name api
pm2 start "node server/server.js" --name frontend
pm2 save
```

---

## Data

Player data was fetched from the [API-Football](https://www.api-football.com/) REST API for the **2023 Premier League season** (league ID 39) across 8 clubs: Manchester City, Manchester United, Liverpool, Arsenal, Chelsea, Tottenham, Aston Villa, and Newcastle United. Each record includes name, photo URL, position, age, nationality, club, height, and performance rating.

---

## License

MIT
