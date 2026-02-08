// Yellow Scribe army list parser

/**
 * Parse a Yellow Scribe format army list
 * @param {string} text - Raw army list text
 * @returns {Object} { faction, detachment, points, units[] }
 */
export function parseArmyList(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const result = {
    faction: "",
    detachment: "",
    points: 0,
    units: [],
  };

  let currentCategory = "";
  let currentUnit = null;

  for (const line of lines) {
    // Header line
    if (line.startsWith("++")) continue;

    // Faction
    const factionMatch = line.match(/^Faction:\s*(.+)/i);
    if (factionMatch) { result.faction = factionMatch[1].trim(); continue; }

    // Detachment
    const detMatch = line.match(/^Detachment:\s*(.+)/i);
    if (detMatch) { result.detachment = detMatch[1].trim(); continue; }

    // Points total
    const ptsMatch = line.match(/^Points:\s*(\d+)/i);
    if (ptsMatch) { result.points = parseInt(ptsMatch[1]); continue; }

    // Category header: + Category +
    const catMatch = line.match(/^\+\s*(.+?)\s*\+$/);
    if (catMatch) { currentCategory = catMatch[1].trim(); continue; }

    // Unit line: Name [Xpts] (Y models) or Name [Xpts]
    const unitMatch = line.match(/^(.+?)\s*\[(\d+)\s*pts?\]/i);
    if (unitMatch) {
      const modelMatch = line.match(/\((\d+)\s*models?\)/i);
      currentUnit = {
        name: unitMatch[1].trim(),
        points: parseInt(unitMatch[2]),
        models: modelMatch ? parseInt(modelMatch[1]) : 1,
        category: currentCategory,
        loadout: [],
      };
      result.units.push(currentUnit);
      continue;
    }

    // Loadout line: - Item or • Item
    const loadoutMatch = line.match(/^[-•]\s*(.+)/);
    if (loadoutMatch && currentUnit) {
      currentUnit.loadout.push(loadoutMatch[1].trim());
      continue;
    }
  }

  // Recalculate total points
  if (result.units.length > 0 && result.points === 0) {
    result.points = result.units.reduce((sum, u) => sum + u.points, 0);
  }

  return result;
}
