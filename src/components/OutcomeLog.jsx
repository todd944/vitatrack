import { useState } from 'react'
import { LogIcon } from './icons'
import SupplementHistory from './SupplementHistory'
import OutcomeChart from './OutcomeChart'
import { todayKey } from '../lib/date'
import FirstTimeHint from './FirstTimeHint'

export default function OutcomeLog({ outcomes, onAddOutcome, userSupplements, supplements, log, seenHints, onDismissHint }) {
  const [mood, setMood] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [notes, setNotes] = useState('')

  return (
    <div style={{ padding: 16 }}>
      <h2><LogIcon className="section-icon" />Log</h2>
      <FirstTimeHint id="outcomes" seenHints={seenHints} onDismiss={onDismissHint}>
        See adherence streaks and a day-by-day history for everything you've scheduled below. Mood and
        energy tracking is optional — expand "How are you feeling?" if you want to log it.
      </FirstTimeHint>

      <SupplementHistory userSupplements={userSupplements} supplements={supplements} log={log} />

      {/* Collapsed by default — daily manual mood/energy logging is a
          feature people tend to try a few times and then stop using, and
          it was previously the first thing on this screen regardless of
          whether anyone wanted it. Adherence history above is the part
          everyone gets value from; this is opt-in for people who want it. */}
      <details style={{ marginTop: 24 }}>
        <summary style={{ cursor: 'pointer', fontSize: 16, fontWeight: 600, color: 'var(--brand-deep)' }}>
          How are you feeling? (optional)
        </summary>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 8 }}>
          A quick daily log so patterns become visible over time. This is for
          your own reference — it isn't analyzed or diagnosed by the app.
        </p>
        <div className="card">
          <label style={{ display: 'block', marginBottom: 12 }}>
            Mood ({mood}/5)
            <input type="range" min="1" max="5" value={mood} onChange={(e) => setMood(+e.target.value)} style={{ width: '100%' }} />
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Energy ({energy}/5)
            <input type="range" min="1" max="5" value={energy} onChange={(e) => setEnergy(+e.target.value)} style={{ width: '100%' }} />
          </label>
          <textarea
            placeholder="Any symptoms or notes today..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', minHeight: 70, padding: 8, border: '1px solid var(--line)', borderRadius: 6 }}
          />
          <button
            className="btn-primary"
            style={{ marginTop: 8 }}
            onClick={() => {
              onAddOutcome({ date: todayKey(), mood, energy, notes })
              setNotes('')
            }}
          >
            Log today
          </button>
        </div>

        <OutcomeChart outcomes={outcomes} log={log} userSupplements={userSupplements} supplements={supplements} />

        {outcomes.length > 0 && (
          <>
            <h3 style={{ marginTop: 24 }}>Recent entries</h3>
            {outcomes.slice().reverse().slice(0, 3).map((o, i) => (
              <div key={i} className="card">
                <div className="source-cite">{o.date}</div>
                <p style={{ margin: '4px 0' }}>Mood {o.mood}/5 · Energy {o.energy}/5</p>
                {o.notes && <p style={{ margin: 0, fontSize: 14 }}>{o.notes}</p>}
              </div>
            ))}
          </>
        )}
      </details>
    </div>
  )
}
