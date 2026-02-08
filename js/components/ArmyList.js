import { createElement as h, useState } from "react";
import { parseArmyList } from "../utils/parser.js";
import { fuzzyMatchUnit } from "../data/wahapedia-loader.js";
import UnitCard from "./UnitCard.js";

export default function ArmyList({ db, onArmyLoaded }) {
  const [text, setText] = useState("");
  const [army, setArmy] = useState(null);
  const [parseError, setParseError] = useState(null);

  function loadArmy(parsed) {
    parsed.units = parsed.units.map(u => {
      const match = fuzzyMatchUnit(u.name, db);
      return { ...u, datasheet: match || null };
    });
    setArmy(parsed);
    if (onArmyLoaded) onArmyLoaded(parsed);
  }

  function handleParse() {
    if (!text.trim()) return;
    setParseError(null);
    try {
      const parsed = parseArmyList(text);
      loadArmy(parsed);
    } catch (e) {
      setParseError("Parse error: " + e.message);
      console.error("Parse error:", e);
    }
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setText(ev.target.result);
    };
    reader.readAsText(file);
  }

  const sampleList = `++ Army Roster (Warhammer 40,000 10th Edition) ++
Faction: Space Marines
Detachment: Gladius Task Force
Points: 2000

+ Character +
Captain in Terminator Armour [100pts]
- Storm bolter, Relic weapon

+ Battleline +
Intercessor Squad [80pts] (5 models)
- Bolt rifle
- Bolt pistol

+ Infantry +
Terminator Squad [200pts] (5 models)
- Storm bolter
- Power fist

Hellblaster Squad [125pts] (5 models)
- Plasma incinerator

+ Vehicle +
Redemptor Dreadnought [210pts]
- Macro plasma incinerator
- Heavy onslaught gatling cannon`;

  return h("div", null,
    // Section 1: Paste/Upload
    h("div", { className: "card", style: { marginBottom: 16 } },
      h("div", { className: "card-header" },
        h("span", { className: "card-title" }, "📄 Paste or Upload"),
        h("span", { className: "card-subtitle" }, "Paste Yellow Scribe text, BattleScribe JSON, or YellowScribe API JSON"),
      ),
      h("div", { className: "upload-area", onClick: () => document.getElementById("file-input").click() },
        h("p", null, "📄 Click to upload a .txt or .json file, or paste below"),
        h("input", { id: "file-input", type: "file", accept: ".txt,.text,.json", style: { display: "none" }, onChange: handleFile }),
      ),
      h("textarea", {
        value: text,
        onChange: e => setText(e.target.value),
        placeholder: "Paste your army list here...",
        rows: 8,
      }),
      parseError && h("div", { style: { color: '#cc2222', fontSize: 13, marginTop: 8 } }, parseError),
      h("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
        h("button", { className: "btn", onClick: handleParse }, "Parse Army List"),
      ),
    ),

    // Section 3: Sample
    h("div", { className: "card", style: { marginBottom: 16 } },
      h("div", { className: "card-header" },
        h("span", { className: "card-title" }, "🎲 Load Sample"),
        h("span", { className: "card-subtitle" }, "Try a sample army list to see how it works"),
      ),
      h("button", { className: "btn btn-gold btn-sm", onClick: () => { setText(sampleList); } }, "Load Sample List"),
    ),

    army && h("div", null,
      h("div", { className: "army-summary" },
        h("div", { className: "army-summary-item" },
          h("div", { className: "army-summary-value" }, army.faction || "Unknown"),
          h("div", { className: "army-summary-label" }, "Faction"),
        ),
        h("div", { className: "army-summary-item" },
          h("div", { className: "army-summary-value" }, army.detachment || "—"),
          h("div", { className: "army-summary-label" }, "Detachment"),
        ),
        h("div", { className: "army-summary-item" },
          h("div", { className: "army-summary-value" }, army.points),
          h("div", { className: "army-summary-label" }, "Total Points"),
        ),
        h("div", { className: "army-summary-item" },
          h("div", { className: "army-summary-value" }, army.units.length),
          h("div", { className: "army-summary-label" }, "Units"),
        ),
      ),
      h("h3", { className: "section-title" }, "Army Units"),
      ...army.units.map((u, i) =>
        u.datasheet
          ? h(UnitCard, { key: i, unit: { ...u.datasheet, points: u.points } })
          : h("div", { key: i, className: "unit-card" },
              h("div", { style: { display: "flex", justifyContent: "space-between" } },
                h("div", null,
                  h("div", { className: "unit-name" }, u.name),
                  h("div", { className: "unit-keywords" },
                    (u.category || u.role || '') + (u.models > 1 ? ` • ${u.models} models` : "")
                  ),
                  u.loadout && u.loadout.length > 0 && h("div", { style: { fontSize: 12, color: "#8a8070", marginTop: 4 } },
                    Array.isArray(u.loadout) ? u.loadout.join(", ") : u.loadout
                  ),
                ),
                h("span", { className: "points-badge" }, u.points + " pts"),
              ),
              u.statProfiles && u.statProfiles.length > 0 && u.statProfiles.map((sp, j) =>
                h("div", { key: j, className: "stat-line", style: { marginTop: 6 } },
                  ...['M', 'T', 'Sv', 'W', 'Ld', 'OC'].map(stat =>
                    h("div", { className: "stat-box", key: stat },
                      h("div", { className: "stat-label" }, stat),
                      h("div", { className: "stat-value" }, sp[stat] || '-'),
                    )
                  ),
                )
              ),
              u.weapons && u.weapons.length > 0 && h("div", { style: { marginTop: 8 } },
                h("div", { style: { fontSize: 11, fontWeight: 'bold', color: '#c0b090', marginBottom: 4 } }, "Weapons"),
                u.weapons.map((w, wi) =>
                  h("div", { key: wi, style: { fontSize: 11, color: '#8a8070', display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 2 } },
                    h("span", { style: { color: '#e8e0d4', minWidth: 120 } }, w.name),
                    w.range && h("span", null, w.range),
                    w.A && w.A !== '-' && h("span", null, "A:", w.A),
                    w.BS_WS && w.BS_WS !== '-' && h("span", null, "BS/WS:", w.BS_WS),
                    w.S && w.S !== '-' && h("span", null, "S:", w.S),
                    w.AP && w.AP !== '0' && w.AP !== '-' && h("span", null, "AP:", w.AP),
                    w.D && w.D !== '-' && h("span", null, "D:", w.D),
                    w.keywords && h("span", { style: { color: '#a08050', fontStyle: 'italic' } }, w.keywords),
                  )
                ),
              ),
              u.abilities && u.abilities.length > 0 && h("div", { style: { marginTop: 8 } },
                h("div", { style: { fontSize: 11, fontWeight: 'bold', color: '#c0b090', marginBottom: 4 } }, "Abilities"),
                u.abilities.map((ab, ai) =>
                  h("div", { key: ai, style: { fontSize: 11, color: '#8a8070', marginBottom: 2 } },
                    h("span", { style: { color: '#e8e0d4' } }, ab.name),
                    ab.description && h("span", null, " — ", ab.description),
                  )
                ),
              ),
              !u.datasheet && h("div", { style: { fontSize: 11, color: '#cc2222', marginTop: 4 } }, "⚠ No wahapedia datasheet match"),
            )
      ),
    ),
  );
}
