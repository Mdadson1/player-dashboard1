import React, { useState } from 'react';

/**
 * @typedef {{ name: string, photo: string, position: string, age: number,
 *             citizenship: string, height: number, club: string, rating: number|null }} Player
 */

// ─── Formation definitions ────────────────────────────────────────────────────
// Each formation: ordered rows top→bottom; each row is [xFraction, roleName]
// Roles: 'Attacker' | 'Midfielder' | 'Defender' | 'Goalkeeper'

export const FORMATIONS = {
  '4-4-2': {
    label: '4-4-2',
    rows: [
      { y: 0.13, slots: [{ x: 0.28, role: 'Attacker'  }, { x: 0.72, role: 'Attacker'  }] },
      { y: 0.37, slots: [{ x: 0.08, role: 'Midfielder' }, { x: 0.36, role: 'Midfielder' }, { x: 0.64, role: 'Midfielder' }, { x: 0.92, role: 'Midfielder' }] },
      { y: 0.62, slots: [{ x: 0.08, role: 'Defender'  }, { x: 0.36, role: 'Defender'  }, { x: 0.64, role: 'Defender'  }, { x: 0.92, role: 'Defender'  }] },
      { y: 0.87, slots: [{ x: 0.5,  role: 'Goalkeeper' }] },
    ],
  },
  '4-3-3': {
    label: '4-3-3',
    rows: [
      { y: 0.12, slots: [{ x: 0.18, role: 'Attacker'  }, { x: 0.5,  role: 'Attacker'  }, { x: 0.82, role: 'Attacker'  }] },
      { y: 0.38, slots: [{ x: 0.2,  role: 'Midfielder' }, { x: 0.5,  role: 'Midfielder' }, { x: 0.8,  role: 'Midfielder' }] },
      { y: 0.62, slots: [{ x: 0.08, role: 'Defender'  }, { x: 0.36, role: 'Defender'  }, { x: 0.64, role: 'Defender'  }, { x: 0.92, role: 'Defender'  }] },
      { y: 0.87, slots: [{ x: 0.5,  role: 'Goalkeeper' }] },
    ],
  },
  '3-5-2': {
    label: '3-5-2',
    rows: [
      { y: 0.12, slots: [{ x: 0.3,  role: 'Attacker'  }, { x: 0.7,  role: 'Attacker'  }] },
      { y: 0.35, slots: [{ x: 0.08, role: 'Midfielder' }, { x: 0.28, role: 'Midfielder' }, { x: 0.5,  role: 'Midfielder' }, { x: 0.72, role: 'Midfielder' }, { x: 0.92, role: 'Midfielder' }] },
      { y: 0.63, slots: [{ x: 0.2,  role: 'Defender'  }, { x: 0.5,  role: 'Defender'  }, { x: 0.8,  role: 'Defender'  }] },
      { y: 0.87, slots: [{ x: 0.5,  role: 'Goalkeeper' }] },
    ],
  },
  '5-3-2': {
    label: '5-3-2',
    rows: [
      { y: 0.12, slots: [{ x: 0.3,  role: 'Attacker'  }, { x: 0.7,  role: 'Attacker'  }] },
      { y: 0.38, slots: [{ x: 0.2,  role: 'Midfielder' }, { x: 0.5,  role: 'Midfielder' }, { x: 0.8,  role: 'Midfielder' }] },
      { y: 0.61, slots: [{ x: 0.08, role: 'Defender'  }, { x: 0.27, role: 'Defender'  }, { x: 0.5,  role: 'Defender'  }, { x: 0.73, role: 'Defender'  }, { x: 0.92, role: 'Defender'  }] },
      { y: 0.87, slots: [{ x: 0.5,  role: 'Goalkeeper' }] },
    ],
  },
};

/** Flatten a formation definition into an ordered array of {xFrac, yFrac, role} */
export function getSlots(formationKey) {
  const formation = FORMATIONS[formationKey] ?? FORMATIONS['4-4-2'];
  return formation.rows.flatMap(row =>
    row.slots.map(slot => ({ xFrac: slot.x, yFrac: row.y, role: slot.role }))
  );
}

/** Return the ordered role list for a formation (used by teamGenerator) */
export function getFormationRoles(formationKey) {
  return getSlots(formationKey).map(s => s.role);
}

// ─── Field geometry constants ────────────────────────────────────────────────

const W  = 520;
const H  = 780;
const B  = 20;
const CX = W / 2;

const LEFT   = B;
const RIGHT  = W - B;
const TOP    = B;
const BOTTOM = H - B;
const MID_Y  = H / 2;

