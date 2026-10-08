import { useEffect, useState } from 'react'
import './App.css'
import { COMPETITION_TYPES, MANAGER_OPTIONS, MATCHES, PLAYER_OPTIONS, TEAM_OPTIONS } from './matches.js'
import { getSession, signIn, signOut, signUp, uploadResults } from './account.js'
import { archiveRounds, countMatches, finalScore, normalize, personMatches, resultNote, roundDate, roundMatchIndex, roundNumber, scorersOf, teamMatches } from './game.js'

const MAX_SUGGESTIONS = 6

function suggest(query, options, exclude = []) {
  const target = normalize(query)
  if (!target) return []
  return options
    .filter((option) => normalize(option).includes(target) && !exclude.includes(option) && normalize(option) !== target)
    .slice(0, MAX_SUGGESTIONS)
}

function AutocompleteField({ label, value, placeholder, options, onChange, disabled }) {
  const suggestions = disabled ? [] : suggest(value, options)

  return (
    <label className="team-autocomplete">
      <span>{label}</span>
      <input type="text" value={value} placeholder={placeholder} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
      {suggestions.length > 0 && (
        <div className="autocomplete-menu">
          {suggestions.map((option) => <button type="button" key={option} onClick={() => onChange(option)}>{option}</button>)}
        </div>
      )}
    </label>
  )
}

function TagInput({ label, selected, placeholder, options, limit, onChange, disabled }) {
  const [query, setQuery] = useState('')
  const full = selected.length >= limit
  const suggestions = disabled || full ? [] : suggest(query, options, selected)
  const add = (name) => {
    const trimmed = name.trim()
    if (!trimmed || full || selected.some((item) => normalize(item) === normalize(trimmed))) return
    onChange([...selected, trimmed])
    setQuery('')
  }

  return (
    <div className="team-autocomplete player-autocomplete">
      <span>{label} <small>{selected.length} / {limit}</small></span>
      <div className="selected-players">
        {selected.map((name) => (
          <button type="button" key={name} disabled={disabled} onClick={() => onChange(selected.filter((item) => item !== name))}>
            {name} {!disabled && <b>×</b>}
          </button>
        ))}
      </div>
      {!disabled && !full && (
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(query) } }}
        />
      )}
      {suggestions.length > 0 && (
        <div className="autocomplete-menu">
          {suggestions.map((name) => <button type="button" key={name} onClick={() => add(name)}>{name}</button>)}
        </div>
      )}
    </div>
  )
}

function ScoreStepper({ team, value, onChange, disabled }) {
  return (
    <div>
      <span>{team}</span>
      <button type="button" disabled={disabled} onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      <strong>{value}</strong>
      <button type="button" disabled={disabled} onClick={() => onChange(value + 1)}>+</button>
    </div>
  )
}

const emptyGuesses = () => ({
  teams: ['', ''],
  year: '',
  competition: '',
  managers: ['', ''],
  homeXI: [],
  awayXI: [],
  score: { home: 0, away: 0 },
  scorers: [],
})

const formatGoal = (goal) => `${goal.player} ${goal.minute}'${goal.penalty ? ' (pen)' : ''}${goal.ownGoal ? ' (OG)' : ''}`

