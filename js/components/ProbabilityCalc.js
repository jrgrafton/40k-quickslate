import { createElement as h, useState, useMemo } from "react";
import { probHit, probWound, probFailSave, probFailFNP, woundTarget } from "../engine/probability.js";
import { formatPercent } from "../utils/helpers.js";

export default function ProbabilityCalc({ db }) {
  const [mode, setMode] = useState("manual"); // manual or database
  const [factionFilter, setFactionFilter] = useState("all");
  const [unitId, setUnitId] = useState("");
  const [weaponIdx, setWeaponIdx] = useState(0);

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

  const units = db?.units || [];
  const factions = db?.factions ? Object.values(db.factions).sort((a, b) => a.name.localeCompare(b.name)) : [];
  const filteredUnits = useMemo(() => {
    if (factionFilter === "all") return units.filter(u => !u.legend);
    return units.filter(u => u.faction_id === factionFilter && !u.legend);
  }, [units, factionFilter]);

  const selectedUnit = units.find(u => u.id === unitId);
  const selectedWeapon = selectedUnit?.weapons?.[weaponIdx];

  // If in database mode and a weapon is selected, use its values
  const effectiveBs = mode === 'database' && selectedWeapon ? parseInt(String(selectedWeapon.BS_WS).replace(/\+/g,'')) || 3 : bs;
  const effectiveS = mode === 'database' && selectedWeapon ? parseInt(selectedWeapon.S) || 4 : S;
  const effectiveAp = mode === 'database' && selectedWeapon ? Math.abs(parseInt(selectedWeapon.AP) || 0) : ap;
  const effectiveD = mode === 'database' && selectedWeapon ? (parseInt(selectedWeapon.D) || 1) : D;
  const effectiveA = mode === 'database' && selectedWeapon ? (parseInt(selectedWeapon.A) || 1) : attacks;

  const pHit = probHit(effectiveBs, { rerollOnes: rerollHit1 });
  const pWound = probWound(effectiveS, T, { rerollOnes: rerollWound1 });
  const pFail = probFailSave(sv, effectiveAp, inv || null);
  const pFnp = probFailFNP(fnp || null);
  const pPerAttack = pHit * pWound * pFail * pFnp;
  const expectedDmg = pPerAttack * effectiveD * effectiveA;

  const tValues = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14];
  const sValues = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14];

  return h("div", null,
    h("div", { className: "card" },
      h("div", { className: "card-header" },
        h("span", { className: "card-title" }, "Attack Probability Calculator"),
      ),
      h("div", { className: "filter-pills", style: { marginBottom: 12 } },
        h("span", { className: `pill ${mode === 'manual' ? 'active' : ''}`, onClick: () => setMode('manual') }, "Manual Input"),
        h("span", { className: `pill ${mode === 'database' ? 'active' : ''}`, onClick: () => setMode('database') }, "From Database"),
      ),

      mode === 'database' && h("div", { style: { marginBottom: 12 } },
        h("div", { className: "grid-3" },
          h("div", { className: "field" },
            h("label", null, "Faction"),
            h("select", { className: "select", value: factionFilter, onChange: e => { setFactionFilter(e.target.value); setUnitId(""); } },
              h("option", { value: "all" }, "All"),
              ...factions.map(f => h("option", { key: f.id, value: f.id }, f.name)),
            ),
          ),
          h("div", { className: "field" },
            h("label", null, "Unit"),
            h("select", { className: "select", value: unitId, onChange: e => { setUnitId(e.target.value); setWeaponIdx(0); } },
              h("option", { value: "" }, "Select..."),
              ...filteredUnits.map(u => h("option", { key: u.id, value: u.id }, u.name)),
            ),
          ),
          selectedUnit && h("div", { className: "field" },
            h("label", null, "Weapon"),
            h("select", { className: "select", value: weaponIdx, onChange: e => setWeaponIdx(+e.target.value) },
              ...selectedUnit.weapons.map((w, i) => h("option", { key: i, value: i }, `${w.name} (S:${w.S} AP:${w.AP})`)),
            ),
          ),
        ),
      ),

      h("div", { className: "grid-3" },
        h("div", { className: "field" },
          h("label", null, "Attacks"), h("input", { className: "input", type: "number", min: 1, value: effectiveA, onChange: e => setAttacks(+e.target.value), disabled: mode === 'database' && selectedWeapon })),
        h("div", { className: "field" },
          h("label", null, "BS/WS"), h("input", { className: "input", type: "number", min: 2, max: 6, value: effectiveBs, onChange: e => setBs(+e.target.value), disabled: mode === 'database' && selectedWeapon })),
        h("div", { className: "field" },
          h("label", null, "Strength"), h("input", { className: "input", type: "number", min: 1, value: effectiveS, onChange: e => setS(+e.target.value), disabled: mode === 'database' && selectedWeapon })),
        h("div", { className: "field" },
          h("label", null, "Toughness"), h("input", { className: "input", type: "number", min: 1, value: T, onChange: e => setT(+e.target.value) })),
        h("div", { className: "field" },
          h("label", null, "AP"), h("input", { className: "input", type: "number", min: 0, max: 6, value: effectiveAp, onChange: e => setAp(+e.target.value), disabled: mode === 'database' && selectedWeapon })),
        h("div", { className: "field" },
          h("label", null, "Save"), h("input", { className: "input", type: "number", min: 2, max: 7, value: sv, onChange: e => setSv(+e.target.value) })),
        h("div", { className: "field" },
          h("label", null, "Invuln (0=none)"), h("input", { className: "input", type: "number", min: 0, max: 6, value: inv, onChange: e => setInv(+e.target.value) })),
        h("div", { className: "field" },
          h("label", null, "FNP (0=none)"), h("input", { className: "input", type: "number", min: 0, max: 6, value: fnp, onChange: e => setFnp(+e.target.value) })),
        h("div", { className: "field" },
          h("label", null, "Damage"), h("input", { className: "input", type: "number", min: 1, value: effectiveD, onChange: e => setD(+e.target.value), disabled: mode === 'database' && selectedWeapon })),
      ),
      h("div", { style: { display: "flex", gap: 16, marginTop: 8 } },
        h("label", { className: "toggle-row" }, h("input", { type: "checkbox", checked: rerollHit1, onChange: e => setRerollHit1(e.target.checked) }), "Re-roll hit 1s"),
        h("label", { className: "toggle-row" }, h("input", { type: "checkbox", checked: rerollWound1, onChange: e => setRerollWound1(e.target.checked) }), "Re-roll wound 1s"),
      ),
      h("div", { className: "sim-stats", style: { marginTop: 16 } },
        h("div", { className: "sim-stat" }, h("div", { className: "sim-stat-value" }, formatPercent(pHit)), h("div", { className: "sim-stat-label" }, "Hit Prob")),
        h("div", { className: "sim-stat" }, h("div", { className: "sim-stat-value" }, formatPercent(pWound)), h("div", { className: "sim-stat-label" }, `Wound (${woundTarget(effectiveS, T)}+)`)),
        h("div", { className: "sim-stat" }, h("div", { className: "sim-stat-value" }, formatPercent(pFail)), h("div", { className: "sim-stat-label" }, "Unsaved")),
        h("div", { className: "sim-stat" }, h("div", { className: "sim-stat-value" }, formatPercent(pPerAttack)), h("div", { className: "sim-stat-label" }, "Per Attack")),
        h("div", { className: "sim-stat" }, h("div", { className: "sim-stat-value", style: { color: "#cc2222" } }, expectedDmg.toFixed(1)), h("div", { className: "sim-stat-label" }, "Exp. Damage")),
      ),
    ),

    h("div", { className: "card", style: { marginTop: 16 } },
      h("div", { className: "card-header" },
        h("span", { className: "card-title" }, "Wound Roll Reference Table"),
        h("span", { className: "card-subtitle" }, "Required roll (S vs T)"),
      ),
      h("div", { style: { overflowX: "auto" } },
        h("table", { className: "prob-table" },
          h("thead", null,
            h("tr", null, h("th", null, "S \\ T"), ...tValues.map(t => h("th", { key: t }, "T" + t))),
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
