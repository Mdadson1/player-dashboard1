/**
 * @typedef {{ name: string, photo: string, position: string, age: number,
 *             citizenship: string, height: number, club: string, rating: number|null }} Player
 */

/**
 * Returns 11 randomly selected players from the provided list.
 * Uses a Fisher-Yates shuffle so every permutation is equally likely.
 *
 * @param {Player[]} players - Full pool of available players
 * @returns {Player[]} Array of 11 players
 */
export function generateRandomTeam(players) {
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 11);
}

/**
 * Picks players by position to match a formation's slot requirements.
 * Each formation slot specifies a required position role; we randomly
 * pick from matching players, falling back to any unselected player if
 * a position pool runs dry.
 *
 * @param {Player[]} players  - Full pool
 * @param {string[]} roles    - Ordered array of 11 position labels
 *                              e.g. ['Goalkeeper','Defender',...,'Attacker']
 * @returns {Player[]}        - 11 selected players in slot order
 */
export function generateTeamByPosition(players, roles) {
  // Normalise: API uses 'Attacker'/'Forward' for strikers
  const ROLE_MAP = {
    Goalkeeper: ['Goalkeeper'],
    Defender:   ['Defender'],
    Midfielder: ['Midfielder'],
    Attacker:   ['Attacker', 'Forward'],
  };

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Build per-position pools (shuffled)
  const pools = {};
  for (const role of Object.keys(ROLE_MAP)) {
    const accepted = ROLE_MAP[role];
    pools[role] = shuffle(players.filter(p => accepted.includes(p.position)));
  }

  const used = new Set();
  const team = [];

  for (const role of roles) {
    // Try position-matched pool first
    const pool = pools[role] ?? [];
    const match = pool.find(p => !used.has(p.name));

    if (match) {
      used.add(match.name);
      team.push(match);
    } else {
      // Fallback: any unused player
      const fallback = players.find(p => !used.has(p.name));
      if (fallback) {
        used.add(fallback.name);
        team.push(fallback);
      }
    }
  }

  return team;
}