function buildSteps(match) {
  const { home, away } = match
  const score = finalScore(match)
  const scorers = scorersOf(match)
  const steps = [
    {
      key: 'teams',
      label: 'The teams',
      prompt: 'Which two teams played?',
      max: 2,
      ready: (g) => g.teams.every(Boolean),
      points: (g) => [home, away].filter((team) => g.teams.some((guess) => teamMatches(guess, team))).length,
      reveal: () => `${home.name} vs ${away.name}`,
    },
    {
      key: 'year',
      label: 'The year',
      prompt: 'What year was this match played?',
      max: 1,
      ready: (g) => /^\d{4}$/.test(g.year),
      points: (g) => Number(Number(g.year) === match.year),
      reveal: () => String(match.year),
    },
    {
      key: 'competition',
      label: 'The competition',
      prompt: 'What type of competition was it?',
      max: 1,
      ready: (g) => Boolean(g.competition),
      points: (g) => Number(g.competition === match.competition),
      reveal: () => `${COMPETITION_TYPES.find((type) => type.id === match.competition).label}: ${match.competitionName}`,
    },
    {
      key: 'managers',
      label: 'The managers',
      prompt: 'Who managed each side?',
      max: 2,
      ready: (g) => g.managers.every(Boolean),
      points: (g) => Number(personMatches(g.managers[0], home.manager)) + Number(personMatches(g.managers[1], away.manager)),
      reveal: () => `${home.name}: ${home.manager} · ${away.name}: ${away.manager}`,
    },
    {
      key: 'lineups',
      label: 'The starting XIs',
      prompt: 'Name as many starters as you can. One point per player.',
      max: 22,
      ready: (g) => g.homeXI.length + g.awayXI.length > 0,
      points: (g) => countMatches(g.homeXI, home.startingXI).size + countMatches(g.awayXI, away.startingXI).size,
      reveal: () => null,
    },
    {
      key: 'score',
      label: 'The final score',
      prompt: 'What was the final score? Penalty shootouts don’t count.',
      max: 1,
      ready: () => true,
      points: (g) => Number(g.score.home === score.home && g.score.away === score.away),
      reveal: () => `${home.name} ${score.home}–${score.away} ${away.name}${resultNote(match) ? ` (${resultNote(match)})` : ''}`,
    },
    {
      key: 'scorers',
      label: 'The goalscorers',
      prompt: `Name the goalscorers, own goals included. You have ${match.goals.length} guesses, one per goal.`,
      max: scorers.length,
      ready: (g) => g.scorers.length > 0,
      points: (g) => countMatches(g.scorers, scorers).size,
      reveal: () => match.goals.map(formatGoal).join(' · '),
    },
  ]
  return match.goals.length ? steps : steps.filter((step) => step.key !== 'scorers')
}

function LineupReveal({ team, guesses }) {
  const found = countMatches(guesses, team.startingXI)
  return (
    <div className="lineup-reveal">
      <strong>{team.name}</strong>
      <ul>{team.startingXI.map((player) => <li key={player} className={found.has(player) ? 'hit' : ''}>{player}</li>)}</ul>
    </div>
  )
}

// Finished rounds, daily or archive, keyed by round number: { [round]: { earned, available } }.
const RESULTS_KEY = 'soccer-guessr:results'

function loadRoundResults() {
  try {
    return JSON.parse(localStorage.getItem(RESULTS_KEY)) || {}
  } catch {
    return {}
  }
}

function saveRoundResults(roundResults) {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(roundResults))
  } catch {
    // Private browsing or full storage: the archive just won't remember this round.
  }
}

function AccountPanel({ onSignedIn, onClose }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const creating = mode === 'signup'

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { user } = await (creating ? signUp : signIn)(email, password)
      await onSignedIn(user)
    } catch (failure) {
      setError(failure.message)
      setBusy(false)
    }
  }

  return (
    <div className="account-backdrop" onClick={onClose}>
      <form className="account-panel" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <p className="eyebrow">{creating ? 'CREATE AN ACCOUNT' : 'SIGN IN'}</p>
        <h2>{creating ? 'Keep your scores everywhere.' : 'Welcome back.'}</h2>
        <p>Scores you’ve saved on this device are added to your account.</p>
        <label>
          <span>Email</span>
          <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          <span>Password</span>
          <input type="password" autoComplete={creating ? 'new-password' : 'current-password'} required minLength={creating ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error && <p className="account-error">{error}</p>}
        <button className="submit-button" type="submit" disabled={busy}>{creating ? 'Create account' : 'Sign in'} <span>→</span></button>
        <button className="account-switch" type="button" onClick={() => { setMode(creating ? 'signin' : 'signup'); setError('') }}>
          {creating ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
      </form>
    </div>
  )
}

const formatDate = (date, options) => date.toLocaleDateString(undefined, options)

