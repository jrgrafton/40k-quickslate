// Army list parser — supports Yellow Scribe plain text AND BattleScribe/New Recruit JSON

/**
 * Auto-detect format and parse
 */
export function parseArmyList(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const json = JSON.parse(trimmed);
      // Auto-detect YellowScribe API format
      if (json.armyData && json.order) {
        return parseYellowScribeAPI(json);
      }
      return parseBattleScribeJSON(json);
    } catch (e) {
      console.warn('JSON parse failed, falling back to text parser:', e);
    }
  }
  return parseYellowScribe(trimmed);
}

/**
 * Parse YellowScribe API response (from /get_army_by_id)
 */
export function parseYellowScribeAPI(json) {
  const order = json.order || [];
  const armyData = json.armyData || {};

  const result = {
    faction: '',
    detachment: '',
    points: 0,
    units: [],
  };

  // Extract detachment from top-level fields
  if (json.detachment) {
    result.detachment = typeof json.detachment === 'string' ? json.detachment : (json.detachment.name || '');
  } else if (json.detachmentName) {
    result.detachment = json.detachmentName;
  }

  // Extract faction from top-level fields
  if (json.faction) {
    result.faction = typeof json.faction === 'string' ? json.faction : (json.faction.name || '');
  } else if (json.factionName) {
    result.faction = json.factionName;
  }

  // Extract points from top-level
  if (json.points) {
    result.points = parseInt(json.points) || 0;
  }

  for (const uuid of order) {
    const data = armyData[uuid];
    if (!data) continue;

    const factionKeywords = data.factionKeywords || [];
    if (!result.faction && factionKeywords.length > 0) {
      result.faction = factionKeywords[0];
    }

    // Try to extract detachment from unit data if not found at top level
    if (!result.detachment) {
      if (data.detachment) {
        result.detachment = typeof data.detachment === 'string' ? data.detachment : (data.detachment.name || '');
      } else if (data.detachmentName) {
        result.detachment = data.detachmentName;
      }
    }

    const keywords = data.keywords || [];
    const role = detectRole(keywords);

    // Model profiles
    const statProfiles = [];
    if (data.modelProfiles) {
      for (const [, prof] of Object.entries(data.modelProfiles)) {
        statProfiles.push({
          name: prof.name || data.name,
          M: prof.m || '-',
          T: prof.t || '-',
          Sv: prof.sv || '-',
          W: prof.w || '-',
          Ld: prof.ld || '-',
          OC: prof.oc || '-',
        });
      }
    }

    // Weapons with full stats
    const weapons = [];
    if (data.weapons) {
      for (const [, w] of Object.entries(data.weapons)) {
        weapons.push({
          name: w.name || '',
          type: (w.range || '').toLowerCase() === 'melee' ? 'melee' : 'ranged',
          range: w.range || '-',
          A: w.a || '-',
          BS_WS: w.bsws || '-',
          S: w.s || '-',
          AP: w.ap || '0',
          D: w.d || '-',
          keywords: w.abilities || '',
          description: w.abilities || '',
        });
      }
    }

    // Abilities
    const abilities = [];
    if (data.abilities) {
      for (const [, ab] of Object.entries(data.abilities)) {
        abilities.push({
          name: ab.name || '',
          description: ab.desc || '',
          type: 'Ability',
        });
      }
    }

    // Model count
    const modelCount = data.models?.totalNumberOfModels || 1;

    // Points per unit
    const unitPoints = data.points || data.cost || 0;

    const unit = {
      name: data.name || 'Unknown',
      points: parseInt(unitPoints) || 0,
      models: modelCount,
      category: role,
      role: role,
      statProfiles,
      weapons,
      abilities,
      rules: (data.rules || []).map(r => typeof r === 'string' ? { name: r, description: '' } : r),
      keywords,
      factionKeywords,
      loadout: weapons.map(w => w.name),
    };

    result.units.push(unit);
  }

  if (result.points === 0) {
    result.points = result.units.reduce((sum, u) => sum + (u.points || 0), 0);
  }
  return result;
}

