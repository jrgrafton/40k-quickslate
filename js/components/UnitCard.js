import { createElement as h, useState } from "react";
import { getRoleColor } from "../data/quick-reference.js";
import { stripHtml } from "../utils/helpers.js";

// Known weapon keywords that should NOT show as unit abilities
const WEAPON_KEYWORDS = new Set([
  'sustained hits', 'lethal hits', 'devastating wounds', 'precision',
  'anti-infantry', 'anti-vehicle', 'anti-monster', 'anti-fly',
  'anti-psyker', 'anti-character', 'twin-linked', 'torrent',
  'blast', 'melta', 'rapid fire', 'assault', 'heavy', 'pistol',
  'hazardous', 'ignores cover', 'indirect fire', 'lance',
  'extra attacks', 'psychic', 'one shot', 'stealth',
]);

function isWeaponKeyword(name) {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  for (const kw of WEAPON_KEYWORDS) {
    if (lower === kw || lower.startsWith(kw)) return true;
  }
  // Match patterns like "Anti-X N+", "Sustained Hits N", "Melta N", "Rapid Fire N"
  if (/^anti-\w+\s*\d/i.test(lower)) return true;
  if (/^(sustained hits|rapid fire|melta|blast)\s*\d/i.test(lower)) return true;
  return false;
}

function isValidAbility(a) {
  if (!a) return false;
  const name = (a.name || '').trim();
  if (!name) return false;
  if (isWeaponKeyword(name)) return false;
  // Skip abilities that are just references (only have type like "Core" or "Faction" but no name/desc)
  if (!name && a.type && !a.description) return false;
  return true;
}

