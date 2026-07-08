require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';
const SEASON = 2023;
const PL_LEAGUE_ID = 39;

// Free plan: 10 requests/minute → 1 request every 7s to stay safely under the cap
const REQUEST_INTERVAL_MS = 7000;
let lastRequestAt = 0;

async function rateLimitedFetch(url, options) {
  const now = Date.now();
  const wait = REQUEST_INTERVAL_MS - (now - lastRequestAt);
  if (wait > 0) {
    process.stdout.write(`  (waiting ${(wait / 1000).toFixed(1)}s for rate limit…) `);
    await new Promise(resolve => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();
  return fetch(url, options);
}

// Top Premier League teams with their API-Football team IDs
const TEAMS = [
  { id: 50,  name: 'Manchester City' },
  { id: 33,  name: 'Manchester United' },
  { id: 40,  name: 'Liverpool' },
  { id: 42,  name: 'Arsenal' },
  { id: 49,  name: 'Chelsea' },
  { id: 47,  name: 'Tottenham' },
  { id: 66,  name: 'Aston Villa' },
  { id: 34,  name: 'Newcastle United' },
];

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'players.json');

async function fetchTeamPlayers(teamId, teamName) {
  let page = 1;
  const allResponses = [];

  const MAX_PAGE = 3; // free plan limit
  while (page <= MAX_PAGE) {
    const url = `${BASE_URL}/players?team=${teamId}&season=${SEASON}&page=${page}`;
    const res = await rateLimitedFetch(url, {
      headers: { 'x-apisports-key': API_KEY },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${teamName} page ${page}: ${res.statusText}`);
    }

    const json = await res.json();

    if (json.errors && Object.keys(json.errors).length > 0) {
      throw new Error(`API error for ${teamName}: ${JSON.stringify(json.errors)}`);
    }

    const players = json.response ?? [];
    allResponses.push(...players);

    const paging = json.paging ?? {};
    if (!paging.total || page >= paging.total || page >= MAX_PAGE) break;

    page++;
  }

  return allResponses;
}

function extractPlayer(entry) {
  const { player, statistics } = entry;
  if (!statistics || statistics.length === 0) return null;

  // Only keep players with Premier League stats in this dataset
  const plStats = statistics.find(s => s.league?.id === PL_LEAGUE_ID);
  if (!plStats) return null;

  const rating = plStats.games?.rating ? parseFloat(plStats.games.rating) : null;

  return {
    name: player.name,
    photo: player.photo,
    position: plStats.games?.position ?? null,
    age: player.age,
    citizenship: player.nationality,
    height: player.height ? parseInt(player.height.replace(/\D/g, ''), 10) || null : null,
    club: plStats.team?.name ?? null,
    rating,
  };
}

async function main() {
  if (!API_KEY) {
    console.error('ERROR: API_FOOTBALL_KEY is not set in your .env file.');
    process.exit(1);
  }

  // Ensure output directory exists
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const rawPlayers = [];

  for (const team of TEAMS) {
    console.log(`Fetching players for ${team.name} (team ${team.id}, season ${SEASON})…`);
    const entries = await fetchTeamPlayers(team.id, team.name);
    console.log(`  → ${entries.length} player entries received`);
    rawPlayers.push(...entries);
  }

  console.log(`\nTotal player entries fetched: ${rawPlayers.length}`);

  // Extract, filter, and deduplicate by name
  const seen = new Set();
  const players = [];

  for (const entry of rawPlayers) {
    const p = extractPlayer(entry);
    if (!p) continue;
    if (seen.has(p.name)) continue;
    seen.add(p.name);
    players.push(p);
  }

  console.log(`Players after filtering & deduplication: ${players.length}`);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(players, null, 2));
  console.log(`\n✓ Saved ${players.length} players to ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