function detectRole(keywords) {
  const kw = keywords.map(k => k.toLowerCase());
  if (kw.includes('character')) return 'Character';
  if (kw.includes('battleline')) return 'Battleline';
  if (kw.includes('dedicated transport')) return 'Dedicated Transport';
  if (kw.includes('vehicle')) return 'Vehicle';
  if (kw.includes('monster')) return 'Monster';
  if (kw.includes('beast')) return 'Beast';
  if (kw.includes('fortification')) return 'Fortification';
  if (kw.includes('infantry')) return 'Infantry';
  return '';
}

/**
 * Parse BattleScribe / New Recruit JSON roster format
 */
function parseBattleScribeJSON(json) {
  // Handle wrapper: could be { roster: {...} } or the roster directly
  const roster = json.roster || json;
  const force = roster.forces?.[0] || {};

  const catalogueName = force.catalogueName || roster.name || '';
  // Extract faction from catalogueName like "Imperium - Adeptus Custodes"
  const faction = catalogueName.replace(/^.*?\s*-\s*/, '') || catalogueName;

  const result = {
    faction: faction,
    detachment: '',
    points: 0,
    units: [],
    armyName: roster.name || '',
    catalogueName: catalogueName,
  };

  const selections = force.selections || roster.selections || [];

  for (const sel of selections) {
    // Skip configuration entries (Battle Size, Detachments, Show/Hide Options)
    if (isConfigSelection(sel)) {
      // But extract detachment name from config
      if (isDetachmentSelection(sel)) {
        result.detachment = extractDetachmentName(sel);
      }
      continue;
    }

    // Parse as unit
    const unit = parseUnitSelection(sel);
    if (unit) {
      result.units.push(unit);
    }
  }

  // Calculate total points
  result.points = result.units.reduce((sum, u) => sum + (u.points || 0), 0);

  return result;
}

function isConfigSelection(sel) {
  if (sel.type === 'upgrade') {
    // Check if it has Configuration category
    const cats = sel.categories || [];
    if (cats.some(c => c.name === 'Configuration')) return true;
    // Common config names
    const configNames = ['Battle Size', 'Show/Hide Options', 'Detachment'];
    if (configNames.some(n => (sel.name || '').includes(n))) return true;
    return true; // All top-level upgrades are config
  }
  return false;
}

function isDetachmentSelection(sel) {
  const name = (sel.name || '').toLowerCase();
  const cats = sel.categories || [];
  return name.includes('detachment') || cats.some(c => c.name === 'Configuration' && name.includes('detachment'));
}

function extractDetachmentName(sel) {
  // The detachment name is usually in a nested selection
  if (sel.selections && sel.selections.length > 0) {
    return sel.selections[0].name || sel.name || '';
  }
  return sel.name || '';
}

