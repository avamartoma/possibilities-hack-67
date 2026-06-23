import { useState } from 'react'
import './App.css'

const prompts = [
  'I like AI but do not want to code all day',
  'I want something creative and high paying',
  'I like psychology, design, and tech',
  'I want to work at a startup',
  'I want a technical job that is people-facing',
]

const rolePools = {
  technicalPeople: [
  {
    title: 'Solutions Engineer',
    readiness: 72,
    fit: 'You get to stay close to technology while helping people solve concrete problems.',
    currentSkills: ['Python', 'Research', 'Communication'],
    missingSkills: ['Cloud platforms', 'Technical demos'],
    person: 'Anika Srivastava',
    path: 'Psychology major to customer research intern to Solutions Engineer at a climate software company.',
    initials: 'AS',
  },
  {
    title: 'Product Manager',
    readiness: 64,
    fit: 'Your research mindset and interest in people make you well positioned to turn ambiguous needs into product direction.',
    currentSkills: ['Research', 'Data analysis', 'Writing'],
    missingSkills: ['Product strategy', 'Experiment design'],
    person: 'Mateo Alvarez',
    path: 'Campus lab researcher to Associate PM, building developer tools for a growing startup.',
    initials: 'MA',
  },
  {
    title: 'Developer Advocate',
    readiness: 57,
    fit: 'This role mixes technical depth, teaching, and community work instead of keeping you behind a screen all day.',
    currentSkills: ['Python', 'Research', 'Storytelling'],
    missingSkills: ['Public speaking', 'API fundamentals'],
    person: 'Rina Okafor',
    path: 'Data science student to open-source contributor to Developer Advocate in AI tooling.',
    initials: 'RO',
  },
  ],
  creative: [
    {
      title: 'UX Researcher', readiness: 69,
      fit: 'You can use curiosity about people to shape better products without having to become a full-time engineer.',
      currentSkills: ['Research', 'Communication', 'Psychology'], missingSkills: ['Interview design', 'Usability testing'],
      person: 'Nadia Chen', path: 'Psychology student to research assistant to UX Researcher for a consumer health product.', initials: 'NC',
    },
    {
      title: 'Product Designer', readiness: 51,
      fit: 'This combines creative problem solving with the practical work of making digital products easier to use.',
      currentSkills: ['Research', 'Storytelling', 'Curious builder'], missingSkills: ['Figma', 'Interaction design'],
      person: 'Luca Bennett', path: 'Student newspaper designer to product design intern to Product Designer at a travel startup.', initials: 'LB',
    },
    {
      title: 'Content Designer', readiness: 63,
      fit: 'You would turn complex technology into clear, useful language for real people.',
      currentSkills: ['Writing', 'Research', 'Communication'], missingSkills: ['Content systems', 'UX writing'],
      person: 'Priya Desai', path: 'Campus editor to technical writer to Content Designer for a financial tools team.', initials: 'PD',
    },
  ],
  startup: [
    {
      title: 'Associate Product Manager', readiness: 66,
      fit: 'Early-stage teams need people who can investigate customer problems and turn them into focused product work.',
      currentSkills: ['Research', 'Data analysis', 'Writing'], missingSkills: ['Product discovery', 'Prioritization'],
      person: 'Maya Solberg', path: 'Lab researcher to startup operations intern to Associate Product Manager at a developer tools company.', initials: 'MS',
    },
    {
      title: 'Founder Associate', readiness: 58,
      fit: 'This is broad, high-ownership work for someone who wants to learn how a startup operates across product, customers, and growth.',
      currentSkills: ['Curious builder', 'Research', 'Communication'], missingSkills: ['Market research', 'Operations'],
      person: 'Elias Romero', path: 'Student consulting lead to Founder Associate, supporting product launches and customer interviews.', initials: 'ER',
    },
    {
      title: 'Growth Analyst', readiness: 61,
      fit: 'You can use data to find what makes a product grow while staying connected to customer behavior and experimentation.',
      currentSkills: ['Data analysis', 'Research', 'Python'], missingSkills: ['Growth experiments', 'SQL'],
      person: 'Talia Morgan', path: 'Data club organizer to growth intern to Growth Analyst at a marketplace startup.', initials: 'TM',
    },
  ],
  aiData: [
    {
      title: 'Applied AI Product Specialist', readiness: 67,
      fit: 'You can work close to AI systems while translating user needs into practical product decisions.',
      currentSkills: ['Python', 'Research', 'Data analysis'], missingSkills: ['AI evaluation', 'Product strategy'],
      person: 'Jules Akande', path: 'Research intern to AI operations analyst to Applied AI Product Specialist in education technology.', initials: 'JA',
    },
    {
      title: 'Data Scientist', readiness: 62,
      fit: 'Your existing Python and research signals are a solid base for using data to answer high-value business questions.',
      currentSkills: ['Python', 'Data analysis', 'Research'], missingSkills: ['Statistics', 'SQL'],
      person: 'Sofia Calder', path: 'Biology researcher to analytics intern to Data Scientist for a climate intelligence team.', initials: 'SC',
    },
    {
      title: 'Machine Learning Engineer', readiness: 48,
      fit: 'A more technical AI path, with a clear skill tree from your current Python foundation.',
      currentSkills: ['Python', 'Data analysis', 'Curious builder'], missingSkills: ['Machine learning', 'Model deployment'],
      person: 'Omar Wren', path: 'Computer science student to ML research assistant to Machine Learning Engineer in robotics.', initials: 'OW',
    },
  ],
}

