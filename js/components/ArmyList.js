import { createElement as h, useState } from "react";
import { parseArmyList } from "../utils/parser.js";
import { UNITS } from "../data/units.js";
import UnitCard from "./UnitCard.js";

export default function ArmyList() {
  const [text, setText] = useState("");
  const [army, setArmy] = useState(null);

  function handleParse() {
    if (!text.trim()) return;
    const parsed = parseArmyList(text);
    // Try to match parsed units to our datasheet database
    parsed.units = parsed.units.map(u => {
      const match = UNITS.find(db =>
        db.name.toLowerCase() === u.name.toLowerCase() ||
        db.name.toLowerCase().includes(u.name.toLowerCase()) ||
        u.name.toLowerCase().includes(db.name.toLowerCase())
      );
      return { ...u, datasheet: match || null };
    });
    setArmy(parsed);
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
        h("span", { className: "card-subtitle" }, "Paste Yellow Scribe format or upload a file"),
      ),
      h("div", { className: "upload-area", onClick: () => document.getElementById("file-input").click() },
        h("p", null, "📄 Click to upload a .txt file or paste below"),
        h("input", { id: "file-input", type: "file", accept: ".txt,.text", style: { display: "none" }, onChange: handleFile }),
      ),
      h("textarea", {
        value: text,
        onChange: e => setText(e.target.value),
        placeholder: "Paste your army list here...",
        rows: 10,
      }),
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
                    u.category + (u.models > 1 ? ` • ${u.models} models` : "")
                  ),
                  u.loadout.length > 0 && h("div", { style: { fontSize: 12, color: "#8a8070", marginTop: 4 } },
                    u.loadout.join(", ")
                  ),
                ),
                h("span", { className: "points-badge" }, u.points + " pts"),
              ),
            )
      ),
    ),
  );
}
