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
  const [page, setPage] = useState('profile')
  const [selectedRole, setSelectedRole] = useState(null)

  if (selectedRole) return <ComparisonView role={selectedRole} onBack={() => setSelectedRole(null)} />
  if (page === 'discover') return <DiscoverPage onExplain={() => setPage('explain')} onExplore={() => setPage('explore')} onBack={() => setPage('profile')} />
  if (page === 'explore') return <ExploreHandoff onBack={() => setPage('discover')} />
  if (page === 'explain') return <ExplainPage onBack={() => setPage('discover')} onCompare={setSelectedRole} />
  return <ProfileEntry onLockIn={() => setPage('discover')} />
}

function ProfileEntry({ onLockIn }) {
  return <main className="app-shell profile-page"><header className="topbar"><a className="brand" href="#profile"><span className="brand-mark">in</span><span>LinkedIn</span></a><button type="button" className="lock-button" onClick={onLockIn}>Lock In</button></header><section className="profile-entry"><div className="profile-cover"></div><div className="profile-card"><span className="entry-avatar">{initials(activeProfile.name)}</span><div className="profile-heading"><div><h1>{activeProfile.name}</h1><p>{activeProfile.school_history?.[0]?.degree || 'Career Explorer'} · {activeProfile.current_location}</p></div><button type="button" className="lock-button lock-button-inline" onClick={onLockIn}>Lock In</button></div><p className="profile-tagline">Exploring where my skills and curiosity can take me.</p><section className="profile-section"><p className="section-label">Skills</p><div className="interest-list">{activeProfile.skills.slice(0, 7).map((skill) => <span key={skill}>{skill}</span>)}</div></section></div><aside className="lock-callout"><span className="assistant-icon" aria-hidden="true">in</span><p><strong>Career discovery, built around you.</strong><span>Find paths that fit what you already know and what you want next.</span></p></aside></section></main>
}

function DiscoverPage({ onExplain, onExplore, onBack }) {
  return <main className="app-shell discovery-page"><header className="topbar"><a className="brand" href="#discover"><span className="brand-mark">in</span><span>Career Guide</span></a><button type="button" className="back-button" onClick={onBack}>Back to profile</button></header><section className="discovery-content"><p className="eyebrow">Career discovery</p><h1>Where do you want to start?</h1><p className="discovery-copy">Browse paths you have not seen before, or tell us what you want in your own words.</p><div className="choice-grid"><button type="button" className="choice-card explore-choice" onClick={onExplore}><span className="choice-mark">01</span><strong>Explore</strong><p>Browse fields, role clusters, and people whose work could surprise you.</p><span className="choice-action">Browse careers</span></button><button type="button" className="choice-card explain-choice" onClick={onExplain}><span className="choice-mark">02</span><strong>Explain</strong><p>Describe your interests, goals, or uncertainty. We will find role patterns that fit.</p><span className="choice-action">Tell us what you want</span></button></div></section></main>
}

function ExploreHandoff({ onBack }) {
  return <main className="app-shell handoff-page"><header className="topbar"><a className="brand" href="#explore"><span className="brand-mark">in</span><span>Career Guide</span></a><button type="button" className="back-button" onClick={onBack}>Back</button></header><section className="handoff-content"><p className="eyebrow">Explore</p><h1>Explore is ready for the shared career map.</h1><p>This route is reserved for the Explore experience. The Explain flow remains available from the discovery page.</p><button type="button" className="lock-button" onClick={onBack}>Choose another path</button></section></main>
}

