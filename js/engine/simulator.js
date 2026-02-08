// Monte Carlo combat simulator for 40K 10th Edition
// Resolves attacks in proper 40K sequence: all hits → all wounds → all saves → allocate damage
import { rollD6, rollExpr } from "./dice.js";
import { woundTarget } from "./probability.js";

/**
 * Simulate a full attack sequence once.
 */
export function simulateOnce(opts) {
  const attackingModels = opts.attackingModels || 1;
  let totalAttacks = 0;
  for (let m = 0; m < attackingModels; m++) {
    totalAttacks += rollExpr(opts.attacks);
  }

  const woundReq = woundTarget(opts.S, opts.T);
  const apVal = Math.abs(opts.AP || 0) + (opts.bonusAP || 0);
  const modSv = opts.Sv + apVal + (opts.cover ? 1 : 0);
  const effectiveSv = (opts.invuln && opts.invuln < modSv) ? opts.invuln : modSv;
  const cappedSv = Math.max(2, effectiveSv);

  const sustainedHits = opts.sustainedHits || 0;
  const lethalHits = opts.lethalHits || false;
  const devWounds = opts.devastatingWounds || false;
  const twinLinked = opts.twinLinked || false;
  const antiCrit = opts.antiCrit || 0;
  const critHitOn = opts.critHitOn || 6;
  const critWoundThreshold = antiCrit > 0 ? antiCrit : 6;

  // ── Phase 1: Hit Rolls ──
  let normalHits = 0;
  let critHits = 0; // hits that were critical (for lethal/sustained)

  for (let i = 0; i < totalAttacks; i++) {
    let hitRoll = rollD6();
    if (hitRoll < opts.skill && hitRoll !== 6) {
      if (opts.rerollHitAll || (opts.rerollHitOnes && hitRoll === 1)) {
        hitRoll = rollD6();
      }
    }
    if (hitRoll < opts.skill && hitRoll !== 6) continue; // miss

    const isCrit = hitRoll >= critHitOn;
    if (isCrit) {
      critHits++;
      // Sustained Hits: extra hits on crit
      if (sustainedHits > 0) normalHits += sustainedHits;
    } else {
      normalHits++;
    }
  }

  const totalHits = normalHits + critHits;

  // ── Phase 2: Wound Rolls ──
  // Lethal Hits: crit hits auto-wound (skip wound roll)
  let autoWounds = 0;       // from lethal hits — count as crit wounds
  let normalWounds = 0;     // passed wound roll, not crit wound
  let critWounds = 0;       // crit wound (for devastating wounds)

  if (lethalHits) {
    autoWounds = critHits;  // all crit hits auto-wound as crit wounds
  }

  // Remaining hits that need wound rolls: normal hits + (crit hits if no lethal)
  const hitsToWound = normalHits + (lethalHits ? 0 : critHits);

  for (let i = 0; i < hitsToWound; i++) {
    let woundRoll = rollD6();
    let isCritW = woundRoll >= critWoundThreshold;

    if (!isCritW && (woundRoll < woundReq && woundRoll !== 6)) {
      if (twinLinked || opts.rerollWoundAll || (opts.rerollWoundOnes && woundRoll === 1)) {
        woundRoll = rollD6();
        isCritW = woundRoll >= critWoundThreshold;
      }
    }

    if (woundRoll >= woundReq || isCritW) {
      if (isCritW) {
        critWounds++;
      } else {
        normalWounds++;
      }
    }
  }

  const totalWounds = autoWounds + normalWounds + critWounds;
  let mortalWounds = 0;

  // ── Phase 3: Save Rolls & Damage ──
  // Devastating Wounds (crit wounds + auto-wounds from lethal): skip save, deal mortal wounds
  const devWoundCount = devWounds ? (critWounds + autoWounds) : 0;
  const savableWounds = totalWounds - devWoundCount;

  // Roll damage for devastating wounds
  for (let i = 0; i < devWoundCount; i++) {
    let dmg = rollExpr(opts.D);
    if (opts.fnp && opts.fnp <= 6) {
      let after = 0;
      for (let d = 0; d < dmg; d++) {
        if (rollD6() < opts.fnp) after++;
      }
      dmg = after;
    }
    mortalWounds += dmg;
  }

  // Save rolls for non-devastating wounds
  let totalSavesMade = 0;
  let totalSavesFailed = 0;
  const damageInstances = []; // damage values that got through saves

  for (let i = 0; i < savableWounds; i++) {
    if (cappedSv <= 6) {
      const saveRoll = rollD6();
      if (saveRoll >= cappedSv) { totalSavesMade++; continue; }
    }
    totalSavesFailed++;

    // Roll damage
    let dmg = rollExpr(opts.D);
    if (opts.fnp && opts.fnp <= 6) {
      let after = 0;
      for (let d = 0; d < dmg; d++) {
        if (rollD6() < opts.fnp) after++;
      }
      dmg = after;
    }
    damageInstances.push(dmg);
  }

  // ── Phase 4: Allocate Damage to Models ──
  let modelsLeft = opts.models || 1;
  let currentModelWounds = opts.wounds || 1;
  let modelsKilled = 0;
  let totalDamage = 0;

  // Apply mortal wounds first (from devastating wounds)
  totalDamage += mortalWounds;
  currentModelWounds -= mortalWounds;
  while (currentModelWounds <= 0 && modelsLeft > 0) {
    modelsKilled++;
    modelsLeft--;
    if (modelsLeft > 0) {
      currentModelWounds = (opts.wounds || 1) + currentModelWounds; // carry over... no, excess is lost in 10th
    }
    currentModelWounds = opts.wounds || 1;
  }

  // Apply damage instances (in order)
  for (const dmg of damageInstances) {
    if (modelsLeft <= 0) break;
    totalDamage += dmg;
    currentModelWounds -= dmg;
    if (currentModelWounds <= 0) {
      modelsKilled++;
      modelsLeft--;
      currentModelWounds = opts.wounds || 1; // excess damage lost in 10th ed
    }
  }

  return { damage: totalDamage, modelsKilled, totalAttacks, totalHits, totalWounds, totalSavesMade, totalSavesFailed, mortalWounds };
}

