# Premier League Player Dashboard

A full-stack football analytics dashboard built with **React + IBM Carbon Design System** on the frontend and **FastAPI (Python)** on the backend.

---

## Features

### Player Browser
- Search players by name or club
- Filter by position (Goalkeeper, Defender, Midfielder, Attacker)
- Sort by name, rating, or age
- Detailed player card with photo, stats, and auto-generated grounded summary
- **Compare mode** — view two players side-by-side

### Team Formation Visualizer
- Four tactical formations: **4-4-2**, **4-3-3**, **3-5-2**, **5-3-2**
- Position-aware random team generator (picks real Goalkeepers, Defenders, etc.)
- Interactive SVG football pitch with official markings (penalty areas, D-rings, corner arcs, goal nets)
- **Hover tooltips** on each player token
- **Click any player** to open a detail side panel

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, IBM Carbon Design System, SCSS |
| Backend API | Python 3, FastAPI, Uvicorn |
| Data | API-Football (2023 Premier League season, 414 players) |
| Process manager | pm2 |

---

## Project Structure

```
├── api/
│   └── main.py           # FastAPI server — /api/players, /api/team, /api/positions
├── scripts/
│   └── fetchPlayers.js   # One-time data fetcher (Node.js, API-Football)
├── server/
│   └── server.js         # Express server — serves React build, proxies /api/* to FastAPI
├── src/
│   ├── components/
│   │   ├── CompareView/      # Side-by-side player comparison
│   │   ├── FormationBoard/   # SVG pitch + player tokens + tooltips
│   │   ├── PlayerCard/       # Individual player stat card
│   │   ├── PlayerSelect/     # Player dropdown
│   │   ├── PlayerSummary/    # Auto-generated grounded text summary
│   │   └── PositionFilter/   # Position dropdown filter
│   ├── data/
│   │   └── players.json      # 414 Premier League players (2023 season)
│   └── utils/
│       └── teamGenerator.js  # Position-aware team generation logic
└── requirements.txt          # Python dependencies
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- An [API-Football](https://www.api-football.com/) free account (only needed to re-fetch player data)

### Install dependencies

```bash
# JavaScript
yarn install

# Python
pip install -r requirements.txt
```

### Run in development

```bash
# Terminal 1 — FastAPI backend (port 8000)
uvicorn api.main:app --reload --port 8000

# Terminal 2 — React dev server (port 3000, proxies /api/* to 8000)
yarn start:dev
```

Open [http://localhost:3000].
(If an error occurs, refresh page once)
### Run in production

```bash
yarn build
uvicorn api.main:app --port 8000 &
node server/server.js
```

Or with pm2:
```bash
pm2 start "uvicorn api.main:app --port 8000" --name api
pm2 start "node server/server.js" --name frontend
pm2 save
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/players` | All players; supports `?search=`, `?position=`, `?sort=` |
| GET | `/api/players/{name}` | Single player by name |
| GET | `/api/team?formation=4-4-2` | 11 position-matched players for a formation |
| GET | `/api/positions` | Distinct positions in the dataset |
| GET | `/health` | Health check |

---

## Data

Player data was fetched from the [API-Football](https://www.api-football.com/) REST API for the **2023 Premier League season** (league ID 39) across 8 top clubs. The dataset includes name, photo, position, age, nationality, club, height, and performance rating.

---

## License

MIT