function Archive({ todayRound, playingRound, roundResults, onPlay }) {
  return (
    <section className="archive" id="archive">
      <p className="eyebrow">ARCHIVE</p>
      <h2>Missed a day? Play any past round.</h2>
      <ul className="archive-list">
        {archiveRounds(roundDate(todayRound)).map((round) => {
          const saved = roundResults[round]
          return (
            <li key={round}>
              <button type="button" className={round === playingRound ? 'current' : ''} onClick={() => onPlay(round)}>
                <strong>Round {String(round).padStart(3, '0')}</strong>
                <span>{round === todayRound ? 'Today' : formatDate(roundDate(round), { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <b>{saved ? `${saved.earned} / ${saved.available}` : round === playingRound ? 'Playing' : 'Not played'}</b>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function shareText(round, results, total, max) {
  const squares = results.map(({ points, max: stepMax }) => (points === stepMax ? '🟩' : points > 0 ? '🟨' : '⬛')).join('')
  return `icalledgame ⚽ soccer ${round === null ? 'practice' : `#${round}`}\n${squares} ${total}/${max}\n${window.location.origin}`
}

function App() {
  const today = new Date()
  const todayRound = roundNumber(today)
  // The round being played, or null for practice matches reached via "Play another match".
  const [round, setRound] = useState(todayRound)
  const [matchIndex, setMatchIndex] = useState(() => roundMatchIndex(todayRound))
  // Guests' results live in this browser; signed-in players' results live in their account.
  const [guestResults, setGuestResults] = useState(loadRoundResults)
  const [accountResults, setAccountResults] = useState(null)
  const [accounts, setAccounts] = useState(false)
  const [user, setUser] = useState(null)
  const [showAccount, setShowAccount] = useState(false)
  const [step, setStep] = useState(0)
  const [guesses, setGuesses] = useState(emptyGuesses)
  const [results, setResults] = useState([])
  const [copied, setCopied] = useState(false)

  const roundResults = accountResults || guestResults

  // Copies this browser's guest results into the account, then shows the account's results.
  const startAccount = async (signedInUser) => {
    const { results } = await uploadResults(guestResults)
    setUser(signedInUser)
    setAccountResults(results)
    setShowAccount(false)
  }

  useEffect(() => {
    getSession()
      .then(({ accounts: enabled, user: signedInUser }) => {
        setAccounts(enabled)
        if (signedInUser) return startAccount(signedInUser)
      })
      .catch(() => {})
    // Only on first load; later sign-ins go through the account panel.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const leaveAccount = async () => {
    await signOut().catch(() => {})
    setUser(null)
    setAccountResults(null)
  }

  const match = MATCHES[matchIndex]
  const steps = buildSteps(match)
  const current = steps[step]
  const locked = results.length > step
  const finished = step === steps.length
  const earned = results.reduce((sum, result) => sum + result.points, 0)
  const available = steps.reduce((sum, item) => sum + item.max, 0)
  const roundLabel = round === null ? 'PRACTICE' : `${round === todayRound ? '' : 'ARCHIVE · '}ROUND ${String(round).padStart(3, '0')}`
  const score = finalScore(match)
  const revealed = (key) => results.length > steps.findIndex((item) => item.key === key)

  const update = (key, value) => setGuesses((currentGuesses) => ({ ...currentGuesses, [key]: value }))
  const updatePair = (key, index, value) => setGuesses((currentGuesses) => ({ ...currentGuesses, [key]: currentGuesses[key].map((item, i) => (i === index ? value : item)) }))
  const lockIn = () => setResults((currentResults) => [...currentResults, { points: current.points(guesses), max: current.max }])
  const startMatch = (index, nextRound = null) => {
    setRound(nextRound)
    setMatchIndex(index)
    setStep(0)
    setGuesses(emptyGuesses())
    setResults([])
    setCopied(false)
  }
  const playRound = (nextRound) => {
    startMatch(roundMatchIndex(nextRound), nextRound)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  // Keep the first finished attempt at a round, so replaying from the archive doesn't overwrite it.
  const finishRound = () => {
    setStep((currentStep) => currentStep + 1)
    if (round === null || roundResults[round]) return
    const entry = { [round]: { earned, available } }
    if (user) {
      setAccountResults((current) => ({ ...entry, ...current }))
      uploadResults(entry).then(({ results }) => setAccountResults(results)).catch(() => {})
      return
    }
    const next = { ...guestResults, ...entry }
    setGuestResults(next)
    saveRoundResults(next)
  }
  const share = async () => {
    try {
      await navigator.clipboard.writeText(shareText(round, results, earned, available))
      setCopied(true)
    } catch {
      window.prompt('Copy your result:', shareText(round, results, earned, available))
    }
  }

  // Once the teams are revealed, later questions can name them.
  const homeLabel = revealed('teams') ? match.home.name : 'Home team'
  const awayLabel = revealed('teams') ? match.away.name : 'Away team'

  const renderInput = () => {
    switch (current.key) {
      case 'teams':
        return (
          <div className="team-inputs">
            <AutocompleteField label="Team one" value={guesses.teams[0]} placeholder="Start typing a team" options={TEAM_OPTIONS} disabled={locked} onChange={(value) => updatePair('teams', 0, value)} />
            <AutocompleteField label="Team two" value={guesses.teams[1]} placeholder="Start typing a team" options={TEAM_OPTIONS} disabled={locked} onChange={(value) => updatePair('teams', 1, value)} />
          </div>
        )
      case 'year':
        return <input className="step-text-input" type="number" inputMode="numeric" min="1900" max={today.getFullYear()} value={guesses.year} placeholder="e.g. 2006" disabled={locked} onChange={(event) => update('year', event.target.value)} />
      case 'competition':
        return (
          <div className="choice-grid">
            {COMPETITION_TYPES.map((type) => (
              <button type="button" key={type.id} disabled={locked} className={guesses.competition === type.id ? 'selected' : ''} onClick={() => update('competition', type.id)}>
                <strong>{type.label}</strong>
                <small>{type.example}</small>
              </button>
            ))}
          </div>
        )
      case 'managers':
        return (
          <div className="team-inputs">
            <AutocompleteField label={`${homeLabel} manager`} value={guesses.managers[0]} placeholder="Start typing a manager" options={MANAGER_OPTIONS} disabled={locked} onChange={(value) => updatePair('managers', 0, value)} />
            <AutocompleteField label={`${awayLabel} manager`} value={guesses.managers[1]} placeholder="Start typing a manager" options={MANAGER_OPTIONS} disabled={locked} onChange={(value) => updatePair('managers', 1, value)} />
          </div>
        )
      case 'lineups':
        return (
          <div className="lineup-inputs">
            <TagInput key={`${match.id}-home`} label={`${homeLabel} XI`} selected={guesses.homeXI} placeholder="Type a player, Enter to add" options={PLAYER_OPTIONS} limit={11} disabled={locked} onChange={(value) => update('homeXI', value)} />
            <TagInput key={`${match.id}-away`} label={`${awayLabel} XI`} selected={guesses.awayXI} placeholder="Type a player, Enter to add" options={PLAYER_OPTIONS} limit={11} disabled={locked} onChange={(value) => update('awayXI', value)} />
          </div>
        )
      case 'score':
        return (
          <div className="score-controls">
            <ScoreStepper team={homeLabel} value={guesses.score.home} disabled={locked} onChange={(value) => update('score', { ...guesses.score, home: value })} />
            <b>–</b>
            <ScoreStepper team={awayLabel} value={guesses.score.away} disabled={locked} onChange={(value) => update('score', { ...guesses.score, away: value })} />
          </div>
        )
      case 'scorers':
        return <TagInput key={`${match.id}-scorers`} label="Goalscorers" selected={guesses.scorers} placeholder="Type a player, Enter to add" options={PLAYER_OPTIONS} limit={match.goals.length} disabled={locked} onChange={(value) => update('scorers', value)} />
      default:
        return null
    }
  }

  const result = results[step]

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="icalledgame home"><span>i</span>calledgame</a>
        <nav>
          <a href="#archive">Archive</a><a href="#how-to-play">How to play</a>
          {accounts && (user
            ? <span className="account-nav"><small>{user.email}</small><button type="button" onClick={leaveAccount}>Sign out</button></span>
            : <button type="button" className="account-nav" onClick={() => setShowAccount(true)}>Sign in</button>)}
        </nav>
      </header>

      {showAccount && <AccountPanel onSignedIn={startAccount} onClose={() => setShowAccount(false)} />}

      <section className="intro">
        <div><p className="eyebrow">THE DAILY SOCCER PUZZLE</p><h1>Can you call<br /><em>this</em> game?</h1></div>
        <div className="date-stamp">
          <strong>{roundLabel}</strong>
          <span>{formatDate(round === null ? today : roundDate(round), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <b>● {finished ? 'FINAL WHISTLE' : 'LIVE'}</b>
        </div>
      </section>

      <section className="game-grid">
        <div className="visual-column">
          <div className="match-image">
            <img src={match.image.src} alt="Mystery match photograph" />
            <div className="image-wash" />
            <div className="image-caption"><span>THE MOMENT</span><strong>Can you read the scene?</strong></div>
          </div>
          <dl className="match-card">
            <div><dt>Teams</dt><dd>{revealed('teams') ? `${match.home.name} vs ${match.away.name}` : '?'}</dd></div>
            <div><dt>Year</dt><dd>{revealed('year') ? match.year : '?'}</dd></div>
            <div><dt>Competition</dt><dd>{revealed('competition') ? match.competitionName : '?'}</dd></div>
            <div><dt>Score</dt><dd>{revealed('score') ? `${score.home}–${score.away}` : '?'}</dd></div>
          </dl>
        </div>

        <div className="answer-panel">
          {!finished ? (
            <>
              <div className="panel-heading">
                <div><p className="eyebrow">QUESTION {String(step + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</p><h2>{current.label}</h2></div>
                <div className="score">{earned}<small>points</small></div>
              </div>
              <div className="step-question"><p>{current.prompt}</p>{renderInput()}</div>
              {locked && (
                <div className={`step-feedback ${result.points === result.max ? 'correct' : result.points > 0 ? 'partial' : 'incorrect'}`}>
                  <strong>{result.points} / {result.max}</strong>
                  <span>{current.reveal()}</span>
                </div>
              )}
              {locked && current.key === 'lineups' && (
                <div className="lineup-reveals"><LineupReveal team={match.home} guesses={guesses.homeXI} /><LineupReveal team={match.away} guesses={guesses.awayXI} /></div>
              )}
              <div className="step-actions">
                {locked
                  ? <button className="submit-button" type="button" onClick={step === steps.length - 1 ? finishRound : () => setStep((currentStep) => currentStep + 1)}>{step === steps.length - 1 ? 'See your result' : 'Next question'} <span>→</span></button>
                  : <button className="submit-button" type="button" disabled={!current.ready(guesses)} onClick={lockIn}>Lock it in <span>→</span></button>}
              </div>
            </>
          ) : (
            <div className="summary">
              <div className="panel-heading">
                <div><p className="eyebrow">FULL TIME</p><h2>{earned === available ? 'Called it.' : `${earned} of ${available} points`}</h2></div>
                <div className="score">{Math.round((earned / available) * 100)}%<small>accuracy</small></div>
              </div>
              <ul className="breakdown">
                {steps.map((item, index) => (
                  <li key={item.key}><span>{item.label}</span><b>{results[index].points} / {item.max}</b></li>
                ))}
              </ul>
              <p className="match-summary">{match.competitionName} · {match.venue}</p>
              <div className="step-actions">
                <button className="back-button" type="button" onClick={share}>{copied ? 'Copied ✓' : 'Share result'}</button>
                <button className="submit-button" type="button" onClick={() => startMatch((matchIndex + 1) % MATCHES.length)}>Play another match <span>→</span></button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Archive todayRound={todayRound} playingRound={round} roundResults={roundResults} onPlay={playRound} />

      <section className="how-to-play" id="how-to-play">
        <p className="eyebrow">HOW TO PLAY</p>
        <p>Study the photo, then answer one question at a time: the teams, the year, the type of competition, both managers, both starting XIs, the final score and the goalscorers. Each answer is revealed once you lock it in, so later questions get easier. Surnames are enough.</p>
      </section>

      <footer>
        <span>icalledgame <b>×</b> soccer edition</span>
        {/* The Commons file name gives the answer away, so only link it once the round is over. */}
        <span>Photo: {finished ? <a href={match.image.page} target="_blank" rel="noreferrer">{match.image.author}</a> : match.image.author} / Wikimedia Commons <a href={match.image.licenseUrl} target="_blank" rel="noreferrer"><i>{match.image.license}</i></a></span>
        <span>New match daily</span>
      </footer>
    </main>
  )
}

export default App
