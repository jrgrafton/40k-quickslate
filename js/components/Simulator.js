import { createElement as h, useState, useRef, useEffect, useMemo } from "react";
import { runSimulation } from "../engine/simulator.js";

function drawHistogram(canvas, histogram, stats) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const ht = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = ht * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, ht);
  if (!histogram || histogram.length === 0) return;
  const maxPct = Math.max(...histogram);
  const barW = Math.max(2, Math.min(30, (w - 60) / histogram.length));
  const startX = 40, startY = ht - 30, chartH = startY - 10;
  ctx.strokeStyle = "#2a2a2a"; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = startY - (chartH * i / 4);
    ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(w - 10, y); ctx.stroke();
    ctx.fillStyle = "#5a5548"; ctx.font = "10px monospace"; ctx.textAlign = "right";
    ctx.fillText((maxPct * i / 4).toFixed(0) + "%", startX - 4, y + 3);
  }
  histogram.forEach((pct, i) => {
    const barH = (pct / maxPct) * chartH;
    const x = startX + i * barW, y = startY - barH;
    const dist = Math.abs(i - stats.mean) / (stats.max - stats.min + 1);
    ctx.fillStyle = `rgb(${Math.floor(139 + 62 * (1 - dist))},${Math.floor(168 * dist * 0.3)},${Math.floor(76 * dist)})`;
    ctx.fillRect(x, y, barW - 1, barH);
  });
  const meanX = startX + stats.mean * barW + barW / 2;
  ctx.strokeStyle = "#c9a84c"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(meanX, 10); ctx.lineTo(meanX, startY); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = "#5a5548"; ctx.font = "10px monospace"; ctx.textAlign = "center";
  const step = Math.max(1, Math.floor(histogram.length / 15));
  for (let i = 0; i < histogram.length; i += step) ctx.fillText(i.toString(), startX + i * barW + barW / 2, startY + 14);
  ctx.fillStyle = "#c9a84c"; ctx.font = "bold 11px monospace"; ctx.fillText("μ=" + stats.mean.toFixed(1), meanX, 10);
}

