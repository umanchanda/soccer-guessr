import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calendarWeeks, countMatches, dailyMatchIndex, personMatches, resultNote, roundDate, roundMatchIndex, roundNumber, teamMatches } from '../../src/game.js'
import { MATCHES } from '../../src/matches.js'

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
