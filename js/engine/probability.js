// Analytical probability calculations for 40K 10th Edition

/** Probability of rolling >= target on a D6 */
export function probRoll(target) {
  if (target <= 1) return 1;
  if (target > 6) return 0;
  return (7 - target) / 6;
}

/** Hit probability given BS/WS as a number (e.g., 3 for 3+) */
export function probHit(skill, { rerollOnes = false, rerollAll = false } = {}) {
  let p = probRoll(skill);
  if (rerollAll) p = p + (1 - p) * p;
  else if (rerollOnes) p = p + (1/6) * p;
  return p;
}

/** Wound roll target: Strength vs Toughness */
export function woundTarget(S, T) {
  if (S >= T * 2) return 2;
  if (S > T) return 3;
  if (S === T) return 4;
  if (S * 2 <= T) return 6;
  return 5;
}

export function probWound(S, T, { rerollOnes = false, rerollAll = false } = {}) {
  const target = woundTarget(S, T);
  let p = probRoll(target);
  if (rerollAll) p = p + (1 - p) * p;
  else if (rerollOnes) p = p + (1/6) * p;
  return p;
}

/** Save probability (probability the save FAILS, i.e., damage goes through) */
export function probFailSave(Sv, AP = 0, invuln = null) {
  const modifiedSv = Sv + Math.abs(AP);
  let effectiveSv = modifiedSv;
  if (invuln !== null && invuln < effectiveSv) effectiveSv = invuln;
  // Save succeeds on effectiveSv+
  const pSave = probRoll(effectiveSv);
  return 1 - pSave;
}

/** Feel No Pain probability (prob damage goes through) */
export function probFailFNP(fnp) {
  if (!fnp || fnp > 6) return 1;
  return 1 - probRoll(fnp);
}

/** Full attack sequence probability: expected damage per attack */
export function expectedDamagePerAttack({ BS, S, T, AP, D, Sv, invuln, fnp, hitMods = {}, woundMods = {} }) {
  const pH = probHit(BS, hitMods);
  const pW = probWound(S, T, woundMods);
  const pFS = probFailSave(Sv, AP, invuln);
  const pFFNP = probFailFNP(fnp);
  const avgD = typeof D === "number" ? D : averageDice(D);
  return pH * pW * pFS * pFFNP * avgD;
}

function averageDice(expr) {
  if (typeof expr === "number") return expr;
  const s = String(expr).trim().toUpperCase();
  const m = s.match(/^(\d*)D(\d+)([+-]\d+)?$/);
  if (!m) return parseFloat(s) || 0;
  const count = m[1] ? parseInt(m[1]) : 1;
  const sides = parseInt(m[2]);
  const mod = m[3] ? parseInt(m[3]) : 0;
  return count * (sides + 1) / 2 + mod;
}

/** Generate wound roll probability table */
export function woundTable() {
  const rows = [];
  for (let S = 2; S <= 14; S += 2) {
    const row = { S };
    for (let T = 2; T <= 14; T += 2) {
      row[`T${T}`] = woundTarget(S, T);
    }
    rows.push(row);
  }
  return rows;
}
