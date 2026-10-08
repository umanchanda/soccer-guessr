#!/usr/bin/env node
// Builds a src/matches.js entry from a Wikipedia article's football box and line-up tables.
//
//   node scripts/import-match.mjs "2010 FIFA World Cup final"
//   node scripts/import-match.mjs "2018 FIFA World Cup Group B" "Portugal vs Spain"
//
// The entry is printed to stdout; anything that needs a second look goes to stderr.
// The photo, competition type and team aliases are left for you to fill in.

import { pathToFileURL } from 'node:url'

const USER_AGENT = 'soccer-guessr/0.1 (match import script)'

const NATIONS = {
  ALG: 'Algeria', ARG: 'Argentina', AUS: 'Australia', AUT: 'Austria', BEL: 'Belgium', BOL: 'Bolivia', BRA: 'Brazil',
  CAN: 'Canada', CHI: 'Chile', CIV: 'Ivory Coast', CMR: 'Cameroon', COL: 'Colombia', CRC: 'Costa Rica', CRO: 'Croatia',
  CZE: 'Czech Republic', DEN: 'Denmark', ECU: 'Ecuador', EGY: 'Egypt', ENG: 'England', ESP: 'Spain', FRA: 'France',
  FRG: 'West Germany', GER: 'Germany', GHA: 'Ghana', GRE: 'Greece', HUN: 'Hungary', IRL: 'Republic of Ireland',
  IRN: 'Iran', ITA: 'Italy', JPN: 'Japan', KOR: 'South Korea', KSA: 'Saudi Arabia', MAR: 'Morocco', MEX: 'Mexico',
  NED: 'Netherlands', NGA: 'Nigeria', NIR: 'Northern Ireland', PAR: 'Paraguay', PER: 'Peru', POL: 'Poland',
  POR: 'Portugal', QAT: 'Qatar', ROU: 'Romania', RUS: 'Russia', SCO: 'Scotland', SEN: 'Senegal', SRB: 'Serbia',
  SUI: 'Switzerland', SVK: 'Slovakia', SVN: 'Slovenia', SWE: 'Sweden', TCH: 'Czechoslovakia', TUN: 'Tunisia',
  TUR: 'Turkey', UKR: 'Ukraine', URS: 'Soviet Union', URU: 'Uruguay', USA: 'United States', VEN: 'Venezuela',
  WAL: 'Wales', YUG: 'Yugoslavia',
}

export async function fetchWikitext(title) {
  const url = `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(title.replaceAll(' ', '_'))}&action=raw`
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`Couldn't fetch "${title}" (HTTP ${response.status})`)
  const text = await response.text()
  const redirect = text.match(/^#REDIRECT\s*\[\[([^\]|#]+)/i)
  return redirect ? fetchWikitext(redirect[1]) : text
}

const stripNoise = (text) => text
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<ref[^>/]*\/>/g, '')
  .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')

// Index just past the {{template}} or [[link]] that opens at `start`.
function closingIndex(text, start) {
  let depth = 0
  for (let i = start; i < text.length - 1; i++) {
    const pair = text.slice(i, i + 2)
    if (pair === '{{' || pair === '[[') { depth++; i++ }
    else if (pair === '}}' || pair === ']]') {
      depth--
      i++
      if (depth === 0) return i + 1
    }
  }
  return text.length
}

function templateParams(template) {
  const inner = template.slice(2, -2)
  const parts = []
  let depth = 0
  let current = ''
  for (let i = 0; i < inner.length; i++) {
    const pair = inner.slice(i, i + 2)
    if (pair === '{{' || pair === '[[') { depth++; current += pair; i++ }
    else if (pair === '}}' || pair === ']]') { depth--; current += pair; i++ }
    else if (inner[i] === '|' && depth === 0) { parts.push(current); current = '' }
    else current += inner[i]
  }
  parts.push(current)
  const [name, ...rest] = parts
  const named = {}
  const positional = []
  for (const part of rest) {
    const match = part.match(/^\s*([\w ]+?)\s*=([\s\S]*)$/)
    if (match) named[match[1].trim()] = match[2].trim()
    else positional.push(part.trim())
  }
  return { name: name.trim().toLowerCase(), named, positional }
}

// Plain text from wikitext: links become their label, templates and formatting disappear.
function plain(text) {
  let result = text
  for (let previous = ''; previous !== result;) {
    previous = result
    result = result.replace(/\{\{[^{}]*\}\}/g, '')
  }
  return result
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const withoutDisambiguation = (title) => title.replace(/\s*\([^)]*\)\s*$/, '').trim()

