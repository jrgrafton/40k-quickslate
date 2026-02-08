// Wahapedia CSV Data Loader for 40K QuickSlate
// Loads pipe-delimited CSVs, joins relational data, caches in localStorage

const CSV_FILES = [
  'Factions', 'Datasheets', 'Datasheets_models', 'Datasheets_wargear',
  'Datasheets_abilities', 'Datasheets_keywords', 'Stratagems',
  'Datasheets_options', 'Datasheets_unit_composition', 'Datasheets_leader',
  'Detachments', 'Enhancements', 'Abilities', 'Datasheets_enhancements'
];

const CACHE_KEY = 'wahapedia_cache_v2';
const CACHE_META_KEY = 'wahapedia_cache_meta_v2';

// Parse pipe-delimited CSV text into array of objects
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];
  // Header: remove trailing pipe
  const headers = lines[0].replace(/\|$/, '').split('|');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].replace(/\|$/, '').split('|');
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = vals[j] || '';
    }
    rows.push(obj);
  }
  return rows;
}

// Try multiple sources for CSV data
async function fetchCSV(name, onProgress) {
  // Try local data-snapshot first (served from same origin)
  const localUrl = `data-snapshot/${name}.csv`;
  try {
    const resp = await fetch(localUrl);
    if (resp.ok) {
      const text = await resp.text();
      if (text.includes('|')) return text;
    }
  } catch (e) { /* fall through */ }

  // Try CORS proxies
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://wahapedia.ru/wh40k10ed/${name}.csv`)}`,
    `https://corsproxy.io/?${encodeURIComponent(`https://wahapedia.ru/wh40k10ed/${name}.csv`)}`,
  ];
  for (const url of proxies) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const text = await resp.text();
        if (text.includes('|')) return text;
      }
    } catch (e) { /* try next */ }
  }
  throw new Error(`Failed to fetch ${name}.csv`);
}

// Join all CSVs into unified data structures
function buildDatabase(raw) {
  const factions = {};
  for (const f of raw.Factions) {
    factions[f.id] = { id: f.id, name: f.name, link: f.link };
  }

  // Index helper tables by datasheet_id
  const modelsByDs = groupBy(raw.Datasheets_models, 'datasheet_id');
  const weaponsByDs = groupBy(raw.Datasheets_wargear, 'datasheet_id');
  const abilitiesByDs = groupBy(raw.Datasheets_abilities, 'datasheet_id');
  const keywordsByDs = groupBy(raw.Datasheets_keywords, 'datasheet_id');
  const optionsByDs = groupBy(raw.Datasheets_options, 'datasheet_id');
  const compositionByDs = groupBy(raw.Datasheets_unit_composition, 'datasheet_id');
  const enhancementsByDs = groupBy(raw.Datasheets_enhancements, 'datasheet_id');

  // Leader attachments
  const leaderAttachments = {};
  for (const l of raw.Datasheets_leader) {
    if (!leaderAttachments[l.leader_id]) leaderAttachments[l.leader_id] = [];
    leaderAttachments[l.leader_id].push(l.attached_id);
  }

  // Build units
  const units = [];
  for (const ds of raw.Datasheets) {
    if (ds.virtual === 'true') continue;

    const models = (modelsByDs[ds.id] || []).map(m => ({
      name: m.name,
      M: m.M, T: m.T, Sv: m.Sv,
      inv_sv: m.inv_sv && m.inv_sv !== '-' ? m.inv_sv : null,
      inv_sv_descr: m.inv_sv_descr || '',
      W: m.W, Ld: m.Ld, OC: m.OC,
    }));

    const weapons = (weaponsByDs[ds.id] || []).map(w => ({
      name: w.name,
      range: w.range,
      type: w.type,
      A: w.A, BS_WS: w.BS_WS, S: w.S, AP: w.AP, D: w.D,
      description: w.description || '',
    }));

    const abilities = (abilitiesByDs[ds.id] || []).map(a => ({
      name: a.name,
      description: a.description || '',
      type: a.type || '',
    }));

    const keywords = (keywordsByDs[ds.id] || []).map(k => k.keyword);
    const factionKeywords = (keywordsByDs[ds.id] || []).filter(k => k.is_faction_keyword === 'true').map(k => k.keyword);

    const options = (optionsByDs[ds.id] || []).map(o => ({
      description: o.description || '',
    }));

    const unit_composition = (compositionByDs[ds.id] || []).map(c => c.description);

    units.push({
      id: ds.id,
      name: ds.name,
      faction_id: ds.faction_id,
      faction_name: factions[ds.faction_id]?.name || ds.faction_id,
      role: ds.role || '',
      legend: ds.legend === 'true',
      loadout: ds.loadout || '',
      transport: ds.transport || '',
      damaged_w: ds.damaged_w || '',
      damaged_description: ds.damaged_description || '',
      link: ds.link || '',
      models,
      weapons,
      abilities,
      keywords,
      factionKeywords,
      options,
      unit_composition,
      leader_attachments: leaderAttachments[ds.id] || [],
      enhancement_ids: (enhancementsByDs[ds.id] || []).map(e => e.enhancement_id),
    });
  }

  // Stratagems
  const stratagems = raw.Stratagems.map(s => ({
    id: s.id,
    faction_id: s.faction_id,
    faction_name: factions[s.faction_id]?.name || s.faction_id,
    name: s.name,
    type: s.type || '',
    cp_cost: s.cp_cost || '',
    turn: s.turn || '',
    phase: s.phase || '',
    detachment: s.detachment || '',
    detachment_id: s.detachment_id || '',
    description: s.description || '',
    legend: s.legend === 'true',
  }));

  // Detachments
  const detachments = raw.Detachments.map(d => ({
    id: d.id,
    faction_id: d.faction_id,
    faction_name: factions[d.faction_id]?.name || d.faction_id,
    name: d.name,
    legend: d.legend || '',
    type: d.type || '',
  }));

  // Enhancements
  const enhancements = raw.Enhancements.map(e => ({
    id: e.id,
    faction_id: e.faction_id,
    faction_name: factions[e.faction_id]?.name || e.faction_id,
    name: e.name,
    cost: e.cost || '',
    detachment: e.detachment || '',
    detachment_id: e.detachment_id || '',
    description: e.description || '',
    legend: e.legend === 'true',
  }));

  // Shared abilities
  const sharedAbilities = raw.Abilities.map(a => ({
    id: a.id,
    name: a.name,
    faction_id: a.faction_id,
    description: a.description || '',
  }));

  return { factions, units, stratagems, detachments, enhancements, sharedAbilities };
}

