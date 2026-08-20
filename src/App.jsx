import { useState } from 'react'
import './App.css'

const teamOptions = ['Germany', 'Argentina', 'Brazil', 'Spain', 'Netherlands', 'France', 'Italy', 'Portugal']
const managerOptions = ['Joachim Löw', 'Alejandro Sabella', 'Jürgen Klinsmann', 'Diego Maradona', 'Pep Guardiola', 'José Mourinho', 'Didier Deschamps', 'Zlatko Dalić']
const yearOptions = ['2014', '2010', '2018', '2022', '2006']
const countryOptions = ['Brazil', 'South Africa', 'Russia', 'Qatar', 'Germany']
const competitionOptions = ['World Cup', 'UEFA Champions League', 'Premier League', 'La Liga', 'Copa América']
const goalscorerOptions = ['Mario Götze', 'Lionel Messi', 'Thomas Müller', 'Miroslav Klose', 'Gonzalo Higuaín']
const germanyPlayers = ['Manuel Neuer', 'Philipp Lahm', 'Jérôme Boateng', 'Mats Hummels', 'Benedikt Höwedes', 'Bastian Schweinsteiger', 'Christoph Kramer', 'Toni Kroos', 'Mesut Özil', 'Miroslav Klose', 'Thomas Müller']
const argentinaPlayers = ['Sergio Romero', 'Pablo Zabaleta', 'Martín Demichelis', 'Ezequiel Garay', 'Marcos Rojo', 'Enzo Pérez', 'Lucas Biglia', 'Javier Mascherano', 'Ezequiel Lavezzi', 'Gonzalo Higuaín', 'Lionel Messi']

function AutocompleteField({ label, value, placeholder, onChange, options }) {
  const suggestions = value ? options.filter((option) => option.toLowerCase().includes(value.toLowerCase())) : []

  return (
    <label className="team-autocomplete">
      <span>{label}</span>
      <input type="text" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      {suggestions.length > 0 && <div className="autocomplete-menu">{suggestions.map((team) => <button type="button" key={team} onClick={() => onChange(team)}>{team}</button>)}</div>}
    </label>
  )
}

function PlayerAutocomplete({ label, selected, placeholder, options, onAdd, onRemove }) {
  const [query, setQuery] = useState('')
  const suggestions = query ? options.filter((player) => player.toLowerCase().includes(query.toLowerCase()) && !selected.includes(player)) : []

  return (
    <div className="team-autocomplete player-autocomplete">
      <span>{label}</span>
      <div className="selected-players">{selected.map((player) => <button type="button" key={player} onClick={() => onRemove(player)}>{player} <b>×</b></button>)}</div>
      <input type="text" value={query} placeholder={placeholder} onChange={(event) => setQuery(event.target.value)} />
      {suggestions.length > 0 && <div className="autocomplete-menu">{suggestions.map((player) => <button type="button" key={player} onClick={() => { onAdd(player); setQuery('') }}>{player}</button>)}</div>}
    </div>
  )
}

