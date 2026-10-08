import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calendarWeeks, countMatches, dailyMatchIndex, personMatches, resultNote, roundDate, roundMatchIndex, roundNumber, teamMatches } from '../../src/game.js'
import { COMPETITION_TYPES, MATCHES } from '../../src/matches.js'

test('team guesses must match a name or alias exactly', () => {
  const team = { name: 'West Germany', aliases: ['FRG'] }
  assert.equal(teamMatches('west germany', team), true)
  assert.equal(teamMatches('FRG', team), true)
  assert.equal(teamMatches('Germany', team), false)
  assert.equal(teamMatches('Madrid', { name: 'Real Madrid', aliases: [] }), false)
})

test('round N plays the Nth match', () => {
  assert.equal(dailyMatchIndex(new Date(2026, 9, 3)), 0)
  assert.equal(dailyMatchIndex(new Date(2026, 9, 4)), 1)
  assert.equal(dailyMatchIndex(new Date(2026, 9, 3 + MATCHES.length)), 0)
})

test('result notes cover extra time and shootouts', () => {
  const home = { name: 'Italy' }
  const away = { name: 'France' }
  assert.equal(resultNote({ home, away, extraTime: true, penalties: { home: 5, away: 3 } }), 'after extra time, Italy won 5–3 on penalties')
  assert.equal(resultNote({ home, away, extraTime: true }), 'after extra time')
  assert.equal(resultNote({ home, away }), '')
})

test('people match on surnames, longer forms and nicknames', () => {
  assert.equal(personMatches('muller', 'Thomas Müller'), true)
  assert.equal(personMatches('van dijk', 'Virgil van Dijk'), true)
  assert.equal(personMatches('Alisson Becker', 'Alisson'), true)
  assert.equal(personMatches('Pity Martínez', 'Gonzalo Martínez'), true)
  assert.equal(personMatches('Neymar', 'Gabriel Jesus'), false)
  assert.equal(countMatches(['kroos', 'kroos'], ['Toni Kroos', 'Mesut Özil']).size, 1)
})

test('the archive calendar covers round 1 up to today', () => {
  const weeks = calendarWeeks(2026, 9, new Date(2026, 9, 5))
  const days = weeks.flat()
  assert.ok(weeks.every((week) => week.length === 7))
  // 1 October 2026 is a Thursday, so four blank days lead the month.
  assert.deepEqual(days.slice(0, 5).map((day) => day && day.date.getDate()), [null, null, null, null, 1])
  assert.deepEqual(days.filter((day) => day?.round).map((day) => [day.date.getDate(), day.round]), [[3, 1], [4, 2], [5, 3]])
  assert.equal(days.filter(Boolean).length, 31)
  assert.deepEqual(calendarWeeks(2026, 8, new Date(2026, 9, 5)).flat().filter((day) => day?.round), [])
  assert.equal(roundMatchIndex(2), dailyMatchIndex(new Date(2026, 9, 4)))
  assert.equal(roundDate(1).toDateString(), new Date(2026, 9, 3).toDateString())
  assert.equal(roundNumber(roundDate(40)), 40)
})

test('the runway report counts days left and picks the least recent competition type', async () => {
  const { nextCompetition, runway } = await import('../match-runway.mjs')
  const report = runway(MATCHES, new Date(2026, 9, 3))
  assert.equal(report.todayRound, 1)
  assert.equal(report.daysLeft, MATCHES.length - 1)
  const matches = ['world-cup', 'domestic-league', 'continental-club', 'world-cup'].map((competition) => ({ competition }))
  assert.equal(nextCompetition(matches), 'continental-trophy')
  assert.equal(nextCompetition([...matches, { competition: 'continental-trophy' }]), 'domestic-league')
})

test('every match is complete and well-formed', () => {
  const types = COMPETITION_TYPES.map((type) => type.id)
  const ids = MATCHES.map((match) => match.id)
  assert.equal(new Set(ids).size, ids.length, 'match ids are unique')
  for (const match of MATCHES) {
    const at = match.id
    assert.match(match.id, /^[a-z0-9-]+$/, at)
    assert.ok(types.includes(match.competition), `${at}: competition type`)
    assert.ok(match.competitionName && match.venue, `${at}: competition name and venue`)
    assert.ok(Number.isInteger(match.year) && match.year > 1900 && match.year <= new Date().getFullYear(), `${at}: year`)
    for (const side of ['home', 'away']) {
      const team = match[side]
      assert.ok(team.name && team.manager && Array.isArray(team.aliases), `${at}: ${side} team`)
      assert.equal(new Set(team.startingXI).size, 11, `${at}: ${side} has 11 different starters`)
    }
    const { image } = match
    assert.match(image.src, /^https:\/\/(upload|thumb)\.wikimedia\.org\//, `${at}: photo from Wikimedia`)
    assert.match(image.page, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/, `${at}: Commons file page`)
    assert.ok(image.author && image.license && image.licenseUrl, `${at}: photo credit`)
    for (const goal of match.goals) {
      assert.ok(['home', 'away'].includes(goal.team) && goal.player && typeof goal.minute === 'string', `${at}: goal`)
    }
  }
})
