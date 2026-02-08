import { createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import ArmyList from "./components/ArmyList.js";
import ProbabilityCalc from "./components/ProbabilityCalc.js";
import Simulator from "./components/Simulator.js";
import StratagemPanel from "./components/StratagemPanel.js";
import SearchBar from "./components/SearchBar.js";
import UnitCard from "./components/UnitCard.js";
import { UNITS } from "./data/units.js";
import { FACTIONS } from "./data/factions.js";

const TABS = [
  { id: "army", label: "My Army" },
  { id: "probability", label: "Probability" },
  { id: "simulator", label: "Simulator" },
  { id: "reference", label: "Reference" },
];

function ReferenceTab() {
  const [search, setSearch] = useState("");
  const [faction, setFaction] = useState("all");

  const filtered = UNITS.filter(u => {
    if (faction !== "all" && u.faction !== faction) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) ||
        u.keywords.some(k => k.toLowerCase().includes(q));
    }
    return true;
  });

  return h("div", null,
    h(SearchBar, { value: search, onChange: setSearch, placeholder: "Search units by name or keyword..." }),
    h("div", { className: "filter-pills" },
      h("span", { className: `pill ${faction === "all" ? "active" : ""}`, onClick: () => setFaction("all") }, "All"),
      ...Object.entries(FACTIONS).map(([id, f]) =>
        h("span", { key: id, className: `pill ${faction === id ? "active" : ""}`, onClick: () => setFaction(id) }, f.name)
      ),
    ),
    h("div", { style: { marginBottom: 8, color: "#5a5548", fontSize: 12 } }, `${filtered.length} units`),
    ...filtered.map(u => h(UnitCard, { key: u.id, unit: u })),
    h("div", { style: { marginTop: 24 } },
      h(StratagemPanel),
    ),
  );
}

function App() {
  const [tab, setTab] = useState("army");

  return h("div", { className: "app" },
    h("header", { className: "header" },
      h("h1", null, "40K ", h("span", null, "Quick"), "Slate"),
      h("nav", { className: "tabs" },
        ...TABS.map(t =>
          h("button", {
            key: t.id,
            className: `tab ${tab === t.id ? "active" : ""}`,
            onClick: () => setTab(t.id),
          }, t.label)
        ),
      ),
    ),
    h("main", { className: "main" },
      tab === "army" && h(ArmyList),
      tab === "probability" && h(ProbabilityCalc),
      tab === "simulator" && h(Simulator),
      tab === "reference" && h(ReferenceTab),
    ),
  );
}

createRoot(document.getElementById("root")).render(h(App));
