export const STRATAGEMS = [
  // Core Stratagems (available to all)
  { id: "cp_reroll", name: "Command Re-roll", cp: 1, phase: "Any phase", type: "strategic", faction: null,
    effect: "Re-roll one Hit roll, one Wound roll, one Damage roll, one saving throw, or one Advance/Charge roll made for a unit from your army." },
  { id: "epic_challenge", name: "Epic Challenge", cp: 1, phase: "Fight phase", type: "epic", faction: null,
    effect: "Use when a Character from your army that is within Engagement Range of one or more enemy Characters is selected to fight. Until the end of the phase, melee attacks made by that Character have the [PRECISION] ability." },
  { id: "counter_offensive", name: "Counter-Offensive", cp: 2, phase: "Fight phase", type: "strategic", faction: null,
    effect: "Use in the Fight phase after an enemy unit has fought. Select one unit from your army that is within Engagement Range of one or more enemy units and has not yet been selected to fight — that unit fights next." },
  { id: "insane_bravery", name: "Insane Bravery", cp: 1, phase: "Any phase", type: "epic", faction: null,
    effect: "Use when a unit from your army fails a Battle-shock test. That unit is treated as if it had passed the test instead." },
  { id: "overwatch", name: "Fire Overwatch", cp: 1, phase: "Opponent's Movement/Charge phase", type: "strategic", faction: null,
    effect: "Use when an enemy unit starts or ends a Normal, Advance, or Fall Back move within 24\" of one of your units, or declares a charge against one of your units. Your unit can shoot that enemy unit as if it were your Shooting phase, but hit on 6s only." },
  { id: "go_to_ground", name: "Go to Ground", cp: 1, phase: "Opponent's Shooting phase", type: "battle", faction: null,
    effect: "Use when a unit from your army is targeted. Until the end of the phase, all models in that unit have a 6+ invulnerable save, or improve their existing invulnerable save by 1 (to a maximum of 4+)." },
  { id: "smokescreen", name: "Smokescreen", cp: 1, phase: "Opponent's Shooting phase", type: "battle", faction: null,
    effect: "Use when a unit from your army with the Smoke keyword is selected as the target of an attack. Until the end of the phase, all models in that unit have the Benefit of Cover and the Stealth ability." },
  { id: "grenades", name: "Grenades", cp: 1, phase: "Shooting phase", type: "battle", faction: null,
    effect: "Use when a unit from your army with the Grenades keyword is selected to shoot. Select one model in that unit — it can only make attacks with its grenades this phase, but those attacks have [BLAST] and [IGNORES COVER]." },
  { id: "tank_shock", name: "Tank Shock", cp: 1, phase: "Charge phase", type: "strategic", faction: null,
    effect: "Use when a Vehicle or Mounted unit from your army ends a Charge move. Select one enemy unit within Engagement Range and roll a number of D6 equal to the charging model's Strength characteristic. For each 5+, that enemy unit suffers 1 mortal wound." },
  { id: "rapid_ingress", name: "Rapid Ingress", cp: 1, phase: "Opponent's Movement phase", type: "strategic", faction: null,
    effect: "Use at the end of your opponent's Movement phase. Select one unit from your army in Reserves — set that unit up on the battlefield using its Deep Strike rule." },

  // Space Marines - Gladius Task Force
  { id: "sm_oath", name: "Oath of Moment", cp: 0, phase: "Command phase", type: "battle", faction: "space_marines",
    effect: "At the start of your Command phase, select one enemy unit. Until the start of your next Command phase, each time a model from your army makes an attack that targets that unit, you can re-roll the Hit roll." },
  { id: "sm_armour_contempt", name: "Armour of Contempt", cp: 1, phase: "Opponent's Shooting/Fight phase", type: "battle", faction: "space_marines",
    effect: "Use when an Adeptus Astartes unit from your army is selected as the target of an attack. Until the end of the phase, each time an attack targets that unit, worsen the AP of that attack by 1." },
  { id: "sm_storm_of_fire", name: "Storm of Fire", cp: 1, phase: "Shooting phase", type: "battle", faction: "space_marines",
    effect: "Use after an Adeptus Astartes unit from your army shoots. Select one enemy unit that had one or more models destroyed by those attacks — that unit must take a Battle-shock test." },

  // Tyranids
  { id: "tyr_rapid_regen", name: "Rapid Regeneration", cp: 1, phase: "Command phase", type: "battle", faction: "tyranids",
    effect: "Use in your Command phase. Select one Tyranids model from your army — that model regains up to D3 lost wounds." },
  { id: "tyr_adrenal_surge", name: "Adrenal Surge", cp: 1, phase: "Fight phase", type: "battle", faction: "tyranids",
    effect: "Use when a Tyranids unit from your army is selected to fight. Until the end of the phase, each time a model in that unit makes a melee attack, an unmodified Hit roll of 5+ scores a Critical Hit." },
  { id: "tyr_death_frenzy", name: "Death Frenzy", cp: 1, phase: "Fight phase", type: "epic", faction: "tyranids",
    effect: "Use when a Tyranids unit from your army is destroyed. Before removing the last model, it can shoot as if it were your Shooting phase, or fight as if it were the Fight phase." },

  // Chaos Space Marines
  { id: "csm_dark_pact", name: "Dark Pacts", cp: 0, phase: "Any phase", type: "battle", faction: "chaos_space_marines",
    effect: "Each time a Heretic Astartes unit is selected to shoot or fight, it can make a Dark Pact. If it does, it must take a Leadership test; if failed, it suffers D3 mortal wounds. If passed, until the end of the phase, weapons gain [LETHAL HITS] or [SUSTAINED HITS 1]." },
  { id: "csm_veterans", name: "Veterans of the Long War", cp: 1, phase: "Shooting/Fight phase", type: "battle", faction: "chaos_space_marines",
    effect: "Use when a Heretic Astartes unit from your army is selected to shoot or fight. Until the end of the phase, each time a model in that unit makes an attack, improve the AP of that attack by 1." },
  { id: "csm_profane_zeal", name: "Profane Zeal", cp: 1, phase: "Any phase", type: "epic", faction: "chaos_space_marines",
    effect: "Use when a Heretic Astartes unit from your army fails a Battle-shock test. That test is treated as passed instead, and until the end of the turn, add 1 to the OC of models in that unit." },
];
