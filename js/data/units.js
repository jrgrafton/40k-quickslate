// Unit datasheets for 40K QuickSlate
// Schema: { id, name, faction, M, T, Sv, W, Ld, OC, invuln?, fnp?, weapons[], abilities[], keywords[], points }

export const UNITS = [
  // === SPACE MARINES ===
  {
    id: "sm_captain_terminator",
    name: "Captain in Terminator Armour",
    faction: "space_marines",
    M: 5, T: 5, Sv: 2, W: 6, Ld: 6, OC: 1,
    invuln: 4,
    weapons: [
      { name: "Storm bolter", type: "ranged", A: 2, BS: 2, S: 4, AP: 0, D: 1, keywords: ["Rapid Fire 2"] },
      { name: "Relic weapon", type: "melee", A: 5, WS: 2, S: 5, AP: -2, D: 2, keywords: [] },
    ],
    abilities: [
      { name: "Rites of Battle", desc: "Once per battle round, one friendly unit within 6\" can re-roll a Hit roll." },
      { name: "Leader", desc: "Can be attached to Terminator Squad or Relic Terminator Squad." },
    ],
    keywords: ["Infantry", "Character", "Imperium", "Terminator", "Captain"],
    points: 100,
  },
  {
    id: "sm_intercessors",
    name: "Intercessor Squad",
    faction: "space_marines",
    M: 6, T: 4, Sv: 3, W: 2, Ld: 6, OC: 2,
    weapons: [
      { name: "Bolt rifle", type: "ranged", A: 2, BS: 3, S: 4, AP: -1, D: 1, keywords: ["Assault", "Heavy"] },
      { name: "Bolt pistol", type: "ranged", A: 1, BS: 3, S: 4, AP: 0, D: 1, keywords: ["Pistol"] },
      { name: "Close combat weapon", type: "melee", A: 3, WS: 3, S: 4, AP: 0, D: 1, keywords: [] },
    ],
    abilities: [
      { name: "Objective Secured", desc: "This unit counts as having the Objective Secured ability." },
    ],
    keywords: ["Infantry", "Battleline", "Imperium", "Tacticus", "Intercessor Squad"],
    points: 80,
  },
  {
    id: "sm_terminators",
    name: "Terminator Squad",
    faction: "space_marines",
    M: 5, T: 5, Sv: 2, W: 3, Ld: 6, OC: 1,
    invuln: 4,
    weapons: [
      { name: "Storm bolter", type: "ranged", A: 2, BS: 3, S: 4, AP: 0, D: 1, keywords: ["Rapid Fire 2"] },
      { name: "Power fist", type: "melee", A: 3, WS: 3, S: 8, AP: -2, D: 2, keywords: [] },
      { name: "Assault cannon", type: "ranged", A: 6, BS: 3, S: 6, AP: 0, D: 1, keywords: ["Devastating Wounds"] },
    ],
    abilities: [
      { name: "Fury of the First", desc: "Each time a model in this unit makes an attack, re-roll a Wound roll of 1." },
    ],
    keywords: ["Infantry", "Imperium", "Terminator", "Terminator Squad"],
    points: 200,
  },
  {
    id: "sm_redemptor",
    name: "Redemptor Dreadnought",
    faction: "space_marines",
    M: 8, T: 10, Sv: 2, W: 12, Ld: 6, OC: 4,
    weapons: [
      { name: "Macro plasma incinerator", type: "ranged", A: "D6+1", BS: 3, S: 9, AP: -3, D: 2, keywords: ["Blast"] },
      { name: "Heavy onslaught gatling cannon", type: "ranged", A: 12, BS: 3, S: 6, AP: 0, D: 1, keywords: [] },
      { name: "Redemptor fist", type: "melee", A: 5, WS: 3, S: 12, AP: -2, D: 3, keywords: [] },
    ],
    abilities: [
      { name: "Duty Eternal", desc: "Each time an attack is allocated to this model, subtract 1 from the Damage characteristic." },
    ],
    keywords: ["Vehicle", "Walker", "Imperium", "Dreadnought", "Redemptor Dreadnought"],
    points: 210,
  },
  {
    id: "sm_hellblasters",
    name: "Hellblaster Squad",
    faction: "space_marines",
    M: 6, T: 4, Sv: 3, W: 2, Ld: 6, OC: 2,
    weapons: [
      { name: "Plasma incinerator", type: "ranged", A: 2, BS: 3, S: 7, AP: -2, D: 1, keywords: ["Assault", "Hazardous"] },
      { name: "Plasma incinerator (supercharge)", type: "ranged", A: 2, BS: 3, S: 8, AP: -3, D: 2, keywords: ["Assault", "Hazardous"] },
      { name: "Close combat weapon", type: "melee", A: 3, WS: 3, S: 4, AP: 0, D: 1, keywords: [] },
    ],
    abilities: [
      { name: "For the Chapter!", desc: "Each time this unit is selected to shoot, you can re-roll one Hit roll and one Wound roll." },
    ],
    keywords: ["Infantry", "Imperium", "Tacticus", "Hellblaster Squad"],
    points: 125,
  },
  {
    id: "sm_eradicators",
    name: "Eradicator Squad",
    faction: "space_marines",
    M: 5, T: 6, Sv: 3, W: 3, Ld: 6, OC: 1,
    weapons: [
      { name: "Melta rifle", type: "ranged", A: 1, BS: 3, S: 9, AP: -4, D: "D6", keywords: ["Melta 2"] },
      { name: "Close combat weapon", type: "melee", A: 3, WS: 3, S: 4, AP: 0, D: 1, keywords: [] },
    ],
    abilities: [
      { name: "Total Obliteration", desc: "Each time a model in this unit makes a ranged attack that targets a Monster or Vehicle, re-roll a Damage roll." },
    ],
    keywords: ["Infantry", "Imperium", "Gravis", "Eradicator Squad"],
    points: 95,
  },

  // === TYRANIDS ===
  {
    id: "tyr_hive_tyrant",
    name: "Hive Tyrant",
    faction: "tyranids",
    M: 8, T: 10, Sv: 2, W: 10, Ld: 7, OC: 4,
    invuln: 4,
    weapons: [
      { name: "Heavy venom cannon", type: "ranged", A: 3, BS: 2, S: 9, AP: -2, D: 3, keywords: ["Blast"] },
      { name: "Monstrous bonesword", type: "melee", A: 6, WS: 2, S: 7, AP: -2, D: 2, keywords: [] },
    ],
    abilities: [
      { name: "Shadow in the Warp", desc: "While a friendly Tyranids unit is within 6\" of this model, each time that unit takes a Battle-shock test, add 1 to that test." },
      { name: "Will of the Hive Mind", desc: "Once per battle round, one friendly unit within 12\" can re-roll a Hit roll, Wound roll, or saving throw." },
    ],
    keywords: ["Monster", "Character", "Fly", "Psyker", "Great Devourer", "Synapse", "Hive Tyrant"],
    points: 220,
  },
  {
    id: "tyr_warriors",
    name: "Tyranid Warriors",
    faction: "tyranids",
    M: 6, T: 5, Sv: 4, W: 3, Ld: 7, OC: 2,
    weapons: [
      { name: "Deathspitter", type: "ranged", A: 3, BS: 3, S: 5, AP: -1, D: 1, keywords: [] },
      { name: "Scything talons", type: "melee", A: 4, WS: 3, S: 5, AP: -1, D: 1, keywords: [] },
      { name: "Boneswords", type: "melee", A: 4, WS: 3, S: 5, AP: -2, D: 1, keywords: ["Twin-linked"] },
    ],
    abilities: [
      { name: "Synapse", desc: "If a friendly Tyranids unit within 6\" fails a Battle-shock test, you can re-roll that test." },
    ],
    keywords: ["Infantry", "Great Devourer", "Synapse", "Tyranid Warriors"],
    points: 65,
  },
  {
    id: "tyr_hormagaunts",
    name: "Hormagaunts",
    faction: "tyranids",
    M: 10, T: 3, Sv: 5, W: 1, Ld: 8, OC: 2,
    weapons: [
      { name: "Hormagaunt talons", type: "melee", A: 3, WS: 4, S: 3, AP: -1, D: 1, keywords: [] },
    ],
    abilities: [
      { name: "Bounding Leap", desc: "At the end of your opponent's Fight phase, if this unit is within Engagement Range of enemy units, it can pile in up to 6\"." },
    ],
    keywords: ["Infantry", "Battleline", "Great Devourer", "Endless Multitude", "Hormagaunts"],
    points: 65,
  },
  {
    id: "tyr_termagants",
    name: "Termagants",
    faction: "tyranids",
    M: 6, T: 3, Sv: 5, W: 1, Ld: 8, OC: 2,
    weapons: [
      { name: "Fleshborer", type: "ranged", A: 1, BS: 4, S: 5, AP: 0, D: 1, keywords: ["Assault"] },
      { name: "Chitinous claws", type: "melee", A: 1, WS: 4, S: 3, AP: 0, D: 1, keywords: [] },
    ],
    abilities: [
      { name: "Skulking Horrors", desc: "Once per battle, when targeted by a ranged attack, this unit can go to ground. Until end of phase, models have a 6+ invulnerable save." },
    ],
    keywords: ["Infantry", "Battleline", "Great Devourer", "Endless Multitude", "Termagants"],
    points: 60,
  },
  {
    id: "tyr_carnifex",
    name: "Carnifex",
    faction: "tyranids",
    M: 8, T: 9, Sv: 3, W: 8, Ld: 8, OC: 3,
    weapons: [
      { name: "Deathspitter (large)", type: "ranged", A: 6, BS: 4, S: 7, AP: -1, D: 2, keywords: [] },
      { name: "Carnifex crushing claws", type: "melee", A: 4, WS: 4, S: 10, AP: -3, D: "D6+1", keywords: [] },
      { name: "Carnifex scything talons", type: "melee", A: 6, WS: 4, S: 7, AP: -1, D: 2, keywords: [] },
    ],
    abilities: [
      { name: "Battering Ram", desc: "Each time this model ends a Charge move, select one enemy unit within Engagement Range and roll one D6: on 4+, that unit suffers D3 mortal wounds." },
    ],
    keywords: ["Monster", "Great Devourer", "Carnifex"],
    points: 125,
  },
  {
    id: "tyr_zoanthropes",
    name: "Zoanthropes",
    faction: "tyranids",
    M: 5, T: 5, Sv: 5, W: 3, Ld: 7, OC: 1,
    invuln: 4,
    weapons: [
      { name: "Warp Blast", type: "ranged", A: "D3", BS: 3, S: 7, AP: -2, D: "D3", keywords: ["Blast", "Psychic"] },
    ],
    abilities: [
      { name: "Spirit Leech", desc: "In your Shooting phase, select one enemy unit within 18\" and roll one D6: on 3+, that unit suffers D3 mortal wounds." },
      { name: "Synapse", desc: "If a friendly Tyranids unit within 6\" fails a Battle-shock test, you can re-roll that test." },
    ],
    keywords: ["Infantry", "Fly", "Psyker", "Great Devourer", "Synapse", "Zoanthropes"],
    points: 65,
  },

  // === CHAOS SPACE MARINES ===
  {
    id: "csm_lord",
    name: "Chaos Lord",
    faction: "chaos_space_marines",
    M: 6, T: 4, Sv: 3, W: 5, Ld: 6, OC: 1,
    invuln: 4,
    weapons: [
      { name: "Bolt pistol", type: "ranged", A: 1, BS: 2, S: 4, AP: 0, D: 1, keywords: ["Pistol"] },
      { name: "Daemon hammer", type: "melee", A: 4, WS: 3, S: 8, AP: -2, D: 2, keywords: [] },
    ],
    abilities: [
      { name: "Dark Zealotry", desc: "While leading a unit, each time a model makes a melee attack, you can re-roll the Hit roll." },
      { name: "Leader", desc: "Can be attached to Legionaries or Chosen." },
    ],
    keywords: ["Infantry", "Character", "Chaos", "Heretic Astartes", "Chaos Lord"],
    points: 90,
  },
  {
    id: "csm_legionaries",
    name: "Legionaries",
    faction: "chaos_space_marines",
    M: 6, T: 4, Sv: 3, W: 2, Ld: 6, OC: 2,
    weapons: [
      { name: "Boltgun", type: "ranged", A: 2, BS: 3, S: 4, AP: 0, D: 1, keywords: [] },
      { name: "Bolt pistol", type: "ranged", A: 1, BS: 3, S: 4, AP: 0, D: 1, keywords: ["Pistol"] },
      { name: "Astartes chainsword", type: "melee", A: 4, WS: 3, S: 4, AP: -1, D: 1, keywords: [] },
    ],
    abilities: [
      { name: "Objective Secured", desc: "This unit counts as having the Objective Secured ability." },
    ],
    keywords: ["Infantry", "Battleline", "Chaos", "Heretic Astartes", "Legionaries"],
    points: 90,
  },
  {
    id: "csm_chosen",
    name: "Chosen",
    faction: "chaos_space_marines",
    M: 6, T: 4, Sv: 3, W: 3, Ld: 6, OC: 2,
    weapons: [
      { name: "Bolt pistol", type: "ranged", A: 1, BS: 3, S: 4, AP: 0, D: 1, keywords: ["Pistol"] },
      { name: "Accursed weapon", type: "melee", A: 4, WS: 3, S: 5, AP: -2, D: 1, keywords: [] },
    ],
    abilities: [
      { name: "Chosen Champions", desc: "Each time a model in this unit makes a melee attack, if this unit made a Charge move this turn, add 1 to the Wound roll." },
    ],
    keywords: ["Infantry", "Chaos", "Heretic Astartes", "Chosen"],
    points: 135,
  },
  {
    id: "csm_forgefiend",
    name: "Forgefiend",
    faction: "chaos_space_marines",
    M: 8, T: 10, Sv: 3, W: 12, Ld: 6, OC: 4,
    invuln: 5,
    weapons: [
      { name: "Hades autocannon (x2)", type: "ranged", A: 6, BS: 3, S: 8, AP: -1, D: 2, keywords: [] },
      { name: "Ectoplasma cannon (x2)", type: "ranged", A: "D3", BS: 3, S: 10, AP: -3, D: 3, keywords: ["Blast"] },
      { name: "Armoured limbs", type: "melee", A: 3, WS: 4, S: 6, AP: 0, D: 1, keywords: [] },
    ],
    abilities: [
      { name: "Daemonic", desc: "This model has a 5+ invulnerable save." },
    ],
    keywords: ["Vehicle", "Daemon", "Chaos", "Heretic Astartes", "Forgefiend"],
    points: 145,
  },
  {
    id: "csm_obliterators",
    name: "Obliterators",
    faction: "chaos_space_marines",
    M: 4, T: 7, Sv: 2, W: 5, Ld: 6, OC: 2,
    weapons: [
      { name: "Fleshmetal guns", type: "ranged", A: 6, BS: 3, S: 7, AP: -2, D: 2, keywords: ["Heavy"] },
      { name: "Crushing fists", type: "melee", A: 4, WS: 4, S: 8, AP: -1, D: 2, keywords: [] },
    ],
    abilities: [
      { name: "Warp Rift", desc: "This unit can be set up anywhere on the battlefield that is more than 9\" from all enemy models." },
    ],
    keywords: ["Infantry", "Chaos", "Daemon", "Heretic Astartes", "Obliterators"],
    points: 160,
  },
  {
    id: "csm_havocs",
    name: "Havocs",
    faction: "chaos_space_marines",
    M: 6, T: 4, Sv: 3, W: 2, Ld: 6, OC: 1,
    weapons: [
      { name: "Lascannon", type: "ranged", A: 1, BS: 3, S: 12, AP: -3, D: "D6+1", keywords: ["Heavy"] },
      { name: "Missile launcher (frag)", type: "ranged", A: "D6", BS: 3, S: 4, AP: 0, D: 1, keywords: ["Blast", "Heavy"] },
      { name: "Missile launcher (krak)", type: "ranged", A: 1, BS: 3, S: 9, AP: -2, D: "D6", keywords: ["Heavy"] },
      { name: "Close combat weapon", type: "melee", A: 2, WS: 3, S: 4, AP: 0, D: 1, keywords: [] },
    ],
    abilities: [
      { name: "Dedicated Havocs", desc: "Each time a model in this unit makes a ranged attack, if this unit Remained Stationary, re-roll a Hit roll of 1." },
    ],
    keywords: ["Infantry", "Chaos", "Heretic Astartes", "Havocs"],
    points: 130,
  },
];
