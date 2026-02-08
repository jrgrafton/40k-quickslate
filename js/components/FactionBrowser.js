import { createElement as h, useState, useMemo } from "react";
import SearchBar from "./SearchBar.js";
import UnitCard from "./UnitCard.js";

export default function FactionBrowser({ db }) {
  const [faction, setFaction] = useState("all");
  const [role, setRole] = useState("all");
  const [search, setSearch] = useState("");
  const [showLegends, setShowLegends] = useState(false);

  const factions = db?.factions ? Object.values(db.factions).sort((a, b) => a.name.localeCompare(b.name)) : [];
  const roles = useMemo(() => {
    if (!db?.units) return [];
    const s = new Set(db.units.map(u => u.role).filter(Boolean));
    return [...s].sort();
  }, [db]);

  const filtered = useMemo(() => {
    if (!db?.units) return [];
    return db.units.filter(u => {
      if (!showLegends && u.legend) return false;
      if (faction !== "all" && u.faction_id !== faction) return false;
      if (role !== "all" && u.role !== role) return false;
      if (search) {
        const q = search.toLowerCase();
        return u.name.toLowerCase().includes(q) ||
          u.keywords.some(k => k.toLowerCase().includes(q)) ||
          (u.faction_name || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [db, faction, role, search, showLegends]);

  return h("div", null,
    h(SearchBar, { value: search, onChange: setSearch, placeholder: "Search all units by name, keyword, or faction..." }),

    h("div", { className: "field", style: { marginBottom: 12 } },
      h("label", null, "Faction"),
      h("select", { className: "select", value: faction, onChange: e => setFaction(e.target.value) },
        h("option", { value: "all" }, `All Factions (${db?.units?.length || 0} units)`),
        ...factions.map(f => {
          const count = db.units.filter(u => u.faction_id === f.id && (!u.legend || showLegends)).length;
          return h("option", { key: f.id, value: f.id }, `${f.name} (${count})`);
        }),
      ),
    ),

    h("div", { className: "filter-pills" },
      h("span", { className: `pill ${role === "all" ? "active" : ""}`, onClick: () => setRole("all") }, "All Roles"),
      ...roles.map(r =>
        h("span", { key: r, className: `pill ${role === r ? "active" : ""}`, onClick: () => setRole(r) }, r)
      ),
    ),

    h("label", { className: "toggle-row", style: { marginBottom: 12 } },
      h("input", { type: "checkbox", checked: showLegends, onChange: e => setShowLegends(e.target.checked) }),
      "Show Legends"),

    h("div", { style: { marginBottom: 8, color: "#5a5548", fontSize: 12 } }, `${filtered.length} units`),

    ...filtered.slice(0, 50).map(u => h(UnitCard, { key: u.id, unit: u, compact: true })),
    filtered.length > 50 && h("div", { style: { textAlign: 'center', color: '#5a5548', padding: 16 } },
      `Showing 50 of ${filtered.length} — refine your search to see more`),
  );
}