export default function UnitCard({ 
  unit, compact = false, battleMode = false, parsedData = null,
  groupCount = 1, attachedLeaders = [], isCharacter = false,
  validLeaderTargets = [], onAttachLeader = null, currentAttachment = undefined,
  onUngroup = null, onRegroup = null,
}) {
  const [expanded, setExpanded] = useState(!compact);
  const [showLeaderMenu, setShowLeaderMenu] = useState(false);

  const models = unit.models && unit.models.length > 0 ? unit.models : [{
    name: unit.name,
    M: (unit.M || '-') + (String(unit.M).includes('"') ? '' : '"'),
    T: unit.T || '-', Sv: (unit.Sv || '-') + (String(unit.Sv).includes('+') ? '' : '+'),
    inv_sv: unit.invuln ? String(unit.invuln) : null,
    W: unit.W || '-', Ld: (unit.Ld || '-') + (String(unit.Ld).includes('+') ? '' : '+'),
    OC: unit.OC || '-',
  }];

  const weapons = unit.weapons || [];
  const rawAbilities = unit.abilities || [];
  const abilities = rawAbilities.filter(isValidAbility);
  const keywords = unit.keywords || [];
  const rules = unit.rules || parsedData?.rules || [];
  const role = unit.role || parsedData?.role || parsedData?.category || '';
  const borderColor = getRoleColor(role);
  const invSv = models.find(m => m.inv_sv && m.inv_sv !== '-')?.inv_sv;

  // Filter rules to remove weapon keywords too
  const filteredRules = rules.filter(r => r.name && !isWeaponKeyword(r.name));

  if (battleMode && compact && !expanded) {
    const m = models[0] || {};
    return h("div", {
      className: "battle-unit-card",
      style: { borderLeftColor: borderColor },
      onClick: () => setExpanded(true),
    },
      h("div", { className: "buc-header" },
        h("span", { className: "buc-name" },
          unit.name,
          groupCount > 1 && h("span", {
            className: "group-badge",
            title: "Click to ungroup",
            onClick: onUngroup ? (e) => { e.stopPropagation(); onUngroup(unit.name); } : undefined,
            style: onUngroup ? { cursor: 'pointer' } : undefined,
          }, `×${groupCount}`),
          onRegroup && h("button", {
            className: "regroup-btn",
            onClick: (e) => { e.stopPropagation(); onRegroup(); },
          }, "regroup"),
        ),
        role && h("span", { className: "buc-role", style: { background: borderColor } }, role),
      ),
      // Attached leaders
      ...attachedLeaders.map((leader, li) =>
        h("div", { key: 'leader' + li, className: "attached-leader-tag" },
          "👑 ", leader.name || leader.datasheet?.name || 'Leader')
      ),
      h("div", { className: "buc-stats" },
        ...['M', 'T', 'Sv', 'W', 'Ld', 'OC'].map(stat =>
          h("span", { key: stat, className: "buc-stat" },
            h("span", { className: "buc-stat-label" }, stat),
            h("span", { className: "buc-stat-value" }, m[stat] || '-'),
          )
        ),
        unit.points != null && h("span", { className: "buc-pts" }, unit.points + "pts"),
      ),
      h("div", { className: "buc-tags" },
        invSv && h("span", { className: "buc-tag" }, invSv + "+ inv"),
        ...filteredRules.slice(0, 4).map((r, i) => h("span", { key: i, className: "buc-tag" }, r.name)),
      ),
      // Leader attach button
      isCharacter && validLeaderTargets.length > 0 && h("div", {
        className: "leader-attach-btn",
        onClick: (e) => { e.stopPropagation(); setShowLeaderMenu(!showLeaderMenu); },
      }, currentAttachment !== undefined ? "✓ Leading" : "👑 Lead..."),
    );
  }

  // Expanded mode
  const rangedWeapons = weapons.filter(w => (w.type || '').toLowerCase() === 'ranged' || (w.range && w.range !== 'Melee'));
  const meleeWeapons = weapons.filter(w => (w.type || '').toLowerCase() === 'melee' || w.range === 'Melee' || (!w.range && !w.type));

  function renderWeaponTable(weaponList, label) {
    if (weaponList.length === 0) return null;
    const isRanged = label === 'RANGED WEAPONS';
    return h("div", { className: "weapon-table-section" },
      h("div", { className: "weapon-section-title" }, label),
      h("table", { className: "battle-weapons-table" },
        h("thead", null,
          h("tr", null,
            h("th", null, "Weapon"),
            h("th", null, isRanged ? "Range" : ""),
            h("th", null, "A"),
            h("th", null, isRanged ? "BS" : "WS"),
            h("th", null, "S"),
            h("th", null, "AP"),
            h("th", null, "D"),
            h("th", null, "Keywords"),
          ),
        ),
        h("tbody", null,
          ...weaponList.map((w, i) => {
            const kwText = w.description || (Array.isArray(w.keywords) ? w.keywords.join(', ') : w.keywords) || '';
            return h("tr", { key: i },
              h("td", { className: "wt-name" }, w.name),
              h("td", null, isRanged ? (w.range || '-') : ''),
              h("td", null, w.A),
              h("td", null, (w.BS_WS || w.BS || w.WS || '-') + (String(w.BS_WS || w.BS || w.WS || '').includes('+') ? '' : '+')),
              h("td", null, w.S),
              h("td", null, w.AP),
              h("td", null, w.D),
              h("td", { className: "wt-keywords" }, kwText ? h("span", { className: "weapon-kw-pill" }, kwText) : null),
            );
          }),
        ),
      ),
    );
  }

  return h("div", {
    className: battleMode ? "battle-unit-card battle-unit-card-expanded" : "unit-card",
    style: battleMode ? { borderLeftColor: borderColor } : undefined,
    onClick: battleMode ? () => setExpanded(false) : (compact ? () => setExpanded(!expanded) : undefined),
  },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
      h("div", { style: { flex: 1 } },
        // Attached leaders shown at top
        ...attachedLeaders.map((leader, li) =>
          h("div", { key: 'leader' + li, className: "attached-leader-inline" },
            "👑 ", h("strong", null, leader.name || leader.datasheet?.name || 'Leader'),
            (() => {
              const lds = leader.datasheet;
              if (!lds?.models?.[0]) return null;
              const lm = lds.models[0];
              return h("span", { className: "leader-inline-stats" },
                ` M:${lm.M} T:${lm.T} Sv:${lm.Sv} W:${lm.W}`
              );
            })(),
          )
        ),
        h("div", { className: "unit-name" },
          unit.name,
          groupCount > 1 && h("span", {
            className: "group-badge",
            title: "Click to ungroup",
            onClick: onUngroup ? (e) => { e.stopPropagation(); onUngroup(unit.name); } : undefined,
            style: onUngroup ? { cursor: 'pointer' } : undefined,
          }, `×${groupCount}`),
          onRegroup && h("button", {
            className: "regroup-btn",
            onClick: (e) => { e.stopPropagation(); onRegroup(); },
          }, "regroup"),
        ),
        !battleMode && unit.faction_name && h("span", { style: { fontSize: 11, color: '#8a8070' } }, unit.faction_name),
        role && h("span", { className: "role-badge", style: battleMode ? { background: borderColor, color: '#fff', borderColor: borderColor } : undefined }, role),
      ),
      unit.points != null && h("span", { className: "points-badge" }, unit.points + " pts"),
    ),

    // Stat lines
    ...models.map((m, i) =>
      h("div", { key: i, style: { marginBottom: 4 } },
        models.length > 1 && h("div", { style: { fontSize: 11, color: '#c9a84c', marginBottom: 2 } }, m.name),
        h("div", { className: battleMode ? "buc-stats" : "stat-line" },
          ...['M', 'T', 'Sv', ...(m.inv_sv && m.inv_sv !== '-' ? ['Inv'] : []), 'W', 'Ld', 'OC'].map(stat => {
            const val = stat === 'Inv' ? (m.inv_sv + '+') : m[stat];
            return battleMode
              ? h("span", { key: stat + i, className: "buc-stat" },
                  h("span", { className: "buc-stat-label" }, stat),
                  h("span", { className: "buc-stat-value" }, val),
                )
              : h("div", { className: "stat-box", key: stat + i },
                  h("div", { className: "stat-label" }, stat),
                  h("div", { className: "stat-value" }, val),
                );
          }),
        ),
      )
    ),

    // Rules/tags (filtered)
    filteredRules.length > 0 && h("div", { className: "buc-tags", style: { marginBottom: 6 } },
      invSv && h("span", { className: "buc-tag" }, invSv + "+ inv"),
      ...filteredRules.map((r, i) => h("span", { key: i, className: "buc-tag", title: r.description }, r.name)),
    ),

    // Keywords (non-battle mode)
    !battleMode && h("div", { className: "unit-keywords" }, keywords.join(" • ")),

    // Weapons (battle mode - proper tables)
    expanded && battleMode && h("div", { className: "weapons-section" },
      renderWeaponTable(rangedWeapons, 'RANGED WEAPONS'),
      renderWeaponTable(meleeWeapons, 'MELEE WEAPONS'),
    ),

    // Weapons (non-battle mode - legacy inline)
    expanded && !battleMode && (rangedWeapons.length > 0 || meleeWeapons.length > 0) && h("div", { className: "weapons-section" },
      renderWeaponTable(rangedWeapons, 'RANGED WEAPONS'),
      renderWeaponTable(meleeWeapons, 'MELEE WEAPONS'),
    ),

    // Abilities (filtered - no empty, no weapon keywords)
    expanded && abilities.length > 0 &&
      h("div", { className: "abilities-section" },
        battleMode && h("div", { className: "weapon-section-title" }, "ABILITIES"),
        ...abilities.map((a, i) =>
          h("div", { key: i, style: { marginBottom: 4 } },
            h("span", { className: "ability-tag" }, a.name),
            a.type && !battleMode && h("span", { style: { fontSize: 10, color: '#5a5548', marginLeft: 4 } }, `[${a.type}]`),
            (a.description || a.desc) && h("div", { className: "ability-desc" }, stripHtml(a.description || a.desc || '')),
          )
        )
      ),

    // Leader attach UI
    expanded && isCharacter && validLeaderTargets.length > 0 && h("div", {
      className: "leader-attach-section",
      onClick: e => e.stopPropagation(),
    },
      h("div", { className: "weapon-section-title" }, "LEADER — ATTACH TO"),
      ...validLeaderTargets.map((t, i) =>
        h("button", {
          key: i,
          className: `btn btn-sm ${currentAttachment === t.armyIndex ? 'btn-gold' : ''}`,
          style: { marginRight: 4, marginBottom: 4 },
          onClick: (e) => {
            e.stopPropagation();
            if (onAttachLeader) {
              onAttachLeader(currentAttachment === t.armyIndex ? -1 : t.armyIndex);
            }
          },
        }, currentAttachment === t.armyIndex ? `✓ ${t.name}` : t.name),
      ),
    ),

    // Unit composition and other details (non-battle mode only)
    !battleMode && expanded && unit.unit_composition && unit.unit_composition.length > 0 &&
      h("div", { style: { marginTop: 8, fontSize: 12, color: '#8a8070' } },
        h("strong", { style: { color: '#c9a84c', fontSize: 10 } }, "UNIT COMPOSITION: "),
        unit.unit_composition.join('; '),
      ),

    !battleMode && expanded && unit.loadout && typeof unit.loadout === 'string' && unit.loadout.length > 0 &&
      h("div", { style: { marginTop: 4, fontSize: 12, color: '#8a8070' } },
        stripHtml(unit.loadout),
      ),

    !battleMode && expanded && unit.options && unit.options.length > 0 &&
      h("div", { style: { marginTop: 4, fontSize: 11, color: '#5a5548' } },
        h("strong", { style: { color: '#c9a84c', fontSize: 10 } }, "OPTIONS: "),
        ...unit.options.map((o, i) => h("div", { key: i }, stripHtml(o.description))),
      ),

    !battleMode && expanded && unit.leader_attachments && unit.leader_attachments.length > 0 &&
      h("div", { style: { marginTop: 4, fontSize: 11, color: '#5a5548' } },
        "Can lead: ", unit.leader_attachments.length, " unit(s)"),

    compact && !expanded && !battleMode && h("div", { style: { fontSize: 11, color: '#5a5548', marginTop: 4 } }, "Click to expand"),
  );
}
