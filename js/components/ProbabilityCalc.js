import { createElement as h, useState } from "react";
import { probHit, probWound, probFailSave, probFailFNP, woundTarget } from "../engine/probability.js";
import { formatPercent } from "../utils/helpers.js";

function ProbCell({ value }) {
  const pct = value * 100;
  const cls = pct >= 60 ? "prob-high" : pct >= 30 ? "prob-mid" : "prob-low";
  return h("td", { className: cls }, formatPercent(value));
}

export default function ProbabilityCalc() {
  const [bs, setBs] = useState(3);
  const [S, setS] = useState(4);
  const [T, setT] = useState(4);
  const [ap, setAp] = useState(0);
  const [sv, setSv] = useState(3);
  const [inv, setInv] = useState(0);
  const [fnp, setFnp] = useState(0);
  const [D, setD] = useState(1);
  const [attacks, setAttacks] = useState(2);
  const [rerollHit1, setRerollHit1] = useState(false);
  const [rerollWound1, setRerollWound1] = useState(false);

  const pHit = probHit(bs, { rerollOnes: rerollHit1 });
  const pWound = probWound(S, T, { rerollOnes: rerollWound1 });
  const pFail = probFailSave(sv, ap, inv || null);
  const pFnp = probFailFNP(fnp || null);
  const pPerAttack = pHit * pWound * pFail * pFnp;
  const expectedDmg = pPerAttack * D * attacks;

  // Wound table
  const tValues = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14];
  const sValues = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14];

  return h("div", null,
    // Calculator
    h("div", { className: "card" },
      h("div", { className: "card-header" },
        h("span", { className: "card-title" }, "Attack Probability Calculator"),
      ),
      h("div", { className: "grid-3" },
        h("div", { className: "field" },
          h("label", null, "Attacks"), h("input", { className: "input", type: "number", min: 1, value: attacks, onChange: e => setAttacks(+e.target.value) })),
        h("div", { className: "field" },
          h("label", null, "BS/WS"), h("input", { className: "input", type: "number", min: 2, max: 6, value: bs, onChange: e => setBs(+e.target.value) })),
        h("div", { className: "field" },
          h("label", null, "Strength"), h("input", { className: "input", type: "number", min: 1, value: S, onChange: e => setS(+e.target.value) })),
        h("div", { className: "field" },
          h("label", null, "Toughness"), h("input", { className: "input", type: "number", min: 1, value: T, onChange: e => setT(+e.target.value) })),
        h("div", { className: "field" },
          h("label", null, "AP"), h("input", { className: "input", type: "number", min: 0, max: 6, value: ap, onChange: e => setAp(+e.target.value) })),
        h("div", { className: "field" },
          h("label", null, "Save"), h("input", { className: "input", type: "number", min: 2, max: 7, value: sv, onChange: e => setSv(+e.target.value) })),
        h("div", { className: "field" },
          h("label", null, "Invuln (0=none)"), h("input", { className: "input", type: "number", min: 0, max: 6, value: inv, onChange: e => setInv(+e.target.value) })),
        h("div", { className: "field" },
          h("label", null, "FNP (0=none)"), h("input", { className: "input", type: "number", min: 0, max: 6, value: fnp, onChange: e => setFnp(+e.target.value) })),
        h("div", { className: "field" },
          h("label", null, "Damage"), h("input", { className: "input", type: "number", min: 1, value: D, onChange: e => setD(+e.target.value) })),
      ),
      h("div", { style: { display: "flex", gap: 16, marginTop: 8 } },
        h("label", { className: "toggle-row" },
          h("input", { type: "checkbox", checked: rerollHit1, onChange: e => setRerollHit1(e.target.checked) }),
          "Re-roll hit 1s"),
        h("label", { className: "toggle-row" },
          h("input", { type: "checkbox", checked: rerollWound1, onChange: e => setRerollWound1(e.target.checked) }),
          "Re-roll wound 1s"),
      ),
      // Results
      h("div", { className: "sim-stats", style: { marginTop: 16 } },
        h("div", { className: "sim-stat" },
          h("div", { className: "sim-stat-value" }, formatPercent(pHit)),
          h("div", { className: "sim-stat-label" }, "Hit Prob")),
        h("div", { className: "sim-stat" },
          h("div", { className: "sim-stat-value" }, formatPercent(pWound)),
          h("div", { className: "sim-stat-label" }, `Wound (${woundTarget(S, T)}+)`)),
        h("div", { className: "sim-stat" },
          h("div", { className: "sim-stat-value" }, formatPercent(pFail)),
          h("div", { className: "sim-stat-label" }, "Unsaved")),
        h("div", { className: "sim-stat" },
          h("div", { className: "sim-stat-value" }, formatPercent(pPerAttack)),
          h("div", { className: "sim-stat-label" }, "Per Attack")),
        h("div", { className: "sim-stat" },
          h("div", { className: "sim-stat-value", style: { color: "#cc2222" } }, expectedDmg.toFixed(1)),
          h("div", { className: "sim-stat-label" }, "Exp. Damage")),
      ),
    ),

    // Wound table reference
    h("div", { className: "card", style: { marginTop: 16 } },
      h("div", { className: "card-header" },
        h("span", { className: "card-title" }, "Wound Roll Reference Table"),
        h("span", { className: "card-subtitle" }, "Required roll (S vs T)"),
      ),
      h("div", { style: { overflowX: "auto" } },
        h("table", { className: "prob-table" },
          h("thead", null,
            h("tr", null,
              h("th", null, "S \\ T"),
              ...tValues.map(t => h("th", { key: t }, "T" + t)),
            ),
          ),
          h("tbody", null,
            ...sValues.map(s =>
              h("tr", { key: s },
                h("td", { style: { fontWeight: 700, color: "#c9a84c" } }, "S" + s),
                ...tValues.map(t => {
                  const req = woundTarget(s, t);
                  const cls = req <= 3 ? "prob-high" : req <= 4 ? "prob-mid" : "prob-low";
                  return h("td", { key: t, className: cls }, req + "+");
                }),
              )
            ),
          ),
        ),
      ),
    ),
  );
}
