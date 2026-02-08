export const KEYWORD_DEFINITIONS = {
  'sustained hits': 'Each time an attack is made with this weapon, if a Critical Hit is rolled, that attack scores a number of additional hits on the target as denoted by the number after the keyword.',
  'lethal hits': 'Each time an attack is made with this weapon, if a Critical Hit is rolled, that attack automatically wounds the target.',
  'devastating wounds': 'Each time an attack is made with this weapon, if a Critical Wound is rolled, the target suffers mortal wounds equal to the Damage characteristic and the attack sequence ends.',
  'feel no pain': 'Each time this model would lose a wound, roll a D6; if the result equals or exceeds the Feel No Pain value, that wound is not lost.',
  'stealth': 'If every model in a unit has this ability, then each time a ranged attack is made against it, subtract 1 from that attack\'s Hit roll.',
  'lone operative': 'Unless part of an Attached unit, this unit can only be selected as the target of a ranged attack if the attacking model is within 12".',
  'deadly demise': 'When this model is destroyed, roll one D6. On a 6, each unit within 6" suffers a number of mortal wounds denoted by the number after the keyword.',
  'deep strike': 'During the Declare Battle Formations step, this unit can be set up in Reserves instead of on the battlefield. At the end of your Movement phase, set it up anywhere on the battlefield more than 9" from all enemy models.',
  'infiltrators': 'During deployment, this unit can be set up anywhere on the battlefield that is more than 9" horizontally away from the enemy deployment zone and all enemy models.',
  'scouts': 'At the start of the first battle round, before the first turn begins, this unit can make a Normal move of up to the distance denoted (e.g. 6").',
  'leader': 'This model can be attached to a specific unit to form an Attached unit.',
  'fights first': 'Units with this ability that are eligible to fight do so in the Fights First step, before all other eligible units.',
  'ignores cover': 'Each time an attack is made with this weapon, the target cannot have the Benefit of Cover against that attack.',
  'indirect fire': 'This weapon can target units not visible to the attacking model. If doing so, subtract 1 from that attack\'s Hit roll, and the target has the Benefit of Cover.',
  'torrent': 'Each time an attack is made with this weapon, that attack automatically hits the target.',
  'twin-linked': 'Each time an attack is made with this weapon, you can re-roll that attack\'s Wound roll.',
  'precision': 'Each time an attack made with this weapon scores a Critical Hit against an Attached unit, if a Character model is visible, the attacking model can choose to have that attack allocated to the Character.',
  'hazardous': 'After a unit shoots or fights, roll one Hazardous test (D6) for each Hazardous weapon used. For each 1, one model equipped with a Hazardous weapon is destroyed.',
  'blast': 'Add 1 to the Attacks characteristic of this weapon for each five models in the target unit (rounding down).',
  'melta': 'Each time an attack made with this weapon targets a unit within half the weapon\'s range, increase the Damage by the amount denoted.',
  'lance': 'Each time an attack is made with this weapon, if the bearer made a Charge move this turn, add 1 to that attack\'s Wound roll.',
  'assault': 'This weapon can be used even if the bearer Advanced this turn.',
  'heavy': 'If the bearer\'s unit Remained Stationary this turn, add 1 to this weapon\'s Hit rolls.',
  'pistol': 'This weapon can be used even if the bearer\'s unit is within Engagement Range of enemy units, but must target one of those enemy units.',
  'rapid fire': 'Each time this weapon is used to make a ranged attack against a target within half range, increase the Attacks by the amount denoted.',
  'one shot': 'The bearer can only shoot with this weapon once per battle.',
  'psychic': 'This weapon is a Psychic weapon.',
  'anti-': 'Each time an attack is made with this weapon, an unmodified Wound roll of N+ scores a Critical Wound if the target has the specified keyword.',
  'extra attacks': 'The bearer can attack with this weapon in addition to any other weapons it is making attacks with.',
};

export function getKeywordTooltip(kw) {
  const lower = kw.toLowerCase().trim();
  // Exact match first
  if (KEYWORD_DEFINITIONS[lower]) return KEYWORD_DEFINITIONS[lower];
  // Prefix match (e.g. "sustained hits 1" -> "sustained hits")
  for (const [key, val] of Object.entries(KEYWORD_DEFINITIONS)) {
    if (lower.startsWith(key)) return val;
  }
  return '';
}
