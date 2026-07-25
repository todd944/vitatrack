import { useState } from 'react'
import HealthProfileForm, { DEFAULT_PROFILE } from './HealthProfileForm'

// Exported so Profile can reuse the same list to let people change their
// goal later — this used to only ever be set once, during onboarding.
export const GOALS = [
  { id: 'bodybuilding', label: 'Muscle building / athletic performance' },
  { id: 'weight_loss', label: 'Weight loss' },
  { id: 'maintenance', label: 'Filling specific nutrient gaps' },
  { id: 'general', label: 'General wellness / everyday health' },
]

const linkStyle = { background: 'none', border: 'none', color: 'var(--brand)', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }

export default function Onboarding({ onComplete, onShowLegal }) {
  const [step, setStep] = useState(0)
  const [consented, setConsented] = useState(false)
  const [healthDataConsented, setHealthDataConsented] = useState(false)
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [goal, setGoal] = useState(null)

  if (step === 0) {
    return (
      <div className="card" style={{ margin: 16 }}>
        <h2>Before you start</h2>
        <p style={{ color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          VitaTrack helps you schedule and track vitamins and supplements, and
          flags well-documented interaction concerns with medications you tell
          it about.
        </p>
        <p style={{ color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          <strong>It is not a substitute for medical advice.</strong> It doesn't
          diagnose anything, and it doesn't tell you what to take or how much.
          Always confirm decisions about supplements and medications with your
          doctor or pharmacist.
        </p>
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '16px 0' }}>
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            style={{ marginTop: 4 }}
          />
          <span>I understand this app is a tracking tool, not medical advice.</span>
        </label>
        <p className="source-cite">
          By continuing you agree to the{' '}
          <button type="button" style={linkStyle} onClick={() => onShowLegal('terms')}>Terms of Service</button>
          {' '}and{' '}
          <button type="button" style={linkStyle} onClick={() => onShowLegal('privacy')}>Privacy Policy</button>.
        </p>
        <button className="btn-primary" disabled={!consented} onClick={() => setStep(1)}>
          Continue
        </button>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="card" style={{ margin: 16 }}>
        <h2>A bit about you</h2>
        <p style={{ color: 'var(--ink-soft)' }}>
          This personalizes recommended amounts and upper-limit warnings — it doesn't change any safety information for anyone else.
        </p>
        <HealthProfileForm profile={profile} onChange={setProfile} />
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '4px 0 16px' }}>
          <input
            type="checkbox"
            checked={healthDataConsented}
            onChange={(e) => setHealthDataConsented(e.target.checked)}
            style={{ marginTop: 4 }}
          />
          <span>
            I consent to providing this health information (sex, age, pregnancy/lactation status, and
            health conditions) so the app can personalize amounts and safety flags. See the{' '}
            <button type="button" style={linkStyle} onClick={() => onShowLegal('privacy')}>Privacy Policy</button>
            {' '}for details.
          </span>
        </label>
        <button className="btn-primary" disabled={!healthDataConsented} onClick={() => setStep(2)}>
          Continue
        </button>
      </div>
    )
  }

  return (
    <div className="card" style={{ margin: 16 }}>
      <h2>What's your main goal?</h2>
      <p style={{ color: 'var(--ink-soft)' }}>
        This just tailors which supplements we surface first — it doesn't change any safety information.
      </p>
      <div style={{ display: 'grid', gap: 8, margin: '16px 0' }}>
        {GOALS.map((g) => (
          <button
            key={g.id}
            className="btn-secondary"
            style={{
              textAlign: 'left',
              borderColor: goal === g.id ? 'var(--brand)' : 'var(--line)',
              color: goal === g.id ? 'var(--brand)' : 'var(--ink)',
            }}
            onClick={() => setGoal(g.id)}
          >
            {g.label}
          </button>
        ))}
      </div>
      <button className="btn-primary" disabled={!goal} onClick={() => onComplete({ goal, profile })}>
        Finish setup
      </button>
    </div>
  )
}