/**
 * Run N simulations and return results
 */
export function runSimulation(opts, N = 10000) {
  const damages = [];
  const kills = [];
  let totalDmg = 0;
  let totalKills = 0;
  let wipeCount = 0;
  let sumAttacks = 0, sumHits = 0, sumWounds = 0, sumSavesMade = 0, sumSavesFailed = 0, sumMortalWounds = 0;

  for (let i = 0; i < N; i++) {
    const result = simulateOnce(opts);
    damages.push(result.damage);
    kills.push(result.modelsKilled);
    totalDmg += result.damage;
    totalKills += result.modelsKilled;
    if (result.modelsKilled >= (opts.models || 1)) wipeCount++;
    sumAttacks += result.totalAttacks;
    sumHits += result.totalHits;
    sumWounds += result.totalWounds;
    sumSavesMade += result.totalSavesMade;
    sumSavesFailed += result.totalSavesFailed;
    sumMortalWounds += result.mortalWounds;
  }

  const maxDmg = Math.max(...damages);
  const histogram = new Array(maxDmg + 1).fill(0);
  for (const d of damages) histogram[d]++;
  const histPct = histogram.map(c => (c / N) * 100);

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
    wipeChance: wipeCount / N,
    N,
    breakdown: {
      avgAttacks: sumAttacks / N,
      avgHits: sumHits / N,
      avgWounds: sumWounds / N,
      avgSavesMade: sumSavesMade / N,
      avgSavesFailed: sumSavesFailed / N,
      avgMortalWounds: sumMortalWounds / N,
    },
  };
}
