# Skirmish

A browser-based hybrid card game / wargame prototype. Pass-and-play on one device for now — online multiplayer is the next milestone.

## Running it locally

You'll need [Node.js](https://nodejs.org) installed (v18 or newer).

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`) in your browser. On your phone, you can also visit your computer's local IP address on the same Wi-Fi network at that port.

## Project structure

```
src/
  main.jsx           - React entry point
  App.jsx            - all game state, event handlers, and rendering
  App.css            - styling
  game/
    constants.js      - board size, deployment rows, unit cap
    cards.js           - the 20-card deck definition and shuffle logic
    rules.js            - pure functions: movement pathing, attack targeting, unit creation
    initialState.js      - builds the starting game state (heroes placed, decks shuffled)
```

## Current rules (v0.1)

- 6x6 board. Each player deploys 3 units (drawn randomly from their deck) into their two home rows before battle starts.
- Every unit has its own mana stat that refreshes each turn: 1 mana = move 1 square (orthogonal only), 1 mana = attack.
- Melee units can attack any of the 8 adjacent tiles and take retaliation damage. Ranged units can attack any enemy within a distance equal to their mana stat, take no retaliation, but still cost 1 mana to fire.
- Players may deploy one new unit per turn (randomly drawn) until 15 units have been placed. New units enter with summoning sickness (no actions until next turn).
- A unit reaching the enemy's back row deals one-time breakthrough damage to that player's life total, but life reaching 0 does **not** end the game — only destroying the enemy hero does.

## Next steps

- Online multiplayer sync (planned: Firebase Realtime Database, server-optional since moves are turn-based)
- Unit abilities/keywords (Guard, Charge, First Strike, etc.)
- Hero powers
- Real card art
