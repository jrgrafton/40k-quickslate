import { createElement as h } from "react";

export const GAME_KEYWORDS = [
  'Sustained Hits', 'Lethal Hits', 'Devastating Wounds', 'Feel No Pain',
  'Stealth', 'Lone Operative', 'Deadly Demise', 'Deep Strike', 'Infiltrators',
  'Scouts', 'Leader', 'Fights First', 'Firing Deck', 'Transport',
  'Ignores Cover', 'Indirect Fire', 'Torrent', 'Twin-linked', 'Anti-',
  'Precision', 'Hazardous', 'Blast', 'Melta', 'Lance', 'Assault', 'Heavy',
  'Pistol', 'Rapid Fire', 'One Shot', 'Overwatch', 'Battle-shock',
];

export const KEYWORD_DEFINITIONS = {
  'Sustained Hits': 'Each time an attack is made with this weapon, if a Critical Hit is rolled, that attack scores a number of additional hits on the target as denoted by the number after the keyword.',
  'Lethal Hits': 'Each time an attack is made with this weapon, if a Critical Hit is rolled, that attack automatically wounds the target.',
  'Devastating Wounds': 'Each time an attack is made with this weapon, if a Critical Wound is rolled, the target suffers mortal wounds equal to the Damage characteristic and the attack sequence ends.',
  'Feel No Pain': 'Each time this model would lose a wound, roll a D6; if the result equals or exceeds the Feel No Pain value, that wound is not lost.',
  'Stealth': 'If every model in a unit has this ability, then each time a ranged attack is made against it, subtract 1 from that attack\'s Hit roll.',
  'Lone Operative': 'Unless part of an Attached unit, this unit can only be selected as the target of a ranged attack if the attacking model is within 12".',
  'Deadly Demise': 'When this model is destroyed, roll one D6. On a 6, each unit within 6" suffers a number of mortal wounds denoted by the number after the keyword.',
  'Deep Strike': 'During the Declare Battle Formations step, this unit can be set up in Reserves instead of on the battlefield. At the end of your Movement phase, set it up anywhere on the battlefield more than 9" from all enemy models.',
  'Infiltrators': 'During deployment, this unit can be set up anywhere on the battlefield that is more than 9" horizontally away from the enemy deployment zone and all enemy models.',
  'Scouts': 'At the start of the first battle round, before the first turn begins, this unit can make a Normal move of up to the distance denoted (e.g. 6").',
  'Leader': 'This model can be attached to a specific unit to form an Attached unit.',
  'Fights First': 'Units with this ability that are eligible to fight do so in the Fights First step, before all other eligible units.',
  'Firing Deck': 'Each time this Transport shoots, select a number of models embarked within it (as denoted). Until that shooting is resolved, those models are treated as if they were within range/line of sight of the target.',
  'Transport': 'This model can transport models as described in its Transport capacity.',
  'Ignores Cover': 'Each time an attack is made with this weapon, the target cannot have the Benefit of Cover against that attack.',
  'Indirect Fire': 'This weapon can target units not visible to the attacking model. If doing so, subtract 1 from that attack\'s Hit roll, and the target has the Benefit of Cover.',
  'Torrent': 'Each time an attack is made with this weapon, that attack automatically hits the target.',
  'Twin-linked': 'Each time an attack is made with this weapon, you can re-roll that attack\'s Wound roll.',
  'Precision': 'Each time an attack made with this weapon scores a Critical Hit against an Attached unit, if a Character model is visible, the attacking model can choose to have that attack allocated to the Character.',
  'Hazardous': 'After a unit shoots or fights, roll one Hazardous test (D6) for each Hazardous weapon used. For each 1, one model equipped with a Hazardous weapon is destroyed.',
  'Blast': 'Add 1 to the Attacks characteristic of this weapon for each five models in the target unit (rounding down).',
  'Melta': 'Each time an attack made with this weapon targets a unit within half the weapon\'s range, increase the Damage by the amount denoted.',
  'Lance': 'Each time an attack is made with this weapon, if the bearer made a Charge move this turn, add 1 to that attack\'s Wound roll.',
  'Assault': 'This weapon can be used even if the bearer Advanced this turn.',
  'Heavy': 'If the bearer\'s unit Remained Stationary this turn, add 1 to this weapon\'s Hit rolls.',
  'Pistol': 'This weapon can be used even if the bearer\'s unit is within Engagement Range of enemy units, but must target one of those enemy units.',
  'Rapid Fire': 'Each time this weapon is used to make a ranged attack against a target within half range, increase the Attacks by the amount denoted.',
  'One Shot': 'The bearer can only shoot with this weapon once per battle.',
  'Overwatch': 'Reactive stratagem allowing a unit to shoot at an enemy that is making a Normal, Advance, or Fall Back move, or charging.',
  'Battle-shock': 'While a unit is Battle-shocked, its OC is 0, it cannot be used for Stratagems, and its models cannot use abilities other than those stated otherwise.',
};

