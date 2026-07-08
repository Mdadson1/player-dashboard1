import React from 'react';
import { Tile } from '@carbon/react';
import './CompareView.scss';

const STATS = [
  { label: 'Position',   key: 'position' },
  { label: 'Age',        key: 'age' },
  { label: 'Nationality', key: 'citizenship' },
  { label: 'Club',       key: 'club' },
];

function formatRating(r) {
  return r != null ? `${parseFloat(r).toFixed(1)} / 10` : '—';
}

/** Single card column inside the compare view */
function CompareCard({ player, label }) {
  return (
    <div className="compare-card">
      <div className="compare-card__slot-label">{label}</div>
      {!player ? (
        <div className="compare-card__empty">No player selected</div>
      ) : (
        <>
          {player.photo && (
            <div className="compare-card__photo-wrap">
              <img
                src={player.photo}
                alt={player.name}
                className="compare-card__photo"
                width={96}
                height={96}
              />
            </div>
          )}
          <h3 className="compare-card__name">{player.name}</h3>
          <dl className="compare-card__stats">
            {STATS.map(({ label: l, key }) => (
              <div className="compare-card__row" key={key}>
                <dt className="compare-card__dt">{l}</dt>
                <dd className="compare-card__dd">{player[key] ?? '—'}</dd>
              </div>
            ))}
            <div className="compare-card__row">
              <dt className="compare-card__dt">Rating</dt>
              <dd className="compare-card__dd">{formatRating(player.rating)}</dd>
            </div>
          </dl>
        </>
      )}
    </div>
  );
}

/**
 * CompareView
 * Props:
 *   playerA  – first Player object (or null)
 *   playerB  – second Player object (or null)
 */
function CompareView({ playerA, playerB }) {
  return (
    <Tile className="compare-view">
      <h2 className="compare-view__heading">Player Comparison</h2>
      <div className="compare-view__grid">
        <CompareCard player={playerA} label="Player A" />
        <div className="compare-view__divider" />
        <CompareCard player={playerB} label="Player B" />
      </div>
    </Tile>
  );
}

export default CompareView;
