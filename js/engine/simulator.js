// Monte Carlo combat simulator for 40K 10th Edition
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
  // Invuln is NOT affected by AP or cover
  const effectiveSv = (opts.invuln && opts.invuln < modSv) ? opts.invuln : modSv;
  // Cap: save can't be better than 2+
  const cappedSv = Math.max(2, effectiveSv);

  const sustainedHits = opts.sustainedHits || 0;
  const lethalHits = opts.lethalHits || false;
  const devWounds = opts.devastatingWounds || false;
  const twinLinked = opts.twinLinked || false;
  const antiCrit = opts.antiCrit || 0; // e.g. 4 for Anti-X 4+
  const critHitOn = opts.critHitOn || 6; // default crit on 6

  let totalDamage = 0;
  let mortalWounds = 0;
  let modelsLeft = opts.models || 1;
  let currentModelWounds = opts.wounds || 1;
  let modelsKilled = 0;
  let totalHits = 0;
  let totalWounds = 0;
  let totalSavesMade = 0;
  let totalSavesFailed = 0;

  for (let i = 0; i < totalAttacks && modelsLeft > 0; i++) {
    // Hit roll
    let hitRoll = rollD6();
    if (hitRoll < opts.skill && hitRoll !== 6) {
      if (opts.rerollHitAll || (opts.rerollHitOnes && hitRoll === 1)) {
        hitRoll = rollD6();
      }
    }
    if (hitRoll < opts.skill && hitRoll !== 6) continue; // miss (natural 6 always hits)
    
    const isCritHit = hitRoll >= critHitOn;
    
    // Sustained Hits: on crit hit, generate extra hits
    let extraHits = 0;
    if (isCritHit && sustainedHits > 0) {
      extraHits = sustainedHits;
    }

    // Process this hit + extra hits from sustained
    totalHits += 1 + extraHits;
    for (let hitNum = 0; hitNum <= extraHits && modelsLeft > 0; hitNum++) {
      // Lethal Hits: crit hit auto-wounds (only on the original hit, not sustained extras... actually RAW all of them)
      let autoWound = false;
      if (isCritHit && lethalHits && hitNum === 0) {
        autoWound = true;
      }

      let woundRoll = 0;
      let isCritWound = false;
      
      if (!autoWound) {
        // Wound roll
        woundRoll = rollD6();
        
        // Anti-X: crit wound on antiCrit+ instead of 6
        const critWoundThreshold = antiCrit > 0 ? antiCrit : 6;
        isCritWound = woundRoll >= critWoundThreshold;
        
        if (!isCritWound && (woundRoll < woundReq && woundRoll !== 6)) {
          // Twin-linked: reroll all failed wounds
          if (twinLinked || opts.rerollWoundAll || (opts.rerollWoundOnes && woundRoll === 1)) {
            woundRoll = rollD6();
            isCritWound = woundRoll >= critWoundThreshold;
          }
        }
        if (woundRoll < woundReq && !isCritWound) continue; // fail to wound (natural 6 always wounds)
      } else {
        isCritWound = true; // lethal hits count as auto-wound
      }

      totalWounds++;

      // Devastating Wounds: crit wound = mortal wounds, skip save
      if (devWounds && isCritWound) {
        let dmg = rollExpr(opts.D);
        if (opts.fnp && opts.fnp <= 6) {
          let after = 0;
          for (let d = 0; d < dmg; d++) {
            if (rollD6() < opts.fnp) after++;
          }
          dmg = after;
        }
        mortalWounds += dmg;
        totalDamage += dmg;
        // Apply mortal wounds to models
        currentModelWounds -= dmg;
        while (currentModelWounds <= 0 && modelsLeft > 0) {
          modelsKilled++;
          modelsLeft--;
          currentModelWounds = opts.wounds || 1;
          break; // excess lost in 10th ed
        }
        if (currentModelWounds <= 0) currentModelWounds = opts.wounds || 1;
        continue;
      }

      // Save roll
      if (cappedSv <= 6) {
        const saveRoll = rollD6();
        if (saveRoll >= cappedSv) { totalSavesMade++; continue; } // saved
        totalSavesFailed++;
      } else {
        totalSavesFailed++;
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

      totalDamage += dmg;
      currentModelWounds -= dmg;
      while (currentModelWounds <= 0 && modelsLeft > 0) {
        modelsKilled++;
        modelsLeft--;
        currentModelWounds = opts.wounds || 1;
        break;
      }
      if (currentModelWounds <= 0) currentModelWounds = opts.wounds || 1;
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
