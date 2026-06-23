import { useState } from 'react'
import { activeProfile, matchCareers, profileCourses } from './lib/careerMatcher'
import './App.css'

const prompts = [
  'I like AI but do not want to code all day',
  'I want something creative and high paying',
  'I like psychology, design, and tech',
  'I want to work at a startup',
  'I want a technical job that is people-facing',
]

function App() {
  const [message, setMessage] = useState('')
  const [submittedMessage, setSubmittedMessage] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const [selectedRole, setSelectedRole] = useState(null)

  function submitMessage(event) {
    event.preventDefault()
    const nextMessage = message.trim()
    if (!nextMessage) return

    setSubmittedMessage(nextMessage)
    setMessage('')
    setIsThinking(true)
    window.setTimeout(() => {
      setRecommendations(matchCareers(nextMessage))
      setIsThinking(false)
    }, 650)
  }

  if (selectedRole) return <ComparisonView role={selectedRole} onBack={() => setSelectedRole(null)} />

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#explain" aria-label="LinkedIn Career Guide"><span className="brand-mark">in</span><span>Career Guide</span></a>
        <div className="profile-chip"><span className="avatar avatar-jordan">{initials(activeProfile.name)}</span><span>Your profile</span></div>
      </header>

      <section className="explain-layout" id="explain">
        <aside className="profile-orbit">
          <p className="eyebrow">Your starting point</p>
          <h1>Find work that clicks.</h1>
          <p className="intro-copy">Tell us what you want. We match your profile against real role patterns, then show a few directions worth exploring.</p>
          <div className="skill-orbit" aria-label="Your profile skills">
            {activeProfile.skills.map((skill, index) => <span className={`skill-bubble bubble-${index % 5}`} key={skill}>{skill}</span>)}
            <span className="orbit-core">You</span>
          </div>
          <p className="data-note">Using your skills, job history, and LinkedIn Learning activity.</p>
        </aside>

        <section className="conversation-column">
          <div className="chat-frame">
            {!submittedMessage ? <Welcome onPrompt={setMessage} /> : <Conversation message={submittedMessage} isThinking={isThinking} recommendations={recommendations} onCompare={setSelectedRole} />}
          </div>
          <form className="composer" onSubmit={submitMessage}>
            <label htmlFor="career-message">Explain what you&apos;re looking for</label>
            <div className="composer-row">
              <textarea id="career-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="I want to work with robotics, but I do not know what role fits me." rows="2" />
              <button className="send-button" type="submit" disabled={!message.trim()}>Find my fit</button>
            </div>
          </form>
        </section>
      </section>
    </main>
  )
}

function Welcome({ onPrompt }) {
  return <><div className="welcome-message"><span className="assistant-icon" aria-hidden="true">in</span><div><p className="message-label">Career Guide</p><p>What kind of work pulls you in, even if you do not know the title yet?</p></div></div><div className="prompt-area"><p className="prompt-label">Start with a thought</p><div className="prompt-chips">{prompts.map((prompt) => <button type="button" key={prompt} onClick={() => onPrompt(prompt)}>{prompt}</button>)}</div></div></>
}

function Conversation({ message, isThinking, recommendations, onCompare }) {
  return <><div className="message-thread"><div className="user-message">{message}</div><div className="assistant-message"><span className="assistant-icon" aria-hidden="true">in</span><div><p className="message-label">Career Guide</p>{isThinking ? <ThinkingState /> : <p>I checked your profile against the role and course patterns in this LinkedIn dataset.</p>}</div></div></div>{!isThinking && <div className="results"><div className="results-heading"><p className="eyebrow">Your career matches</p><p>Ranked by skill overlap, query relevance, and similar-member paths.</p></div><div className="role-list">{recommendations.map((role) => <RoleCard key={role.title} role={role} onCompare={() => onCompare(role)} />)}</div></div>}</>
}

function ThinkingState() { return <div className="thinking" aria-live="polite"><span></span><span></span><span></span><em>Matching skills, paths, and courses</em></div> }

function RoleCard({ role, onCompare }) {
  return <article className="role-card"><div className="role-topline"><div><p className="role-title">{role.title}</p><p className="role-fit">{role.matchReason}</p></div><div className="readiness"><strong>{role.readiness}%</strong><span>match</span></div></div><div className="skill-groups"><SkillGroup label="You already bring" skills={role.currentSkills} tone="current" /><SkillGroup label="Worth building next" skills={role.missingSkills} tone="missing" /></div><div className="path-row"><span className="avatar avatar-path">{role.initials}</span><p><strong>{role.person}</strong><span>{role.path}</span><em>{role.roleModelCount} sample members have held this role</em></p></div><div className="course-row"><span>Suggested next step</span><strong>{role.course}</strong><button type="button" className="compare-button" onClick={onCompare}>Compare</button></div></article>
}

function SkillGroup({ label, skills, tone }) { return <div className="skill-group"><p>{label}</p><div>{skills.length ? skills.map((skill) => <span className={tone} key={skill}>{skill}</span>) : <span className="missing">New territory</span>}</div></div> }

function ComparisonView({ role, onBack }) {
  return <main className="app-shell comparison-page"><header className="topbar"><a className="brand" href="#comparison"><span className="brand-mark">in</span><span>Career Guide</span></a><button type="button" className="back-button" onClick={onBack}>Back to Explain</button></header><section className="comparison-content" id="comparison"><p className="eyebrow">Comparison page</p><h1>{role.title} is on your map.</h1><p className="comparison-intro">This handoff carries your profile match, role-model signal, and most relevant course into the shared comparison experience.</p><div className="comparison-preview"><div><p>Profile match</p><strong>{role.readiness}%</strong></div><div><p>Build next</p><strong>{role.missingSkills.join(' · ')}</strong></div><div><p>Suggested course</p><strong>{role.course}</strong><span>Completed learning: {profileCourses().join(' · ') || 'None yet'}</span></div></div></section></main>
}

function initials(name) { return name.split(' ').map((part) => part[0]).join('').slice(0, 2) }

export default App
