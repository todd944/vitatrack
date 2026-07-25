import { useState } from 'react'
import { scheduledOn, getDayFlags } from '../lib/conflicts'
import { dateKey, formatTime } from '../lib/date'
import { CalendarIcon } from './icons'
import FirstTimeHint from './FirstTimeHint'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function sameDay(a, b) {
  return dateKey(a) === dateKey(b)
}

export default function Calendar({ supplements, userSupplements, medications, profile, log, onMarkTaken, onEditSupplement, seenHints, onDismissHint }) {
  const [view, setView] = useState('day')
  const [selectedDate, setSelectedDate] = useState(new Date())

  const goToDay = (date) => {
    setSelectedDate(date)
    setView('day')
  }

  return (
    <div style={{ padding: 16 }}>
      <FirstTimeHint id="calendar" seenHints={seenHints} onDismiss={onDismissHint}>
        <strong>This is your Today screen.</strong> Switch between Daily and Monthly above. Tap "Mark taken" as
        you take each item, or tap a scheduled supplement to jump back and edit its days, dosage, or reminders.
      </FirstTimeHint>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}><CalendarIcon className="section-icon" />Schedule</h2>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className={view === 'day' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: 13 }}
            onClick={() => setView('day')}
          >
            Daily
          </button>
          <button
            className={view === 'month' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: 13 }}
            onClick={() => setView('month')}
          >
            Monthly
          </button>
        </div>
      </div>

      {view === 'day' ? (
        <DayView
          supplements={supplements}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          userSupplements={userSupplements}
          medications={medications}
          profile={profile}
          log={log}
          onMarkTaken={onMarkTaken}
          onEditSupplement={onEditSupplement}
        />
      ) : (
        <MonthView
          supplements={supplements}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          userSupplements={userSupplements}
          medications={medications}
          profile={profile}
          onSelectDay={goToDay}
        />
      )}
    </div>
  )
}

function DayView({ supplements, selectedDate, onChangeDate, userSupplements, medications, profile, log, onMarkTaken, onEditSupplement }) {
  const today = new Date()
  const isToday = sameDay(selectedDate, today)
  const key = dateKey(selectedDate)
  const takenForDay = log[key] || {}
  const scheduled = userSupplements.filter((u) => scheduledOn(u, selectedDate))
  const takenCount = scheduled.filter((u) => takenForDay[u.id]).length
  const { reasons } = getDayFlags(selectedDate, { userSupplements, medications, profile, supplements })

  const shiftDay = (delta) => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + delta)
    onChangeDate(next)
  }

  // Marks every not-yet-taken item for this day in one pass. onMarkTaken
  // toggles per-item via a functional state update, so firing it once per
  // remaining item here is safe — each call sees the latest state rather
  // than a stale snapshot from before this loop started.
  const takeAll = () => {
    scheduled.forEach((u) => {
      if (!takenForDay[u.id]) onMarkTaken(key, u.id)
    })
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => shiftDay(-1)}>‹</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600 }}>{selectedDate.toDateString()}</div>
          {!isToday && (
            <button
              className="source-cite"
              style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', padding: 0 }}
              onClick={() => onChangeDate(new Date())}
            >
              Jump to today
            </button>
          )}
        </div>
        <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => shiftDay(1)}>›</button>
      </div>

      {scheduled.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 4 }}>
            <span>{takenCount} of {scheduled.length} taken</span>
            {takenCount === scheduled.length ? (
              <span style={{ color: 'var(--safe)', fontWeight: 600 }}>All done for today ✓</span>
            ) : (
              <button
                type="button"
                onClick={takeAll}
                style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Take all
              </button>
            )}
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(takenCount / scheduled.length) * 100}%`,
                background: 'var(--safe)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {reasons.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {reasons.map((r, i) => (
            <div key={i} className={`card severity-${r.severity}`} style={{ padding: 10, marginBottom: 6 }}>
              {r.text}
            </div>
          ))}
        </div>
      )}

      {scheduled.length === 0 && (
        <div className="card">
          <p>Nothing scheduled for this day. Add supplements from the Library tab and choose which days they're taken.</p>
        </div>
      )}

      {scheduled.map((u) => {
        const s = supplements.find((sp) => sp.id === u.id)
        const taken = !!takenForDay[u.id]
        return (
          <div
            key={u.id}
            className="card"
            onClick={() => onEditSupplement?.(u.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onEditSupplement?.(u.id) }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: onEditSupplement ? 'pointer' : 'default' }}
          >
            <div>
              <strong>{s.name}</strong>
              <div className="source-cite">{u.dosage || s.rdaAdult}</div>
              {u.reminderTimes?.length > 0 && (
                <div className="source-cite">Reminders: {u.reminderTimes.map(formatTime).join(', ')}</div>
              )}
              {s.timingGuidance && <div className="source-cite">{s.timingGuidance}</div>}
              <div className="source-cite" style={{ color: 'var(--brand)' }}>Tap to edit schedule</div>
            </div>
            <button
              className={taken ? 'btn-secondary' : 'btn-primary'}
              onClick={(e) => {
                e.stopPropagation()
                onMarkTaken(key, u.id)
              }}
            >
              {taken ? '✓ Taken' : 'Mark taken'}
            </button>
          </div>
        )
      })}
    </>
  )
}

function MonthView({ supplements, selectedDate, onChangeDate, userSupplements, medications, profile, onSelectDay }) {
  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = firstOfMonth.getDay()
  const today = new Date()

  const shiftMonth = (delta) => {
    onChangeDate(new Date(year, month + delta, 1))
  }

  const cells = []
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => shiftMonth(-1)}>‹</button>
        <div style={{ fontWeight: 600 }}>{MONTH_LABELS[month]} {year}</div>
        <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => shiftMonth(1)}>›</button>
      </div>

      <div className="calendar-grid">
        {WEEKDAY_LABELS.map((wd) => (
          <div key={wd} className="calendar-weekday">{wd}</div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} className="calendar-cell calendar-cell-blank" />
          const count = userSupplements.filter((u) => scheduledOn(u, date)).length
          const { level } = getDayFlags(date, { userSupplements, medications, profile, supplements })
          const isToday = sameDay(date, today)
          const isSelected = sameDay(date, selectedDate)
          const conflictClass = level ? ` calendar-cell-${level}` : ''
          return (
            <button
              key={dateKey(date)}
              className={`calendar-cell${isToday ? ' calendar-cell-today' : ''}${isSelected ? ' calendar-cell-selected' : ''}${conflictClass}`}
              onClick={() => onSelectDay(date)}
            >
              <span className="calendar-cell-num">{date.getDate()}</span>
              {count > 0 && <span className="calendar-cell-dot">{count}</span>}
            </button>
          )
        })}
      </div>

      <p className="source-cite" style={{ marginTop: 8 }}>
        Amber/red days have a scheduling conflict — supplement combos, medication interactions, or a dose near/above your limit. Tap the day for details.
      </p>
    </>
  )
}