function App() {
  const emptyAnswers = { teams: '', homeTeam: '', awayTeam: '', managers: '', homeManager: '', awayManager: '', year: '', country: '', tournament: '', homeXI: '', awayXI: '', finalScore: '', goalscorer: '' }
  const [answers, setAnswers] = useState(emptyAnswers)
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState(0)
  const [lastFeedback, setLastFeedback] = useState(null)
  const [goalGuess, setGoalGuess] = useState({ germany: 0, argentina: 0 })

  const correctAnswers = {
    teams: 'Germany vs Argentina',
    managers: 'Joachim Löw vs Alejandro Sabella',
    year: '2014',
    country: 'Brazil',
    tournament: 'World Cup',
    finalScore: '1-0',
    goalscorer: 'Mario Götze',
    homeXI: germanyPlayers.join('|'),
    awayXI: argentinaPlayers.join('|'),
  }

  const steps = [
    { key: 'teams', label: 'Teams involved', prompt: 'Who played in this match?', placeholder: 'Type both teams' , type: 'text' },
    { key: 'managers', label: 'Managers involved', prompt: 'Who led both sides?', placeholder: 'Type both managers', type: 'managers' },
    { key: 'year', label: 'Year photographed', prompt: 'When was this picture taken?', placeholder: 'Type the year', type: 'autocomplete', options: yearOptions },
    { key: 'country', label: 'Country', prompt: 'Which country hosted this match?', placeholder: 'Type the country', type: 'autocomplete', options: countryOptions },
    { key: 'tournament', label: 'Type of competition', prompt: 'What type of competition was it?', placeholder: 'Type the competition', type: 'autocomplete', options: competitionOptions },
    { key: 'lineups', label: 'Starting XIs', prompt: 'Name both starting lineups', placeholder: 'Type Germany’s lineup', type: 'lineups' },
    { key: 'finalScore', label: 'Final score', prompt: 'What was the final score?', type: 'score' },
    { key: 'goalscorer', label: 'Goalscorer', prompt: 'Who scored the winning goal?', placeholder: 'Type the goalscorer', type: 'autocomplete', options: goalscorerOptions },
  ]

  const updateAnswer = (key, value) => {
    setAnswers((current) => ({ ...current, [key]: value, ...(key === 'homeTeam' || key === 'awayTeam' ? { teams: key === 'homeTeam' ? `${value} vs ${current.awayTeam}` : `${current.homeTeam} vs ${value}` } : {}), ...(key === 'homeManager' || key === 'awayManager' ? { managers: key === 'homeManager' ? `${value} vs ${current.awayManager}` : `${current.homeManager} vs ${value}` } : {}) }))
    setSubmitted(false)
  }

  const selectedPlayers = (key) => answers[key] ? answers[key].split('|') : []
  const addPlayer = (key, player) => updateAnswer(key, [...selectedPlayers(key), player].join('|'))
  const removePlayer = (key, player) => updateAnswer(key, selectedPlayers(key).filter((selected) => selected !== player).join('|'))
  const updateGoals = (team, amount) => {
    setGoalGuess((current) => {
      const next = Math.max(0, current[team] + amount)
      const nextGuess = { ...current, [team]: next }
      updateAnswer('finalScore', `${nextGuess.germany}-${nextGuess.argentina}`)
      return nextGuess
    })
  }

  const allAnswered = answers.teams && answers.managers && answers.year && answers.country && answers.tournament && answers.homeXI && answers.awayXI && answers.finalScore && answers.goalscorer
  const normalizeAnswer = (answer) => answer.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase()
  const lineupPoints = (answer, expected) => answer.split('|').filter((player) => expected.split('|').some((target) => normalizeAnswer(player) === normalizeAnswer(target))).length
  const score = ['teams', 'managers', 'year', 'country', 'tournament', 'finalScore'].filter((key) => normalizeAnswer(answers[key]) === normalizeAnswer(correctAnswers[key])).length + lineupPoints(answers.homeXI, correctAnswers.homeXI) + lineupPoints(answers.awayXI, correctAnswers.awayXI)
  const currentStep = steps[step]
  const currentStepAnswered = currentStep.key === 'teams' || currentStep.key === 'managers' ? (currentStep.key === 'teams' ? answers.homeTeam && answers.awayTeam : answers.homeManager && answers.awayManager) : currentStep.type === 'lineups' ? answers.homeXI || answers.awayXI : currentStep.type === 'score' || answers[currentStep.key]
  const submitStep = () => {
    if (!currentStepAnswered) return
    const correct = currentStep.key === 'teams'
      ? normalizeAnswer(answers.homeTeam) === normalizeAnswer('Germany') && normalizeAnswer(answers.awayTeam) === normalizeAnswer('Argentina')
      : currentStep.key === 'managers'
        ? normalizeAnswer(answers.homeManager) === normalizeAnswer('Joachim Löw') && normalizeAnswer(answers.awayManager) === normalizeAnswer('Alejandro Sabella')
        : currentStep.type === 'lineups'
          ? lineupPoints(answers.homeXI, correctAnswers.homeXI) + lineupPoints(answers.awayXI, correctAnswers.awayXI)
          : normalizeAnswer(answers[currentStep.key]) === normalizeAnswer(correctAnswers[currentStep.key])
    setLastFeedback({ correct, label: currentStep.label, points: currentStep.type === 'lineups' ? correct : null })
    if (step < steps.length - 1) setStep((current) => current + 1)
  }
  const previousStep = () => { if (step > 0) setStep((current) => current - 1) }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="icalledgame home"><span>i</span>calledgame</a>
        <nav><a href="#how-to-play">How to play</a><a href="#archive">Archive</a><button className="profile" aria-label="Open profile">JD</button></nav>
      </header>

      <section className="intro">
        <div><p className="eyebrow">THE DAILY SOCCER PUZZLE</p><h1>Who called<br /><em>this</em> game?</h1></div>
        <div className="date-stamp"><strong>ROUND 042</strong><span>Thursday, August 20, 2026</span><b>● LIVE</b></div>
      </section>

      <section className="game-grid">
        <div className="visual-column">
          <div className="match-image">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/C%C3%A1maras_-_Acci%C3%B3n_-_140713-8653-jikatu_%2814479326838%29.jpg/1280px-C%C3%A1maras_-_Acci%C3%B3n_-_140713-8653-jikatu_%2814479326838%29.jpg" alt="Lionel Messi of Argentina runs with the ball against Germany in the 2014 World Cup final" />
            <div className="image-wash" />
            <div className="image-caption"><span>THE MOMENT</span><strong>Can you read the scene?</strong></div>
          </div>
          <div className="hint-row"><span className="hint-icon">?</span><span>One image. Eight calls. No VAR.</span><button type="button">Need a hint? <b>−1 pt</b></button></div>
        </div>

        <div className="answer-panel">
          <div className="panel-heading"><div><p className="eyebrow">QUESTION 0{step + 1} / 08</p><h2>{currentStep.label}</h2></div><div className="score">{submitted ? `${score} / 29` : `${step} / 8`}<small>{submitted ? 'points' : 'progress'}</small></div></div>
          {lastFeedback && !submitted && <div className={`step-feedback ${lastFeedback.correct ? 'correct' : 'incorrect'}`}><strong>{currentStep.type === 'lineups' ? `${lastFeedback.points} / 22 points` : lastFeedback.correct ? 'Correct' : 'Wrong'}</strong><span>{lastFeedback.label} submitted</span></div>}
          <div className="step-question"><p>{currentStep.prompt}</p>{currentStep.key === 'teams' ? <div className="team-inputs"><AutocompleteField label="Home team" value={answers.homeTeam} placeholder="Start typing a team" options={teamOptions} onChange={(value) => updateAnswer('homeTeam', value)} /><AutocompleteField label="Away team" value={answers.awayTeam} placeholder="Start typing a team" options={teamOptions} onChange={(value) => updateAnswer('awayTeam', value)} /></div> : currentStep.key === 'managers' ? <div className="team-inputs"><AutocompleteField label="Home manager" value={answers.homeManager} placeholder="Start typing a manager" options={managerOptions} onChange={(value) => updateAnswer('homeManager', value)} /><AutocompleteField label="Away manager" value={answers.awayManager} placeholder="Start typing a manager" options={managerOptions} onChange={(value) => updateAnswer('awayManager', value)} /></div> : currentStep.type === 'lineups' ? <div className="lineup-inputs"><PlayerAutocomplete label="Germany starting XI" selected={selectedPlayers('homeXI')} placeholder="Type a Germany player" options={germanyPlayers} onAdd={(player) => addPlayer('homeXI', player)} onRemove={(player) => removePlayer('homeXI', player)} /><PlayerAutocomplete label="Argentina starting XI" selected={selectedPlayers('awayXI')} placeholder="Type an Argentina player" options={argentinaPlayers} onAdd={(player) => addPlayer('awayXI', player)} onRemove={(player) => removePlayer('awayXI', player)} /></div> : currentStep.type === 'score' ? <div className="score-controls"><div><span>Germany</span><button type="button" onClick={() => updateGoals('germany', -1)}>-</button><strong>{goalGuess.germany}</strong><button type="button" onClick={() => updateGoals('germany', 1)}>+</button></div><b>−</b><div><span>Argentina</span><button type="button" onClick={() => updateGoals('argentina', -1)}>-</button><strong>{goalGuess.argentina}</strong><button type="button" onClick={() => updateGoals('argentina', 1)}>+</button></div></div> : currentStep.type === 'autocomplete' ? <AutocompleteField label={currentStep.label} value={answers[currentStep.key]} placeholder={currentStep.placeholder} options={currentStep.options} onChange={(value) => updateAnswer(currentStep.key, value)} /> : <input className="step-text-input" type="text" value={answers[currentStep.key]} placeholder={currentStep.placeholder} onChange={(event) => updateAnswer(currentStep.key, event.target.value)} />}</div>
          <div className="step-actions"><button className="back-button" type="button" onClick={previousStep} disabled={step === 0}>← Back</button>{step < steps.length - 1 ? <button className="submit-button" type="button" disabled={!currentStepAnswered} onClick={submitStep}>Submit & next <span>→</span></button> : <button className="submit-button" type="button" disabled={!allAnswered} onClick={() => { submitStep(); setSubmitted(true) }}>{submitted ? 'Call submitted ✓' : 'Submit your call'}<span>→</span></button>}</div>
          {submitted && <div className="result"><span>✦</span><div><strong>{score === 29 ? 'Sharp eyes.' : `${score} of 29 points earned.`}</strong><p>{score === 29 ? 'You found today’s full lineup, final score, and goalscorer.' : `Germany XI: ${lineupPoints(answers.homeXI, correctAnswers.homeXI)} / 11. Argentina XI: ${lineupPoints(answers.awayXI, correctAnswers.awayXI)} / 11. Final score: ${answers.finalScore === correctAnswers.finalScore ? 'Correct' : 'Wrong'}. Goalscorer: ${normalizeAnswer(answers.goalscorer) === normalizeAnswer(correctAnswers.goalscorer) ? 'Correct' : 'Wrong'}.`}</p></div><button type="button" onClick={() => { setAnswers(emptyAnswers); setGoalGuess({ germany: 0, argentina: 0 }); setSubmitted(false); setStep(0); setLastFeedback(null) }}>New round</button></div>}
        </div>
      </section>

      <footer><span>icalledgame <b>×</b> soccer edition</span><span>Photo: Jimmy Baikovicius / Wikimedia Commons <i>CC BY-SA 2.0</i></span><span>Daily at 09:00 UTC</span></footer>
    </main>
  )
}

export default App
