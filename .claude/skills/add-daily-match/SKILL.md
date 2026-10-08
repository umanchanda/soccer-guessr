---
name: add-daily-match
description: Add the next soccer-guessr match to src/matches.js from Wikipedia and Wikimedia Commons, check it, and merge it to master. The daily match routine follows this; use it whenever a new match is added.
---

# Add the daily match

Round N of the game plays `MATCHES[N-1]` in `src/matches.js`, counting from round 1 on 3 October 2026. Each day needs one new match at the end of the list, or the schedule starts repeating. This procedure adds it and merges it to `master` with no human review, so every rule below is a hard rule: when a candidate doesn't meet one, drop the candidate and pick another, never bend the rule.

## 1. Start from the latest master

```bash
git fetch origin master && git checkout -B daily-match/$(date -u +%F) origin/master
npm ci
node scripts/match-runway.mjs
```

The runway report gives today's round, how many days of new matches are left, the competition type due next, and every match already in the list.

Before adding anything, look for an open pull request from an earlier `daily-match/` branch. If one is open, finish that one first (bring master in, fix what fails, merge it) and count its matches as already added.

**How many to add:** one. If the report shows fewer than 7 days left (after counting any match you just merged), add enough to reach 7, at most 3 in one run.

## 2. Pick the match

- Use the competition type the report names as next (`domestic-league`, `continental-club`, `continental-trophy`, `world-cup`). If no candidate of that type works after a real search, move to the type after it.
- Pick a well-known match people will remember: finals, title deciders, famous upsets, classic tournament knockouts. Not a match already in the list (compare against the report's ids and competition names; the same final from a different year is fine).
- `domestic-league` means a league match or a league play-off (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, MLS Cup, Championship play-off finals). Domestic cup finals don't count. Few league games have both Wikipedia line-ups and a free photo from the match, so play-off finals and MLS Cups are the usual source.
- The match's Wikipedia article (or the tournament article's section for it) must have a football box with both starting line-ups.

## 3. Import the line-ups

Line-ups, managers, scorers and the score come only from Wikipedia through the importer. Never fill or correct them from memory.

```bash
node scripts/import-match.mjs "2005 UEFA Champions League final"
node scripts/import-match.mjs "2018 FIFA World Cup Group B" "Portugal vs Spain"
```

Every warning it prints on stderr must be resolved by reading the article (`https://en.wikipedia.org/w/index.php?title=<Title>&action=raw`), not by guessing. If a warning can't be resolved from the article, pick another match.

Then fill in what the importer leaves blank:

- `id`: short kebab-case, like the existing ones (`ucl-2005-final`, `wc-2014-semi-bra-ger`).
- `competition` and `competitionName` (the article's name for the match, e.g. `2005 UEFA Champions League final`).
- Team `aliases`: common names players will type ("Man City", "Spurs", "PSG"), and for national teams the local name where it's familiar. Players must type a name or alias exactly.
- Check `home` is the team the article lists first.

## 4. Find the photo

The photo must be a freely licensed Wikimedia Commons file **taken at this match**, and must not give the answer away.

- Search Commons categories for the match first: `Category:<Competition> final <year>`, `Category:<Team> v <Team>, <date>`, `Category:Final of the <year> FIFA World Cup`, and the stadium's category for that date. Commons API: `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:...&cmtype=file&format=json` (retry on 429).
- Confirm the file's date and description place it at this match, not a different game or the day before.
- License must be CC0, public domain, CC BY or CC BY-SA. Read author and license from `action=query&prop=imageinfo&iiprop=extmetadata|url&iiurlwidth=1280&titles=File:...` (`Artist`, `LicenseShortName`, `LicenseUrl`). Strip HTML from the author.
- Download the 1280px thumb and **look at it** before choosing it. Reject it if it shows a scoreboard or score, a trophy, competition logos or signage naming the event or year, scarves, flags or banners with text naming the match, or a caption burned into the image. Team kits and players are fine; that's the game.
- `image.src` is the 1280px thumb URL (`https://upload.wikimedia.org/wikipedia/commons/thumb/...` or `thumb.wikimedia.org`; full-size originals get rate-limited). `image.page` is the `https://commons.wikimedia.org/wiki/File:...` page.

If no photo passes, pick another match. Never use a photo from a different match or a non-free source.

## 5. Add it and check it

Append the entry as the last element of `MATCHES`. Never reorder, edit or remove existing matches; that would change past days.

```bash
npm test && npm run lint && npm run build
```

All three must pass. `npm test` includes a check that every match is complete (11 different starters per side, a credited Commons photo, a valid competition type, unique ids).

## 6. Merge it

1. Commit (`Add <competitionName>` as the subject), push the `daily-match/<date>` branch, and open a pull request against `master`. In the body give the Wikipedia article, the Commons file page with author and license, and the date the match will first be played (`roundDate` of its round, i.e. 3 October 2026 plus its index in the list).
2. Assign it to `umanchanda`.
3. If the checks passed, squash-merge it right away. If anything failed and can't be fixed within the rules, leave the pull request open with a comment saying exactly what failed, and don't merge.
