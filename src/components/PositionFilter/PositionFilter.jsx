import React from 'react';
import { Select, SelectItem } from '@carbon/react';

const POSITIONS = ['Attacker', 'Defender', 'Forward', 'Goalkeeper', 'Midfielder'];

/**
 * PositionFilter
 * Props:
 *   value    – current position filter value ('' = all)
 *   onChange – called with the new position string ('' = all)
 */
function PositionFilter({ value = '', onChange }) {
  return (
    <Select
      id="position-filter"
      labelText="Filter by position"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <SelectItem value="" text="All positions" />
      {POSITIONS.map((pos) => (
        <SelectItem key={pos} value={pos} text={pos} />
      ))}
    </Select>
  );
}

export default PositionFilter;
