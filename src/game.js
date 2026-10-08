import { MATCHES } from './matches.js'

const LAUNCH_DAY = Date.UTC(2026, 9, 7) / 86400000

const stripAccents = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '')
export const normalize = (text) => stripAccents(String(text)).toLowerCase().replace(/[^a-z0-9]/g, '')
const tokens = (text) => stripAccents(String(text)).toLowerCase().split(/[\s-]+/).map(normalize).filter(Boolean)

// Teams must match the name or a listed alias: "Madrid" alone could mean two clubs.
export const teamMatches = (guess, team) => Boolean(normalize(guess)) && [team.name, ...team.aliases].some((name) => normalize(name) === normalize(guess))

// People match on the end of their name ("Müller", "van Dijk"), a longer form of it
// ("Alisson Becker" for "Alisson"), or a different first name with the same surname
// ("Pity Martínez" for "Gonzalo Martínez").
export function personMatches(guess, name) {
  const guessed = tokens(guess)
  const actual = tokens(name)
  if (!guessed.length) return false
  const isEnding = guessed.length <= actual.length && guessed.every((token, i) => token === actual[actual.length - guessed.length + i])
  const contains = guessed.some((_, start) => actual.every((token, i) => guessed[start + i] === token))
  const sameSurname = guessed.length > 1 && guessed.at(-1) === actual.at(-1)
  return isEnding || contains || sameSurname
}

// Counts how many distinct names in `answers` are hit by `guesses`.
export function countMatches(guesses, answers) {
  const found = new Set()
  for (const guess of guesses) {
    const hit = answers.find((answer) => !found.has(answer) && personMatches(guess, answer))
    if (hit) found.add(hit)
  }
  return found
}

export const scorersOf = (match) => [...new Set(match.goals.map((goal) => goal.player))]
export const finalScore = (match) => ({
  home: match.goals.filter((goal) => goal.team === 'home').length,
  away: match.goals.filter((goal) => goal.team === 'away').length,
})

export function dayNumber(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000)
}

// "after extra time, Italy won 5–3 on penalties"
export function resultNote(match) {
  const notes = []
  if (match.extraTime) notes.push('after extra time')
  if (match.penalties) {
    const { home, away } = match.penalties
    notes.push(`${(home > away ? match.home : match.away).name} won ${Math.max(home, away)}–${Math.min(home, away)} on penalties`)
  }
  return notes.join(', ')
}

export const roundNumber = (date) => dayNumber(date) - LAUNCH_DAY + 1

// Round 1 plays MATCHES[0], round 2 MATCHES[1] and so on, so appending matches
// doesn't reshuffle the schedule until the list wraps around.
export const roundMatchIndex = (round) => (((round - 1) % MATCHES.length) + MATCHES.length) % MATCHES.length
export const dailyMatchIndex = (date) => roundMatchIndex(roundNumber(date))

// The calendar day a round was the daily puzzle, as a local date.
export function roundDate(round) {
  const utc = new Date((LAUNCH_DAY + round - 1) * 86400000)
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate())
}

// Archive rounds, newest first: every day from launch up to and including `date`.
export const archiveRounds = (date) => Array.from({ length: Math.max(0, roundNumber(date)) }, (_, i) => roundNumber(date) - i)