let _keyIdx = 0;
export function resetKeyIdx() { _keyIdx = 0; }

// Keywords that are common English words and should only match
// when in brackets like [HEAVY] or as standalone uppercase
const CONTEXT_SENSITIVE_KEYWORDS = new Set([
  'heavy', 'assault', 'pistol', 'blast', 'melta', 'lance', 'leader',
  'transport', 'stealth', 'precision', 'scouts',
]);

function isWordBoundary(ch) {
  return !ch || /[\s,.\[\](){}:;!?/"']/.test(ch);
}

export function highlightKeywords(text) {
  if (!text) return [text];
  const parts = [];
  let remaining = text;
  while (remaining.length > 0) {
    let earliest = -1, earliestLen = 0, earliestKw = '';
    for (const kw of GAME_KEYWORDS) {
      const idx = remaining.toLowerCase().indexOf(kw.toLowerCase());
      if (idx === -1) continue;

      let matchLen = kw.length;
      if (kw === 'Anti-') {
        const after = remaining.slice(idx + kw.length);
        const endMatch = after.match(/^[\w]+(\s*\d+\+)?/);
        if (endMatch) matchLen += endMatch[0].length;
      }

      // Word boundary check — keyword shouldn't be part of a larger word
      const charBefore = idx > 0 ? remaining[idx - 1] : '';
      const charAfter = remaining[idx + matchLen] || '';
      if (!isWordBoundary(charBefore) || (!isWordBoundary(charAfter) && kw !== 'Anti-')) continue;

      // Context-sensitive keywords: only match if in brackets [KEYWORD] or ALL CAPS
      if (CONTEXT_SENSITIVE_KEYWORDS.has(kw.toLowerCase())) {
        const matched = remaining.slice(idx, idx + matchLen);
        const inBrackets = idx > 0 && remaining[idx - 1] === '[';
        const isUpperCase = matched === matched.toUpperCase();
        if (!inBrackets && !isUpperCase) continue;
      }

      if (earliest === -1 || idx < earliest) {
        earliest = idx;
        earliestLen = matchLen;
        earliestKw = remaining.slice(idx, idx + matchLen);
      }
    }
    if (earliest === -1) {
      parts.push(remaining);
      break;
    }
    if (earliest > 0) parts.push(remaining.slice(0, earliest));
    const baseKw = GAME_KEYWORDS.find(k => earliestKw.toLowerCase().startsWith(k.toLowerCase())) || earliestKw;
    const tooltip = KEYWORD_DEFINITIONS[baseKw] || KEYWORD_DEFINITIONS[earliestKw] || '';
    parts.push(h("span", { key: 'kw' + (_keyIdx++), className: "kw-pill", "data-tip": tooltip || undefined }, earliestKw));
    remaining = remaining.slice(earliest + earliestLen);
  }
  return parts;
}
