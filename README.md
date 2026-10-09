# Soccer Guessr

**Play it at [www.soccerguessr.com](https://www.soccerguessr.com)**

Soccer Guessr is a daily soccer puzzle. Each day there is a new photo from a real match: work out which game it was by answering one question at a time (the teams, the year, the type of competition, both managers, both starting XIs, the final score and the goalscorers). Each answer is revealed once it's locked in, so later questions get easier.

- **One play per day.** A round locks once the first answer is in. Leaving halfway resumes where you left off, and reopening a finished round shows its full-time score.
- **Archive.** The Archive page is a month calendar of every past round with your score, so you can catch up on days you missed. The full-time screen links to it with "Play Archive".
- **Share and community.** "Share result" copies an emoji summary of your round, and the [Discord](https://discord.gg/P4NuchShK) is linked from the top bar and the full-time screen.
- **Accounts are optional.** Guests play with scores kept in the browser; signing in with email and password or Google keeps scores across devices.
- **Privacy policy** at [www.soccerguessr.com/privacy](https://www.soccerguessr.com/privacy).

## Project layout

- `src/` is the React + Vite front end: `App.jsx` (game, archive and account UI), `game.js` (scoring and the daily schedule), `matches.js` (every puzzle), `account.js` (API calls), `transfer.js` (moving guest scores between addresses).
- `server.js` starts the Node server; `server/app.js` serves the API and the built site, `server/store.js` is the Postgres store, `server/auth.js` handles passwords and sessions, `server/google.js` handles Google sign-in.
- `public/` holds static files, including the logo and `privacy.html`.
- `scripts/` holds the match importer, `match-runway.mjs`, and the tests in `scripts/test/`.

## Local development

```bash
npm install
npm run dev
```

`npm test` runs the tests, `npm run lint` runs Oxlint and `npm run build` builds the site into `dist`.

## Production / Heroku

Heroku uses the `build` script during deploy and starts the compiled app with `npm start`. The Node server reads Heroku's `PORT` value and serves the Vite output from `dist`.

```bash
npm run build
npm start
```

### Custom domain

The game lives at [www.soccerguessr.com](https://www.soccerguessr.com) (DNS on Cloudflare). Set `CANONICAL_HOST=www.soccerguessr.com` on Heroku and every other address redirects there. The bare `soccerguessr.com` gets a plain server redirect (so crawlers such as Google's follow it). Browsers keep localStorage per address, so page loads on the old `herokuapp.com` address first pass the guest's scores along in the URL fragment; `src/transfer.js` saves them on the new address without replacing anything already there. Only set `CANONICAL_HOST` once the new address loads over HTTPS, or everyone is sent to a site that doesn't work yet.

## Accounts and saved scores

Players can play as guests, or sign in with an email and password so their scores follow them between devices. Guests' finished rounds stay in the browser (localStorage); signing in copies them into the account, keeping the account's own score for any round it already has.

Accounts are stored in a [Neon](https://neon.tech) Postgres database, reached through `DATABASE_URL`. The server creates the tables on start-up (`server/store.js`). Without `DATABASE_URL` the game still runs and the sign-in button is hidden. Copy the connection string from the Neon dashboard (Connect, pooled connection), change `sslmode=require` to `sslmode=verify-full` (same behaviour in the `pg` driver, without its warning), and set it on Heroku:

```bash
heroku config:set DATABASE_URL='postgresql://…-pooler.….neon.tech/neondb?sslmode=verify-full'
```

Players can also use "Continue with Google". Create an OAuth client (type "Web application") in Google Cloud with the redirect URI `https://www.soccerguessr.com/api/auth/google/callback`, then set its values on Heroku; the button appears once both are set:

```bash
heroku config:set GOOGLE_CLIENT_ID=… GOOGLE_CLIENT_SECRET=…
```

A Google sign-in reaches the account already linked to that Google account, or else the account with the same (Google-verified) email, which it links; otherwise it creates one with no password.

Passwords are hashed with scrypt. Sign-in uses a random session token in an HttpOnly cookie (`Secure` when `NODE_ENV=production`, which Heroku sets); only the token's hash is stored.

For local development, run `npm start` with `DATABASE_URL` pointing at a local Postgres next to `npm run dev`; Vite forwards `/api` to port 3000. `npm test` covers the API against an in-memory store, and against Postgres too when `TEST_DATABASE_URL` is set.

## Adding matches

Every puzzle lives in `src/matches.js`. Each entry needs the teams, managers, starting XIs, goals (scorer, minute, which side it counted for), year, competition type and a photo. The list is also the schedule: round 1 (3 October 2026, backdated before the 7 October launch so the archive starts with a few games) plays the first match, round 2 the second, and so on, so add new matches at the end. The Archive page (`#archive`) shows every round from round 1 up to today on a month calendar, with each day's round number and the player's score, so players can catch up on days they missed.

Most major finals and tournament matches have line-up tables on Wikipedia. `scripts/import-match.mjs` turns one into an entry:

```bash
node scripts/import-match.mjs "2010 FIFA World Cup final"
node scripts/import-match.mjs "2018 FIFA World Cup Group B" "Portugal vs Spain"
```

It prints the entry and warns when something doesn't add up (not 11 starters, goals that don't match the score, a scorer missing from both squads). Fill in the photo, competition type and team aliases yourself. Wikipedia lists the official home team first, which isn't always the side people remember.

Photos are loaded from Wikimedia Commons at runtime and aren't stored in this repository or on Heroku's filesystem. Each match records the photo's author and license, which the footer displays. Pick photos that don't give the answer away (no scoreboards or scarves naming the final).

### Daily routine

A Claude Code routine runs once a day and adds the next match by following [`.claude/skills/add-daily-match/SKILL.md`](.claude/skills/add-daily-match/SKILL.md): it imports the line-ups, finds a match photo on Commons, runs `npm test`, `npm run lint` and `npm run build`, then opens a pull request and merges it into `master`. If a check fails it leaves the pull request open instead. `node scripts/match-runway.mjs` shows how many days of new matches are left and which competition type is due next.
