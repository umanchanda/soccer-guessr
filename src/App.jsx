import { useState } from 'react'
import './App.css'

function App() {
  const emptyAnswers = { teams: '', year: '', player: '', managers: '', homeXI: '', awayXI: '' }
  const [answers, setAnswers] = useState(emptyAnswers)
  const [submitted, setSubmitted] = useState(false)

  const correctAnswers = {
    teams: 'Germany vs Argentina',
    year: '2014',
    player: 'Lionel Messi',
    managers: 'Joachim Löw vs Alejandro Sabella',
    homeXI: 'Neuer; Lahm, Boateng, Hummels, Höwedes; Schweinsteiger, Kramer, Kroos; Özil, Klose, Müller',
    awayXI: 'Romero; Zabaleta, Demichelis, Garay, Rojo; Pérez, Biglia, Mascherano; Lavezzi, Higuaín, Messi',
  }

  const fields = [
    { key: 'teams', label: 'Teams in the match', placeholder: 'Identify both teams', options: ['Germany vs Argentina', 'Brazil vs Germany', 'Spain vs Netherlands', 'France vs Croatia'] },
    { key: 'year', label: 'Year photographed', placeholder: 'When was this taken?', options: ['2014', '2010', '2018', '2022'] },
    { key: 'player', label: 'Player in frame', placeholder: 'Who is the moment about?', options: ['Lionel Messi', 'Mario Götze', 'Thomas Müller', 'Miroslav Klose'] },
    { key: 'managers', label: 'Managers on the touchline', placeholder: 'Identify both managers', options: ['Joachim Löw vs Alejandro Sabella', 'Joachim Löw vs Diego Maradona', 'Pep Guardiola vs José Mourinho', 'Didier Deschamps vs Zlatko Dalić'] },
    { key: 'homeXI', label: 'Starting XI — side 1', placeholder: 'Type the first lineup', type: 'text' },
    { key: 'awayXI', label: 'Starting XI — side 2', placeholder: 'Type the second lineup', type: 'text' },
  ]

  const updateAnswer = (key, value) => {
    setAnswers((current) => ({ ...current, [key]: value }))
    setSubmitted(false)
  }

  const allAnswered = Object.values(answers).every(Boolean)
  const normalizeAnswer = (answer) => answer.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase()
  const score = Object.keys(correctAnswers).filter((key) => normalizeAnswer(answers[key]) === normalizeAnswer(correctAnswers[key])).length

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
            <span className="photo-credit">MARACANÃ / 13 JUL 2014</span>
          </div>
          <div className="hint-row"><span className="hint-icon">?</span><span>One image. Six calls. No VAR.</span><button type="button">Need a hint? <b>−1 pt</b></button></div>
        </div>

        <div className="answer-panel">
          <div className="panel-heading"><div><p className="eyebrow">IDENTIFY THE LINEUP</p><h2>Make your call</h2></div><div className="score">{submitted ? `${score} / 6` : '0 / 6'}<small>locked in</small></div></div>
          <div className="fields">
            {fields.map((field, index) => <label className="answer-field" key={field.key}><span className="field-number">0{index + 1}</span><span className="field-copy"><b>{field.label}</b>{field.type === 'text' ? <input type="text" value={answers[field.key]} placeholder={field.placeholder} onChange={(event) => updateAnswer(field.key, event.target.value)} /> : <select value={answers[field.key]} onChange={(event) => updateAnswer(field.key, event.target.value)}><option value="">{field.placeholder}</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select>}</span><span className="chevron">{field.type === 'text' ? '↵' : '⌄'}</span></label>)}
          </div>
          <button className="submit-button" type="button" disabled={!allAnswered} onClick={() => setSubmitted(true)}>{submitted ? 'Call submitted ✓' : 'Submit your call'}<span>→</span></button>
          {submitted && <div className="result"><span>✦</span><div><strong>{score === 6 ? 'Sharp eyes.' : `${score} of 6 calls landed.`}</strong><p>{score === 6 ? 'You found today’s full lineup. Share your score with the group chat.' : 'The archive has revealed the answer key. Try the round again.'}</p></div><button type="button" onClick={() => { setAnswers(emptyAnswers); setSubmitted(false) }}>New round</button></div>}
        </div>
      </section>

      <footer><span>icalledgame <b>×</b> soccer edition</span><span>Photo: Jimmy Baikovicius / Wikimedia Commons <i>CC BY-SA 2.0</i></span><span>Daily at 09:00 UTC</span></footer>
    </main>
  )
}

export default App
