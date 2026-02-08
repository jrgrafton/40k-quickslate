import { createElement as h, useState, useMemo, useRef, useEffect } from "react";
import UnitCard from "./UnitCard.js";
import { getWoundRoll, CHARGE_PROBABILITY, SAVE_VALUES, AP_VALUES, getModifiedSave, getRoleColor } from "../data/quick-reference.js";
import { runSimulation } from "../engine/simulator.js";
import { stripHtml } from "../utils/helpers.js";

// Highlight known 40k keywords in text
const GAME_KEYWORDS = [
  'Sustained Hits', 'Lethal Hits', 'Devastating Wounds', 'Feel No Pain',
  'Stealth', 'Lone Operative', 'Deadly Demise', 'Deep Strike', 'Infiltrators',
  'Scouts', 'Leader', 'Fights First', 'Firing Deck', 'Transport',
  'Ignores Cover', 'Indirect Fire', 'Torrent', 'Twin-linked', 'Anti-',
  'Precision', 'Hazardous', 'Blast', 'Melta', 'Lance', 'Assault', 'Heavy',
  'Pistol', 'Rapid Fire', 'One Shot', 'Overwatch', 'Battle-shock',
];

const KEYWORD_DEFINITIONS = {
  'Sustained Hits': 'Each time an attack is made with this weapon, if a Critical Hit is rolled, that attack scores a number of additional hits on the target as denoted by the number after the keyword.',
  'Lethal Hits': 'Each time an attack is made with this weapon, if a Critical Hit is rolled, that attack automatically wounds the target.',
  'Devastating Wounds': 'Each time an attack is made with this weapon, if a Critical Wound is rolled, the target suffers mortal wounds equal to the Damage characteristic and the attack sequence ends.',
  'Feel No Pain': 'Each time this model would lose a wound, roll a D6; if the result equals or exceeds the Feel No Pain value, that wound is not lost.',
  'Stealth': 'If every model in a unit has this ability, then each time a ranged attack is made against it, subtract 1 from that attack\'s Hit roll.',
  'Lone Operative': 'Unless part of an Attached unit, this unit can only be selected as the target of a ranged attack if the attacking model is within 12".',
  'Deadly Demise': 'When this model is destroyed, roll one D6. On a 6, each unit within 6" suffers a number of mortal wounds denoted by the number after the keyword.',
  'Deep Strike': 'During the Declare Battle Formations step, this unit can be set up in Reserves instead of on the battlefield. At the end of your Movement phase, set it up anywhere on the battlefield more than 9" from all enemy models.',
  'Infiltrators': 'During deployment, this unit can be set up anywhere on the battlefield that is more than 9" horizontally away from the enemy deployment zone and all enemy models.',
  'Scouts': 'At the start of the first battle round, before the first turn begins, this unit can make a Normal move of up to the distance denoted (e.g. 6").',
  'Leader': 'This model can be attached to a specific unit to form an Attached unit.',
  'Fights First': 'Units with this ability that are eligible to fight do so in the Fights First step, before all other eligible units.',
  'Firing Deck': 'Each time this Transport shoots, select a number of models embarked within it (as denoted). Until that shooting is resolved, those models are treated as if they were within range/line of sight of the target.',
  'Transport': 'This model can transport models as described in its Transport capacity.',
  'Ignores Cover': 'Each time an attack is made with this weapon, the target cannot have the Benefit of Cover against that attack.',
  'Indirect Fire': 'This weapon can target units not visible to the attacking model. If doing so, subtract 1 from that attack\'s Hit roll, and the target has the Benefit of Cover.',
  'Torrent': 'Each time an attack is made with this weapon, that attack automatically hits the target.',
  'Twin-linked': 'Each time an attack is made with this weapon, you can re-roll that attack\'s Wound roll.',
  'Precision': 'Each time an attack made with this weapon scores a Critical Hit against an Attached unit, if a Character model is visible, the attacking model can choose to have that attack allocated to the Character.',
  'Hazardous': 'After a unit shoots or fights, roll one Hazardous test (D6) for each Hazardous weapon used. For each 1, one model equipped with a Hazardous weapon is destroyed.',
  'Blast': 'Add 1 to the Attacks characteristic of this weapon for each five models in the target unit (rounding down).',
  'Melta': 'Each time an attack made with this weapon targets a unit within half the weapon\'s range, increase the Damage by the amount denoted.',
  'Lance': 'Each time an attack is made with this weapon, if the bearer made a Charge move this turn, add 1 to that attack\'s Wound roll.',
  'Assault': 'This weapon can be used even if the bearer Advanced this turn.',
  'Heavy': 'If the bearer\'s unit Remained Stationary this turn, add 1 to this weapon\'s Hit rolls.',
  'Pistol': 'This weapon can be used even if the bearer\'s unit is within Engagement Range of enemy units, but must target one of those enemy units.',
  'Rapid Fire': 'Each time this weapon is used to make a ranged attack against a target within half range, increase the Attacks by the amount denoted.',
  'One Shot': 'The bearer can only shoot with this weapon once per battle.',
  'Overwatch': 'Reactive stratagem allowing a unit to shoot at an enemy that is making a Normal, Advance, or Fall Back move, or charging.',
  'Battle-shock': 'While a unit is Battle-shocked, its OC is 0, it cannot be used for Stratagems, and its models cannot use abilities other than those stated otherwise.',
};

