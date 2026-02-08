import { createElement as h, useState, useMemo } from "react";

export default function DetachmentViewer({ db }) {
  const [faction, setFaction] = useState("all");
  const factions = db?.factions ? Object.values(db.factions).sort((a, b) => a.name.localeCompare(b.name)) : [];
  const detachments = db?.detachments || [];
  const enhancements = db?.enhancements || [];

  const filtered = useMemo(() => {
    if (faction === "all") return detachments;
    return detachments.filter(d => d.faction_id === faction);
  }, [detachments, faction]);

  return h("div", null,
    h("div", { className: "card" },
      h("div", { className: "card-header" },
        h("span", { className: "card-title" }, "Detachments & Enhancements"),
        h("span", { className: "card-subtitle" }, `${filtered.length} detachments`),
      ),
      h("div", { className: "field" },
        h("label", null, "Faction"),
        h("select", { className: "select", value: faction, onChange: e => setFaction(e.target.value) },
          h("option", { value: "all" }, "All Factions"),
          ...factions.map(f => h("option", { key: f.id, value: f.id }, f.name)),
        ),
      ),
    ),

    ...filtered.map(d => {
      const detEnhancements = enhancements.filter(e => e.detachment_id === d.id);
      return h("div", { key: d.id, className: "card" },
        h("div", { className: "card-header" },
          h("span", { className: "card-title" }, d.name),
          h("span", { className: "card-subtitle" }, d.faction_name),
        ),
        d.legend && h("div", { style: { fontSize: 12, color: '#8a8070', marginBottom: 8 }, dangerouslySetInnerHTML: { __html: d.legend } }),
        d.type && h("div", { style: { fontSize: 11, color: '#5a5548', marginBottom: 8 } }, `Type: ${d.type}`),

        detEnhancements.length > 0 && h("div", null,
          h("h4", { style: { color: '#c9a84c', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 } }, "Enhancements"),
          ...detEnhancements.map(e =>
            h("div", { key: e.id, style: { marginBottom: 8, padding: '8px 12px', background: '#141414', borderRadius: 4, borderLeft: '2px solid #c9a84c' } },
              h("div", { style: { display: 'flex', justifyContent: 'space-between' } },
                h("span", { style: { fontWeight: 700, color: '#e0d8c8' } }, e.name),
                e.cost && h("span", { className: "points-badge" }, e.cost + " pts"),
              ),
              h("div", { style: { fontSize: 12, color: '#8a8070', marginTop: 4 }, dangerouslySetInnerHTML: { __html: e.description } }),
            )
          ),
        ),
      );
    }),
  );
}
