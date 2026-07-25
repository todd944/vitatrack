import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { supplements as librarySupplements } from '../data/supplements'
import { pickDri, ulStatusFor, parseDosageValue } from '../lib/dri'
import { formatTime } from '../lib/date'
import { getSuggestions } from '../lib/fuzzySearch'
import { lookupBarcode } from '../lib/barcodeLookup'
import { LibraryIcon } from './icons'
import FirstTimeHint from './FirstTimeHint'
// The ZXing barcode-decoding library is a meaningful chunk of the app's
// total bundle size and only matters to the minority of visits that tap
// "Scan barcode" — lazy-loading it keeps that weight out of the initial
// page load for everyone else.
const BarcodeScanner = lazy(() => import('./BarcodeScanner'))

const WEEKDAYS = [
  { day: 0, label: 'Su' },
  { day: 1, label: 'Mo' },
  { day: 2, label: 'Tu' },
  { day: 3, label: 'We' },
  { day: 4, label: 'Th' },
  { day: 5, label: 'Fr' },
  { day: 6, label: 'Sa' },
]
const ALL_DAYS = WEEKDAYS.map((w) => w.day)
const CATEGORY_CLASS = {
  vitamin: 'category-tag-vitamin',
  mineral: 'category-tag-mineral',
  herbal: 'category-tag-herbal',
  other: 'category-tag-other',
  custom: 'category-tag-custom',
}

// Picks the dosage option closest to the user's personalized RDA, instead
// of always defaulting to the first option in the list (which may be far
// from what's actually recommended for this person). Custom/user-entered
// products have no preset options at all, so this only applies to library items.
function closestDosageOption(supplement, dri) {
  if (!supplement.dosageOptions) return ''
  if (!dri) return supplement.dosageOptions[0]
  let best = supplement.dosageOptions[0]
  let bestDiff = Infinity
  for (const opt of supplement.dosageOptions) {
    const value = parseDosageValue(opt)
    if (value == null) continue
    const diff = Math.abs(value - dri.rda)
    if (diff < bestDiff) {
      bestDiff = diff
      best = opt
    }
  }
  return best
}

// Strips punctuation (periods, apostrophes) so "st john" matches "St. John's
// Wort" — without this, the exact-match filter below rejects a name typed
// without punctuation even though the fuzzy-suggestion dropdown finds it
// fine, leaving the user stuck on a "no supplements match" dead end if they
// press Enter instead of clicking the suggestion.
function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '')
}

function matchesSearch(supplement, query) {
  if (!query) return true
  const q = normalize(query)
  return (
    normalize(supplement.name).includes(q) ||
    normalize(supplement.category).includes(q) ||
    (supplement.aliases || []).some((a) => normalize(a).includes(q))
  )
}

const GOAL_LABELS = {
  bodybuilding: 'muscle building / athletic performance',
  weight_loss: 'weight loss',
  maintenance: 'filling specific nutrient gaps',
  general: 'general wellness / everyday health',
}

const ALPHABET = ['#', ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('')]

// Buckets non-letter-leading names (e.g. "5-HTP") under "#", a common
// convention for alphabetical indexes so every item still lands somewhere
// in the strip instead of silently sorting to a weird spot.
function indexLetter(name) {
  const ch = name.trim()[0]?.toUpperCase() || '#'
  return /[A-Z]/.test(ch) ? ch : '#'
}

