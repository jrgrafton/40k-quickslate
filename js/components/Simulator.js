import { createElement as h, useState, useRef, useEffect } from "react";
import { UNITS } from "../data/units.js";
import { FACTIONS } from "../data/factions.js";
import { runSimulation } from "../engine/simulator.js";
import { avgExpr } from "../engine/dice.js";

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
  const startX = 40;
  const startY = ht - 30;
  const chartH = startY - 10;

  // Grid lines
  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = startY - (chartH * i / 4);
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(w - 10, y);
    ctx.stroke();
    ctx.fillStyle = "#5a5548";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText((maxPct * i / 4).toFixed(0) + "%", startX - 4, y + 3);
  }

  // Bars
  histogram.forEach((pct, i) => {
    const barH = (pct / maxPct) * chartH;
    const x = startX + i * barW;
    const y = startY - barH;

    // Gradient color based on distance from mean
    const dist = Math.abs(i - stats.mean) / (stats.max - stats.min + 1);
    const r = Math.floor(139 + (201 - 139) * (1 - dist));
    const g = Math.floor(0 + 168 * dist * 0.3);
    const b = Math.floor(0 + 76 * dist);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, y, barW - 1, barH);
  });

  // Mean line
  const meanX = startX + stats.mean * barW + barW / 2;
  ctx.strokeStyle = "#c9a84c";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(meanX, 10);
  ctx.lineTo(meanX, startY);
  ctx.stroke();
  ctx.setLineDash([]);

  // X axis labels
  ctx.fillStyle = "#5a5548";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  const step = Math.max(1, Math.floor(histogram.length / 15));
  for (let i = 0; i < histogram.length; i += step) {
    ctx.fillText(i.toString(), startX + i * barW + barW / 2, startY + 14);
  }

  // Mean label
  ctx.fillStyle = "#c9a84c";
  ctx.font = "bold 11px monospace";
  ctx.fillText("μ=" + stats.mean.toFixed(1), meanX, 10);
}

export default function Simulator() {
  const [attackerId, setAttackerId] = useState("");
  const [weaponIdx, setWeaponIdx] = useState(0);
  const [defenderId, setDefenderId] = useState("");
  const [numModels, setNumModels] = useState(5);
  const [numSims, setNumSims] = useState(10000);
  const [rerollHit1, setRerollHit1] = useState(false);
  const [rerollWound1, setRerollWound1] = useState(false);
  const [results, setResults] = useState(null);
  const canvasRef = useRef(null);

  const attacker = UNITS.find(u => u.id === attackerId);
  const defender = UNITS.find(u => u.id === defenderId);
  const weapon = attacker?.weapons?.[weaponIdx];

  useEffect(() => {
    if (results && canvasRef.current) {
      drawHistogram(canvasRef.current, results.histogram, results);
    }
  }, [results]);

  function run() {
    if (!weapon || !defender) return;
    const opts = {
      attacks: weapon.A,
      skill: weapon.BS || weapon.WS,
      S: weapon.S,
      T: defender.T,
      AP: weapon.AP,
      D: weapon.D,
      Sv: defender.Sv,
      invuln: defender.invuln || null,
      fnp: defender.fnp || null,
      wounds: defender.W,
      models: numModels,
      rerollHitOnes: rerollHit1,
      rerollWoundOnes: rerollWound1,
    };
    const res = runSimulation(opts, numSims);
    setResults(res);
  }

  const unitOptions = Object.entries(FACTIONS).map(([fid, f]) => ({
    label: f.name,
    units: UNITS.filter(u => u.faction === fid),
  }));

  return h("div", null,
    h("div", { className: "sim-config" },
      // Attacker panel
      h("div", { className: "sim-panel" },
        h("h3", null, "⚔️ Attacker"),
        h("div", { className: "field" },
          h("label", null, "Unit"),
          h("select", { className: "select", value: attackerId, onChange: e => { setAttackerId(e.target.value); setWeaponIdx(0); } },
            h("option", { value: "" }, "Select unit..."),
            ...unitOptions.map(g =>
              h("optgroup", { key: g.label, label: g.label },
                ...g.units.map(u => h("option", { key: u.id, value: u.id }, u.name))
              )
            ),
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
          h("label", { className: "toggle-row" },
            h("input", { type: "checkbox", checked: rerollHit1, onChange: e => setRerollHit1(e.target.checked) }),
            "Re-roll hit 1s"),
          h("label", { className: "toggle-row" },
            h("input", { type: "checkbox", checked: rerollWound1, onChange: e => setRerollWound1(e.target.checked) }),
            "Re-roll wound 1s"),
        ),
      ),
      // Defender panel
      h("div", { className: "sim-panel" },
        h("h3", null, "🛡️ Defender"),
        h("div", { className: "field" },
          h("label", null, "Unit"),
          h("select", { className: "select", value: defenderId, onChange: e => setDefenderId(e.target.value) },
            h("option", { value: "" }, "Select unit..."),
            ...unitOptions.map(g =>
              h("optgroup", { key: g.label, label: g.label },
                ...g.units.map(u => h("option", { key: u.id, value: u.id }, `${u.name} (T:${u.T} Sv:${u.Sv}+ W:${u.W})`))
              )
            ),
          ),
        ),
        defender && h("div", null,
          h("div", { style: { fontSize: 12, color: "#8a8070", marginBottom: 8 } },
            `T:${defender.T} Sv:${defender.Sv}+ W:${defender.W}` +
            (defender.invuln ? ` Inv:${defender.invuln}+` : "") +
            (defender.fnp ? ` FNP:${defender.fnp}+` : "")
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
        h("div", { className: "sim-stat" }, h("div", { className: "sim-stat-value" }, results.p25 + "–" + results.p75), h("div", { className: "sim-stat-label" }, "IQR (25–75%)")),
        h("div", { className: "sim-stat" }, h("div", { className: "sim-stat-value" }, results.N.toLocaleString()), h("div", { className: "sim-stat-label" }, "Simulations")),
      ),
    ),
  );
}