export default function Simulator({ db }) {
  const [factionFilter, setFactionFilter] = useState("all");
  const [attackerId, setAttackerId] = useState("");
  const [weaponIdx, setWeaponIdx] = useState(0);
  const [defenderId, setDefenderId] = useState("");
  const [defFactionFilter, setDefFactionFilter] = useState("all");
  const [numModels, setNumModels] = useState(5);
  const [numSims, setNumSims] = useState(10000);
  const [rerollHit1, setRerollHit1] = useState(false);
  const [rerollWound1, setRerollWound1] = useState(false);
  const [results, setResults] = useState(null);
  const canvasRef = useRef(null);

  const units = db?.units || [];
  const factions = db?.factions ? Object.values(db.factions).sort((a, b) => a.name.localeCompare(b.name)) : [];

  const attackerUnits = useMemo(() => {
    if (factionFilter === "all") return units.filter(u => !u.legend);
    return units.filter(u => u.faction_id === factionFilter && !u.legend);
  }, [units, factionFilter]);

  const defenderUnits = useMemo(() => {
    if (defFactionFilter === "all") return units.filter(u => !u.legend);
    return units.filter(u => u.faction_id === defFactionFilter && !u.legend);
  }, [units, defFactionFilter]);

  const attacker = units.find(u => u.id === attackerId);
  const defender = units.find(u => u.id === defenderId);
  const weapon = attacker?.weapons?.[weaponIdx];

  useEffect(() => {
    if (results && canvasRef.current) drawHistogram(canvasRef.current, results.histogram, results);
  }, [results]);

  function parseNum(s) {
    const n = parseInt(String(s).replace(/[^0-9]/g, ''));
    return isNaN(n) ? 3 : n;
  }

  function run() {
    if (!weapon || !defender) return;
    const defModel = defender.models?.[0] || {};
    const T = parseNum(defModel.T || defender.T || 4);
    const Sv = parseNum(defModel.Sv || defender.Sv || 4);
    const W = parseNum(defModel.W || defender.W || 1);
    const inv = defModel.inv_sv && defModel.inv_sv !== '-' ? parseNum(defModel.inv_sv) : null;

    const opts = {
      attacks: weapon.A,
      skill: parseNum(weapon.BS_WS || weapon.BS || weapon.WS || 3),
      S: parseNum(weapon.S || 4),
      T, AP: Math.abs(parseNum(weapon.AP || 0)),
      D: weapon.D,
      Sv, invuln: inv, fnp: null,
      wounds: W, models: numModels,
      rerollHitOnes: rerollHit1, rerollWoundOnes: rerollWound1,
    };
    setResults(runSimulation(opts, numSims));
  }

  return h("div", null,
    h("div", { className: "sim-config" },
      h("div", { className: "sim-panel" },
        h("h3", null, "⚔️ Attacker"),
        h("div", { className: "field" },
          h("label", null, "Faction Filter"),
          h("select", { className: "select", value: factionFilter, onChange: e => { setFactionFilter(e.target.value); setAttackerId(""); } },
            h("option", { value: "all" }, "All Factions"),
            ...factions.map(f => h("option", { key: f.id, value: f.id }, f.name)),
          ),
        ),
        h("div", { className: "field" },
          h("label", null, `Unit (${attackerUnits.length})`),
          h("select", { className: "select", value: attackerId, onChange: e => { setAttackerId(e.target.value); setWeaponIdx(0); } },
            h("option", { value: "" }, "Select unit..."),
            ...attackerUnits.map(u => h("option", { key: u.id, value: u.id }, u.name)),
          ),
        ),
        attacker && h("div", { className: "field" },
          h("label", null, "Weapon"),
          h("select", { className: "select", value: weaponIdx, onChange: e => setWeaponIdx(+e.target.value) },
            ...attacker.weapons.map((w, i) =>
              h("option", { key: i, value: i }, `${w.name} (A:${w.A} S:${w.S} AP:${w.AP} D:${w.D})`)
            ),
          ),
        ),
        h("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } },
          h("label", { className: "toggle-row" }, h("input", { type: "checkbox", checked: rerollHit1, onChange: e => setRerollHit1(e.target.checked) }), "Re-roll hit 1s"),
          h("label", { className: "toggle-row" }, h("input", { type: "checkbox", checked: rerollWound1, onChange: e => setRerollWound1(e.target.checked) }), "Re-roll wound 1s"),
        ),
      ),
      h("div", { className: "sim-panel" },
        h("h3", null, "🛡️ Defender"),
        h("div", { className: "field" },
          h("label", null, "Faction Filter"),
          h("select", { className: "select", value: defFactionFilter, onChange: e => { setDefFactionFilter(e.target.value); setDefenderId(""); } },
            h("option", { value: "all" }, "All Factions"),
            ...factions.map(f => h("option", { key: f.id, value: f.id }, f.name)),
          ),
        ),
        h("div", { className: "field" },
          h("label", null, `Unit (${defenderUnits.length})`),
          h("select", { className: "select", value: defenderId, onChange: e => setDefenderId(e.target.value) },
            h("option", { value: "" }, "Select unit..."),
            ...defenderUnits.map(u => {
              const m = u.models?.[0] || {};
              return h("option", { key: u.id, value: u.id }, `${u.name} (T:${m.T || '?'} Sv:${m.Sv || '?'} W:${m.W || '?'})`);
            }),
          ),
        ),
        h("div", { className: "field" },
          h("label", null, "Models"), h("input", { className: "input", type: "number", min: 1, max: 30, value: numModels, onChange: e => setNumModels(+e.target.value) })),
        h("div", { className: "field" },
          h("label", null, "Simulations"), h("input", { className: "input", type: "number", min: 100, max: 100000, step: 1000, value: numSims, onChange: e => setNumSims(+e.target.value) })),
      ),
    ),
    h("div", { style: { textAlign: "center", marginBottom: 16 } },
      h("button", { className: "btn", onClick: run, disabled: !weapon || !defender }, "⚡ Run Simulation"),
    ),
    results && h("div", null,
      h("div", { className: "histogram" },
        h("h3", { className: "section-title" }, "Damage Distribution"),
        h("canvas", { ref: canvasRef, style: { width: "100%", height: 220 } }),
      ),
      h("div", { className: "sim-stats" },
        h("div", { className: "sim-stat" }, h("div", { className: "sim-stat-value" }, results.mean.toFixed(1)), h("div", { className: "sim-stat-label" }, "Mean Dmg")),
        h("div", { className: "sim-stat" }, h("div", { className: "sim-stat-value" }, results.median), h("div", { className: "sim-stat-label" }, "Median")),
        h("div", { className: "sim-stat" }, h("div", { className: "sim-stat-value" }, results.meanKills.toFixed(1)), h("div", { className: "sim-stat-label" }, "Avg Kills")),
        h("div", { className: "sim-stat" }, h("div", { className: "sim-stat-value" }, results.min + "–" + results.max), h("div", { className: "sim-stat-label" }, "Range")),
        h("div", { className: "sim-stat" }, h("div", { className: "sim-stat-value" }, results.p25 + "–" + results.p75), h("div", { className: "sim-stat-label" }, "IQR")),
        h("div", { className: "sim-stat" }, h("div", { className: "sim-stat-value" }, results.N.toLocaleString()), h("div", { className: "sim-stat-label" }, "Simulations")),
      ),
    ),
  );
}
