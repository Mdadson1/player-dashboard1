import React from 'react';
import { Select, SelectItem } from '@carbon/react';
import './PlayerSelect.scss';

/**
 * PlayerSelect
 * Props:
 *   players  – array of player objects { name, ... }
 *   value    – currently selected player name (or '')
 *   onChange – called with the new player name string
 */
function PlayerSelect({ players = [], value = '', onChange }) {
  function handleChange(e) {
    onChange(e.target.value);
  }

  return (
    <div className="player-select">
      <Select
        id="player-select"
        labelText="Choose a player"
        value={value}
        onChange={handleChange}
      >
        <SelectItem value="" text="Select a player..." />
        {players.map((player) => (
          <SelectItem
            key={player.name}
            value={player.name}
            text={player.name}
          />
        ))}
      </Select>
    </div>
  );
}

export default PlayerSelect;