function groupBy(arr, key) {
  const map = {};
  for (const item of arr) {
    const k = item[key];
    if (!map[k]) map[k] = [];
    map[k].push(item);
  }
  return map;
}

// Cache management
function saveToCache(db) {
  try {
    // Split into chunks if too large for localStorage
    const json = JSON.stringify(db);
    localStorage.setItem(CACHE_KEY, json);
    localStorage.setItem(CACHE_META_KEY, JSON.stringify({
      timestamp: Date.now(),
      unitCount: db.units.length,
      stratagemCount: db.stratagems.length,
    }));
    return true;
  } catch (e) {
    console.warn('Cache save failed (storage full?):', e);
    return false;
  }
}

function loadFromCache() {
  try {
    const json = localStorage.getItem(CACHE_KEY);
    if (!json) return null;
    const meta = JSON.parse(localStorage.getItem(CACHE_META_KEY) || '{}');
    const db = JSON.parse(json);
    db._meta = meta;
    return db;
  } catch (e) {
    return null;
  }
}

export function getCacheMeta() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_META_KEY) || 'null');
  } catch { return null; }
}

export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_META_KEY);
}

// Main loader
let _database = null;
let _loading = false;
let _listeners = [];

export function onLoadProgress(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

function notifyProgress(loaded, total, message) {
  for (const fn of _listeners) fn({ loaded, total, message });
}

export async function loadDatabase(forceRefresh = false) {
  if (_database && !forceRefresh) return _database;
  if (_loading) {
    // Wait for existing load
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (!_loading) { clearInterval(check); resolve(_database); }
      }, 100);
    });
  }

  // Try cache first
  if (!forceRefresh) {
    const cached = loadFromCache();
    if (cached && cached.units && cached.units.length > 0) {
      _database = cached;
      notifyProgress(CSV_FILES.length, CSV_FILES.length, 'Loaded from cache');
      return _database;
    }
  }

  _loading = true;
  notifyProgress(0, CSV_FILES.length, 'Starting download...');

  try {
    const raw = {};
    for (let i = 0; i < CSV_FILES.length; i++) {
      const name = CSV_FILES[i];
      notifyProgress(i, CSV_FILES.length, `Fetching ${name}...`);
      const text = await fetchCSV(name);
      raw[name] = parseCSV(text);
    }

    notifyProgress(CSV_FILES.length, CSV_FILES.length, 'Building database...');
    _database = buildDatabase(raw);
    saveToCache(_database);
    notifyProgress(CSV_FILES.length, CSV_FILES.length, 'Complete!');
    return _database;
  } catch (e) {
    console.error('Failed to load wahapedia data:', e);
    // Fall back to cache
    const cached = loadFromCache();
    if (cached) {
      _database = cached;
      return _database;
    }
    throw e;
  } finally {
    _loading = false;
  }
}

export function getDatabase() {
  return _database;
}

// Fuzzy match a unit name against the database
export function fuzzyMatchUnit(name, db) {
  if (!db || !db.units) return null;
  const lower = name.toLowerCase().trim();
  // Exact match
  let match = db.units.find(u => u.name.toLowerCase() === lower);
  if (match) return match;
  // Contains match
  match = db.units.find(u => u.name.toLowerCase().includes(lower) || lower.includes(u.name.toLowerCase()));
  if (match) return match;
  // Word overlap match
  const words = lower.split(/\s+/);
  let bestScore = 0, bestMatch = null;
  for (const u of db.units) {
    const uWords = u.name.toLowerCase().split(/\s+/);
    const overlap = words.filter(w => uWords.some(uw => uw.includes(w) || w.includes(uw))).length;
    const score = overlap / Math.max(words.length, uWords.length);
    if (score > bestScore && score >= 0.5) {
      bestScore = score;
      bestMatch = u;
    }
  }
  return bestMatch;
}