function highlightKeywords(text) {
  if (!text) return text;
  const parts = [];
  let remaining = text;
  let keyIdx = 0;
  while (remaining.length > 0) {
    let earliest = -1, earliestLen = 0, earliestKw = '';
    for (const kw of GAME_KEYWORDS) {
      const idx = remaining.toLowerCase().indexOf(kw.toLowerCase());
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        // For "Anti-", match until the next space or comma
        let matchLen = kw.length;
        if (kw === 'Anti-') {
          const after = remaining.slice(idx + kw.length);
          const endMatch = after.match(/^[\w]+(\s*\d+\+)?/);
          if (endMatch) matchLen += endMatch[0].length;
        }
        earliest = idx;
        earliestLen = matchLen;
        earliestKw = remaining.slice(idx, idx + matchLen);
      }
    }
    if (earliest === -1) {
      parts.push(remaining);
      break;
    }
    if (earliest > 0) parts.push(remaining.slice(0, earliest));
    // Find matching base keyword for tooltip lookup
    const baseKw = GAME_KEYWORDS.find(k => earliestKw.toLowerCase().startsWith(k.toLowerCase())) || earliestKw;
    const tooltip = KEYWORD_DEFINITIONS[baseKw] || KEYWORD_DEFINITIONS[earliestKw] || '';
    parts.push(h("span", { key: 'kw' + (keyIdx++), className: "kw-pill", title: tooltip }, earliestKw));
    remaining = remaining.slice(earliest + earliestLen);
  }
  return parts;
}

function parseStratagemSections(text) {
  const whenMatch = text.match(/WHEN:\s*(.*?)(?=TARGET:|EFFECT:|RESTRICTIONS:|$)/is);
  const targetMatch = text.match(/TARGET:\s*(.*?)(?=EFFECT:|RESTRICTIONS:|$)/is);
  const effectMatch = text.match(/EFFECT:\s*(.*?)(?=RESTRICTIONS:|$)/is);
  const restrictMatch = text.match(/RESTRICTIONS:\s*(.*?)$/is);
  if (!whenMatch && !targetMatch && !effectMatch) return null;
  return {
    when: whenMatch ? whenMatch[1].trim() : null,
    target: targetMatch ? targetMatch[1].trim() : null,
    effect: effectMatch ? effectMatch[1].trim() : null,
    restrictions: restrictMatch ? restrictMatch[1].trim() : null,
  };
}

function renderStanceRule(text, ruleName) {
  const nameLower = (ruleName || '').toLowerCase();
  
  // Hardcode well-known stance rules for clean display
  if (nameLower.includes("ka'tah") && !nameLower.includes("mastery")) {
    return h("div", null,
      h("div", { className: "stance-header" }, "⚔️ SELECT ONE STANCE EACH TIME THIS UNIT FIGHTS:"),
      h("div", { className: "stance-options" },
        h("div", { className: "stance-card" }, ...highlightKeywords("■ DACATARAI: Melee weapons have [Sustained Hits 1]")),
        h("div", { className: "stance-card" }, ...highlightKeywords("■ RENDAX: Melee weapons have [Lethal Hits]")),
      ),
    );
  }
  
  if (nameLower.includes("martial mastery")) {
    return h("div", null,
      h("div", { style: { marginBottom: 8 } }, ...highlightKeywords("At the start of the Fight phase, this unit can change its Ka'tah stance.")),
      h("div", { className: "stance-header" }, "⚔️ STANCE OPTIONS:"),
      h("div", { className: "stance-options" },
        h("div", { className: "stance-card" }, ...highlightKeywords("■ DACATARAI: Melee weapons have [Sustained Hits 1]")),
        h("div", { className: "stance-card" }, ...highlightKeywords("■ RENDAX: Melee weapons have [Lethal Hits]")),
      ),
    );
  }
  
  // Generic: split by newlines and display with proper formatting
  const lines = text.split(/\n/).filter(l => l.trim());
  const stances = [];
  const preamble = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-•■]\s/.test(trimmed) || /^Each time/.test(trimmed) || /^Improve/.test(trimmed)) {
      stances.push(trimmed.replace(/^[-•■]\s*/, ''));
    } else {
      preamble.push(trimmed);
    }
  }
  
  return h("div", null,
    preamble.length > 0 && h("div", { style: { marginBottom: 8 } }, ...highlightKeywords(preamble.join(' '))),
    stances.length >= 2 && h("div", { className: "stance-header" }, "⚔️ SELECT ONE STANCE PER FIGHT:"),
    h("div", { className: "stance-options" },
      ...stances.map((s, i) =>
        h("div", { key: i, className: "stance-card" }, ...highlightKeywords(s))
      ),
    ),
  );
}

