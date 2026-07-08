import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  Select,
  SelectItem,
  Tile,
  InlineLoading,
} from '@carbon/react';

import PlayerSelect from './components/PlayerSelect/PlayerSelect';
import PositionFilter from './components/PositionFilter/PositionFilter';
import PlayerCard from './components/PlayerCard/PlayerCard';
import PlayerSummary from './components/PlayerSummary/PlayerSummary';
import CompareView from './components/CompareView/CompareView';
import FormationBoard, { FORMATIONS } from './components/FormationBoard/FormationBoard';
import './App.scss';

// ─── API helpers ──────────────────────────────────────────────────────────────

const API = process.env.REACT_APP_API_URL ?? 'http://localhost:8000';

async function apiFetch(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

// Kick off the players fetch immediately — before React even mounts.
// The useEffect below picks up this same promise, so the data is already
// in-flight (or resolved) by the time the component renders.
const playersPromise = apiFetch('/api/players?sort=name-asc');

// ─── Sort options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'name-asc',    label: 'Name (A → Z)'        },
  { value: 'name-desc',   label: 'Name (Z → A)'        },
  { value: 'rating-desc', label: 'Rating (high → low)' },
  { value: 'rating-asc',  label: 'Rating (low → high)' },
  { value: 'age-asc',     label: 'Age (young → old)'   },
  { value: 'age-desc',    label: 'Age (old → young)'   },
];

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  // ── Navigation ──
  const [page, setPage] = useState('browser');

  // ── Browser page state ──
  const [positionFilter, setPositionFilter] = useState('');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [sortKey,        setSortKey]        = useState('name-asc');
  const [compareMode,    setCompareMode]    = useState(false);
  const [selectedNameA,  setSelectedNameA]  = useState('');
  const [selectedNameB,  setSelectedNameB]  = useState('');

  // ── Formation page state ──
  const [formation,   setFormation]   = useState('4-4-2');
  const [team,        setTeam]        = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [panelPlayer, setPanelPlayer] = useState(null);

  // ── Fetched data ──
  const [allPlayers,     setAllPlayers]     = useState([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [playersError,   setPlayersError]   = useState(null);

  // Consume the pre-started promise — data may already be resolved by now
  useEffect(() => {
    playersPromise
      .then(data => { setAllPlayers(data); setPlayersLoading(false); })
      .catch(err  => { setPlayersError(err.message); setPlayersLoading(false); });
  }, []);

  // ── Derived: filtered + sorted list (client-side, instant) ──
  const displayedPlayers = useMemo(() => {
    let list = positionFilter
      ? allPlayers.filter(p => p.position === positionFilter)
      : allPlayers;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.club ?? '').toLowerCase().includes(q)
      );
    }
    // Sort
    const sorted = [...list];
    switch (sortKey) {
      case 'name-asc':    sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc':   sorted.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'rating-desc': sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1)); break;
      case 'rating-asc':  sorted.sort((a, b) => (a.rating ?? -1) - (b.rating ?? -1)); break;
      case 'age-asc':     sorted.sort((a, b) => (a.age ?? 0) - (b.age ?? 0)); break;
      case 'age-desc':    sorted.sort((a, b) => (b.age ?? 0) - (a.age ?? 0)); break;
      default: break;
    }
    return sorted;
  }, [allPlayers, positionFilter, searchQuery, sortKey]);

  // Resolve selected player objects — fall back to full list so names stay
  // valid even when current filter hides the player
  const selectedPlayerA = displayedPlayers.find(p => p.name === selectedNameA)
    ?? allPlayers.find(p => p.name === selectedNameA)
    ?? null;
  const selectedPlayerB = displayedPlayers.find(p => p.name === selectedNameB)
    ?? allPlayers.find(p => p.name === selectedNameB)
    ?? null;

  function handlePositionChange(pos) {
    setPositionFilter(pos);
    setSelectedNameA('');
    setSelectedNameB('');
  }

  function handleSearchChange(e) {
    setSearchQuery(e.target.value);
    setSelectedNameA('');
    setSelectedNameB('');
  }

  const handleGenerateTeam = useCallback(async () => {
    setTeamLoading(true);
    setPanelPlayer(null);
    try {
      const data = await apiFetch(`/api/team?formation=${encodeURIComponent(formation)}`);
      setTeam(data);
    } catch (err) {
      console.error('Failed to generate team:', err);
    } finally {
      setTeamLoading(false);
    }
  }, [formation]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <Header aria-label="Player Dashboard" className="app-header">
        <HeaderName prefix="">&nbsp;Player Dashboard</HeaderName>
        <HeaderNavigation aria-label="Main navigation">
          <HeaderMenuItem isCurrentPage={page === 'browser'} onClick={() => setPage('browser')}>
            Player Browser
          </HeaderMenuItem>
          <HeaderMenuItem isCurrentPage={page === 'formation'} onClick={() => setPage('formation')}>
            Team Formation
          </HeaderMenuItem>
        </HeaderNavigation>
      </Header>

      <div className="app-header-spacer" />

      {/* ═══════════════════════════ BROWSER PAGE ═══════════════════════════ */}
      {page === 'browser' && (
        <main className="app-main">

          {playersLoading && (
            <div className="app-loading">
              <InlineLoading description="Loading players…" status="active" />
            </div>
          )}

          {playersError && (
            <p className="api-error">
              Could not reach the API: {playersError}.
              Make sure <code>uvicorn api.main:app --port 8000</code> is running.
            </p>
          )}

          {!playersLoading && !playersError && (
            <>
              {/* ── Toolbar ── */}
              <div className="browser-toolbar">
                <div className="browser-toolbar__search">
                  <label htmlFor="player-search" className="browser-toolbar__label">
                    Search players
                  </label>
                  <input
                    id="player-search"
                    type="text"
                    className="browser-toolbar__input"
                    placeholder="Name or club…"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>

                <div className="browser-toolbar__control">
                  <PositionFilter value={positionFilter} onChange={handlePositionChange} />
                </div>

                <div className="browser-toolbar__control">
                  <Select
                    id="sort-select"
                    labelText="Sort by"
                    value={sortKey}
                    onChange={e => setSortKey(e.target.value)}
                  >
                    {SORT_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value} text={o.label} />
                    ))}
                  </Select>
                </div>

                <div className="browser-toolbar__compare-toggle">
                  <button
                    className={`compare-toggle-btn${compareMode ? ' compare-toggle-btn--active' : ''}`}
                    onClick={() => {
                      setCompareMode(m => !m);
                      setSelectedNameA('');
                      setSelectedNameB('');
                    }}
                  >
                    {compareMode ? 'Exit Compare' : 'Compare Players'}
                  </button>
                </div>
              </div>

              <p className="browser-result-count">
                {displayedPlayers.length} player{displayedPlayers.length !== 1 ? 's' : ''}
                {positionFilter ? ` · ${positionFilter}` : ''}
                {searchQuery ? ` matching "${searchQuery}"` : ''}
              </p>

              {!compareMode && (
                <>
                  <div className="browser-controls">
                    <PlayerSelect
                      players={displayedPlayers}
                      value={selectedNameA}
                      onChange={setSelectedNameA}
                    />
                  </div>
                  <PlayerCard player={selectedPlayerA} />
                  <PlayerSummary player={selectedPlayerA} />
                </>
              )}

              {compareMode && (
                <>
                  <div className="browser-controls browser-controls--compare">
                    <div className="browser-controls__slot">
                      <PlayerSelect players={displayedPlayers} value={selectedNameA} onChange={setSelectedNameA} />
                    </div>
                    <div className="browser-controls__vs">vs</div>
                    <div className="browser-controls__slot">
                      <PlayerSelect players={displayedPlayers} value={selectedNameB} onChange={setSelectedNameB} />
                    </div>
                  </div>
                  <CompareView playerA={selectedPlayerA} playerB={selectedPlayerB} />
                </>
              )}
            </>
          )}
        </main>
      )}

      {/* ═══════════════════════════ FORMATION PAGE ══════════════════════════ */}
      {page === 'formation' && (
        <main className="app-main app-main--formation">
          <h2 className="formation-heading">Team Formation Visualizer</h2>

          <div className="formation-controls">
            <div className="formation-controls__select">
              <Select
                id="formation-select"
                labelText="Formation"
                value={formation}
                onChange={e => {
                  setFormation(e.target.value);
                  setTeam([]);
                  setPanelPlayer(null);
                }}
              >
                {Object.entries(FORMATIONS).map(([key, f]) => (
                  <SelectItem key={key} value={key} text={f.label} />
                ))}
              </Select>
            </div>

            <button className="generate-btn" onClick={handleGenerateTeam} disabled={teamLoading}>
              {teamLoading ? 'Generating…' : 'Generate Team'}
            </button>
          </div>

          {teamLoading && <InlineLoading description="Picking players…" />}

          <div className="formation-layout">
            <div className="formation-board-wrap">
              <FormationBoard
                players={team}
                formation={formation}
                selectedPlayer={panelPlayer}
                onPlayerClick={p => setPanelPlayer(prev => prev?.name === p.name ? null : p)}
              />
            </div>

            {panelPlayer && (
              <div className="formation-panel">
                <button
                  className="formation-panel__close"
                  onClick={() => setPanelPlayer(null)}
                  aria-label="Close panel"
                >✕</button>
                <Tile className="formation-panel__tile">
                  {panelPlayer.photo && (
                    <div className="formation-panel__photo-wrap">
                      <img src={panelPlayer.photo} alt={panelPlayer.name}
                        className="formation-panel__photo" width={80} height={80} />
                    </div>
                  )}
                  <h3 className="formation-panel__name">{panelPlayer.name}</h3>
                  <dl className="formation-panel__stats">
                    {[
                      ['Position',    panelPlayer.position],
                      ['Club',        panelPlayer.club],
                      ['Age',         panelPlayer.age],
                      ['Nationality', panelPlayer.citizenship],
                      ['Rating',      panelPlayer.rating != null
                        ? `${parseFloat(panelPlayer.rating).toFixed(1)} / 10` : null],
                    ].map(([label, val]) => val != null ? (
                      <div className="formation-panel__row" key={label}>
                        <dt className="formation-panel__dt">{label}</dt>
                        <dd className="formation-panel__dd">{val}</dd>
                      </div>
                    ) : null)}
                  </dl>
                </Tile>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
