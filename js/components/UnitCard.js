import { createElement as h, useState } from "react";
import { getRoleColor } from "../data/quick-reference.js";

export default function UnitCard({ unit, compact = false, battleMode = false, parsedData = null }) {
  const [expanded, setExpanded] = useState(!compact);

  const models = unit.models && unit.models.length > 0 ? unit.models : [{
    name: unit.name,
    M: (unit.M || '-') + (String(unit.M).includes('"') ? '' : '"'),
    T: unit.T || '-', Sv: (unit.Sv || '-') + (String(unit.Sv).includes('+') ? '' : '+'),
    inv_sv: unit.invuln ? String(unit.invuln) : null,
    W: unit.W || '-', Ld: (unit.Ld || '-') + (String(unit.Ld).includes('+') ? '' : '+'),
    OC: unit.OC || '-',
  }];

  const weapons = unit.weapons || [];
  const abilities = unit.abilities || [];
  const keywords = unit.keywords || [];
  const rules = unit.rules || parsedData?.rules || [];
  const role = unit.role || parsedData?.role || parsedData?.category || '';
  const borderColor = getRoleColor(role);

  // Get invulnerable save from models
  const invSv = models.find(m => m.inv_sv && m.inv_sv !== '-')?.inv_sv;

  if (battleMode && compact && !expanded) {
    // Ultra-compact battle mode card
    const m = models[0] || {};
    return h("div", {
      className: "battle-unit-card",
      style: { borderLeftColor: borderColor },
      onClick: () => setExpanded(true),
    },
      h("div", { className: "buc-header" },
        h("span", { className: "buc-name" }, unit.name),
        role && h("span", { className: "buc-role", style: { background: borderColor } }, role),
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
        ...rules.slice(0, 4).map((r, i) => h("span", { key: i, className: "buc-tag" }, r.name)),
      ),
    );
  }

  // Expanded mode (or non-battle compact)
  const rangedWeapons = weapons.filter(w => (w.type || '').toLowerCase() === 'ranged' || (w.range && w.range !== 'Melee'));
  const meleeWeapons = weapons.filter(w => (w.type || '').toLowerCase() === 'melee' || w.range === 'Melee' || (!w.range && !w.type));

  return h("div", {
    className: battleMode ? "battle-unit-card battle-unit-card-expanded" : "unit-card",
    style: battleMode ? { borderLeftColor: borderColor } : undefined,
    onClick: battleMode ? () => setExpanded(false) : (compact ? () => setExpanded(!expanded) : undefined),
  },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
      h("div", { style: { flex: 1 } },
        h("div", { className: "unit-name" }, unit.name),
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

    // Rules/tags
    rules.length > 0 && h("div", { className: "buc-tags", style: { marginBottom: 6 } },
      invSv && h("span", { className: "buc-tag" }, invSv + "+ inv"),
      ...rules.map((r, i) => h("span", { key: i, className: "buc-tag", title: r.description }, r.name)),
    ),

    // Keywords (non-battle mode)
    !battleMode && h("div", { className: "unit-keywords" }, keywords.join(" • ")),

    // Weapons
    expanded && (rangedWeapons.length > 0 || meleeWeapons.length > 0) && h("div", { className: "weapons-section" },
      rangedWeapons.length > 0 && h("div", null,
        h("div", { className: "weapon-section-title" }, "RANGED WEAPONS"),
        ...rangedWeapons.map((w, i) =>
          h("div", { key: i, className: "weapon-row" },
            h("span", { className: "weapon-name" }, w.name),
            h("span", { className: "weapon-stats" },
              `${w.A}A `, `BS${w.BS_WS || w.BS || '-'}+ `,
              `S${w.S} `, `${w.AP} `, `D${w.D}`,
            ),
          )
        ),
      ),
      meleeWeapons.length > 0 && h("div", null,
        h("div", { className: "weapon-section-title" }, "MELEE WEAPONS"),
        ...meleeWeapons.map((w, i) =>
          h("div", { key: i, className: "weapon-row" },
            h("span", { className: "weapon-name" }, w.name),
            h("span", { className: "weapon-stats" },
              `${w.A}A `, `WS${w.BS_WS || w.WS || '-'}+ `,
              `S${w.S} `, `${w.AP} `, `D${w.D}`,
            ),
          )
        ),
      ),
      rangedWeapons.length === 0 && meleeWeapons.length === 0 && h("div", { className: "weapon-row" }, "(none)"),
    ),

    // Full weapons table for non-battle mode
    !battleMode && expanded && weapons.length > 0 &&
      h("table", { className: "weapons-table" },
        h("thead", null,
          h("tr", null,
            ...["Weapon", "Range", "A", "Skill", "S", "AP", "D", "Keywords"].map(hdr =>
              h("th", { key: hdr }, hdr)
            )
          )
        ),
        h("tbody", null,
          ...weapons.map((w, i) => {
            const isRanged = (w.type || '').toLowerCase() === 'ranged' || (w.range && w.range !== 'Melee');
            const skill = w.BS_WS || w.BS || w.WS || '-';
            return h("tr", { key: i },
              h("td", null, w.name),
              h("td", null, h("span", { className: `weapon-type ${isRanged ? "weapon-ranged" : "weapon-melee"}` },
                isRanged ? w.range || 'RNG' : 'Melee')),
              h("td", null, w.A),
              h("td", null, skill + (String(skill).includes('+') ? '' : '+')),
              h("td", null, w.S),
              h("td", null, w.AP),
              h("td", null, w.D),
              h("td", { style: { fontSize: "10px", color: "#8a8070", maxWidth: 200 } },
                w.description || (w.keywords || []).join?.(", ") || w.keywords || ''),
            );
          })
        )
      ),

    // Abilities
    expanded && abilities.length > 0 &&
      h("div", { className: "abilities-section" },
        battleMode && h("div", { className: "weapon-section-title" }, "ABILITIES"),
        ...abilities.map((a, i) =>
          h("div", { key: i, style: { marginBottom: 4 } },
            h("span", { className: "ability-tag" }, a.name),
            a.type && !battleMode && h("span", { style: { fontSize: 10, color: '#5a5548', marginLeft: 4 } }, `[${a.type}]`),
            h("div", { className: "ability-desc" }, a.description || a.desc || ''),
          )
        )
      ),

    // Unit composition and other details (non-battle mode only)
    !battleMode && expanded && unit.unit_composition && unit.unit_composition.length > 0 &&
      h("div", { style: { marginTop: 8, fontSize: 12, color: '#8a8070' } },
        h("strong", { style: { color: '#c9a84c', fontSize: 10 } }, "UNIT COMPOSITION: "),
        unit.unit_composition.join('; '),
      ),

    !battleMode && expanded && unit.loadout && typeof unit.loadout === 'string' && unit.loadout.length > 0 &&
      h("div", { style: { marginTop: 4, fontSize: 12, color: '#8a8070' } },
        h("span", { dangerouslySetInnerHTML: { __html: unit.loadout } }),
      ),

    !battleMode && expanded && unit.options && unit.options.length > 0 &&
      h("div", { style: { marginTop: 4, fontSize: 11, color: '#5a5548' } },
        h("strong", { style: { color: '#c9a84c', fontSize: 10 } }, "OPTIONS: "),
        ...unit.options.map((o, i) => h("div", { key: i, dangerouslySetInnerHTML: { __html: o.description } })),
      ),

    !battleMode && expanded && unit.leader_attachments && unit.leader_attachments.length > 0 &&
      h("div", { style: { marginTop: 4, fontSize: 11, color: '#5a5548' } },
        "Can lead: ", unit.leader_attachments.length, " unit(s)"),

    compact && !expanded && !battleMode && h("div", { style: { fontSize: 11, color: '#5a5548', marginTop: 4 } }, "Click to expand"),
  );
}
