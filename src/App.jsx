import { useState } from 'react'
import './App.css'

function App() {
  const [answers, setAnswers] = useState({ home: '', away: '', player: '', homeCoach: '', awayCoach: '' })
  const [submitted, setSubmitted] = useState(false)

  const correctAnswers = { home: 'Germany', away: 'Argentina', player: 'Lionel Messi', homeCoach: 'Joachim Löw', awayCoach: 'Alejandro Sabella' }

  const fields = [
    { key: 'home', label: 'Home team', placeholder: 'Pick the home side', options: ['Germany', 'Brazil', 'Spain', 'France'] },
    { key: 'away', label: 'Away team', placeholder: 'Pick the away side', options: ['Argentina', 'Netherlands', 'Italy', 'Portugal'] },
    { key: 'player', label: 'Player in frame', placeholder: 'Who is the moment about?', options: ['Lionel Messi', 'Mario Götze', 'Thomas Müller', 'Miroslav Klose'] },
    { key: 'homeCoach', label: 'Home coach', placeholder: 'Who led the home side?', options: ['Joachim Löw', 'Jürgen Klinsmann', 'Pep Guardiola', 'Hansi Flick'] },
    { key: 'awayCoach', label: 'Away coach', placeholder: 'Who led the visitors?', options: ['Alejandro Sabella', 'Diego Maradona', 'Jorge Sampaoli', 'Marcelo Bielsa'] },
  ]

  const updateAnswer = (key, value) => {
    setAnswers((current) => ({ ...current, [key]: value }))
    setSubmitted(false)
  }

  const allAnswered = Object.values(answers).every(Boolean)
  const score = Object.keys(correctAnswers).filter((key) => answers[key] === correctAnswers[key]).length

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
          <div className="hint-row"><span className="hint-icon">?</span><span>One image. Four calls. No VAR.</span><button type="button">Need a hint? <b>−1 pt</b></button></div>
        </div>

        <div className="answer-panel">
          <div className="panel-heading"><div><p className="eyebrow">IDENTIFY THE LINEUP</p><h2>Make your call</h2></div><div className="score">{submitted ? `${score} / 5` : '0 / 5'}<small>locked in</small></div></div>
          <div className="fields">
            {fields.map((field, index) => <label className="answer-field" key={field.key}><span className="field-number">0{index + 1}</span><span className="field-copy"><b>{field.label}</b><select value={answers[field.key]} onChange={(event) => updateAnswer(field.key, event.target.value)}><option value="">{field.placeholder}</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select></span><span className="chevron">⌄</span></label>)}
          </div>
          <button className="submit-button" type="button" disabled={!allAnswered} onClick={() => setSubmitted(true)}>{submitted ? 'Call submitted ✓' : 'Submit your call'}<span>→</span></button>
          {submitted && <div className="result"><span>✦</span><div><strong>{score === 5 ? 'Sharp eyes.' : `${score} of 5 calls landed.`}</strong><p>{score === 5 ? 'You found today’s full lineup. Share your score with the group chat.' : 'The archive has revealed the answer key. Try the round again.'}</p></div><button type="button" onClick={() => { setAnswers({ home: '', away: '', player: '', homeCoach: '', awayCoach: '' }); setSubmitted(false) }}>New round</button></div>}
        </div>
      </section>

      <footer><span>icalledgame <b>×</b> soccer edition</span><span>Photo: Jimmy Baikovicius / Wikimedia Commons <i>CC BY-SA 2.0</i></span><span>Daily at 09:00 UTC</span></footer>
    </main>
  )
}

export default App
