import { createElement as h, useState } from "react";
import { parseArmyList } from "../utils/parser.js";
import { fuzzyMatchUnit } from "../data/wahapedia-loader.js";
import UnitCard from "./UnitCard.js";

export default function ArmyList({ db, onArmyLoaded }) {
  const [text, setText] = useState("");
  const [army, setArmy] = useState(null);
  const [parseError, setParseError] = useState(null);

  function handleParse() {
    if (!text.trim()) return;
    setParseError(null);
    try {
      const parsed = parseArmyList(text);
      // Fuzzy-match parsed units against wahapedia database
      parsed.units = parsed.units.map(u => {
        const match = fuzzyMatchUnit(u.name, db);
        return { ...u, datasheet: match || null };
      });
      setArmy(parsed);
      if (onArmyLoaded) onArmyLoaded(parsed);
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
    h("div", { className: "card" },
      h("div", { className: "card-header" },
        h("span", { className: "card-title" }, "Import Army List"),
        h("span", { className: "card-subtitle" }, "Paste Yellow Scribe text or BattleScribe JSON, or upload a file"),
      ),
      h("div", { className: "upload-area", onClick: () => document.getElementById("file-input").click() },
        h("p", null, "📄 Click to upload a .txt or .json file, or paste below"),
        h("input", { id: "file-input", type: "file", accept: ".txt,.text,.json", style: { display: "none" }, onChange: handleFile }),
      ),
      h("textarea", {
        value: text,
        onChange: e => setText(e.target.value),
        placeholder: "Paste your army list here (Yellow Scribe text or BattleScribe JSON)...",
        rows: 10,
      }),
      parseError && h("div", { style: { color: '#cc2222', fontSize: 13, marginTop: 8 } }, parseError),
      h("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
        h("button", { className: "btn", onClick: handleParse }, "Parse Army List"),
        h("button", { className: "btn btn-gold btn-sm", onClick: () => setText(sampleList) }, "Load Sample"),
      ),
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
              u.weapons && u.weapons.length > 0 && h("div", { style: { fontSize: 11, color: '#8a8070', marginTop: 6 } },
                "Weapons: ", u.weapons.map(w => w.name).join(", ")
              ),
              !u.datasheet && h("div", { style: { fontSize: 11, color: '#cc2222', marginTop: 4 } }, "⚠ No wahapedia datasheet match"),
            )
      ),
    ),
  );
}