function getCareerResponse(message) {
  const text = message.toLowerCase()

  if (/(creative|design|art|write|writing|psychology)/.test(text)) {
    return { roles: rolePools.creative, lead: 'Your interest in people and creativity points toward roles that turn research into experiences people can understand.' }
  }
  if (/(startup|founder|business|entrepreneur|fast-paced|growth)/.test(text)) {
    return { roles: rolePools.startup, lead: 'You seem drawn to high-ownership work, where learning quickly and working across functions matters.' }
  }
  if (/(ai|robot|robotics|data|machine learning|ml|science)/.test(text)) {
    return { roles: rolePools.aiData, lead: 'Your interest in technical problem solving can lead to AI and data work with different levels of coding depth.' }
  }
  return { roles: rolePools.technicalPeople, lead: 'I found directions that combine your profile signals with the kind of work you described.' }
}

function App() {
  const [message, setMessage] = useState('')
  const [submittedMessage, setSubmittedMessage] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [recommendations, setRecommendations] = useState(rolePools.technicalPeople)
  const [responseLead, setResponseLead] = useState('')

  function submitMessage(event) {
    event.preventDefault()
    const nextMessage = message.trim()
    if (!nextMessage) return

    setSubmittedMessage(nextMessage)
    const response = getCareerResponse(nextMessage)
    setRecommendations(response.roles)
    setResponseLead(response.lead)
    setMessage('')
    setIsThinking(true)
    window.setTimeout(() => setIsThinking(false), 700)
  }

  function applyPrompt(prompt) {
    setMessage(prompt)
  }

  if (selectedRole) {
    return <ComparisonView role={selectedRole} onBack={() => setSelectedRole(null)} />
  }

  const hasResults = Boolean(submittedMessage) && !isThinking

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#explain" aria-label="LinkedIn Career Discovery home">
          <span className="brand-mark">in</span>
          <span>Career Discovery</span>
        </a>
        <div className="profile-chip" aria-label="Current profile: Jordan Lee">
          <span className="avatar avatar-jordan">JL</span>
          <span>Jordan Lee</span>
        </div>
      </header>

      <section className="explain-layout" id="explain">
        <div className="intro-column">
          <p className="eyebrow">Career discovery</p>
          <h1>Explain what you&apos;re looking for.</h1>
          <p className="intro-copy">
            Describe your interests, goals, personality, or career confusion. We&apos;ll connect the dots between what you enjoy and the work that could fit.
          </p>
          <div className="signal-panel">
            <p className="signal-label">Your profile signals</p>
            <div className="signal-list">
              <span>Python</span><span>Research</span><span>Data analysis</span><span>Curious builder</span>
            </div>
          </div>
        </div>

        <div className="conversation-column">
          <div className="chat-frame">
            {!submittedMessage && (
              <div className="welcome-message">
                <span className="assistant-icon" aria-hidden="true">in</span>
                <div>
                  <p className="message-label">Career Guide</p>
                  <p>What kind of work are you drawn to, even if you do not know the job title yet?</p>
                </div>
              </div>
            )}

            {submittedMessage && (
              <div className="message-thread">
                <div className="user-message">{submittedMessage}</div>
                <div className="assistant-message">
                  <span className="assistant-icon" aria-hidden="true">in</span>
                  <div>
                    <p className="message-label">Career Guide</p>
                    {isThinking ? <ThinkingState /> : <p>{responseLead}</p>}
                  </div>
                </div>
              </div>
            )}

            {hasResults && (
              <div className="results">
                <div className="results-heading">
                  <p className="eyebrow">Potential directions</p>
                  <p>Based on your profile and what you shared</p>
                </div>
                <div className="role-list">
                  {recommendations.map((role) => (
                    <RoleCard key={role.title} role={role} onCompare={() => setSelectedRole(role)} />
                  ))}
                </div>
              </div>
            )}

            {!submittedMessage && (
              <div className="prompt-area">
                <p className="prompt-label">Try one of these</p>
                <div className="prompt-chips">
                  {prompts.map((prompt) => <button type="button" key={prompt} onClick={() => applyPrompt(prompt)}>{prompt}</button>)}
                </div>
              </div>
            )}
          </div>

          <form className="composer" onSubmit={submitMessage}>
            <label htmlFor="career-message">Tell us what is on your mind</label>
            <div className="composer-row">
              <textarea id="career-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="For example: I want to work with robotics, but I do not know which role is right for me." rows="2" />
              <button className="send-button" type="submit" disabled={!message.trim()}>Send</button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}