export default function BattleDashboard({ army, db }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [simAttackerIdx, setSimAttackerIdx] = useState(0);
  const [simWeaponIdx, setSimWeaponIdx] = useState(0);
  const [simDefenderId, setSimDefenderId] = useState("");
  const [simDefModels, setSimDefModels] = useState(5);
  const [simAttackModels, setSimAttackModels] = useState(1);
  const [simCover, setSimCover] = useState(false);
  const [simFnp, setSimFnp] = useState(0);
  const [simResult, setSimResult] = useState(null);
  const [stratSearch, setStratSearch] = useState("");
  // Leader attachment state: { [characterUnitIndex]: bodyguardUnitIndex }
  const [leaderAttachments, setLeaderAttachments] = useState({});
  // Ungrouping state
  const [ungroupedNames, setUngroupedNames] = useState(new Set());
  // Searchable enemy dropdown
  const [enemySearch, setEnemySearch] = useState("");
  const [enemyDropdownOpen, setEnemyDropdownOpen] = useState(false);
  const enemyDropdownRef = useRef(null);
  // Army rules expand state
  const [expandedRules, setExpandedRules] = useState(new Set());
  // Stratagem type collapse state
  const [collapsedStratTypes, setCollapsedStratTypes] = useState(new Set());

  if (!army) {
    return h("div", { className: "empty-state" },
      h("p", null, "No army loaded. Go to Import Army to load your list."),
    );
  }

  // Find the detachment_id that matches army.detachment
  const detachmentObj = useMemo(() => {
    if (!db?.detachments || !army.detachment) return null;
    const detName = army.detachment.toLowerCase().trim();
    return db.detachments.find(d => d.name.toLowerCase().trim() === detName) || 
           db.detachments.find(d => d.name.toLowerCase().includes(detName) || detName.includes(d.name.toLowerCase()));
  }, [db, army.detachment]);

  // Get stratagems: filtered by detachment + core (no faction_id)
  const stratagems = useMemo(() => {
    if (!db?.stratagems) return [];
    const detId = detachmentObj?.id;
    const detName = (army.detachment || '').toLowerCase().trim();
    
    return db.stratagems.filter(s => {
      if (s.legend) return false;
      // Core stratagems (no faction_id)
      if (!s.faction_id || s.faction_id === '') return true;
      // Match by detachment_id or detachment name
      if (detId && s.detachment_id === detId) return true;
      if (detName && (s.detachment || '').toLowerCase().includes(detName)) return true;
      return false;
    });
  }, [db, detachmentObj, army.detachment]);

  const filteredStratagems = useMemo(() => {
    if (!stratSearch) return stratagems;
    const q = stratSearch.toLowerCase();
    return stratagems.filter(s =>
      s.name.toLowerCase().includes(q) || stripHtml(s.description).toLowerCase().includes(q)
    );
  }, [stratagems, stratSearch]);

  // Army rules from shared abilities
  const armyRules = useMemo(() => {
    if (!db?.sharedAbilities || !army.faction) return [];
    const factionLower = army.faction.toLowerCase();
    // Find faction_id that matches
    let factionId = null;
    if (db.factions) {
      for (const [id, f] of Object.entries(db.factions)) {
        if (f.name.toLowerCase().includes(factionLower) || factionLower.includes(f.name.toLowerCase())) {
          factionId = id;
          break;
        }
      }
    }
    if (!factionId) return [];
    return db.sharedAbilities.filter(a => a.faction_id === factionId && a.name && a.description);
  }, [db, army.faction]);

  // Group identical units (respecting ungroupedNames)
  const groupedUnits = useMemo(() => {
    const groups = [];
    const seen = new Map(); // name -> group index
    const nameCounters = new Map(); // for ungrouped naming
    army.units.forEach((u, i) => {
      const name = (u.name || u.datasheet?.name || '').toLowerCase().trim();
      const isUngrouped = ungroupedNames.has(name);
      if (isUngrouped) {
        const count = (nameCounters.get(name) || 0) + 1;
        nameCounters.set(name, count);
        const displayName = (u.name || u.datasheet?.name || '') + ` (${count})`;
        groups.push({ units: [{ ...u, originalIndex: i }], count: 1, totalPoints: u.points || 0, ungroupedDisplayName: displayName, ungroupedBaseName: name });
      } else if (seen.has(name)) {
        const gi = seen.get(name);
        groups[gi].units.push({ ...u, originalIndex: i });
        groups[gi].count++;
        groups[gi].totalPoints += (u.points || 0);
      } else {
        seen.set(name, groups.length);
        groups.push({ units: [{ ...u, originalIndex: i }], count: 1, totalPoints: u.points || 0 });
      }
    });
    return groups;
  }, [army.units, ungroupedNames]);

  // Leader attachment data — supports both wahapedia leader_attachments AND BattleScribe leaderTargets
  const leaderData = useMemo(() => {
    if (!db && !army.units.some(u => u.leaderTargets)) return { characters: [], targets: {} };
    const characters = [];
    const targets = {}; // charIndex -> [{ armyIndex, name }]
    
    army.units.forEach((u, i) => {
      const ds = u.datasheet;
      let validTargets = [];

      // Path 1: wahapedia leader_attachments
      if (ds && ds.leader_attachments && ds.leader_attachments.length > 0) {
        validTargets = ds.leader_attachments.map(attachedId => {
          let matchIdx = army.units.findIndex((au, j) => j !== i && au.datasheet?.id === attachedId);
          if (matchIdx < 0 && db) {
            const targetUnit = db.units.find(u2 => u2.id === attachedId);
            if (targetUnit) {
              const targetName = targetUnit.name.toLowerCase().trim();
              matchIdx = army.units.findIndex((au, j) => {
                if (j === i) return false;
                const auName = (au.datasheet?.name || au.name || '').toLowerCase().trim();
                return auName === targetName || auName.includes(targetName) || targetName.includes(auName);
              });
            }
          }
          const matchUnit = db?.units?.find(u2 => u2.id === attachedId);
          return { armyIndex: matchIdx, name: matchUnit?.name || attachedId };
        }).filter(t => t.armyIndex >= 0);
      }

      // Path 2: BattleScribe leaderTargets from parsed abilities
      if (validTargets.length === 0 && u.leaderTargets && u.leaderTargets.length > 0) {
        for (const targetName of u.leaderTargets) {
          const tLower = targetName.toLowerCase().trim();
          const isAllCaps = targetName === targetName.toUpperCase() && targetName.includes(' ');
          
          army.units.forEach((au, j) => {
            if (j === i) return;
            const auName = (au.datasheet?.name || au.name || '').toLowerCase().trim();
            
            if (isAllCaps) {
              // Keyword-based matching: all words must appear in unit keywords/categories
              const words = tLower.split(/\s+/);
              const unitKeywords = (au.keywords || []).concat(au.datasheet?.keywords || []).map(k => k.toLowerCase());
              const allMatch = words.every(w => unitKeywords.some(k => k.includes(w)));
              if (allMatch && !validTargets.some(t => t.armyIndex === j)) {
                validTargets.push({ armyIndex: j, name: au.datasheet?.name || au.name || targetName });
              }
            } else {
              // Name-based matching
              if (auName === tLower || auName.includes(tLower) || tLower.includes(auName)) {
                if (!validTargets.some(t => t.armyIndex === j)) {
                  validTargets.push({ armyIndex: j, name: au.datasheet?.name || au.name });
                }
              }
            }
          });
        }
      }

      if (validTargets.length > 0) {
        characters.push(i);
        targets[i] = validTargets;
      }
    });
    return { characters, targets };
  }, [army.units, db]);

  const allUnits = db?.units || [];

  function runQuickSim() {
    const attackerUnit = army.units[simAttackerIdx];
    if (!attackerUnit) return;
    const allWeapons = attackerUnit.datasheet?.weapons || attackerUnit.weapons || [];
    const weapon = allWeapons[simWeaponIdx];
    if (!weapon) return;
    const defender = allUnits.find(u => u.id === simDefenderId);
    if (!defender) return;
    const defModel = defender.models?.[0] || {};
    const parseN = (s) => { const n = parseInt(String(s).replace(/[^0-9]/g, '')); return isNaN(n) ? 4 : n; };
    const T = parseN(defModel.T || defender.T || 4);
    const Sv = parseN(defModel.Sv || defender.Sv || 4);
    const W = parseN(defModel.W || defender.W || 1);
    const inv = defModel.inv_sv && defModel.inv_sv !== '-' ? parseN(defModel.inv_sv) : null;

    // Parse weapon keywords
    const desc = (weapon.description || '').toLowerCase();
    const sustainedMatch = desc.match(/sustained hits\s*(\d+)/i);
    const lethalHits = /lethal hits/i.test(desc);
    const devWounds = /devastating wounds/i.test(desc);
    const twinLinked = /twin-linked/i.test(desc);
    const antiMatch = desc.match(/anti-\w+\s*(\d+)\+/i);

    const opts = {
      attacks: weapon.A, skill: parseN(weapon.BS_WS || weapon.BS || weapon.WS || 3),
      S: parseN(weapon.S || 4), T, AP: Math.abs(parseN(weapon.AP || 0)),
      D: weapon.D, Sv, invuln: inv,
      fnp: simFnp > 0 ? simFnp : null,
      wounds: W, models: simDefModels,
      attackingModels: simAttackModels,
      cover: simCover,
      sustainedHits: sustainedMatch ? parseInt(sustainedMatch[1]) : 0,
      lethalHits, devastatingWounds: devWounds,
      twinLinked,
      antiCrit: antiMatch ? parseInt(antiMatch[1]) : 0,
    };
    setSimResult(runSimulation(opts, 5000));
  }

  function attachLeader(charIdx, bodyguardIdx) {
    setLeaderAttachments(prev => {
      const next = { ...prev };
      if (bodyguardIdx === -1) {
        delete next[charIdx];
      } else {
        next[charIdx] = bodyguardIdx;
      }
      return next;
    });
  }

  // Build display units accounting for leader attachments
  const bodyguardToLeader = {};
  for (const [charIdx, bgIdx] of Object.entries(leaderAttachments)) {
    if (!bodyguardToLeader[bgIdx]) bodyguardToLeader[bgIdx] = [];
    bodyguardToLeader[bgIdx].push(Number(charIdx));
  }

  const typeColor = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('battle')) return 'stratagem-battle';
    if (t.includes('strategic')) return 'stratagem-strategic';
    if (t.includes('epic')) return 'stratagem-epic';
    return '';
  };

  return h("div", { className: "battle-layout" },
    // Army Overview Bar
    h("div", { className: "army-overview-bar" },
      h("div", { className: "army-overview-item" },
        h("span", { className: "army-overview-label" }, "FACTION"),
        h("span", { className: "army-overview-value" }, army.faction || "Unknown"),
      ),
      h("div", { className: "army-overview-item" },
        h("span", { className: "army-overview-label" }, "DETACHMENT"),
        h("span", { className: "army-overview-value" }, army.detachment || "—"),
      ),
      h("div", { className: "army-overview-item" },
        h("span", { className: "army-overview-label" }, "POINTS"),
        h("span", { className: "army-overview-value army-overview-pts" }, army.points),
      ),
      h("div", { className: "army-overview-item" },
        h("span", { className: "army-overview-label" }, "UNITS"),
        h("span", { className: "army-overview-value" }, army.units.length),
      ),
      h("button", {
        className: "btn btn-sm sidebar-toggle",
        onClick: () => setSidebarOpen(!sidebarOpen),
      }, sidebarOpen ? "Hide Ref ▶" : "◀ Show Ref"),
    ),

    h("div", { className: "battle-content" },
      // Main content area
      h("div", { className: "battle-main" },
        // Unit Cards Grid
        h("div", { className: "unit-cards-grid" },
          ...groupedUnits.map((group, gi) => {
            const u = group.units[0];
            const i = u.originalIndex;
            const ds = u.datasheet;
            const leaders = (bodyguardToLeader[i] || []).map(ci => army.units[ci]);
            const isCharacter = leaderData.characters.includes(i);
            const rawTargets = leaderData.targets[i] || [];
            // Annotate targets with group info and instance labels
            const validTargets = rawTargets.map(t => {
              const targetGroup = groupedUnits.find(g => g.units.some(u => u.originalIndex === t.armyIndex));
              const gc = targetGroup ? targetGroup.count : 1;
              const instanceLabel = targetGroup?.ungroupedDisplayName
                ? (army.units[t.armyIndex]?.name || t.name)
                : t.name;
              return { ...t, groupCount: gc, instanceLabel: gc > 1 ? t.name : instanceLabel };
            });

            const displayName = group.ungroupedDisplayName || null;
            const onUngroup = group.count > 1 ? (name) => {
              setUngroupedNames(prev => { const next = new Set(prev); next.add(name.toLowerCase().trim()); return next; });
            } : null;
            const onRegroup = group.ungroupedBaseName ? () => {
              setUngroupedNames(prev => { const next = new Set(prev); next.delete(group.ungroupedBaseName); return next; });
            } : null;

            // Find what this character is leading (if anything)
            const leadingIdx = leaderAttachments[i];
            const leadingUnit = leadingIdx !== undefined ? army.units[leadingIdx] : null;
            const leadingName = leadingUnit ? (leadingUnit.datasheet?.name || leadingUnit.name || '') : null;

            const unitEl = ds
              ? h(UnitCard, {
                  key: 'g' + gi,
                  unit: { ...ds, points: group.totalPoints, ...(displayName ? { name: displayName } : {}) },
                  compact: true,
                  battleMode: true,
                  parsedData: u,
                  groupCount: group.count,
                  attachedLeaders: leaders,
                  isCharacter,
                  validLeaderTargets: validTargets,
                  onAttachLeader: isCharacter ? (targetIdx) => attachLeader(i, targetIdx) : null,
                  currentAttachment: leaderAttachments[i],
                  leadingName,
                  onUngroup,
                  onRegroup,
                })
              : h(UnitCard, {
                  key: 'g' + gi,
                  unit: { ...buildUnitFromParsed(u), ...(displayName ? { name: displayName } : {}) },
                  compact: true,
                  battleMode: true,
                  parsedData: u,
                  groupCount: group.count,
                  onUngroup,
                  onRegroup,
                });
            return unitEl;
          }).filter(Boolean),
        ),

        // Quick Sim Strip
        h("div", { className: "quick-sim-strip" },
          h("h3", { className: "section-title" }, "⚡ Quick Sim"),
          h("div", { className: "quick-sim-row" },
            h("div", { className: "field" },
              h("label", null, "Your Unit"),
              h("select", { className: "select", value: simAttackerIdx,
                onChange: e => { setSimAttackerIdx(+e.target.value); setSimWeaponIdx(0); setSimResult(null); } },
                ...army.units.map((u, i) => h("option", { key: i, value: i }, u.name || u.datasheet?.name)),
              ),
            ),
            h("div", { className: "field" },
              h("label", null, "Weapon"),
              (() => {
                const au = army.units[simAttackerIdx];
                const weapons = au?.datasheet?.weapons || au?.weapons || [];
                return h("select", { className: "select", value: simWeaponIdx,
                  onChange: e => { setSimWeaponIdx(+e.target.value); setSimResult(null); } },
                  ...weapons.map((w, i) => h("option", { key: i, value: i },
                    `${w.name} (S:${w.S} AP:${w.AP} D:${w.D}${w.description ? ' [' + w.description.slice(0, 20) + ']' : ''})`)),
                );
              })(),
            ),
            h("div", { className: "field" },
              h("label", null, "# Attacking Models"),
              h("input", { className: "input", type: "number", min: 1, max: 30, value: simAttackModels,
                onChange: e => setSimAttackModels(+e.target.value), style: { width: 60 } }),
            ),
            h("div", { className: "field search-dropdown", ref: enemyDropdownRef },
              h("label", null, "Enemy Unit"),
              h("input", {
                className: "input",
                placeholder: "Search enemy unit...",
                value: enemyDropdownOpen ? enemySearch : (allUnits.find(u => u.id === simDefenderId)?.name || enemySearch),
                onFocus: () => { setEnemyDropdownOpen(true); setEnemySearch(""); },
                onChange: e => { setEnemySearch(e.target.value); setEnemyDropdownOpen(true); },
                onBlur: () => { setTimeout(() => setEnemyDropdownOpen(false), 200); },
              }),
              enemyDropdownOpen && h("div", { className: "search-dropdown-list" },
                ...(() => {
                  const q = enemySearch.toLowerCase();
                  return allUnits.filter(u => !u.legend && (!q || u.name.toLowerCase().includes(q))).slice(0, 20).map(u => {
                    const m = u.models?.[0] || {};
                    return h("div", {
                      key: u.id, className: "search-dropdown-item",
                      onMouseDown: e => { e.preventDefault(); setSimDefenderId(u.id); setEnemySearch(u.name); setEnemyDropdownOpen(false); setSimResult(null); },
                    },
                      h("span", null, u.name),
                      h("span", { className: "dd-stats" }, `T${m.T||'?'} Sv${m.Sv||'?'}`),
                    );
                  });
                })(),
              ),
            ),
            h("div", { className: "field" },
              h("label", null, "Def Models"),
              h("input", { className: "input", type: "number", min: 1, max: 30, value: simDefModels,
                onChange: e => setSimDefModels(+e.target.value), style: { width: 60 } }),
            ),
            h("div", { className: "field" },
              h("label", null, "FNP (0=none)"),
              h("input", { className: "input", type: "number", min: 0, max: 6, value: simFnp,
                onChange: e => setSimFnp(+e.target.value), style: { width: 60 } }),
            ),
            h("div", { className: "field" },
              h("label", null, "Cover"),
              h("button", {
                className: `cover-toggle ${simCover ? 'active' : ''}`,
                onClick: () => setSimCover(!simCover),
              }, "Cover"),
            ),
            h("button", { className: "btn btn-sm sim-inline-btn", onClick: runQuickSim, style: { alignSelf: 'flex-end', height: 32, whiteSpace: 'nowrap' } }, "⚡ Sim"),
          ),
          simResult && (() => {
            const defender = allUnits.find(u => u.id === simDefenderId);
            const defModel = defender?.models?.[0] || {};
            const parseN = (s) => { const n = parseInt(String(s).replace(/[^0-9]/g, '')); return isNaN(n) ? '?' : n; };
            const dT = parseN(defModel.T || defender?.T || '?');
            const dSv = parseN(defModel.Sv || defender?.Sv || '?');
            const dW = parseN(defModel.W || defender?.W || '?');
            const dInv = defModel.inv_sv && defModel.inv_sv !== '-' ? parseN(defModel.inv_sv) : null;
            const defStr = `vs T${dT} Sv${dSv}+${dInv ? ' Inv' + dInv + '+' : ''} W${dW}`;
            return h("div", { className: "quick-sim-results" },
              h("span", { className: "sim-result-item" }, h("strong", null, simResult.mean.toFixed(1)), " avg dmg"),
              h("span", { className: "sim-result-item" }, h("strong", null, simResult.meanKills.toFixed(1)), " avg kills"),
              h("span", { className: "sim-result-item" }, h("strong", null, (simResult.wipeChance * 100).toFixed(1) + "%"), " wipe"),
              h("span", { className: "sim-result-item" }, h("strong", null, simResult.min + "–" + simResult.max), " range"),
              h("span", { className: "sim-result-item", style: { color: '#8a8070', fontSize: 11 } }, defStr),
            );
          })(),
        ),

        // Stratagems section (moved from sidebar to main body)
        stratagems.length > 0 && (() => {
          // Split into detachment vs core stratagems
          const detachmentStrats = filteredStratagems.filter(s => s.detachment || s.detachment_id);
          const coreStrats = filteredStratagems.filter(s => !s.detachment && !s.detachment_id);
          
          // Group core by type
          const grouped = {};
          coreStrats.forEach(s => {
            const type = s.type || 'Other';
            if (!grouped[type]) grouped[type] = [];
            grouped[type].push(s);
          });
          const typeOrder = ['Battle Tactic', 'Strategic Ploy', 'Epic Deed', 'Other'];
          const sortedTypes = typeOrder.filter(t => grouped[t]).concat(Object.keys(grouped).filter(t => !typeOrder.includes(t)));
          
          const detSectionName = (army.detachment || 'Detachment') + ' Stratagems';

          const typePillClass = (type) => {
            const t = (type || '').toLowerCase();
            if (t.includes('battle')) return 'battle';
            if (t.includes('strategic')) return 'strategic';
            if (t.includes('epic')) return 'epic';
            return '';
          };

          return h("div", { className: "stratagems-main-section" },
            h("h3", { className: "section-title" }, `Stratagems (${filteredStratagems.length})`),
            h("input", {
              className: "input",
              placeholder: "Search stratagems...",
              value: stratSearch,
              onChange: e => setStratSearch(e.target.value),
              style: { marginBottom: 10, maxWidth: 400 },
            }),
            // Detachment stratagems first
            detachmentStrats.length > 0 && h("div", { className: "strat-type-group" },
              h("div", {
                className: "strat-type-header strat-detachment-header",
                onClick: () => setCollapsedStratTypes(prev => {
                  const next = new Set(prev);
                  next.has('__detachment__') ? next.delete('__detachment__') : next.add('__detachment__');
                  return next;
                }),
              }, `⚔️ ${detSectionName} (${detachmentStrats.length})`, collapsedStratTypes.has('__detachment__') ? "▶" : "▼"),
              !collapsedStratTypes.has('__detachment__') && h("div", { className: "stratagems-grid" },
                ...detachmentStrats.map((s, i) => {
                  const rawDesc = stripHtml(s.description);
                  const sections = parseStratagemSections(rawDesc);
                  return h("div", { key: 'det' + i, className: `stratagem-card-v2 ${typeColor(s.type)}` },
                    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
                      h("div", null,
                        h("span", { className: `strat-type-pill ${typePillClass(s.type)}` }, s.type || 'Stratagem'),
                        h("div", { className: "strat-name-v2" }, s.name),
                        s.phase && h("span", { className: "strat-phase-tag" }, s.phase),
                      ),
                      h("span", { className: "strat-cp-badge" }, s.cp_cost + " CP"),
                    ),
                    h("div", { style: { fontSize: 10, color: "#5a5548", marginTop: 2 } },
                      [s.turn, s.detachment].filter(Boolean).join(' • ')),
                    sections ? h("div", { className: "strat-desc-v2 strat-sections" },
                      sections.when && h("div", { className: "strat-section" },
                        h("span", { className: "strat-section-label" }, "WHEN: "),
                        ...highlightKeywords(sections.when),
                      ),
                      sections.target && h("div", { className: "strat-section" },
                        h("span", { className: "strat-section-label" }, "TARGET: "),
                        ...highlightKeywords(sections.target),
                      ),
                      sections.effect && h("div", { className: "strat-section" },
                        h("span", { className: "strat-section-label" }, "EFFECT: "),
                        ...highlightKeywords(sections.effect),
                      ),
                      sections.restrictions && h("div", { className: "strat-section" },
                        h("span", { className: "strat-section-label" }, "RESTRICTIONS: "),
                        ...highlightKeywords(sections.restrictions),
                      ),
                    ) : h("div", { className: "strat-desc-v2" }, ...highlightKeywords(rawDesc)),
                  );
                }),
              ),
            ),
            // Core stratagems by type
            ...sortedTypes.map(type =>
              h("div", { key: type, className: "strat-type-group" },
                h("div", {
                  className: "strat-type-header",
                  onClick: () => setCollapsedStratTypes(prev => {
                    const next = new Set(prev);
                    next.has(type) ? next.delete(type) : next.add(type);
                    return next;
                  }),
                }, type + ` (${grouped[type].length})`, collapsedStratTypes.has(type) ? "▶" : "▼"),
                !collapsedStratTypes.has(type) && h("div", { className: "stratagems-grid" },
                  ...grouped[type].map((s, i) => {
                    // Parse WHEN/TARGET/EFFECT from description
                    const rawDesc = stripHtml(s.description);
                    const sections = parseStratagemSections(rawDesc);
                    
                    return h("div", { key: i, className: `stratagem-card-v2 ${typeColor(s.type)}` },
                      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
                        h("div", null,
                          h("span", { className: `strat-type-pill ${typePillClass(s.type)}` }, s.type || 'Stratagem'),
                          h("div", { className: "strat-name-v2" }, s.name),
                          s.phase && h("span", { className: "strat-phase-tag" }, s.phase),
                        ),
                        h("span", { className: "strat-cp-badge" }, s.cp_cost + " CP"),
                      ),
                      h("div", { style: { fontSize: 10, color: "#5a5548", marginTop: 2 } },
                        [s.turn, s.detachment].filter(Boolean).join(' • ')),
                      sections ? h("div", { className: "strat-desc-v2 strat-sections" },
                        sections.when && h("div", { className: "strat-section" },
                          h("span", { className: "strat-section-label" }, "WHEN: "),
                          ...highlightKeywords(sections.when),
                        ),
                        sections.target && h("div", { className: "strat-section" },
                          h("span", { className: "strat-section-label" }, "TARGET: "),
                          ...highlightKeywords(sections.target),
                        ),
                        sections.effect && h("div", { className: "strat-section" },
                          h("span", { className: "strat-section-label" }, "EFFECT: "),
                          ...highlightKeywords(sections.effect),
                        ),
                        sections.restrictions && h("div", { className: "strat-section" },
                          h("span", { className: "strat-section-label" }, "RESTRICTIONS: "),
                          ...highlightKeywords(sections.restrictions),
                        ),
                      ) : h("div", { className: "strat-desc-v2" }, ...highlightKeywords(rawDesc)),
                    );
                  }),
                ),
              )
            ),
          );
        })(),
      ),

      // Quick Reference Sidebar
      sidebarOpen && h("div", { className: "battle-sidebar" },
        // Army Rules
        armyRules.length > 0 && h("div", { className: "ref-section" },
          h("h4", { className: "ref-title" }, "Army Rules"),
          ...armyRules.map((r, i) => {
            const desc = stripHtml(r.description);
            const isKatah = r.name && r.name.toLowerCase().includes("ka'tah");
            const isMastery = r.name && r.name.toLowerCase().includes("martial mastery");
            
            return h("div", { key: i, className: "army-rule-card", onClick: () => {
              setExpandedRules(prev => {
                const next = new Set(prev);
                next.has(i) ? next.delete(i) : next.add(i);
                return next;
              });
            }},
              h("div", { className: "army-rule-header" }, r.name, expandedRules.has(i) ? "▼" : "▶"),
              expandedRules.has(i) && h("div", { className: "army-rule-body", onClick: e => e.stopPropagation() },
                (isKatah || isMastery) ? renderStanceRule(desc, r.name) : h("span", { style: { whiteSpace: 'pre-line' } }, ...highlightKeywords(desc)),
              ),
            );
          }),
        ),

        // Turn Order
        h("div", { className: "ref-section" },
          h("h4", { className: "ref-title" }, "Turn Order"),
          ...[ 
            ["1. Command Phase", "Battle-shock tests, use abilities"],
            ["2. Movement Phase", "Move, Advance, Fall Back"],
            ["3. Shooting Phase", "Select targets, resolve attacks"],
            ["4. Charge Phase", "Declare charges, roll 2D6"],
            ["5. Fight Phase", "Pile in, make attacks, consolidate"],
          ].map(([title, desc], i) =>
            h("div", { key: i, style: { padding: '3px 0', fontSize: 11 } },
              h("span", { style: { color: '#c9a84c', fontWeight: 700 } }, title),
              h("span", { style: { color: '#8a8070', marginLeft: 6 } }, desc),
            )
          ),
        ),

        // Wound Roll Table
        h("div", { className: "ref-section" },
          h("h4", { className: "ref-title" }, "Wound Roll Table"),
          h("div", { className: "ref-table-wrap" },
            h("table", { className: "ref-table" },
              h("thead", null,
                h("tr", null,
                  h("th", null, "S\\T"),
                  ...[3, 4, 5, 6, 7, 8, 9, 10, 12].map(t => h("th", { key: t }, t)),
                ),
              ),
              h("tbody", null,
                ...[3, 4, 5, 6, 7, 8, 9, 10, 12, 14].map(s =>
                  h("tr", { key: s },
                    h("td", { className: "ref-row-header" }, s),
                    ...[3, 4, 5, 6, 7, 8, 9, 10, 12].map(t => {
                      const roll = getWoundRoll(s, t);
                      const cls = roll <= 3 ? "ref-good" : roll <= 4 ? "ref-ok" : "ref-bad";
                      return h("td", { key: t, className: cls }, roll + "+");
                    }),
                  )
                ),
              ),
            ),
          ),
        ),

        // Charge Probability
        h("div", { className: "ref-section" },
          h("h4", { className: "ref-title" }, "Charge Probability"),
          h("div", { className: "charge-grid" },
            ...CHARGE_PROBABILITY.filter(c => c.distance >= 4).map(c =>
              h("div", { key: c.distance, className: "charge-item" },
                h("span", { className: "charge-dist" }, c.distance + '"'),
                h("span", {
                  className: `charge-pct ${c.pct >= 60 ? 'ref-good' : c.pct >= 30 ? 'ref-ok' : 'ref-bad'}`
                }, c.pct.toFixed(1) + "%"),
              )
            ),
          ),
        ),

        // Save Grid
        h("div", { className: "ref-section" },
          h("h4", { className: "ref-title" }, "Modified Save (AP vs Sv)"),
          h("div", { className: "ref-table-wrap" },
            h("table", { className: "ref-table" },
              h("thead", null,
                h("tr", null,
                  h("th", null, "AP\\Sv"),
                  ...SAVE_VALUES.map(sv => h("th", { key: sv }, sv + "+")),
                ),
              ),
              h("tbody", null,
                ...AP_VALUES.map(ap =>
                  h("tr", { key: ap },
                    h("td", { className: "ref-row-header" }, ap),
                    ...SAVE_VALUES.map(sv => {
                      const mod = getModifiedSave(sv, ap);
                      const display = mod > 6 ? "—" : mod + "+";
                      const cls = mod > 6 ? "ref-bad" : mod <= 3 ? "ref-good" : mod <= 5 ? "ref-ok" : "ref-bad";
                      return h("td", { key: sv, className: cls }, display);
                    }),
                  )
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

/** Build a unit object from parsed BattleScribe data for cards without wahapedia match */
function buildUnitFromParsed(u) {
  const models = (u.statProfiles || []).map(sp => ({
    name: sp.name,
    M: sp.M, T: sp.T, Sv: sp.Sv, W: sp.W, Ld: sp.Ld, OC: sp.OC,
    inv_sv: null,
  }));

  return {
    name: u.name,
    points: u.points,
    role: u.role || u.category || '',
    models: models.length > 0 ? models : [],
    weapons: u.weapons || [],
    abilities: u.abilities || [],
    keywords: u.keywords || [],
    rules: u.rules || [],
    _fromParser: true,
  };
}