export default function SupplementLibrary({ userSupplements, customSupplements, profile, goal, onSchedule, onRemove, onAddCustom, onRemoveCustom, editTarget, onClearEditTarget, seenHints, onDismissHint }) {
  const [search, setSearch] = useState('')
  const [customName, setCustomName] = useState('')
  const [customDetailsOpen, setCustomDetailsOpen] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scanStatus, setScanStatus] = useState(null) // null | 'looking-up' | 'no-match' | 'unknown-barcode' | 'error'
  // Name of the library item addCustom() redirected to instead of creating
  // a duplicate — shown as a brief confirmation so the redirect isn't silent.
  const [foundInLibrary, setFoundInLibrary] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightIndex, setHighlightIndexState] = useState(-1)
  // Keydown handlers can fire back-to-back faster than React commits a
  // render (e.g. rapid arrow-then-enter), so the Enter check below reads
  // this ref rather than the (possibly stale) `highlightIndex` closure.
  const highlightRef = useRef(-1)
  const setHighlightIndex = (updater) => {
    setHighlightIndexState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      highlightRef.current = next
      return next
    })
  }
  // letterRefs holds the DOM node for each letter's first section header, so
  // the A-Z index on the right can jump straight to it. A plain ref object
  // (not state) since these are just scroll targets, not something the UI
  // re-renders in response to.
  const letterRefs = useRef({})

  const allItems = [...librarySupplements, ...customSupplements]
  // Alphabetical is the only sort now — goal-based reordering was dropped
  // because it made the list feel like it shuffled unpredictably depending
  // on onboarding goal and search state. The "Matches your goal" badge on
  // each card still surfaces the same information without moving anything.
  const filtered = allItems
    .filter((s) => matchesSearch(s, search.trim()))
    .sort((a, b) => a.name.localeCompare(b.name))
  const suggestions = getSuggestions(search, allItems)
  // Live "is this already in the library" check as the user types a custom
  // product name — lets them pick the real item before ever hitting Add,
  // rather than only catching it after the fact in addCustom().
  const customMatches = customName.trim().length >= 2 ? getSuggestions(customName, allItems, { limit: 4 }) : []

  const pickExistingForCustom = (s) => {
    setCustomName('')
    setSearch(s.name)
    setCustomDetailsOpen(false)
    setFoundInLibrary(s.name)
  }

  // Groups the already-sorted list into per-letter sections in one pass —
  // availableLetters drives which buttons in the A-Z index are clickable.
  let lastLetter = null
  const availableLetters = new Set()
  const sectioned = filtered.map((s) => {
    const letter = indexLetter(s.name)
    availableLetters.add(letter)
    const isNewSection = letter !== lastLetter
    lastLetter = letter
    return { supplement: s, letter, isNewSection }
  })

  const scrollToLetter = (letter) => {
    letterRefs.current[letter]?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }

  const selectSuggestion = (s) => {
    setSearch(s.name)
    setShowSuggestions(false)
    setHighlightIndex(-1)
  }

  const handleSearchKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter' && highlightRef.current >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[highlightRef.current])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlightIndex(-1)
    }
  }

  // Clearing search after a successful add/save surfaces the rest of the
  // library immediately, instead of leaving the user staring at a search box
  // that still filters everything down to the one item they just finished
  // with — which made it unclear how to go add the next one.
  //
  // Before creating a custom entry, check whether this is actually already
  // in the reference library — a failed barcode lookup or a slightly
  // different typed name shouldn't silently create a duplicate ("custom"
  // copy of something that already has real dosage/interaction data).
  // If there's a strong match, route to that item instead of adding.
  const addCustom = (name) => {
    const trimmed = (name || '').trim()
    if (!trimmed) return
    const [existing] = getSuggestions(trimmed, allItems, { limit: 1 })
    if (existing) {
      setCustomName('')
      setSearch(existing.name)
      setCustomDetailsOpen(false)
      setFoundInLibrary(existing.name)
      return
    }
    onAddCustom(trimmed)
    setCustomName('')
    setSearch('')
  }

  const handleSchedule = (id, schedule) => {
    onSchedule(id, schedule)
    setSearch('')
  }

  // Barcode-scanned product titles are typically "Brand + Ingredient + Form"
  // (e.g. "Nutricost Vitamin D3 5000IU Softgels"), and this library's own
  // aliases already include compound forms like "vitamin d3" — so reusing
  // the existing fuzzy-suggestion matcher against the full scanned title
  // works well without a separate matching algorithm: it hits via the
  // substring branch whenever a curated alias appears inside the title.
  const handleBarcodeScanned = async (code) => {
    setShowScanner(false)
    setScanStatus('looking-up')
    try {
      const product = await lookupBarcode(code)
      const productName = product?.name || null
      const [bestMatch] = productName ? getSuggestions(productName, allItems, { limit: 1 }) : []
      if (bestMatch) {
        setSearch(bestMatch.name)
        setScanStatus(null)
      } else {
        setCustomName(productName || `Scanned item (barcode ${code})`)
        setCustomDetailsOpen(true)
        setSearch('')
        setScanStatus(productName ? 'no-match' : 'unknown-barcode')
      }
    } catch {
      setCustomName(`Scanned item (barcode ${code})`)
      setCustomDetailsOpen(true)
      setSearch('')
      setScanStatus('error')
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2><LibraryIcon className="section-icon" />Supplement library</h2>
      <FirstTimeHint id="library" seenHints={seenHints} onDismiss={onDismissHint}>
        Search, scroll, or tap "Scan barcode" to find a supplement — the list is alphabetical, with a letter
        index on the right to jump around. Tap "Add to my list" to set a dosage, pick which days you take it,
        and add reminder times. Can't find something? Add it as a custom product below the search box.
      </FirstTimeHint>
      <p className="source-cite">Sourced from NIH Office of Dietary Supplements and NCCIH fact sheets</p>
      {goal && GOAL_LABELS[goal] && (
        <p className="source-cite" style={{ marginTop: -4, marginBottom: 12 }}>
          Items related to your goal ({GOAL_LABELS[goal]}) are marked "Matches your goal" below.
        </p>
      )}

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setShowSuggestions(true)
            setHighlightIndex(-1)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setShowSuggestions(false)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search by name (e.g. Ascorbic Acid, Fish Oil, Cobalamin)..."
          style={{ width: '100%', padding: '10px 34px 10px 10px', border: '1px solid var(--line)', borderRadius: 6, fontSize: 14 }}
        />
        {search && (
          <button
            type="button"
            aria-label="Clear search"
            // onMouseDown (not onClick) so this fires before the input's
            // onBlur closes the suggestion dropdown out from under it.
            onMouseDown={(e) => {
              e.preventDefault()
              setSearch('')
              setShowSuggestions(false)
            }}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--ink-soft)',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ×
          </button>
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
                key={s.id}
                type="button"
                // onMouseDown (not onClick) fires before the input's onBlur,
                // so the suggestion registers before the dropdown closes.
                onMouseDown={(e) => {
                  e.preventDefault()
                  selectSuggestion(s)
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
                <span className="label-tag" style={{ marginLeft: 8 }}>{s.isCustom ? 'your product' : s.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn-secondary"
        style={{ marginBottom: 12, padding: '8px 14px', fontSize: 13 }}
        onClick={() => {
          setScanStatus(null)
          setShowScanner(true)
        }}
      >
        📷 Scan barcode
      </button>
      {scanStatus === 'looking-up' && (
        <p className="source-cite" style={{ marginTop: -8, marginBottom: 12 }}>Looking up that barcode…</p>
      )}
      {scanStatus === 'no-match' && (
        <p className="source-cite" style={{ marginTop: -8, marginBottom: 12 }}>
          Found the product, but it's not in our reference library — pre-filled below as a custom product.
        </p>
      )}
      {scanStatus === 'unknown-barcode' && (
        <p className="source-cite" style={{ marginTop: -8, marginBottom: 12 }}>
          Couldn't identify that barcode — add it as a custom product below.
        </p>
      )}
      {scanStatus === 'error' && (
        <p className="source-cite" style={{ marginTop: -8, marginBottom: 12 }}>
          Couldn't reach the barcode database right now — add the product by name below.
        </p>
      )}
      {showScanner && (
        <Suspense
          fallback={
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 30, 28, 0.92)',
                zIndex: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              Loading scanner…
            </div>
          }
        >
          <BarcodeScanner onScan={handleBarcodeScanned} onClose={() => setShowScanner(false)} />
        </Suspense>
      )}

      {foundInLibrary && (
        <p className="source-cite" style={{ marginTop: -8, marginBottom: 12, color: 'var(--safe)' }}>
          "{foundInLibrary}" is already in the library — showing it below instead of adding a duplicate.
        </p>
      )}

      <details
        style={{ marginBottom: 8 }}
        open={customDetailsOpen}
        onToggle={(e) => setCustomDetailsOpen(e.target.open)}
      >
        <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--brand)', fontWeight: 600 }}>
          Can't find your product? Add it yourself
        </summary>
        <div className="card" style={{ marginTop: 8 }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ink-soft)' }}>
            Since it's not in our reference library, it won't be checked for dosage limits or interactions — confirm those separately with a pharmacist.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value)
                setFoundInLibrary(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && addCustom(customName)}
              placeholder="e.g. My multivitamin brand"
              style={{ flex: 1, padding: 8, border: '1px solid var(--line)', borderRadius: 6 }}
            />
            <button className="btn-primary" onClick={() => addCustom(customName)}>Add</button>
          </div>
          {customMatches.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--ink-soft)' }}>
                Did you mean one of these already in the library?
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {customMatches.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => pickExistingForCustom(s)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>

      <details style={{ marginBottom: 16 }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--brand)', fontWeight: 600 }}>
          A note on quality
        </summary>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
          Supplements aren't FDA-approved for effectiveness or purity the way medications are. Look for
          third-party testing seals (USP, NSF, or ConsumerLab) on the product label as a signal of quality.
        </p>
      </details>

      {filtered.length === 0 && (
        <div className="card">
          <p style={{ margin: '0 0 8px' }}>No supplements match "{search}".</p>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ink-soft)' }}>
            Add it as a custom product instead — you can still schedule it and get reminders, though it
            won't be checked for dosage limits or interactions.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={customName || search}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustom(customName || search)}
              style={{ flex: 1, padding: 8, border: '1px solid var(--line)', borderRadius: 6 }}
            />
            <button className="btn-primary" onClick={() => addCustom(customName || search)}>Add</button>
          </div>
        </div>
      )}

      {sectioned.map(({ supplement: s, letter, isNewSection }) => {
        const active = userSupplements.find((u) => u.id === s.id)
        return (
          <div key={s.id}>
            {isNewSection && (
              <div
                ref={(el) => { letterRefs.current[letter] = el }}
                className="az-section-header"
              >
                {letter}
              </div>
            )}
            <LibraryItem
              supplement={s}
              active={active}
              profile={profile}
              matchesGoal={!!goal && !!s.goals?.includes(goal)}
              onSchedule={handleSchedule}
              onRemove={onRemove}
              onRemoveCustom={onRemoveCustom}
              forceEdit={editTarget === s.id}
              onForceEditHandled={onClearEditTarget}
            />
          </div>
        )
      })}

      {filtered.length > 0 && (
        <div className="az-index">
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              type="button"
              disabled={!availableLetters.has(letter)}
              onClick={() => scrollToLetter(letter)}
              className="az-index-letter"
            >
              {letter}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function LibraryItem({ supplement: s, active, profile, matchesGoal, onSchedule, onRemove, onRemoveCustom, forceEdit, onForceEditHandled }) {
  const dri = pickDri(s, profile)
  const [editing, setEditing] = useState(false)
  const [dosage, setDosage] = useState(active?.dosage || closestDosageOption(s, dri))
  // Preset dosageOptions are common label/RDA amounts, not every real
  // product on a shelf — if someone's actual bottle says e.g. "750 mg" and
  // that's not one of the presets, they need a way to type it in rather
  // than being forced to pick the closest-but-wrong option. Defaults to
  // custom mode if there's already an active dosage that isn't one of the
  // presets (e.g. edited in from a barcode scan or a previous custom entry).
  const [useCustomDosage, setUseCustomDosage] = useState(
    !!active && !!s.dosageOptions && !s.dosageOptions.includes(active.dosage)
  )
  // Starts empty (not "every day") for a new schedule — defaulting to all
  // days pre-selected meant clicking a single day (e.g. "Su") actually
  // deselected it, leaving every OTHER day active. That's the exact bug
  // reported: "scheduled for Sunday, shows every day except Sunday."
  const [days, setDays] = useState(active?.days || [])
  const [reminderTimes, setReminderTimes] = useState(active?.reminderTimes || [])
  const [newTime, setNewTime] = useState('08:00')
  const cardRef = useRef(null)

  useEffect(() => {
    if (!forceEdit) return
    setEditing(true)
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    onForceEditHandled?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceEdit])

  const draftStatus = ulStatusFor(s, dosage, profile)
  const activeStatus = active ? ulStatusFor(s, active.dosage, profile) : null
  const hasSymptomInfo = (s.excessSymptoms?.length || 0) > 0 || (s.deficiencySymptoms?.length || 0) > 0

  const toggleDay = (day) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()))
  }

  const addReminder = () => {
    if (!newTime || reminderTimes.includes(newTime)) return
    setReminderTimes((prev) => [...prev, newTime].sort())
  }

  const removeReminder = (time) => {
    setReminderTimes((prev) => prev.filter((t) => t !== time))
  }

  const save = () => {
    if (!dosage.trim() || days.length === 0) return
    onSchedule(s.id, { dosage: dosage.trim(), days, reminderTimes })
    setEditing(false)
  }

  const removeFromSchedule = () => {
    onRemove(s.id)
    setEditing(false)
  }

  const deleteProduct = () => {
    onRemoveCustom(s.id)
    setEditing(false)
  }

  return (
    <div className="card" ref={cardRef}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ margin: 0 }}>{s.name}</h3>
        <span className={`label-tag ${CATEGORY_CLASS[s.isCustom ? 'custom' : s.category] || ''}`}>
          {s.isCustom ? 'your product' : s.category}
        </span>
      </div>

      {matchesGoal && (
        <div className="pill" style={{ color: 'var(--brand)', borderColor: 'var(--brand)', margin: '6px 0 0', display: 'inline-block' }}>
          ✓ Matches your goal
        </div>
      )}

      {s.isCustom && (
        <p style={{ margin: '8px 0', fontSize: 13, color: 'var(--ink-soft)' }}>
          You added this yourself — it's not in our reference library, so it isn't checked for dosage
          limits or interactions. Confirm those separately with a pharmacist.
        </p>
      )}

      {dri ? (
        <>
          <p style={{ margin: '8px 0 4px', fontSize: 14 }}>
            <strong>Recommended for you ({dri.label}):</strong> {dri.rda} {dri.unit}/day
            {dri.ul != null && <> · <strong>your upper limit:</strong> {dri.ul} {dri.unit}/day</>}
          </p>
          {dri.note && (
            <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ink-soft)' }}>{dri.note}</p>
          )}
        </>
      ) : !s.isCustom ? (
        <>
          <p style={{ margin: '8px 0 4px', fontSize: 14 }}>
            <strong>Typical adult amount:</strong> {s.rdaAdult}
          </p>
          <p style={{ margin: '0 0 8px', fontSize: 14 }}>
            <strong>Upper limit:</strong> {s.upperLimit}
          </p>
        </>
      ) : null}

      {s.formNote && (
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ink-soft)' }}>
          <strong>Form matters:</strong> {s.formNote}
        </p>
      )}

      {s.timingGuidance && (
        <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--ink-soft)' }}>
          <strong>Timing:</strong> {s.timingGuidance}
        </p>
      )}
      {s.allergenNotes && (
        <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--ink-soft)' }}>
          <strong>Note:</strong> {s.allergenNotes}
        </p>
      )}
      {s.preOpCaution && (
        <div className="pill" style={{ color: 'var(--caution)', borderColor: 'var(--caution)', margin: '4px 0' }}>
          Before surgery: check with your surgical team
        </div>
      )}

      {hasSymptomInfo && (
        <details>
          <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--brand)' }}>
            Symptoms to watch for
          </summary>
          {s.excessSymptoms?.length > 0 && (
            <p style={{ fontSize: 13 }}>
              <strong>Possible signs of too much:</strong> {s.excessSymptoms.join(', ')}
            </p>
          )}
          {s.deficiencySymptoms?.length > 0 && (
            <p style={{ fontSize: 13 }}>
              <strong>Possible signs of too little:</strong> {s.deficiencySymptoms.join(', ')}
            </p>
          )}
        </details>
      )}
      {s.sourceCitation && (
        <p className="source-cite">Adapted from {s.sourceCitation} — not independently verified against the current publication.</p>
      )}

      {active && !editing && (
        <>
          <p style={{ margin: '8px 0 4px', fontSize: 13 }}>
            <strong>Your schedule:</strong> {active.dosage} ·{' '}
            {active.days.length === 7 ? 'every day' : active.days.map((d) => WEEKDAYS[d].label).join(' ')}
            {active.reminderTimes?.length > 0 && (
              <> · Reminders: {active.reminderTimes.map(formatTime).join(', ')}</>
            )}
          </p>
          {activeStatus?.level === 'over' && (
            <div className="card severity-danger" style={{ margin: '4px 0', padding: 10 }}>
              This dose is at or above your upper limit ({activeStatus.dri.ul} {activeStatus.dri.unit}/day, {activeStatus.dri.label}).
            </div>
          )}
          {activeStatus?.level === 'near' && (
            <div className="card severity-caution" style={{ margin: '4px 0', padding: 10 }}>
              This dose is close to your upper limit ({activeStatus.dri.ul} {activeStatus.dri.unit}/day, {activeStatus.dri.label}).
            </div>
          )}
        </>
      )}

      {editing && (
        <div style={{ margin: '8px 0 12px', padding: 12, background: 'var(--paper)', borderRadius: 6 }}>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>
            Dosage
            {s.dosageOptions && !useCustomDosage ? (
              <select
                value={dosage}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setUseCustomDosage(true)
                    setDosage('')
                  } else {
                    setDosage(e.target.value)
                  }
                }}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, border: '1px solid var(--line)', borderRadius: 6 }}
              >
                {s.dosageOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="__custom__">Custom amount…</option>
              </select>
            ) : (
              <>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 1 tablet, 500 mg"
                  style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, border: '1px solid var(--line)', borderRadius: 6 }}
                />
                {s.dosageOptions && (
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomDosage(false)
                      setDosage(closestDosageOption(s, dri))
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--brand)', textDecoration: 'underline', cursor: 'pointer', padding: 0, marginTop: 4, fontSize: 12 }}
                  >
                    Choose from list instead
                  </button>
                )}
              </>
            )}
          </label>
          {draftStatus.level === 'over' && (
            <p style={{ fontSize: 13, color: 'var(--danger)', margin: '0 0 8px' }}>
              At or above your upper limit ({draftStatus.dri.ul} {draftStatus.dri.unit}/day, {draftStatus.dri.label}).
            </p>
          )}
          {draftStatus.level === 'near' && (
            <p style={{ fontSize: 13, color: 'var(--caution)', margin: '0 0 8px' }}>
              Close to your upper limit ({draftStatus.dri.ul} {draftStatus.dri.unit}/day, {draftStatus.dri.label}).
            </p>
          )}
          <div style={{ fontSize: 13, marginBottom: 6 }}>Days</div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setDays(days.length === 7 ? [] : ALL_DAYS)}
            style={{ width: '100%', padding: '8px 12px', fontSize: 13, marginBottom: 8 }}
          >
            {days.length === 7 ? '✓ Every day selected — tap to clear' : 'Select every day'}
          </button>
          <div className="weekday-picker">
            {WEEKDAYS.map((w) => (
              <button
                key={w.day}
                type="button"
                className={`weekday-toggle${days.includes(w.day) ? ' weekday-toggle-active' : ''}`}
                onClick={() => toggleDay(w.day)}
              >
                {w.label}
              </button>
            ))}
          </div>
          {days.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--caution)', margin: '6px 0 0' }}>
              Pick at least one day, or tap "Every day" above.
            </p>
          )}
          <div style={{ fontSize: 13, margin: '12px 0 6px' }}>Reminders</div>
          {reminderTimes.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {reminderTimes.map((t) => (
                <span key={t} className="label-tag" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {formatTime(t)}
                  <button
                    type="button"
                    onClick={() => removeReminder(t)}
                    style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer', padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              style={{ padding: 8, border: '1px solid var(--line)', borderRadius: 6 }}
            />
            <button type="button" className="btn-secondary" onClick={addReminder}>Add reminder</button>
          </div>
          <p className="source-cite" style={{ marginTop: 4 }}>
            Add as many times a day as you need — reminders only fire on the days selected above, and only while this app is open in your browser.
          </p>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn-primary" onClick={save} disabled={!dosage.trim() || days.length === 0}>Save schedule</button>
            <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>

          {active && (
            <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              <button
                type="button"
                onClick={removeFromSchedule}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 13, cursor: 'pointer', padding: 0 }}
              >
                Remove from your list
              </button>
              {s.isCustom && (
                <button
                  type="button"
                  onClick={deleteProduct}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 13, cursor: 'pointer', padding: 0 }}
                >
                  Delete this product
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!editing && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => setEditing(true)}>
            {active ? 'Edit schedule' : 'Add to my list'}
          </button>
          {active && (
            <button className="btn-secondary" onClick={() => onRemove(s.id)}>
              Remove
            </button>
          )}
          {s.isCustom && (
            <button className="btn-secondary" onClick={() => onRemoveCustom(s.id)}>
              Delete product
            </button>
          )}
        </div>
      )}
    </div>
  )
}
