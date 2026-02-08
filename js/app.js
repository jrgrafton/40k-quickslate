import { createElement as h, useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import ArmyList from "./components/ArmyList.js";
import ProbabilityCalc from "./components/ProbabilityCalc.js";
import Simulator from "./components/Simulator.js";
import StratagemPanel from "./components/StratagemPanel.js";
import SearchBar from "./components/SearchBar.js";
import UnitCard from "./components/UnitCard.js";
import FactionBrowser from "./components/FactionBrowser.js";
import DetachmentViewer from "./components/DetachmentViewer.js";
import BattleDashboard from "./components/BattleDashboard.js";
import LoadingScreen from "./components/LoadingScreen.js";
import DataStatus from "./components/DataStatus.js";
import { loadDatabase, getDatabase, onLoadProgress, getCacheMeta } from "./data/wahapedia-loader.js";

const TABS = [
  { id: "army", label: "Import Army" },
  { id: "battle", label: "⚔️ Battle" },
  { id: "browse", label: "Browse" },
  { id: "probability", label: "Probability" },
  { id: "simulator", label: "Simulator" },
  { id: "stratagems", label: "Stratagems" },
  { id: "detachments", label: "Detachments" },
];

function App() {
  const [tab, setTab] = useState("army");
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ loaded: 0, total: 14, message: 'Initializing...' });
  const [error, setError] = useState(null);
  const [army, setArmy] = useState(null);

  const doLoad = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const database = await loadDatabase(force);
      setDb(database);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onLoadProgress(setProgress);
    doLoad();
    return unsub;
  }, [doLoad]);

  function handleArmyLoaded(parsedArmy) {
    setArmy(parsedArmy);
    setTab("battle");
  }

  if (loading && !db) {
    return h(LoadingScreen, { progress, error });
  }

  return h("div", { className: "app" },
    h("header", { className: "header" },
      h("h1", null, "40K ", h("span", null, "Quick"), "Slate"),
      h("nav", { className: "tabs" },
        ...TABS.map(t =>
          h("button", {
            key: t.id,
            className: `tab ${tab === t.id ? "active" : ""} ${t.id === "battle" && army ? "tab-battle-ready" : ""}`,
            onClick: () => setTab(t.id),
          }, t.label)
        ),
      ),
    ),
    h(DataStatus, { db, onRefresh: () => doLoad(true), loading }),
    h("div", { style: { textAlign: 'right', padding: '0 16px', fontSize: 10, color: '#5a5548', fontFamily: 'var(--font-mono)' } }, "Last updated: 2026-02-08"),
    h("main", { className: "main" },
      error && !db && h("div", { className: "card", style: { color: '#cc2222' } }, "Error: ", error),
      tab === "army" && h(ArmyList, { db, onArmyLoaded: handleArmyLoaded }),
      tab === "battle" && h(BattleDashboard, { army, db }),
      tab === "browse" && h(FactionBrowser, { db }),
      tab === "probability" && h(ProbabilityCalc, { db }),
      tab === "simulator" && h(Simulator, { db }),
      tab === "stratagems" && h(StratagemPanel, { db }),
      tab === "detachments" && h(DetachmentViewer, { db }),
    ),
  );
}

createRoot(document.getElementById("root")).render(h(App));