function ExplainPage({ onBack, onCompare }) {
  const [message, setMessage] = useState('')
  const [submittedMessage, setSubmittedMessage] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [recommendations, setRecommendations] = useState([])

  function submitMessage(event) {
    event.preventDefault()
    const nextMessage = message.trim()
    if (!nextMessage) return
    setSubmittedMessage(nextMessage)
    setMessage('')
    setIsThinking(true)
    window.setTimeout(() => { setRecommendations(matchCareers(nextMessage)); setIsThinking(false) }, 650)
  }

  return <main className="app-shell"><header className="topbar"><a className="brand" href="#explain"><span className="brand-mark">in</span><span>Career Guide</span></a><button type="button" className="back-button" onClick={onBack}>Back to discovery</button></header><section className="explain-layout"><aside className="interests-panel"><p className="eyebrow">Your interests</p><h1>Start with what pulls you in.</h1><div className="interest-list">{activeProfile.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><p className="data-note">Based on the skills and activity already on your profile.</p></aside><section className="conversation-column"><div className="chat-frame">{!submittedMessage ? <Welcome onPrompt={setMessage} /> : <Conversation message={submittedMessage} isThinking={isThinking} recommendations={recommendations} onCompare={onCompare} />}</div><form className="composer" onSubmit={submitMessage}><label htmlFor="career-message">Explain what you&apos;re looking for</label><div className="composer-row"><textarea id="career-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="I want to work with robotics, but I do not know what role fits me." rows="2" /><button className="send-button" type="submit" disabled={!message.trim()}>Find my fit</button></div></form></section></section></main>
}

function Welcome({ onPrompt }) { return <><div className="welcome-message"><span className="assistant-icon" aria-hidden="true">in</span><div><p className="message-label">Career Guide</p><p>What kind of work pulls you in, even if you do not know the title yet?</p></div></div><div className="prompt-area"><p className="prompt-label">Start with a thought</p><div className="prompt-chips">{prompts.map((prompt) => <button type="button" key={prompt} onClick={() => onPrompt(prompt)}>{prompt}</button>)}</div></div></> }

function Conversation({ message, isThinking, recommendations, onCompare }) { return <><div className="message-thread"><div className="user-message">{message}</div><div className="assistant-message"><span className="assistant-icon" aria-hidden="true">in</span><div><p className="message-label">Career Guide</p>{isThinking ? <ThinkingState /> : <p>I checked your profile against the role and course patterns in this LinkedIn dataset.</p>}</div></div></div>{!isThinking && <div className="results"><div className="results-heading"><p className="eyebrow">Your career matches</p><p>Ranked by skill overlap, query relevance, and similar-member paths.</p></div><div className="role-list">{recommendations.map((role) => <RoleCard key={role.title} role={role} onCompare={() => onCompare(role)} />)}</div></div>}</> }
function ThinkingState() { return <div className="thinking" aria-live="polite"><span></span><span></span><span></span><em>Matching skills, paths, and courses</em></div> }
function RoleCard({ role, onCompare }) { return <article className="role-card"><div className="role-topline"><div><p className="role-title">{role.title}</p><p className="role-fit">{role.matchReason}</p></div><div className="readiness"><strong>{role.readiness}%</strong><span>match</span></div></div><div className="skill-groups"><SkillGroup label="You already bring" skills={role.currentSkills} tone="current" /><SkillGroup label="Worth building next" skills={role.missingSkills} tone="missing" /></div><div className="path-row"><span className="avatar avatar-path">{role.initials}</span><p><strong>{role.person}</strong><span>{role.path}</span><em>{role.roleModelCount} sample members have held this role</em></p></div><div className="course-row"><span>Suggested next step</span><strong>{role.course}</strong><button type="button" className="compare-button" onClick={onCompare}>Compare</button></div></article> }
function SkillGroup({ label, skills, tone }) { return <div className="skill-group"><p>{label}</p><div>{skills.length ? skills.map((skill) => <span className={tone} key={skill}>{skill}</span>) : <span className="missing">New territory</span>}</div></div> }
function ComparisonView({ role, onBack }) { return <main className="app-shell comparison-page"><header className="topbar"><a className="brand" href="#comparison"><span className="brand-mark">in</span><span>Career Guide</span></a><button type="button" className="back-button" onClick={onBack}>Back to Explain</button></header><section className="comparison-content"><p className="eyebrow">Comparison page</p><h1>{role.title} is on your map.</h1><p className="comparison-intro">This handoff carries your profile match, role-model signal, and most relevant course into the shared comparison experience.</p><div className="comparison-preview"><div><p>Profile match</p><strong>{role.readiness}%</strong></div><div><p>Build next</p><strong>{role.missingSkills.join(' · ')}</strong></div><div><p>Suggested course</p><strong>{role.course}</strong><span>Completed learning: {profileCourses().join(' · ') || 'None yet'}</span></div></div></section></main> }
function initials(name) { return name.split(' ').map((part) => part[0]).join('').slice(0, 2) }

export default App
