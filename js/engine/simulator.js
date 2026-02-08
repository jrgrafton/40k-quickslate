// Monte Carlo combat simulator for 40K 10th Edition
import { rollD6, rollExpr } from "./dice.js";
import { woundTarget } from "./probability.js";

/**
 * Simulate a full attack sequence once.
 * @param {Object} opts
 * @param {number|string} opts.attacks - Number of attacks (or dice expr)
 * @param {number} opts.skill - BS or WS (e.g., 3 for 3+)
 * @param {number} opts.S - Strength
 * @param {number} opts.T - Toughness
 * @param {number} opts.AP - AP value (positive number)
 * @param {number|string} opts.D - Damage per wound
 * @param {number} opts.Sv - Save characteristic
 * @param {number|null} opts.invuln - Invulnerable save
 * @param {number|null} opts.fnp - Feel No Pain
 * @param {number} opts.wounds - Wounds per model
 * @param {number} opts.models - Number of defending models
 * @param {boolean} opts.rerollHitOnes
 * @param {boolean} opts.rerollHitAll
 * @param {boolean} opts.rerollWoundOnes
 * @param {boolean} opts.rerollWoundAll
 * @returns {Object} { damage, modelsKilled }
 */
export function simulateOnce(opts) {
  const numAttacks = rollExpr(opts.attacks);
  const woundReq = woundTarget(opts.S, opts.T);
  const modSv = opts.Sv + Math.abs(opts.AP || 0);
  const effectiveSv = (opts.invuln && opts.invuln < modSv) ? opts.invuln : modSv;

  let totalDamage = 0;
  let modelsLeft = opts.models || 1;
  let currentModelWounds = opts.wounds || 1;
  let modelsKilled = 0;

  for (let i = 0; i < numAttacks && modelsLeft > 0; i++) {
    // Hit roll
    let hitRoll = rollD6();
    if (hitRoll === 1 || hitRoll < opts.skill) {
      // Reroll?
      if (opts.rerollHitAll || (opts.rerollHitOnes && hitRoll === 1)) {
        hitRoll = rollD6();
      }
    }
    if (hitRoll < opts.skill) continue; // miss

    // Wound roll
    let woundRoll = rollD6();
    if (woundRoll === 1 || woundRoll < woundReq) {
      if (opts.rerollWoundAll || (opts.rerollWoundOnes && woundRoll === 1)) {
        woundRoll = rollD6();
      }
    }
    if (woundRoll < woundReq) continue; // fail to wound

    // Save roll
    if (effectiveSv <= 6) {
      const saveRoll = rollD6();
      if (saveRoll >= effectiveSv) continue; // saved
    }

    // Damage
    let dmg = rollExpr(opts.D);

    // FNP
    if (opts.fnp && opts.fnp <= 6) {
      let dmgAfterFnp = 0;
      for (let d = 0; d < dmg; d++) {
        if (rollD6() < opts.fnp) dmgAfterFnp++;
      }
      dmg = dmgAfterFnp;
    }

    // Apply damage to models (excess spills per model)
    totalDamage += dmg;
    currentModelWounds -= dmg;
    while (currentModelWounds <= 0 && modelsLeft > 0) {
      modelsKilled++;
      modelsLeft--;
      currentModelWounds = opts.wounds || 1; // reset for next model (excess is lost in 10th ed)
      // Actually in 10th ed excess damage doesn't carry over
      break;
    }
    if (currentModelWounds <= 0) {
      currentModelWounds = opts.wounds || 1;
    }
  }

  return { damage: totalDamage, modelsKilled };
}

/**
 * Run N simulations and return results
 */
export function runSimulation(opts, N = 10000) {
  const damages = [];
  const kills = [];
  let totalDmg = 0;
  let totalKills = 0;

  for (let i = 0; i < N; i++) {
    const result = simulateOnce(opts);
    damages.push(result.damage);
    kills.push(result.modelsKilled);
    totalDmg += result.damage;
    totalKills += result.modelsKilled;
  }

  // Build histogram
  const maxDmg = Math.max(...damages);
  const histogram = new Array(maxDmg + 1).fill(0);
  for (const d of damages) histogram[d]++;

  // Convert to percentages
  const histPct = histogram.map(c => (c / N) * 100);

  // Percentiles
  damages.sort((a, b) => a - b);
  const p10 = damages[Math.floor(N * 0.1)];
  const p25 = damages[Math.floor(N * 0.25)];
  const p50 = damages[Math.floor(N * 0.5)];
  const p75 = damages[Math.floor(N * 0.75)];
  const p90 = damages[Math.floor(N * 0.9)];

  return {
    mean: totalDmg / N,
    meanKills: totalKills / N,
    median: p50,
    p10, p25, p75, p90,
    min: damages[0],
    max: damages[N - 1],
    histogram: histPct,
    N,
  };
}
