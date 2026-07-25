import { useState, useEffect, useRef } from 'react'
import { interactions } from '../data/interactions'
import { conditionCautions } from '../data/conditionCautions'
import { ulStatusFor } from '../lib/dri'
import { medicationMatches } from '../lib/medications'
import { searchMedications } from '../lib/rxnorm'
import { ShieldIcon } from './icons'
import FirstTimeHint from './FirstTimeHint'

const ACTION_LABEL = {
  avoid_combination: 'Generally avoid combining',
  adjust_timing: 'Adjust timing',
  monitor: 'Monitor / discuss with doctor',
}

export default function MedicationCheck({ supplements, userSupplements, profile, medications, onAddMedication, onRemoveMedication, seenHints, onDismissHint }) {
  const userSupplementIds = userSupplements.map((u) => u.id)
  const customCount = userSupplements.filter((u) => supplements.find((sp) => sp.id === u.id)?.isCustom).length

  const medicationFlags = interactions.filter((i) => {
    if (i.interactsWith.type !== 'medication') return false
    if (!userSupplementIds.includes(i.supplementId)) return false
    return medicationMatches(i.interactsWith, medications)
  })

  // Compares every pair of supplements currently loaded from the library
  // against the interaction table, so combos are flagged as soon as both
  // items are on the user's list (not just against typed medications).
  const supplementFlags = interactions.filter((i) => {
    if (i.interactsWith.type !== 'supplement') return false
    if (!userSupplementIds.includes(i.supplementId)) return false
    if (i.interactsWith.id) {
      return userSupplementIds.includes(i.interactsWith.id)
    }
    return userSupplementIds.some((id) => {
      if (id === i.supplementId) return false
      const s = supplements.find((sp) => sp.id === id)
      return s && i.interactsWith.name.toLowerCase().includes(s.name.toLowerCase())
    })
  })

  const doseFlags = userSupplements
    .map((u) => {
      const s = supplements.find((sp) => sp.id === u.id)
      const status = ulStatusFor(s, u.dosage, profile)
      return { u, s, ...status }
    })
    .filter((f) => f.dri)
  const overLimit = doseFlags.filter((f) => f.level === 'over')
  const nearLimit = doseFlags.filter((f) => f.level === 'near')
  const withinRange = doseFlags.filter((f) => f.level === 'ok')

  const preOpItems = userSupplements
    .map((u) => supplements.find((sp) => sp.id === u.id))
    .filter((s) => s && s.preOpCaution)

  // 'teen' isn't a checkbox like the others — it's derived from age band,
  // since sports-nutrition products (creatine, protein, BCAAs, etc.) are
  // studied almost entirely in adults and this app also serves a 14-18 band.
  const activeConditions = ['kidneyDisease', 'liverDisease', 'pregnant', 'lactating'].filter((c) => profile?.[c])
  if (profile?.ageBand === '14-18') activeConditions.push('teen')
  const conditionFlags = conditionCautions.filter(
    (c) => activeConditions.includes(c.condition) && userSupplementIds.includes(c.supplementId)
  )

  return (
    <div style={{ padding: 16 }}>
      <h2><ShieldIcon className="section-icon" />Interactions & safety check</h2>
      <FirstTimeHint id="interactions" seenHints={seenHints} onDismiss={onDismissHint}>
        Search for any medications you take below — suggestions come from the NIH's medication database, so
        picking from the list (rather than typing blind) makes sure the name matches what this app checks
        against. This screen also flags supplement-to-supplement combinations, doses near your personal upper
        limit, and FDA recalls.
      </FirstTimeHint>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
        This checks your supplement list against a small, hand-curated set of
        well-documented interactions and dosing limits. It is not exhaustive — always confirm
        with your pharmacist, especially for anything not listed here.
      </p>

      {customCount > 0 && (
        <div className="card severity-caution">
          {customCount === 1 ? "1 product you added yourself isn't" : `${customCount} products you added yourself aren't`}{' '}
          in our reference library, so it can't be checked for interactions or dosage limits — confirm it separately with a pharmacist.
        </div>
      )}

      <div className="card">
        <MedicationInput onAddMedication={onAddMedication} />
        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {medications.map((m) => (
            <span key={m} className="label-tag" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {m}
              <button
                onClick={() => onRemoveMedication(m)}
                style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>Dosage & upper limit check</h3>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
        Each scheduled dose compared against your personalized upper limit (from your health profile).
      </p>
      {doseFlags.length === 0 && (
        <div className="card">No dosage data to check yet — add supplements from the Library tab.</div>
      )}
      {overLimit.map((f) => <DoseCard key={f.u.id} flag={f} level="over" />)}
      {nearLimit.map((f) => <DoseCard key={f.u.id} flag={f} level="near" />)}
      {withinRange.length > 0 && (
        <div className="card severity-safe">
          {withinRange.length === 1 ? '1 supplement is' : `${withinRange.length} supplements are`} within your typical range.
        </div>
      )}

      <h3 style={{ marginTop: 24 }}>Supplement combinations</h3>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
        Every supplement currently on your list is compared against every other one as they're loaded from the library.
      </p>
      {supplementFlags.length === 0 && (
        <div className="card severity-safe">No compatibility flags among your current supplements.</div>
      )}
      {supplementFlags.map((f) => <FlagCard key={f.id} flag={f} supplements={supplements} />)}

      <h3 style={{ marginTop: 24 }}>Medication interactions</h3>
      {medicationFlags.length === 0 && (
        <div className="card severity-safe">No flags found for your current supplements and medications.</div>
      )}
      {medicationFlags.map((f) => <FlagCard key={f.id} flag={f} supplements={supplements} />)}

      {preOpItems.length > 0 && (
        <>
          <h3 style={{ marginTop: 24 }}>Before surgery</h3>
          {preOpItems.map((s) => (
            <div key={s.id} className="card severity-caution">
              <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{s.name}</p>
              <p style={{ margin: 0, fontSize: 14 }}>{s.preOpCaution}</p>
            </div>
          ))}
        </>
      )}

      {conditionFlags.length > 0 && (
        <>
          <h3 style={{ marginTop: 24 }}>Based on your health profile</h3>
          {conditionFlags.map((c) => {
            const s = supplements.find((sp) => sp.id === c.supplementId)
            return (
              <div key={c.id} className="card severity-caution">
                <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{s?.name}</p>
                <p style={{ margin: 0, fontSize: 14 }}>{c.text}</p>
              </div>
            )
          })}
        </>
      )}

      {userSupplements.length > 0 && (
        <>
          <h3 style={{ marginTop: 24 }}>Recall check</h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
            Best-effort lookup against the public FDA recall database. Not exhaustive — check{' '}
            <span style={{ textDecoration: 'underline' }}>fda.gov/safety/recalls</span> directly for anything urgent.
          </p>
          <p className="source-cite" style={{ marginBottom: 12 }}>
            Matches are based on ingredient name only, not your specific brand or product — a result
            showing up here doesn't necessarily mean the exact product you take was recalled. Check
            whether the listing actually matches your brand and lot before acting on it.
          </p>
          {userSupplements.map((u) => {
            const s = supplements.find((sp) => sp.id === u.id)
            return <RecallCheck key={u.id} supplementName={s.name} />
          })}
        </>
      )}
    </div>
  )
}

// Autocomplete backed by the NIH RxNorm medication database instead of
// blind free-text — mirrors the fuzzy-suggestion search box already used in
// SupplementLibrary, so the interaction pattern (type, arrow keys, click a
// suggestion) is consistent across the app. A user can still type a full
// name and tap Add without picking a suggestion, for anything RxNorm
// doesn't recognize (compounded prescriptions, less-common products, or if
// the lookup itself fails) — this keeps that path working exactly as before.
function MedicationInput({ onAddMedication }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightIndex, setHighlightIndexState] = useState(-1)
  const highlightRef = useRef(-1)
  const debounceRef = useRef(null)

  const setHighlightIndex = (updater) => {
    setHighlightIndexState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      highlightRef.current = next
      return next
    })
  }

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setSuggestions([])
      setStatus('idle')
      return
    }
    debounceRef.current = setTimeout(async () => {
      setStatus('loading')
      try {
        const results = await searchMedications(query)
        setSuggestions(results)
        setStatus('idle')
      } catch {
        setSuggestions([])
        setStatus('error')
      }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  const addAndClear = (name) => {
    if (!name.trim()) return
    onAddMedication(name.trim())
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    setHighlightIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        addAndClear(query)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      addAndClear(highlightRef.current >= 0 ? suggestions[highlightRef.current].name : query)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlightIndex(-1)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowSuggestions(true)
            setHighlightIndex(-1)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setShowSuggestions(false)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Warfarin"
          style={{ flex: 1, padding: 8, border: '1px solid var(--line)', borderRadius: 6 }}
        />
        <button className="btn-primary" onClick={() => addAndClear(query)}>Add</button>
      </div>

      {showSuggestions && status === 'loading' && (
        <p className="source-cite" style={{ marginTop: 4 }}>Searching…</p>
      )}
      {showSuggestions && status === 'error' && (
        <p className="source-cite" style={{ marginTop: 4 }}>
          Couldn't reach the medication database — you can still type the full name and tap Add.
        </p>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            zIndex: 30,
            overflow: 'hidden',
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s.rxcui}
              type="button"
              // onMouseDown (not onClick) fires before the input's onBlur,
              // so the suggestion registers before the dropdown closes.
              onMouseDown={(e) => {
                e.preventDefault()
                addAndClear(s.name)
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                border: 'none',
                background: i === highlightIndex ? 'var(--paper)' : 'transparent',
                cursor: 'pointer',
                fontSize: 14,
                color: 'var(--ink)',
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <p className="source-cite" style={{ marginTop: 8 }}>
        Suggestions from the NIH RxNorm medication database. Can't find yours? Type the full name and tap Add anyway.
      </p>
    </div>
  )
}

function DoseCard({ flag, level }) {
  const { u, s, dri, pct } = flag
  return (
    <div className={`card severity-${level === 'over' ? 'danger' : 'caution'}`}>
      <div className="pill">{level === 'over' ? 'At/above upper limit' : 'Close to upper limit'}</div>
      <p style={{ margin: '8px 0 4px', fontWeight: 600 }}>{s.name} — {u.dosage}</p>
      <p style={{ margin: 0, fontSize: 14 }}>
        Your upper limit ({dri.label}): {dri.ul} {dri.unit}/day — you're scheduled for about {Math.round(pct)}% of that.
      </p>
    </div>
  )
}

function FlagCard({ flag: f, supplements }) {
  const s = supplements.find((sp) => sp.id === f.supplementId)
  const pillText = f.mechanism === 'depletion'
    ? 'May deplete this nutrient over time'
    : f.severity === 'danger' ? 'Higher concern' : 'Worth noting'
  return (
    <div className={`card severity-${f.severity}`}>
      <div className="pill">{pillText}</div>
      {f.action && <div className="label-tag" style={{ marginLeft: 8 }}>{ACTION_LABEL[f.action]}</div>}
      <p style={{ margin: '8px 0 4px', fontWeight: 600 }}>
        {s?.name} + {f.interactsWith.name}
      </p>
      <p style={{ margin: '0 0 8px', fontSize: 14 }}>{f.description}</p>
      <p style={{ margin: '0 0 8px', fontSize: 14 }}>
        <strong>Talk to your doctor or pharmacist about:</strong> {f.recommendation}
      </p>
      <p className="source-cite">Adapted from {f.sourceCitation} — not independently verified against the current publication.</p>
    </div>
  )
}

function RecallCheck({ supplementName }) {
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [results, setResults] = useState([])

  const check = async () => {
    setState('loading')
    try {
      // Requiring "supplement" alongside the name keeps this from matching
      // unrelated foods that merely list the nutrient as an ingredient
      // (e.g. "Reduced Iron" in bread flour).
      const query = encodeURIComponent(`product_description:"${supplementName}" AND product_description:"supplement"`)
      const res = await fetch(`https://api.fda.gov/food/enforcement.json?search=${query}&limit=3`)
      if (!res.ok) throw new Error('bad response')
      const data = await res.json()
      setResults(data.results || [])
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{supplementName}</strong>
        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={check} disabled={state === 'loading'}>
          {state === 'loading' ? 'Checking…' : 'Check for recalls'}
        </button>
      </div>
      {state === 'error' && (
        <p className="source-cite" style={{ marginTop: 8 }}>
          Couldn't reach the FDA recall database right now — check fda.gov/safety/recalls directly.
        </p>
      )}
      {state === 'done' && results.length === 0 && (
        <p className="source-cite" style={{ marginTop: 8 }}>No recent FDA recalls found for this search term.</p>
      )}
      {state === 'done' && results.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {results.map((r, i) => (
            <div key={i} style={{ fontSize: 13, marginBottom: 6 }}>
              <strong>{r.recall_initiation_date}</strong> — {r.product_description}
              <div className="source-cite">{r.reason_for_recall}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
