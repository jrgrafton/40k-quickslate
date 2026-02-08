import { createElement as h, useState } from "react";

// Render a full wahapedia unit card
export default function UnitCard({ unit, compact = false }) {
  const [expanded, setExpanded] = useState(!compact);

  // Support both old format (flat stats) and new wahapedia format (models array)
  const models = unit.models && unit.models.length > 0 ? unit.models : [{
    name: unit.name,
    M: (unit.M || '-') + (String(unit.M).includes('"') ? '' : '"'),
    T: unit.T || '-', Sv: (unit.Sv || '-') + (String(unit.Sv).includes('+') ? '' : '+'),
    inv_sv: unit.invuln ? String(unit.invuln) : null,
    W: unit.W || '-', Ld: (unit.Ld || '-') + (String(unit.Ld).includes('+') ? '' : '+'),
    OC: unit.OC || '-',
  }];

  // Support both old and new weapon format
  const weapons = unit.weapons || [];

  const abilities = unit.abilities || [];
  const keywords = unit.keywords || [];

  return h("div", { className: "unit-card", onClick: compact ? () => setExpanded(!expanded) : undefined },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
      h("div", { style: { flex: 1 } },
        h("div", { className: "unit-name" }, unit.name),
        unit.faction_name && h("span", { style: { fontSize: 11, color: '#8a8070', marginLeft: 0 } }, unit.faction_name),
        unit.role && h("span", { className: "role-badge" }, unit.role),
      ),
      unit.points != null && h("span", { className: "points-badge" }, unit.points + " pts"),
    ),
    h("div", { className: "unit-keywords" }, keywords.join(" • ")),

    // Model stat lines
    ...models.map((m, i) =>
      h("div", { key: i, style: { marginBottom: 4 } },
        models.length > 1 && h("div", { style: { fontSize: 11, color: '#c9a84c', marginBottom: 2 } }, m.name),
        h("div", { className: "stat-line" },
          ...[ ['M', m.M], ['T', m.T], ['Sv', m.Sv],
               ...(m.inv_sv && m.inv_sv !== '-' ? [['Inv', m.inv_sv + '+']] : []),
               ['W', m.W], ['Ld', m.Ld], ['OC', m.OC],
          ].map(([label, val]) =>
            h("div", { className: "stat-box", key: label + i },
              h("div", { className: "stat-label" }, label),
              h("div", { className: "stat-value" }, val),
            )
          )
        ),
      )
    ),

    expanded && weapons.length > 0 &&
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
            const ap = w.AP;
            return h("tr", { key: i },
              h("td", null, w.name),
              h("td", null, h("span", { className: `weapon-type ${isRanged ? "weapon-ranged" : "weapon-melee"}` },
                isRanged ? w.range || 'RNG' : 'Melee')),
              h("td", null, w.A),
              h("td", null, skill + (String(skill).includes('+') ? '' : '+')),
              h("td", null, w.S),
              h("td", null, ap),
              h("td", null, w.D),
              h("td", { style: { fontSize: "10px", color: "#8a8070", maxWidth: 200 } },
                w.description || (w.keywords || []).join(", ")),
            );
          })
        )
      ),

    expanded && abilities.length > 0 &&
      h("div", { className: "abilities-section" },
        ...abilities.map((a, i) =>
          h("div", { key: i, style: { marginBottom: 4 } },
            h("span", { className: "ability-tag" }, a.name),
            a.type && h("span", { style: { fontSize: 10, color: '#5a5548', marginLeft: 4 } }, `[${a.type}]`),
            h("div", { className: "ability-desc" }, a.description || a.desc || ''),
          )
        )
      ),

    expanded && unit.unit_composition && unit.unit_composition.length > 0 &&
      h("div", { style: { marginTop: 8, fontSize: 12, color: '#8a8070' } },
        h("strong", { style: { color: '#c9a84c', fontSize: 10 } }, "UNIT COMPOSITION: "),
        unit.unit_composition.join('; '),
      ),

    expanded && unit.loadout && typeof unit.loadout === 'string' && unit.loadout.length > 0 &&
      h("div", { style: { marginTop: 4, fontSize: 12, color: '#8a8070' } },
        h("span", { dangerouslySetInnerHTML: { __html: unit.loadout } }),
      ),

    expanded && unit.options && unit.options.length > 0 &&
      h("div", { style: { marginTop: 4, fontSize: 11, color: '#5a5548' } },
        h("strong", { style: { color: '#c9a84c', fontSize: 10 } }, "OPTIONS: "),
        ...unit.options.map((o, i) => h("div", { key: i, dangerouslySetInnerHTML: { __html: o.description } })),
      ),

    expanded && unit.leader_attachments && unit.leader_attachments.length > 0 &&
      h("div", { style: { marginTop: 4, fontSize: 11, color: '#5a5548' } },
        "Can lead: ", unit.leader_attachments.length, " unit(s)"),

    compact && !expanded && h("div", { style: { fontSize: 11, color: '#5a5548', marginTop: 4 } }, "Click to expand"),
  );
}