const PB_W    = 260;
const PB_H    = 130;
const PB_X    = CX - PB_W / 2;
const GA_W    = 130;
const GA_H    = 55;
const GA_X    = CX - GA_W / 2;
const PS_DIST = 95;
const ARC_R   = 65;
const CC_R    = 70;
const CORNER_R = 12;
const GOAL_W  = 90;
const GOAL_H  = 18;
const GOAL_X  = CX - GOAL_W / 2;
const PATTERN_ID = 'goal-net';

// ─── Penalty arc path ────────────────────────────────────────────────────────

function penaltyArcPath(end) {
  const spotY   = end === 'top' ? TOP + PS_DIST : BOTTOM - PS_DIST;
  const boxEdge = end === 'top' ? TOP + PB_H    : BOTTOM - PB_H;
  const dy = Math.abs(boxEdge - spotY);
  if (dy >= ARC_R) return null;
  const halfAngle = Math.acos(dy / ARC_R);
  const x1 = CX - ARC_R * Math.sin(halfAngle);
  const x2 = CX + ARC_R * Math.sin(halfAngle);
  const sweep = end === 'top' ? 0 : 1;
  return `M ${x1} ${boxEdge} A ${ARC_R} ${ARC_R} 0 0 ${sweep} ${x2} ${boxEdge}`;
}

// ─── FieldMarkings ───────────────────────────────────────────────────────────

