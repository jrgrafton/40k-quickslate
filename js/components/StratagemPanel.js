import { createElement as h, useState } from "react";
import { STRATAGEMS } from "../data/stratagems.js";
import { FACTIONS } from "../data/factions.js";

export default function StratagemPanel() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const factionFilters = [
    { id: "all", label: "All" },
    { id: "core", label: "Core" },
    ...Object.entries(FACTIONS).map(([id, f]) => ({ id, label: f.name })),
  ];

  const filtered = STRATAGEMS.filter(s => {
    if (filter === "core") return s.faction === null;
    if (filter !== "all") return s.faction === filter || s.faction === null;
    return true;
  }).filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.effect.toLowerCase().includes(search.toLowerCase())
  );

  return h("div", null,
    h("div", { className: "card" },
      h("div", { className: "card-header" },
        h("span", { className: "card-title" }, "Stratagems Reference"),
        h("span", { className: "card-subtitle" }, `${filtered.length} stratagems`),
      ),
      h("input", {
        className: "input",
        placeholder: "Search stratagems...",
        value: search,
        onChange: e => setSearch(e.target.value),
        style: { marginBottom: 12 },
      }),
      h("div", { className: "filter-pills" },
        ...factionFilters.map(f =>
          h("span", {
            key: f.id,
            className: `pill ${filter === f.id ? "active" : ""}`,
            onClick: () => setFilter(f.id),
          }, f.label)
        ),
      ),
    ),
    ...filtered.map(s =>
      h("div", { key: s.id, className: `stratagem-card stratagem-${s.type}` },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
          h("div", null,
            h("span", { className: "stratagem-name" }, s.name),
            h("span", { className: "stratagem-phase", style: { marginLeft: 8 } }, s.phase),
          ),
          h("span", { className: "stratagem-cp" }, s.cp + " CP"),
        ),
        s.faction && h("div", { style: { fontSize: 11, color: "#5a5548", marginTop: 2 } }, FACTIONS[s.faction]?.name || s.faction),
        h("div", { className: "stratagem-effect" }, s.effect),
      )
    ),
  );
}
