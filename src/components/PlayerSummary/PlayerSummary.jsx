import React from 'react';
import { Tile } from '@carbon/react';
import './PlayerSummary.scss';

function formDescription(rating) {
  if (rating == null) return null;
  if (rating >= 8.0) return 'in strong form';
  if (rating >= 6.0) return 'showing consistent form';
  return 'building form';
}

function buildSummary(player) {
  const parts = [];

  // Opening: name + position + club
  if (player.position && player.club) {
    parts.push(`${player.name} is a ${player.position.toLowerCase()} currently playing for ${player.club}.`);
  } else if (player.position) {
    parts.push(`${player.name} is a ${player.position.toLowerCase()}.`);
  } else if (player.club) {
    parts.push(`${player.name} currently plays for ${player.club}.`);
  } else {
    parts.push(`${player.name} is a professional footballer.`);
  }

  // Age + nationality
  if (player.age && player.citizenship) {
    parts.push(`They are ${player.age} years old and represent ${player.citizenship}.`);
  } else if (player.age) {
    parts.push(`They are ${player.age} years old.`);
  } else if (player.citizenship) {
    parts.push(`They represent ${player.citizenship}.`);
  }

  // Form
  const form = formDescription(player.rating);
  if (form) {
    parts.push(`Based on their 2023 Premier League statistics, they are ${form}.`);
  }

  parts.push('This profile is based on the available dataset only.');

  return parts.join(' ');
}

function PlayerSummary({ player }) {
  if (!player) return null;

  const text = buildSummary(player);

  return (
    <Tile className="player-summary">
      <h3 className="player-summary__label">Player Summary</h3>
      <p className="player-summary__text">{text}</p>
      <p className="player-summary__source">
        This summary is based only on the loaded dataset.
      </p>
    </Tile>
  );
}

export default PlayerSummary;
