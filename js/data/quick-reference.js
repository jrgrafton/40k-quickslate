// Quick reference data for 40K 10th Edition Battle Dashboard

/**
 * Wound roll required: S vs T
 * Returns the minimum D6 roll needed to wound
 */
export function getWoundRoll(S, T) {
  if (S >= T * 2) return 2;
  if (S > T) return 3;
  if (S === T) return 4;
  if (S * 2 <= T) return 6;
  return 5;
}

/**
 * Wound roll table as a 2D lookup
 * woundRollTable[s][t] = required roll
 */
export const STRENGTH_VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14];
export const TOUGHNESS_VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14];

/**
 * Charge probability by distance (2D6 >= distance)
 */
export const CHARGE_PROBABILITY = [
  { distance: 2, pct: 100.0 },
  { distance: 3, pct: 97.2 },
  { distance: 4, pct: 91.7 },
  { distance: 5, pct: 83.3 },
  { distance: 6, pct: 72.2 },
  { distance: 7, pct: 58.3 },
  { distance: 8, pct: 41.7 },
  { distance: 9, pct: 27.8 },
  { distance: 10, pct: 16.7 },
  { distance: 11, pct: 8.3 },
  { distance: 12, pct: 2.8 },
];

/**
 * Save probability grid: AP vs Base Save
 * Returns the modified save value (7+ means no save)
 */
export function getModifiedSave(baseSave, ap) {
  return baseSave + Math.abs(ap);
}

/**
 * Probability of failing a save (damage getting through)
 */
export function getSaveFailProb(baseSave, ap, invuln) {
  const modSave = getModifiedSave(baseSave, ap);
  const effectiveSave = (invuln && invuln < modSave) ? invuln : modSave;
  if (effectiveSave > 6) return 1.0;
  return (effectiveSave - 1) / 6;
}

export const SAVE_VALUES = [2, 3, 4, 5, 6];
export const AP_VALUES = [0, -1, -2, -3, -4];

/**
 * Role colors for unit cards
 */
export const ROLE_COLORS = {
  'Character': '#c9a84c',
  'Battleline': '#2d6a2d',
  'Infantry': '#4a6a8a',
  'Vehicle': '#6a4a2d',
  'Monster': '#6a2d4a',
  'Dedicated Transport': '#5a5548',
  'Fortification': '#3a3a3a',
  'Epic Hero': '#c9a84c',
  'default': '#8b0000',
};

export function getRoleColor(role) {
  if (!role) return ROLE_COLORS.default;
  for (const [key, color] of Object.entries(ROLE_COLORS)) {
    if (role.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return ROLE_COLORS.default;
}
