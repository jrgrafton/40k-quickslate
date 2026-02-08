# 40K QuickSlate

A Warhammer 40,000 10th Edition companion web app for quick reference during games.

## Features

- **Army List Import** — Paste or upload Yellow Scribe format army lists
- **Unit Stats Dashboard** — Browse all unit datasheets with stats, weapons, and abilities
- **Probability Calculator** — Hit/wound/save probabilities with reroll support
- **Monte Carlo Simulator** — Run 10,000+ combat simulations with histogram output
- **Stratagems Reference** — Searchable stratagem database filtered by faction

## Tech Stack

- React 18 via ESM (no build step)
- Pure CSS dark grimdark theme
- Canvas-based histogram rendering
- Zero dependencies beyond React from CDN

## Usage

### Local Development

```bash
# Any static file server works
npx serve .
# or
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser.

### GitHub Pages

Push to a GitHub repo and enable Pages from the root of the main branch (or use the `docs/` folder). The `.nojekyll` file ensures proper serving.

## Data

Sample unit datasheets included for:
- **Space Marines** (6 units)
- **Tyranids** (6 units)  
- **Chaos Space Marines** (6 units)

Edit `js/data/units.js` to add more units. Schema:

```js
{
  id: "unique_id",
  name: "Unit Name",
  faction: "faction_key",
  M: 6, T: 4, Sv: 3, W: 2, Ld: 6, OC: 2,
  invuln: 4, // optional
  fnp: 5, // optional
  weapons: [
    { name: "Bolt rifle", type: "ranged", A: 2, BS: 3, S: 4, AP: -1, D: 1, keywords: ["Assault"] }
  ],
  abilities: [
    { name: "Ability Name", desc: "Description" }
  ],
  keywords: ["Infantry", "Battleline"],
  points: 80,
}
```

## License

Fan project. Warhammer 40,000 © Games Workshop.
