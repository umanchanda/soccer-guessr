import { test } from 'node:test'
import assert from 'node:assert/strict'
import { countMatches, dailyMatchIndex, personMatches, resultNote, teamMatches } from '../../src/game.js'
import { MATCHES } from '../../src/matches.js'

test('team guesses must match a name or alias exactly', () => {
  const team = { name: 'West Germany', aliases: ['FRG'] }
  assert.equal(teamMatches('west germany', team), true)
  assert.equal(teamMatches('FRG', team), true)
  assert.equal(teamMatches('Germany', team), false)
  assert.equal(teamMatches('Madrid', { name: 'Real Madrid', aliases: [] }), false)
})

test('round N plays the Nth match', () => {
  assert.equal(dailyMatchIndex(new Date(2026, 9, 7)), 0)
  assert.equal(dailyMatchIndex(new Date(2026, 9, 8)), 1)
  assert.equal(dailyMatchIndex(new Date(2026, 9, 7 + MATCHES.length)), 0)
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
