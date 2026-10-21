// Codeforces rating bands and their official colors.
export const RANKS = [
  { name: 'newbie', min: 0, color: '#808080' },
  { name: 'pupil', min: 1200, color: '#008000' },
  { name: 'specialist', min: 1400, color: '#03a89e' },
  { name: 'expert', min: 1600, color: '#0000ff' },
  { name: 'candidate master', min: 1900, color: '#aa00aa' },
  { name: 'master', min: 2100, color: '#ff8c00' },
  { name: 'international master', min: 2300, color: '#ff8c00' },
  { name: 'grandmaster', min: 2400, color: '#ff0000' },
  { name: 'international grandmaster', min: 2600, color: '#ff0000' },
  { name: 'legendary grandmaster', min: 3000, color: '#ff0000' },
];

export const INK = '#1b2733';

export function rankColor(rank) {
  if (!rank) return INK;
  return RANKS.find((r) => r.name === rank.toLowerCase())?.color ?? INK;
}

export function ratingColor(rating) {
  let c = RANKS[0].color;
  for (const r of RANKS) if (rating >= r.min) c = r.color;
  return c;
}

export const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
