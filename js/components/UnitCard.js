import { createElement as h } from "react";

export default function UnitCard({ unit, compact = false }) {
  const stats = [
    ["M", unit.M + '"'], ["T", unit.T], ["Sv", unit.Sv + "+"],
    ["W", unit.W], ["Ld", unit.Ld + "+"], ["OC", unit.OC],
  ];
  if (unit.invuln) stats.push(["Inv", unit.invuln + "+"]);
  if (unit.fnp) stats.push(["FNP", unit.fnp + "+"]);

  return h("div", { className: "unit-card" },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
      h("div", null,
        h("div", { className: "unit-name" }, unit.name),
        h("div", { className: "unit-keywords" }, (unit.keywords || []).join(" • ")),
      ),
      h("span", { className: "points-badge" }, unit.points + " pts"),
    ),
    h("div", { className: "stat-line" },
      ...stats.map(([label, val]) =>
        h("div", { className: "stat-box", key: label },
          h("div", { className: "stat-label" }, label),
          h("div", { className: "stat-value" }, val),
        )
      )
    ),
    !compact && unit.weapons && unit.weapons.length > 0 &&
      h("table", { className: "weapons-table" },
        h("thead", null,
          h("tr", null,
            ...["Weapon", "Type", "A", "Skill", "S", "AP", "D", "Keywords"].map(hdr =>
              h("th", { key: hdr }, hdr)
            )
          )
        ),
        h("tbody", null,
          ...unit.weapons.map((w, i) =>
            h("tr", { key: i },
              h("td", null, w.name),
              h("td", null, h("span", { className: `weapon-type ${w.type === "ranged" ? "weapon-ranged" : "weapon-melee"}` }, w.type === "ranged" ? "RNG" : "MEL")),
              h("td", null, w.A),
              h("td", null, (w.BS || w.WS) + "+"),
              h("td", null, w.S),
              h("td", null, w.AP === 0 ? "0" : "-" + Math.abs(w.AP)),
              h("td", null, w.D),
              h("td", { style: { fontSize: "10px", color: "#8a8070" } }, (w.keywords || []).join(", ")),
            )
          )
        )
      ),
    !compact && unit.abilities && unit.abilities.length > 0 &&
      h("div", { className: "abilities-section" },
        ...unit.abilities.map((a, i) =>
          h("div", { key: i, style: { marginBottom: 4 } },
            h("span", { className: "ability-tag" }, a.name),
            h("span", { className: "ability-desc", style: { marginLeft: 8 } }, a.desc),
          )
        )
      ),
  );
}
