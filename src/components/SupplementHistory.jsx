import { useState } from 'react'
import { computeStreak, computeMonthlyAdherence, recentDayStrip } from '../lib/adherence'

export default function SupplementHistory({ userSupplements, supplements, log }) {
  const [filterId, setFilterId] = useState('all')

  if (userSupplements.length === 0) {
    return (
      <>
        <h3 style={{ marginTop: 24 }}>Supplement history</h3>
        <div className="card">Add supplements from the Library tab to start tracking your history.</div>
      </>
    )
  }

  const rows = userSupplements
    .map((us) => ({
      us,
      s: supplements.find((sp) => sp.id === us.id),
      streak: computeStreak(us, log),
      monthly: computeMonthlyAdherence(us, log),
      strip: recentDayStrip(us, log),
    }))
    .filter((r) => filterId === 'all' || r.us.id === filterId)
    .sort((a, b) => b.streak - a.streak)

  return (
    <>
      <h3 style={{ marginTop: 24 }}>Supplement history</h3>
      <select
        value={filterId}
        onChange={(e) => setFilterId(e.target.value)}
        style={{ width: '100%', padding: 8, border: '1px solid var(--line)', borderRadius: 6, marginBottom: 12, fontSize: 14 }}
      >
        <option value="all">All supplements</option>
        {userSupplements.map((us) => {
          const s = supplements.find((sp) => sp.id === us.id)
          return <option key={us.id} value={us.id}>{s?.name}</option>
        })}
      </select>

      {rows.map(({ us, s, streak, monthly, strip }) => (
        <div key={us.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <strong>{s?.name}</strong>
            {streak > 0 ? (
              <span className="pill" style={{ color: 'var(--safe)', borderColor: 'var(--safe)', whiteSpace: 'nowrap' }}>
                🔥 {streak}-day streak
              </span>
            ) : (
              <span className="source-cite">No current streak</span>
            )}
          </div>
          <p style={{ margin: '8px 0 4px', fontSize: 13, color: 'var(--ink-soft)' }}>
            {monthly.pct != null
              ? `${monthly.pct}% taken this month (${monthly.takenCount} of ${monthly.scheduledCount} scheduled days)`
              : 'No scheduled days yet this month'}
          </p>
          <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
            {strip.map(({ date, scheduled, taken }, i) => (
              <div
                key={i}
                title={`${date.toDateString()}${!scheduled ? ' — not scheduled' : taken ? ' — taken' : ' — missed'}`}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: !scheduled ? 'var(--paper)' : taken ? 'var(--safe)' : 'var(--danger-bg)',
                  border: !scheduled ? '1px solid var(--line)' : taken ? 'none' : '1px solid var(--danger)',
                }}
              />
            ))}
          </div>
          <p className="source-cite" style={{ marginTop: 6 }}>Last 14 days — green = taken, red = missed, blank = not scheduled</p>
        </div>
      ))}
    </>
  )
}