// First person named in a cell: a wikilink (ignoring the captain marker), a {{sortname}},
// or an {{interlanguage link}} for players without an English article.
function personIn(cell) {
  const pattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\{\{\s*sortname\s*\|([^|}]+)\|([^|}]+)(?:\|([^|}=]+))?[^}]*\}\}|\{\{\s*(?:interlanguage link|ill)\s*\|([^|}]+)[^}]*\}\}/gi
  for (const match of cell.matchAll(pattern)) {
    if (match[1]) {
      if (/^(captain|file|image)\b/i.test(match[1].trim())) continue
      return { link: match[1].trim(), name: plain(match[2] ?? withoutDisambiguation(match[1])) }
    }
    if (match[6]) return { link: match[6].trim(), name: withoutDisambiguation(match[6]) }
    const name = `${match[3].trim()} ${match[4].trim()}`
    return { link: (match[5] ?? name).trim(), name }
  }
  const name = plain(cell.replace(/\([^)]*\)/g, ''))
  return name ? { link: name, name } : null
}

const POSITION_ROW = /^\|\s*(?:\{\{\s*abbr\s*\|\s*([A-Z]{1,4})\s*\|[^}]*\}\}|([A-Z]{1,4}))\s*\|\|(.*)$/

function parseLineups(text) {
  const teams = []
  let team = { starters: [], substitutes: [], manager: null }
  let phase = 'starters'
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (/'''\s*(substitutes|substitutions|subs)\b/i.test(line)) { phase = 'substitutes'; continue }
    const managerLabel = line.match(/'''\s*(assistant\s+)?(manager|head coach|coach)s?\s*:?\s*'''/i)
    if (managerLabel) {
      phase = 'manager'
      team.assistantListed = Boolean(managerLabel[1])
      continue
    }
    if (phase === 'manager') {
      if (!line.startsWith('|') || /^\|[-}]/.test(line)) continue
      const person = personIn(line.replace(/^\|\s*(colspan\s*=\s*"?\d+"?\s*\|)?/i, ''))
      team.manager = person?.name ?? null
      teams.push(team)
      if (teams.length === 2) break
      team = { starters: [], substitutes: [], manager: null }
      phase = 'starters'
      continue
    }
    const row = line.match(POSITION_ROW)
    if (!row) continue
    const cells = row[3].split('||')
    const person = cells.map(personIn).find((candidate) => candidate && !/^'*\d+'*$/.test(candidate.name))
    if (person) team[phase].push(person)
  }
  return teams
}

function teamName(value) {
  // {{fb|ESP}}, or the module forms {{#invoke:flag|fb-rt|ESP}} and {{#invoke:flagg|main|unpre|avar=fb|ARG}}.
  const template = value.match(/\{\{\s*(?:fb|fb-rt|fbw|fbw-rt|fbu|fb-big)\s*\|\s*([A-Z]{3})/i)
    ?? value.match(/\{\{\s*#invoke:\s*flagg?\s*\|[^{}]*?\|\s*([A-Z]{3})\s*(?:\||\}\})/)
  if (template) return NATIONS[template[1].toUpperCase()] ?? template[1].toUpperCase()
  const link = value.match(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/)
  return link ? plain(link[1]) : plain(value)
}

function scoreOf(value) {
  const candidates = [value, ...[...value.matchAll(/\{\{[^{}]*\}\}/g)].flatMap((match) => templateParams(match[0]).positional)]
  for (const candidate of candidates) {
    const match = plain(candidate).match(/^(\d+)\s*[–-]\s*(\d+)$/)
    if (match) return [Number(match[1]), Number(match[2])]
  }
  const loose = plain(value).match(/(\d+)\s*[–-]\s*(\d+)/)
  return loose ? [Number(loose[1]), Number(loose[2])] : null
}

function parseGoals(value, side) {
  const goals = []
  let scorer = null
  // Minutes come in {{goal}} templates, or as plain text like `106'` or `45+2' (pen.)`.
  const pattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\{\{\s*(sortname|interlanguage link|ill|goal|pengoal|penalty goal|own goal|og)\s*(\|[^{}]*)?\}\}|(\d+(?:\s*\+\s*\d+)?)\s*['’](\s*\((?:pen|o\.?\s?g)[^)]*\))?/gi
  for (const match of value.matchAll(pattern)) {
    if (match[5]) {
      if (scorer) goals.push({ side, scorer, minute: match[5].replace(/\s/g, ''), penalty: /pen/i.test(match[6] ?? ''), ownGoal: /o\.?\s?g/i.test(match[6] ?? '') })
      continue
    }
    if (match[1]) {
      scorer = { link: match[1].trim(), name: plain(match[2] ?? withoutDisambiguation(match[1])) }
      continue
    }
    const kind = match[3].toLowerCase()
    const params = (match[4] ?? '').split('|').slice(1).map((param) => param.trim())
    if (kind === 'sortname') {
      const name = `${params[0]} ${params[1]}`
      scorer = { link: params[2] && !params[2].includes('=') ? params[2] : name, name }
      continue
    }
    if (kind === 'interlanguage link' || kind === 'ill') {
      scorer = { link: params[0], name: withoutDisambiguation(params[0]) }
      continue
    }
    if (!scorer) continue
    for (let i = 0; i < params.length; i += 2) {
      const minute = params[i].replace(/['’]/g, '')
      if (!/^\d/.test(minute)) continue
      const note = `${params[i + 1] ?? ''} ${kind}`
      goals.push({ side, scorer, minute, penalty: /pen/i.test(note), ownGoal: /\bo\.?\s?g\b|own/i.test(note) })
    }
  }
  return goals
}

const minuteOrder = (minute) => {
  const [base, added = '0'] = minute.split('+')
  return Number.parseInt(base, 10) * 100 + Number.parseInt(added, 10)
}

// Replaces {{#lst:Article|section}} with the labelled section from that article.
async function expandTransclusions(text) {
  let result = text
  for (const match of text.matchAll(/\{\{#lst:\s*([^|}]+)\|\s*([^|}]+)\}\}/gi)) {
    const source = await fetchWikitext(match[1].trim())
    const label = match[2].trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const section = source.match(new RegExp(`<section\\s+begin\\s*=\\s*"?${label}"?\\s*/>([\\s\\S]*?)<section\\s+end\\s*=\\s*"?${label}"?\\s*/>`, 'i'))
    result = result.replace(match[0], section ? section[1] : '')
  }
  return result
}

function selectSection(text, heading) {
  const lines = text.split('\n')
  const headings = lines
    .map((line, index) => ({ index, match: line.match(/^(=+)\s*(.*?)\s*\1\s*$/) }))
    .filter((item) => item.match)
  const wanted = heading.toLowerCase()
  const start = headings.find((item) => item.match[2].toLowerCase().includes(wanted))
  if (!start) throw new Error(`No section matching "${heading}". Sections: ${headings.map((item) => item.match[2]).join(' | ')}`)
  const level = start.match[1].length
  const end = headings.find((item) => item.index > start.index && item.match[1].length <= level)
  return lines.slice(start.index, end ? end.index : lines.length).join('\n')
}

export function parseMatch(wikitext) {
  const text = stripNoise(wikitext)
  const boxes = []
  for (const match of text.matchAll(/\{\{\s*(?:#invoke:\s*)?football ?box\b/gi)) {
    const end = closingIndex(text, match.index)
    boxes.push({ start: match.index, end, params: templateParams(text.slice(match.index, end)).named })
  }
  const candidates = boxes.map((box, index) => ({ box, teams: parseLineups(text.slice(box.end, boxes[index + 1]?.start ?? text.length)) }))
  const found = candidates.find((candidate) => candidate.teams.length === 2)
  if (!found) throw new Error(`No football box followed by two line-ups (found ${boxes.length} football boxes)`)

  const warnings = []
  if (candidates.filter((candidate) => candidate.teams.length === 2).length > 1) warnings.push('More than one match here; used the first. Pass a section heading to pick another.')
  const { params } = found.box
  const [homeTeam, awayTeam] = found.teams
  const squads = [...homeTeam.starters, ...homeTeam.substitutes, ...awayTeam.starters, ...awayTeam.substitutes]
  const nameFor = (scorer) => {
    const exact = squads.find((player) => withoutDisambiguation(player.link) === withoutDisambiguation(scorer.link))
    const surname = scorer.name.split(' ').at(-1)
    const bySurname = squads.filter((player) => player.name.split(' ').at(-1) === surname)
    if (exact) return exact.name
    if (bySurname.length === 1) return bySurname[0].name
    warnings.push(`Scorer "${scorer.name}" isn't in either squad; check the name.`)
    return withoutDisambiguation(scorer.link)
  }
  const goals = [...parseGoals(params.goals1 ?? '', 'home'), ...parseGoals(params.goals2 ?? '', 'away')]
    .sort((a, b) => minuteOrder(a.minute) - minuteOrder(b.minute))
    .map((goal) => ({ team: goal.side, player: nameFor(goal.scorer), minute: goal.minute, ...(goal.penalty && { penalty: true }), ...(goal.ownGoal && { ownGoal: true }) }))

  const score = scoreOf(params.score ?? '')
  const tally = [goals.filter((goal) => goal.team === 'home').length, goals.filter((goal) => goal.team === 'away').length]
  if (!score) warnings.push('Couldn\'t read the score.')
  else if (score[0] !== tally[0] || score[1] !== tally[1]) warnings.push(`Goals add up to ${tally.join('–')} but the score is ${score.join('–')}.`)
  const shootout = params.penaltyscore ? scoreOf(params.penaltyscore) : null

  const side = (team, value) => {
    const name = teamName(value ?? '')
    if (/^[A-Z]{3}$/.test(name)) warnings.push(`Unknown country code ${name}; add it to NATIONS.`)
    if (team.starters.length !== 11) warnings.push(`${name}: found ${team.starters.length} starters, expected 11.`)
    if (!team.manager) warnings.push(`${name}: no manager found.`)
    if (team.assistantListed) warnings.push(`${name}: the article lists an assistant coach (${team.manager}); the manager may have been suspended.`)
    return { name, aliases: [], manager: team.manager ?? '', startingXI: team.starters.map((player) => player.name) }
  }

  const year = plain(params.date ?? '').match(/\b(18|19|20)\d{2}\b/) ?? (params.date ?? '').match(/\b(18|19|20)\d{2}\b/)
  return {
    entry: {
      year: year ? Number(year[0]) : null,
      venue: plain(params.stadium ?? ''),
      ...(/^y/i.test(params.aet ?? '') && { extraTime: true }),
      ...(shootout && { penalties: { home: shootout[0], away: shootout[1] } }),
      home: side(homeTeam, params.team1),
      away: side(awayTeam, params.team2),
      goals,
    },
    warnings,
  }
}

export async function importMatch(title, heading) {
  let text = await fetchWikitext(title)
  if (heading) text = selectSection(text, heading)
  return parseMatch(await expandTransclusions(text))
}

const quote = (value) => (value.includes("'") ? `"${value}"` : `'${value}'`)
const list = (values) => `[${values.map(quote).join(', ')}]`

export function formatEntry(entry) {
  const image = entry.image ?? { src: '', page: '', author: '', license: '', licenseUrl: '' }
  const team = (side) => [
    `    ${side}: {`,
    `      name: ${quote(entry[side].name)},`,
    `      aliases: ${list(entry[side].aliases)},`,
    `      manager: ${quote(entry[side].manager)},`,
    `      startingXI: ${list(entry[side].startingXI)},`,
    '    },',
  ]
  const goal = (item) => `      { team: '${item.team}', player: ${quote(item.player)}, minute: '${item.minute}'${item.penalty ? ', penalty: true' : ''}${item.ownGoal ? ', ownGoal: true' : ''} },`
  return [
    '  {',
    `    id: ${quote(entry.id ?? '')},`,
    `    year: ${entry.year},`,
    `    competition: ${quote(entry.competition ?? '')},`,
    `    competitionName: ${quote(entry.competitionName ?? '')},`,
    `    venue: ${quote(entry.venue)},`,
    ...(entry.extraTime ? ['    extraTime: true,'] : []),
    ...(entry.penalties ? [`    penalties: { home: ${entry.penalties.home}, away: ${entry.penalties.away} },`] : []),
    '    image: {',
    ...['src', 'page', 'author', 'license', 'licenseUrl'].map((key) => `      ${key}: ${quote(image[key] ?? '')},`),
    '    },',
    ...team('home'),
    ...team('away'),
    entry.goals.length ? '    goals: [' : '    goals: [],',
    ...(entry.goals.length ? [...entry.goals.map(goal), '    ],'] : []),
    '  },',
  ].join('\n')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [title, heading] = process.argv.slice(2)
  if (!title) {
    console.error('Usage: node scripts/import-match.mjs "<Wikipedia article>" ["<section heading>"]')
    process.exit(1)
  }
  try {
    const { entry, warnings } = await importMatch(title, heading)
    console.log(formatEntry({ ...entry, competitionName: heading ? `${title}, ${heading}` : title }))
    for (const warning of warnings) console.error(`warning: ${warning}`)
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
