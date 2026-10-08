#!/usr/bin/env node
// Reports how far the daily schedule runs before it repeats, which competition type is due
// next, and which matches are already in the list. The daily match routine reads this.
//
//   node scripts/match-runway.mjs          # human-readable
//   node scripts/match-runway.mjs --json

import { pathToFileURL } from 'node:url'
import { COMPETITION_TYPES, MATCHES } from '../src/matches.js'
import { roundDate, roundNumber } from '../src/game.js'

const isoDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

// The type to add next: the one used least among the most recent matches, so the list keeps
// rotating through all four. Ties go to the type that appeared longest ago.
export function nextCompetition(matches, window = 8) {
  const recent = matches.slice(-window)
  const lastSeen = (id) => recent.map((match) => match.competition).lastIndexOf(id)
  return COMPETITION_TYPES.map(({ id }) => id).sort((a, b) =>
    recent.filter((match) => match.competition === a).length - recent.filter((match) => match.competition === b).length
    || lastSeen(a) - lastSeen(b))[0]
}

export function runway(matches = MATCHES, today = new Date()) {
  const todayRound = roundNumber(today)
  const lastNewDay = roundDate(matches.length)
  return {
    today: isoDate(today),
    todayRound,
    matches: matches.length,
    lastNewDay: isoDate(lastNewDay),
    daysLeft: matches.length - todayRound,
    nextCompetition: nextCompetition(matches),
    existing: matches.map((match) => ({ id: match.id, competitionName: match.competitionName })),
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = runway()
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
  else {
    console.log(`Today is ${report.today}, round ${report.todayRound}.`)
    console.log(`${report.matches} matches: new matches run out after ${report.lastNewDay} (${report.daysLeft} days left), then the list repeats.`)
    console.log(`Next competition type: ${report.nextCompetition}`)
    console.log('Already in the list:')
    for (const match of report.existing) console.log(`  ${match.id}  ${match.competitionName}`)
  }
}
