import { createElement as h, useState, useMemo } from "react";

export default function StratagemPanel({ db }) {
  const [faction, setFaction] = useState("all");
  const [detachment, setDetachment] = useState("all");
  const [search, setSearch] = useState("");
  const [showLegends, setShowLegends] = useState(false);

  const stratagems = db?.stratagems || [];
  const factions = db?.factions ? Object.values(db.factions).sort((a, b) => a.name.localeCompare(b.name)) : [];

  const detachments = useMemo(() => {
    if (faction === "all") return [];
    return (db?.detachments || []).filter(d => d.faction_id === faction);
  }, [db, faction]);

  const filtered = useMemo(() => {
    return stratagems.filter(s => {
      if (!showLegends && s.legend) return false;
      if (faction !== "all" && s.faction_id !== faction) return false;
      if (detachment !== "all" && s.detachment_id !== detachment) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [stratagems, faction, detachment, search, showLegends]);

  const typeColor = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('battle')) return 'stratagem-battle';
    if (t.includes('strategic')) return 'stratagem-strategic';
    if (t.includes('epic')) return 'stratagem-epic';
    return '';
  };

  return h("div", null,
    h("div", { className: "card" },
      h("div", { className: "card-header" },
        h("span", { className: "card-title" }, "Stratagems"),
        h("span", { className: "card-subtitle" }, `${filtered.length} stratagems`),
      ),
      h("input", {
        className: "input",
        placeholder: "Search stratagems...",
        value: search,
        onChange: e => setSearch(e.target.value),
        style: { marginBottom: 12 },
      }),
      h("div", { className: "grid-2", style: { marginBottom: 12 } },
        h("div", { className: "field" },
          h("label", null, "Faction"),
          h("select", { className: "select", value: faction, onChange: e => { setFaction(e.target.value); setDetachment("all"); } },
            h("option", { value: "all" }, "All Factions"),
            ...factions.map(f => h("option", { key: f.id, value: f.id }, f.name)),
          ),
        ),
        detachments.length > 0 && h("div", { className: "field" },
          h("label", null, "Detachment"),
          h("select", { className: "select", value: detachment, onChange: e => setDetachment(e.target.value) },
            h("option", { value: "all" }, "All Detachments"),
            ...detachments.map(d => h("option", { key: d.id, value: d.id }, d.name)),
          ),
        ),
      ),
      h("label", { className: "toggle-row" },
        h("input", { type: "checkbox", checked: showLegends, onChange: e => setShowLegends(e.target.checked) }),
        "Show Legends"),
    ),

    ...filtered.slice(0, 100).map(s =>
      h("div", { key: s.id, className: `stratagem-card ${typeColor(s.type)}` },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
          h("div", null,
            h("span", { className: "stratagem-name" }, s.name),
            s.phase && h("span", { className: "stratagem-phase", style: { marginLeft: 8 } }, s.phase),
          ),
          h("span", { className: "stratagem-cp" }, s.cp_cost + " CP"),
        ),
        h("div", { style: { fontSize: 11, color: "#5a5548", marginTop: 2 } },
          [s.faction_name, s.detachment, s.turn].filter(Boolean).join(' • ')),
        h("div", { className: "stratagem-effect", dangerouslySetInnerHTML: { __html: s.description } }),
      )
    ),
    filtered.length > 100 && h("div", { style: { textAlign: 'center', color: '#5a5548', padding: 16 } },
      `Showing 100 of ${filtered.length}`),
  );
}