function FieldMarkings() {
  const stroke = '#ffffff';
  const sw     = 2;
  const topArc = penaltyArcPath('top');
  const botArc = penaltyArcPath('bottom');

  return (
    <svg width={W} height={H}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <pattern id={PATTERN_ID} patternUnits="userSpaceOnUse" width="6" height="6">
          <rect width="6" height="6" fill="#e8e8e8" />
          <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke="#bbb" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Goals */}
      <rect x={GOAL_X} y={TOP - GOAL_H} width={GOAL_W} height={GOAL_H} fill={`url(#${PATTERN_ID})`} stroke={stroke} strokeWidth={sw} />
      <rect x={GOAL_X} y={BOTTOM} width={GOAL_W} height={GOAL_H} fill={`url(#${PATTERN_ID})`} stroke={stroke} strokeWidth={sw} />

      {/* Outer border */}
      <rect x={LEFT} y={TOP} width={RIGHT - LEFT} height={BOTTOM - TOP} fill="none" stroke={stroke} strokeWidth={sw} />

      {/* Halfway line */}
      <line x1={LEFT} y1={MID_Y} x2={RIGHT} y2={MID_Y} stroke={stroke} strokeWidth={sw} />

      {/* Centre circle + spot */}
      <circle cx={CX} cy={MID_Y} r={CC_R} fill="none" stroke={stroke} strokeWidth={sw} />
      <circle cx={CX} cy={MID_Y} r={4} fill={stroke} />

      {/* Top penalty area */}
      <rect x={PB_X} y={TOP} width={PB_W} height={PB_H} fill="none" stroke={stroke} strokeWidth={sw} />
      <rect x={GA_X} y={TOP} width={GA_W} height={GA_H} fill="none" stroke={stroke} strokeWidth={sw} />
      <circle cx={CX} cy={TOP + PS_DIST} r={3} fill={stroke} />
      {topArc && <path d={topArc} fill="none" stroke={stroke} strokeWidth={sw} />}

      {/* Bottom penalty area */}
      <rect x={PB_X} y={BOTTOM - PB_H} width={PB_W} height={PB_H} fill="none" stroke={stroke} strokeWidth={sw} />
      <rect x={GA_X} y={BOTTOM - GA_H} width={GA_W} height={GA_H} fill="none" stroke={stroke} strokeWidth={sw} />
      <circle cx={CX} cy={BOTTOM - PS_DIST} r={3} fill={stroke} />
      {botArc && <path d={botArc} fill="none" stroke={stroke} strokeWidth={sw} />}

      {/* Corner arcs */}
      <path d={`M ${LEFT} ${TOP + CORNER_R} A ${CORNER_R} ${CORNER_R} 0 0 0 ${LEFT + CORNER_R} ${TOP}`} fill="none" stroke={stroke} strokeWidth={sw} />
      <path d={`M ${RIGHT - CORNER_R} ${TOP} A ${CORNER_R} ${CORNER_R} 0 0 0 ${RIGHT} ${TOP + CORNER_R}`} fill="none" stroke={stroke} strokeWidth={sw} />
      <path d={`M ${LEFT + CORNER_R} ${BOTTOM} A ${CORNER_R} ${CORNER_R} 0 0 0 ${LEFT} ${BOTTOM - CORNER_R}`} fill="none" stroke={stroke} strokeWidth={sw} />
      <path d={`M ${RIGHT} ${BOTTOM - CORNER_R} A ${CORNER_R} ${CORNER_R} 0 0 0 ${RIGHT - CORNER_R} ${BOTTOM}`} fill="none" stroke={stroke} strokeWidth={sw} />
    </svg>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function Tooltip({ player, x, y }) {
  // Decide whether to flip left/right so the tooltip stays on-field
  const flipX = x > W * 0.65;
  const flipY = y > H * 0.75;

  return (
    <div style={{
      position: 'absolute',
      left: flipX ? x - 154 : x + 24,
      top:  flipY ? y - 110  : y - 10,
      width: 140,
      background: 'rgba(22,22,22,0.95)',
      color: '#fff',
      borderRadius: 6,
      padding: '8px 10px',
      fontSize: 11,
      lineHeight: 1.5,
      pointerEvents: 'none',
      zIndex: 20,
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.15)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {player.name}
      </div>
      <div style={{ color: '#a8c4ff' }}>{player.position ?? '—'}</div>
      <div>{player.club ?? '—'}</div>
      <div>Age: {player.age ?? '—'}</div>
      <div>Rating: {player.rating != null ? `${parseFloat(player.rating).toFixed(1)} / 10` : '—'}</div>
    </div>
  );
}

// ─── PlayerToken ─────────────────────────────────────────────────────────────

/**
 * @param {{ player: Player, number: number, x: number, y: number,
 *           isSelected: boolean, onClick: function }} props
 */
function PlayerToken({ player, number, x, y, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false);
  const PHOTO = 38;
  const BADGE = 16;

  return (
    <>
      <div
        onClick={() => onClick(player)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          zIndex: 3,
          width: 68,
          cursor: 'pointer',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={player.photo}
            alt={player.name}
            width={PHOTO}
            height={PHOTO}
            style={{
              borderRadius: '50%',
              border: isSelected ? '2.5px solid #f1c21b' : '2px solid #fff',
              objectFit: 'cover',
              display: 'block',
              boxShadow: isSelected
                ? '0 0 0 3px rgba(241,194,27,0.5), 0 2px 8px rgba(0,0,0,0.55)'
                : '0 2px 8px rgba(0,0,0,0.55)',
              background: '#2d7a2d',
              transition: 'box-shadow 0.15s, border-color 0.15s',
              transform: hovered ? 'scale(1.12)' : 'scale(1)',
            }}
          />
          <span style={{
            position: 'absolute',
            bottom: -2, right: -4,
            width: BADGE, height: BADGE,
            borderRadius: '50%',
            background: isSelected ? '#f1c21b' : '#0f62fe',
            color: isSelected ? '#161616' : '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid #fff',
            lineHeight: 1,
          }}>
            {number}
          </span>
        </div>

        <span style={{
          color: '#fff',
          fontSize: 9, fontWeight: 600,
          textAlign: 'center', lineHeight: 1.2,
          textShadow: '0 1px 4px rgba(0,0,0,0.9)',
          maxWidth: 66,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        }}>
          {player.name}
        </span>
      </div>

      {hovered && <Tooltip player={player} x={x} y={y} />}
    </>
  );
}

// ─── FormationBoard ──────────────────────────────────────────────────────────

/**
 * @param {{
 *   players:          Player[],
 *   formation:        string,
 *   selectedPlayer:   Player|null,
 *   onPlayerClick:    function,
 * }} props
 */
function FormationBoard({ players = [], formation = '4-4-2', selectedPlayer = null, onPlayerClick = () => {} }) {
  const hasPlayers = players.length > 0;
  const slots = getSlots(formation);

  return (
    <div style={{
      position: 'relative',
      width: W,
      height: H,
      borderRadius: 8,
      background: 'linear-gradient(180deg, #4a9e4a 0%, #3d8c3d 25%, #357a35 50%, #3d8c3d 75%, #4a9e4a 100%)',
      border: '3px solid #fff',
      boxShadow: 'inset 0 0 40px rgba(0,0,0,0.25), 0 8px 32px rgba(0,0,0,0.35)',
      overflow: 'visible',
      userSelect: 'none',
    }}>
      <FieldMarkings />

      {!hasPlayers && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: 'rgba(255,255,255,0.8)', fontSize: 15,
          fontStyle: 'italic', textAlign: 'center', padding: '0 2.5rem',
          position: 'relative', zIndex: 2,
        }}>
          Click Generate Team to see the formation
        </div>
      )}

      {hasPlayers && slots.map((slot, idx) => {
        const player = players[idx];
        if (!player) return null;
        return (
          <PlayerToken
            key={player.name}
            player={player}
            number={idx + 1}
            x={slot.xFrac * W}
            y={slot.yFrac * H}
            isSelected={selectedPlayer?.name === player.name}
            onClick={onPlayerClick}
          />
        );
      })}
    </div>
  );
}

export default FormationBoard;
