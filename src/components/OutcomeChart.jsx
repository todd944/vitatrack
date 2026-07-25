import { useState } from 'react'
import { dateKey } from '../lib/date'
import { scheduledOn } from '../lib/conflicts'

// Two categorical hues from the app's validated data-viz palette (not the
// --brand/--caution CSS tokens elsewhere in the app, which already carry
// "success"/"warning" meaning here — mood and energy are just two neutral
// series, so reusing status colors for them would be misleading).
const MOOD_COLOR = '#2a78d6'
const ENERGY_COLOR = '#4a3aa7'

const DAYS = 14
// Mark specs (2px lines, 10px labels, etc. below) are absolute pixel sizes
// by design-system convention — they only read correctly if the viewBox is
// sized close to the SVG's actual rendered width. This app's real card
// content width on a phone is ~310px, not the 700+ a desktop-oriented
// viewBox would imply, so the canvas is sized for mobile first; it simply
// renders larger (and still fine) on the wider desktop layout.
const CHART_W = 340
const PLOT_LEFT = 70
const PLOT_RIGHT = 280
const PLOT_TOP = 14
const PLOT_BOTTOM = 100
const ROW_H = 22
// Row cells are centered on each day's x position, so the first cell
// extends CELL_W/2 to the left of PLOT_LEFT — the row-label x position
// below has to clear that overlap, not just PLOT_LEFT itself.
const CELL_W = (PLOT_RIGHT - PLOT_LEFT) / (DAYS - 1) - 4
const ROW_LABEL_X = PLOT_LEFT - CELL_W / 2 - 8

function last14Days() {
  const out = []
  const today = new Date()
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    out.push(d)
  }
  return out
}

function xFor(i) {
  return PLOT_LEFT + (i * (PLOT_RIGHT - PLOT_LEFT)) / (DAYS - 1)
}

function yFor(value) {
  // value is 1-5; higher is plotted higher (smaller y)
  return PLOT_BOTTOM - ((value - 1) / 4) * (PLOT_BOTTOM - PLOT_TOP)
}

// Builds separate path segments so the line doesn't bridge across days with
// no logged outcome — a gap in logging should look like a gap, not get
// silently interpolated over.
function buildSegments(days, values) {
  const segments = []
  let current = []
  days.forEach((_, i) => {
    if (values[i] == null) {
      if (current.length > 1) segments.push(current)
      current = []
    } else {
      current.push([xFor(i), yFor(values[i])])
    }
  })
  if (current.length > 1) segments.push(current)
  return segments
}

function pathFrom(points) {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}