function applyEnhancementEffects(unit) {
  if (!unit.enhancements) return;
  for (const enh of unit.enhancements) {
    const desc = (enh.description || '').toLowerCase();
    const addMatch = desc.match(/add\s+(\d+)\s+to\s+(?:the bearer'?s?\s+)?(\w+)\s+characteristic/i);
    if (addMatch && unit.statProfiles?.length > 0) {
      const amount = parseInt(addMatch[1]);
      const stat = addMatch[2].toLowerCase();
      const statKey = stat === 'wounds' ? 'W' : stat === 'toughness' ? 'T' : stat === 'strength' ? 'S' : null;
      if (statKey) {
        for (const sp of unit.statProfiles) {
          const current = parseInt(sp[statKey]);
          if (!isNaN(current)) sp[statKey] = String(current + amount);
        }
      }
    }
  }
}

function parseUnitSelection(sel) {
  const unit = {
    name: sel.name || 'Unknown',
    points: 0,
    models: 1,
    category: '',
    role: '',
    statProfiles: [],
    weapons: [],
    abilities: [],
    rules: [],
    keywords: [],
    loadout: [],
  };

  // Points from costs
  if (sel.costs && sel.costs.length > 0) {
    unit.points = sel.costs.reduce((sum, c) => sum + (parseFloat(c.value) || 0), 0);
  }

  // Category/role from categories
  const cats = sel.categories || [];
  const primaryCat = cats.find(c => c.primary) || cats[0];
  if (primaryCat) {
    unit.role = primaryCat.name || '';
    unit.category = primaryCat.name || '';
  }
  // Collect all category names as potential keywords
  for (const c of cats) {
    if (c.name && !unit.keywords.includes(c.name)) {
      unit.keywords.push(c.name);
    }
  }

  // Parse profiles at this level
  extractProfiles(sel, unit);

  // Parse rules at this level
  if (sel.rules) {
    for (const r of sel.rules) {
      unit.rules.push({ name: r.name || '', description: r.description || '' });
    }
  }

  // Parse nested selections (weapons, models, etc.)
  if (sel.selections) {
    for (const nested of sel.selections) {
      parseNestedSelection(nested, unit);
    }
  }

  // Sum costs from nested selections (enhancements, wargear with pts)
  function sumNestedCosts(s) {
    let total = 0;
    if (s.costs) total += s.costs.reduce((sum, c) => sum + (parseFloat(c.value) || 0), 0);
    if (s.selections) for (const nested of s.selections) total += sumNestedCosts(nested);
    return total;
  }
  unit.points = sumNestedCosts(sel);

  // Number of models from sel.number if available
  if (sel.number) {
    unit.models = parseInt(sel.number) || 1;
  }

  // Apply enhancement stat modifications
  applyEnhancementEffects(unit);

  // Extract leader targets from "Leader" ability
  for (const ab of unit.abilities) {
    if ((ab.name || '').toLowerCase() === 'leader' && ab.description && ab.description.toLowerCase().includes('can be attached to')) {
      unit.leaderTargets = parseLeaderTargets(ab.description);
    }
  }

  return unit;
}

function extractProfiles(sel, unit) {
  if (!sel.profiles) return;
  for (const prof of sel.profiles) {
    const typeName = (prof.typeName || '').toLowerCase();
    if (typeName === 'unit') {
      // Stat profile
      const stats = {};
      for (const ch of (prof.characteristics || [])) {
        const val = ch.$text || ch.value || ch._ || '';
        stats[ch.name] = val;
      }
      unit.statProfiles.push({
        name: prof.name || sel.name,
        M: stats.M || stats.m || '-',
        T: stats.T || stats.t || '-',
        Sv: stats.SV || stats.Sv || stats.sv || stats.Save || '-',
        W: stats.W || stats.w || '-',
        Ld: stats.LD || stats.Ld || stats.ld || '-',
        OC: stats.OC || stats.oc || '-',
      });
    } else if (typeName === 'abilities') {
      unit.abilities.push({
        name: prof.name || '',
        description: (prof.characteristics && prof.characteristics[0]) ? (prof.characteristics[0].$text || prof.characteristics[0].value || '') : '',
        type: 'Ability',
      });
    } else if (typeName === 'ranged weapons' || typeName === 'melee weapons') {
      const isRanged = typeName === 'ranged weapons';
      const stats = {};
      for (const ch of (prof.characteristics || [])) {
        stats[ch.name] = ch.$text || ch.value || ch._ || '';
      }
      unit.weapons.push({
        name: prof.name || '',
        type: isRanged ? 'ranged' : 'melee',
        range: isRanged ? (stats.Range || stats.range || '-') : 'Melee',
        A: stats.A || stats.Attacks || '-',
        BS_WS: stats['BS'] || stats['WS'] || stats['BS/WS'] || '-',
        S: stats.S || stats.Strength || '-',
        AP: stats.AP || stats.ap || '0',
        D: stats.D || stats.Damage || '-',
        keywords: stats.Keywords || stats.keywords || '',
        description: stats.Keywords || stats.keywords || '',
      });
    }
  }
}

function parseNestedSelection(sel, unit) {
  // Extract profiles from nested selections (weapons, abilities, models)
  extractProfiles(sel, unit);

  // Detect enhancements: upgrade type with ability profiles and costs
  if (sel.type === 'upgrade' && sel.profiles) {
    const abilityProfiles = sel.profiles.filter(p => (p.typeName || '').toLowerCase() === 'abilities');
    if (abilityProfiles.length > 0) {
      const cost = sel.costs ? sel.costs.reduce((s, c) => s + (parseFloat(c.value) || 0), 0) : 0;
      if (cost > 0 || abilityProfiles.some(p => p.characteristics && p.characteristics.length > 0)) {
        if (!unit.enhancements) unit.enhancements = [];
        for (const ap of abilityProfiles) {
          const rawDesc = (ap.characteristics && ap.characteristics[0]) ? (ap.characteristics[0].$text || ap.characteristics[0].value || '') : '';
          const desc = rawDesc.replace(/\*\*/g, '').replace(/\^\^/g, '');
          unit.enhancements.push({
            name: ap.name || sel.name || '',
            description: desc,
            cost: cost,
          });
        }
      }
    }
  }

  // Extract rules
  if (sel.rules) {
    for (const r of sel.rules) {
      if (!unit.rules.some(existing => existing.name === r.name)) {
        unit.rules.push({ name: r.name || '', description: r.description || '' });
      }
    }
  }

  // Track loadout
  if (sel.name && sel.type !== 'model') {
    unit.loadout.push(sel.name);
  }

  // Recurse into nested selections
  if (sel.selections) {
    for (const nested of sel.selections) {
      parseNestedSelection(nested, unit);
    }
  }
}

/**
 * Parse leader target names from a "Leader" ability description.
 * Handles both "■ Unit Name" bullet format and comma-separated ALL-CAPS keyword lists.
 */
function parseLeaderTargets(description) {
  const targets = [];
  // Match "■ Unit Name" lines
  const bulletMatches = description.match(/■\s*([^\n■]+)/g);
  if (bulletMatches) {
    for (const m of bulletMatches) {
      const name = m.replace(/^■\s*/, '').trim();
      if (name) targets.push(name);
    }
  }
  if (targets.length > 0) return targets;

  // Fallback: parse after "can be attached to the following units:" 
  const afterColon = description.match(/can be attached to the following units[:\s]*(.*)/is);
  if (afterColon) {
    const text = afterColon[1].trim();
    // Split by comma
    const parts = text.split(/,/).map(s => s.trim()).filter(Boolean);
    for (const p of parts) {
      if (p) targets.push(p);
    }
  }
  return targets;
}

/**
 * Parse a Yellow Scribe format army list (original parser)
 * Supports both "Faction: Value" and "FACTION\nValue" formats
 */
function parseYellowScribe(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const result = {
    faction: "",
    detachment: "",
    points: 0,
    units: [],
  };

  let currentCategory = "";
  let currentUnit = null;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (line.startsWith("++")) continue;

    // "Faction: Value" format
    const factionMatch = line.match(/^Faction:\s*(.+)/i);
    if (factionMatch) { result.faction = factionMatch[1].trim(); continue; }

    // "FACTION" on its own line, value on next line
    if (line.toUpperCase() === 'FACTION' && idx + 1 < lines.length) {
      result.faction = lines[idx + 1].trim();
      idx++;
      continue;
    }

    // "Detachment: Value" format
    const detMatch = line.match(/^Detachment:\s*(.+)/i);
    if (detMatch) { result.detachment = detMatch[1].trim(); continue; }

    // "DETACHMENT" on its own line, value on next line
    if (line.toUpperCase() === 'DETACHMENT' && idx + 1 < lines.length) {
      result.detachment = lines[idx + 1].trim();
      idx++;
      continue;
    }

    // "Points: N" format
    const ptsMatch = line.match(/^Points:\s*(\d+)/i);
    if (ptsMatch) { result.points = parseInt(ptsMatch[1]); continue; }

    // "POINTS" on its own line, value on next line
    if (line.toUpperCase() === 'POINTS' && idx + 1 < lines.length) {
      const pVal = parseInt(lines[idx + 1].trim());
      if (!isNaN(pVal)) { result.points = pVal; idx++; }
      continue;
    }

    const catMatch = line.match(/^\+\s*(.+?)\s*\+$/);
    if (catMatch) { currentCategory = catMatch[1].trim(); continue; }

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

    const loadoutMatch = line.match(/^[-•]\s*(.+)/);
    if (loadoutMatch && currentUnit) {
      currentUnit.loadout.push(loadoutMatch[1].trim());
      continue;
    }
  }

  if (result.units.length > 0 && result.points === 0) {
    result.points = result.units.reduce((sum, u) => sum + u.points, 0);
  }

  return result;
}
