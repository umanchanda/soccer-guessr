import { MATCHES } from './matches.js'

const LAUNCH_DAY = Date.UTC(2026, 9, 7) / 86400000

const stripAccents = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '')
export const normalize = (text) => stripAccents(String(text)).toLowerCase().replace(/[^a-z0-9]/g, '')

// A guess matches a name if it equals the full name, any trailing part of it
// ("Müller", "van Dijk", "Alexander-Arnold"), or one of the listed aliases.
export function namesMatch(guess, name, aliases = []) {
  const target = normalize(guess)
  if (!target) return false
  const tokens = stripAccents(name).split(/\s+/)
  const suffixes = tokens.map((_, index) => tokens.slice(index).join(''))
  return [...suffixes, ...aliases].some((candidate) => normalize(candidate) === target)
}

// Counts how many distinct names in `answers` are hit by `guesses`.
export function countMatches(guesses, answers) {
  const found = new Set()
  for (const guess of guesses) {
    const hit = answers.find((answer) => !found.has(answer) && namesMatch(guess, answer))
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

export const roundNumber = (date) => dayNumber(date) - LAUNCH_DAY + 1
export const dailyMatchIndex = (date) => ((dayNumber(date) % MATCHES.length) + MATCHES.length) % MATCHES.length