export default function OutcomeChart({ outcomes, log, userSupplements, supplements }) {
  const [selected, setSelected] = useState(null) // day index or null

  if (outcomes.length === 0 && userSupplements.length === 0) return null

  const days = last14Days()
  const keys = days.map(dateKey)
  const byDate = Object.fromEntries(outcomes.map((o) => [o.date, o]))

  const moodValues = keys.map((k) => byDate[k]?.mood ?? null)
  const energyValues = keys.map((k) => byDate[k]?.energy ?? null)
  const moodSegments = buildSegments(days, moodValues)
  const energySegments = buildSegments(days, energyValues)

  const lastMoodIdx = moodValues.map((v, i) => (v != null ? i : -1)).filter((i) => i >= 0).at(-1)
  const lastEnergyIdx = energyValues.map((v, i) => (v != null ? i : -1)).filter((i) => i >= 0).at(-1)
  // When the two lines end at (near) the same value, their direct labels
  // land on top of each other and turn to noise — nudge them apart
  // vertically instead of letting them collide (see marks-and-anatomy.md).
  let moodLabelDy = 0
  let energyLabelDy = 0
  if (lastMoodIdx >= 0 && lastEnergyIdx >= 0) {
    const dy = yFor(moodValues[lastMoodIdx]) - yFor(energyValues[lastEnergyIdx])
    if (Math.abs(dy) < 10) {
      moodLabelDy = -7
      energyLabelDy = 7
    }
  }

  const rows = userSupplements
    .map((us) => ({ us, s: supplements.find((sp) => sp.id === us.id) }))
    .filter((r) => r.s)

  const plotHeight = PLOT_BOTTOM + 24
  const rowsHeight = rows.length > 0 ? rows.length * ROW_H + 30 : 0
  const totalHeight = plotHeight + rowsHeight + (selected != null ? 70 : 0)

  const selectedDate = selected != null ? days[selected] : null
  const selectedKey = selected != null ? keys[selected] : null
  const selectedOutcome = selectedKey ? byDate[selectedKey] : null
  const selectedTaken = selected != null
    ? rows.filter(({ us }) => scheduledOn(us, selectedDate) && !!log[selectedKey]?.[us.id])
    : []

  return (
    <>
      <h3 style={{ marginTop: 24 }}>Mood &amp; energy vs. what you took</h3>
      <div className="card">
        <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 12, color: 'var(--ink-soft)' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: MOOD_COLOR, marginRight: 5 }} />Mood</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: ENERGY_COLOR, marginRight: 5 }} />Energy</span>
        </div>

        <svg viewBox={`0 0 ${CHART_W} ${totalHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* gridlines at 1/3/5, y-axis labels */}
          {[1, 3, 5].map((v) => (
            <g key={v}>
              <line x1={PLOT_LEFT} x2={PLOT_RIGHT} y1={yFor(v)} y2={yFor(v)} stroke="var(--line)" strokeWidth="1" />
              <text x={PLOT_LEFT - 6} y={yFor(v) + 3} textAnchor="end" fontSize="10" fill="var(--ink-soft)">{v}</text>
            </g>
          ))}

          {/* x-axis date labels, every ~3 days — the i < DAYS - 2 guard drops
              the %3 label that would otherwise land right next to the
              always-shown last day and collide with it */}
          {days.map((d, i) => (
            (i === 0 || i === DAYS - 1 || (i % 3 === 0 && i < DAYS - 2)) && (
              <text
                key={i}
                x={xFor(i)}
                y={PLOT_BOTTOM + 16}
                textAnchor="middle"
                fontSize="9"
                fill="var(--ink-soft)"
              >
                {`${d.getMonth() + 1}/${d.getDate()}`}
              </text>
            )
          ))}

          {/* A brand-new user with a scheduled supplement but zero mood/energy
              entries would otherwise see bare, unexplained axes here — easy
              to mistake for something broken rather than an empty state. */}
          {outcomes.length === 0 && (
            <text x={(PLOT_LEFT + PLOT_RIGHT) / 2} y={(PLOT_TOP + PLOT_BOTTOM) / 2} textAnchor="middle" fontSize="10" fill="var(--ink-soft)">
              <tspan x={(PLOT_LEFT + PLOT_RIGHT) / 2} dy="0">No mood/energy logged yet —</tspan>
              <tspan x={(PLOT_LEFT + PLOT_RIGHT) / 2} dy="13">log today to start your trend</tspan>
            </text>
          )}

          {/* mood / energy lines */}
          {moodSegments.map((seg, i) => (
            <path key={`m${i}`} d={pathFrom(seg)} fill="none" stroke={MOOD_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {energySegments.map((seg, i) => (
            <path key={`e${i}`} d={pathFrom(seg)} fill="none" stroke={ENERGY_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          ))}

          {/* points, with a surface ring so they stay legible crossing the other line */}
          {moodValues.map((v, i) => v != null && (
            <circle key={`mp${i}`} cx={xFor(i)} cy={yFor(v)} r="4" fill={MOOD_COLOR} stroke="var(--paper-raised)" strokeWidth="2">
              <title>{`${keys[i]} — Mood ${v}/5`}</title>
            </circle>
          ))}
          {energyValues.map((v, i) => v != null && (
            <circle key={`ep${i}`} cx={xFor(i)} cy={yFor(v)} r="4" fill={ENERGY_COLOR} stroke="var(--paper-raised)" strokeWidth="2">
              <title>{`${keys[i]} — Energy ${v}/5`}</title>
            </circle>
          ))}

          {/* direct end-labels, nudged apart if they'd otherwise collide */}
          {lastMoodIdx != null && lastMoodIdx >= 0 && (
            <text x={xFor(lastMoodIdx) + 8} y={yFor(moodValues[lastMoodIdx]) + 3 + moodLabelDy} fontSize="10" fontWeight="600" fill={MOOD_COLOR}>
              Mood
            </text>
          )}
          {lastEnergyIdx != null && lastEnergyIdx >= 0 && (
            <text x={xFor(lastEnergyIdx) + 8} y={yFor(energyValues[lastEnergyIdx]) + 3 + energyLabelDy} fontSize="10" fontWeight="600" fill={ENERGY_COLOR}>
              Energy
            </text>
          )}

          {/* tap targets — one invisible column per day, selects it for the detail panel below */}
          {days.map((_, i) => (
            <rect
              key={`hit${i}`}
              x={xFor(i) - (PLOT_RIGHT - PLOT_LEFT) / (DAYS - 1) / 2}
              y={0}
              width={(PLOT_RIGHT - PLOT_LEFT) / (DAYS - 1)}
              height={plotHeight}
              fill={selected === i ? 'rgba(31,92,86,0.06)' : 'transparent'}
              onClick={() => setSelected(selected === i ? null : i)}
              style={{ cursor: 'pointer' }}
            />
          ))}

          {/* supplement adherence rows, sharing the same day columns as the lines above */}
          {rows.map(({ us, s }, ri) => {
            const rowY = plotHeight + ri * ROW_H
            return (
              <g key={us.id}>
                <text x={ROW_LABEL_X} y={rowY + 13} textAnchor="end" fontSize="10" fill="var(--ink-soft)">
                  {s.name.length > 9 ? s.name.slice(0, 8) + '…' : s.name}
                </text>
                {days.map((d, i) => {
                  // Matches SupplementHistory's own day-strip convention:
                  // a day before the schedule existed (or not one of its
                  // days) is blank, not a red "missed" — those aren't the
                  // same thing, and conflating them was the bug here.
                  const scheduled = scheduledOn(us, d)
                  const taken = scheduled && !!log[keys[i]]?.[us.id]
                  const fill = !scheduled ? 'var(--paper)' : taken ? 'var(--safe)' : 'var(--danger-bg)'
                  const stroke = !scheduled ? 'var(--line)' : taken ? 'none' : 'var(--danger)'
                  const label = !scheduled ? 'not scheduled' : taken ? 'taken' : 'missed'
                  return (
                    <rect
                      key={i}
                      x={xFor(i) - CELL_W / 2}
                      y={rowY + 2}
                      width={CELL_W}
                      height={14}
                      rx="3"
                      fill={fill}
                      stroke={stroke}
                      onClick={() => setSelected(selected === i ? null : i)}
                      style={{ cursor: 'pointer' }}
                    >
                      <title>{`${keys[i]} — ${s.name} — ${label}`}</title>
                    </rect>
                  )
                })}
              </g>
            )
          })}
        </svg>

        {selected != null && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: 13 }}>
            <strong>{selectedDate.toDateString()}</strong>
            <p style={{ margin: '4px 0' }}>
              {selectedOutcome
                ? `Mood ${selectedOutcome.mood}/5 · Energy ${selectedOutcome.energy}/5`
                : 'No mood/energy logged this day'}
            </p>
            {selectedOutcome?.notes && (
              <p style={{ margin: '4px 0', fontStyle: 'italic' }}>"{selectedOutcome.notes}"</p>
            )}
            <p style={{ margin: 0, color: 'var(--ink-soft)' }}>
              {selectedTaken.length > 0
                ? `Taken: ${selectedTaken.map(({ us, s }) => `${s.name} (${us.dosage})`).join(', ')}`
                : 'Nothing logged as taken this day'}
            </p>
          </div>
        )}

        <p className="source-cite" style={{ marginTop: 10 }}>
          Tap a day to see exactly what was taken alongside that day's mood and energy. Not medical
          analysis — just a visual way to notice your own patterns.
        </p>
      </div>
    </>
  )
}