function ThinkingState() {
  return <div className="thinking" aria-live="polite"><span></span><span></span><span></span><em>Looking at your profile signals</em></div>
}

function RoleCard({ role, onCompare }) {
  return (
    <article className="role-card">
      <div className="role-topline">
        <div>
          <p className="role-title">{role.title}</p>
          <p className="role-fit">{role.fit}</p>
        </div>
        <div className="readiness"><strong>{role.readiness}%</strong><span>ready</span></div>
      </div>
      <div className="skill-groups">
        <SkillGroup label="You already bring" skills={role.currentSkills} tone="current" />
        <SkillGroup label="Worth building next" skills={role.missingSkills} tone="missing" />
      </div>
      <div className="role-footer">
        <div className="path-person">
          <span className="avatar avatar-path">{role.initials}</span>
          <p><strong>{role.person}</strong><span>{role.path}</span></p>
        </div>
        <button type="button" className="compare-button" onClick={onCompare}>Compare this role</button>
      </div>
    </article>
  )
}

function SkillGroup({ label, skills, tone }) {
  return <div className="skill-group"><p>{label}</p><div>{skills.map((skill) => <span className={tone} key={skill}>{skill}</span>)}</div></div>
}

function ComparisonView({ role, onBack }) {
  return (
    <main className="app-shell comparison-page">
      <header className="topbar">
        <a className="brand" href="#comparison" aria-label="LinkedIn Career Discovery"><span className="brand-mark">in</span><span>Career Discovery</span></a>
        <button type="button" className="back-button" onClick={onBack}>Back to Explain</button>
      </header>
      <section className="comparison-content" id="comparison">
        <p className="eyebrow">Comparison page</p>
        <h1>{role.title} could be a strong direction.</h1>
        <p className="comparison-intro">This is the handoff into the shared role-comparison experience. Your selected role and profile signals are ready to compare against other options.</p>
        <div className="comparison-preview">
          <div><p>Current readiness</p><strong>{role.readiness}%</strong></div>
          <div><p>Skills to build</p><strong>{role.missingSkills.join(' · ')}</strong></div>
          <div><p>Example path</p><strong>{role.person}</strong><span>{role.path}</span></div>
        </div>
      </section>
    </main>
  )
}

export default App
