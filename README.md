# icalledgame: soccer edition

## Local development

```bash
npm install
npm run dev
```

## Production / Heroku

Heroku uses the `build` script during deploy and starts the compiled app with `npm start`. The Node server reads Heroku's `PORT` value and serves the Vite output from `dist`.

```bash
npm run build
npm start
```

## Adding matches

Every puzzle lives in `src/matches.js`. Each entry needs the teams, managers, starting XIs, goals (scorer, minute, which side it counted for), year, competition type and a photo. The list is also the schedule: round 1 (7 October 2026) plays the first match, round 2 the second, and so on, so add new matches at the end. "Play another match" steps to the next one. The archive section lists every round from launch up to today so players can catch up on days they missed; finished rounds are remembered in the browser (localStorage) and show their score.

Most major finals and tournament matches have line-up tables on Wikipedia. `scripts/import-match.mjs` turns one into an entry:

```bash
node scripts/import-match.mjs "2010 FIFA World Cup final"
node scripts/import-match.mjs "2018 FIFA World Cup Group B" "Portugal vs Spain"
```

It prints the entry and warns when something doesn't add up (not 11 starters, goals that don't match the score, a scorer missing from both squads). Fill in the photo, competition type and team aliases yourself. Wikipedia lists the official home team first, which isn't always the side people remember.

Photos are loaded from Wikimedia Commons at runtime and aren't stored in this repository or on Heroku's filesystem. Each match records the photo's author and license, which the footer displays. Pick photos that don't give the answer away (no scoreboards or scarves naming the final).
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
