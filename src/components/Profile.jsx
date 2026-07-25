import { useState, useEffect, useRef } from 'react'
import HealthProfileForm from './HealthProfileForm'
import { GOALS } from './Onboarding'
import { ProfileIcon } from './icons'
import FirstTimeHint from './FirstTimeHint'

const NOTIF_STATUS_TEXT = {
  granted: 'Reminder notifications are enabled. You\'ll get an alert (and an in-app banner) at each reminder time while VitaTrack is open in a browser tab.',
  denied: 'Notifications are blocked for this site. Re-enable them in your browser\'s site settings if you want OS-level alerts — the in-app banner will still work either way.',
  unsupported: 'This browser doesn\'t support notifications here. Reminders will still show as an in-app banner while VitaTrack is open.',
  default: 'Reminders always show as an in-app banner while VitaTrack is open. Enable notifications to also get an OS-level alert.',
}

// iOS Safari doesn't support real push notifications at all in a plain
// browser tab — only an installed-to-Home-Screen PWA gets them. Without this
// notice, someone could set reminder times, never get alerted, and have no
// clue why: the "enable notifications" flow above doesn't tell them, and the
// in-app banner only helps if the app happens to already be open.
function isIosBrowserTab() {
  if (typeof navigator === 'undefined') return false
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  const isStandalone = window.navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches
  return isIos && !isStandalone
}

export default function Profile({ profile, onSave, goal, onSaveGoal, onShowLegal, notifStatus, onRequestNotifications, seenHints, onDismissHint, onResetAllData, onExportData, onImportData }) {
  const [draft, setDraft] = useState(profile)
  const [draftGoal, setDraftGoal] = useState(goal)
  const [confirmingReset, setConfirmingReset] = useState(false)
  // The parsed (but not-yet-applied) backup file, shown in a confirmation
  // card before anything actually overwrites current data — mirrors the
  // existing "Clear all data" confirm pattern, since restoring is just as
  // destructive to whatever's currently on this device.
  const [pendingImport, setPendingImport] = useState(null)
  const [importError, setImportError] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => setDraft(profile), [profile])
  useEffect(() => setDraftGoal(goal), [goal])

  const dirty = JSON.stringify(draft) !== JSON.stringify(profile)
  const goalDirty = draftGoal !== goal

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allows re-selecting the same file later
    if (!file) return
    setImportError(null)
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result)
        setPendingImport(payload)
      } catch {
        setImportError('That file isn\'t valid JSON — make sure it\'s an unmodified VitaTrack backup file.')
      }
    }
    reader.onerror = () => setImportError('Couldn\'t read that file.')
    reader.readAsText(file)
  }

  const confirmImport = () => {
    const result = onImportData(pendingImport)
    setPendingImport(null)
    if (result.success) {
      setImportResult('Backup restored.')
    } else {
      setImportError(result.error)
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <FirstTimeHint id="profile" seenHints={seenHints} onDismiss={onDismissHint}>
        Your sex, age, pregnancy/lactation status, and health conditions here personalize recommended amounts
        and safety flags throughout the app. Saved on this device, so it's here the next time you open the app.
      </FirstTimeHint>
      <h2><ProfileIcon className="section-icon" />Health profile</h2>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
        Used to personalize recommended amounts, upper-limit warnings, and safety flags throughout the app.
      </p>
      <div className="card">
        <HealthProfileForm profile={draft} onChange={setDraft} />
        <button className="btn-primary" style={{ marginTop: 8 }} disabled={!dirty} onClick={() => onSave(draft)}>
          Save profile
        </button>
      </div>

      <h2 style={{ marginTop: 24 }}>Goal</h2>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
        Tailors which supplements the Library surfaces first and marks as "Matches your goal" — it
        doesn't change any safety information, so switching goals is always safe to do.
      </p>
      <div className="card">
        <div style={{ display: 'grid', gap: 8, marginBottom: 8 }}>
          {GOALS.map((g) => (
            <button
              key={g.id}
              type="button"
              className="btn-secondary"
              style={{
                textAlign: 'left',
                borderColor: draftGoal === g.id ? 'var(--brand)' : 'var(--line)',
                color: draftGoal === g.id ? 'var(--brand)' : 'var(--ink)',
              }}
              onClick={() => setDraftGoal(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
        <button className="btn-primary" disabled={!goalDirty} onClick={() => onSaveGoal(draftGoal)}>
          Save goal
        </button>
      </div>

      <h2 style={{ marginTop: 24 }}>Reminders</h2>
      <div className="card">
        {isIosBrowserTab() && (
          <p className="card severity-caution" style={{ margin: '0 0 12px', fontSize: 13 }}>
            On iPhone, reminders only fire as real alerts if VitaTrack is installed to your Home Screen —
            a browser tab can't send them, even with notifications "enabled." Tap the Share icon in Safari,
            then "Add to Home Screen." Until then, reminders only show as an in-app banner while you have
            this open.
          </p>
        )}
        <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--ink-soft)' }}>{NOTIF_STATUS_TEXT[notifStatus] || NOTIF_STATUS_TEXT.default}</p>
        {notifStatus === 'default' && (
          <button className="btn-primary" onClick={onRequestNotifications}>Enable notifications</button>
        )}
        <p className="source-cite" style={{ marginTop: 8 }}>
          Set reminder times per supplement from the Library tab, when adding or editing its schedule.
        </p>
      </div>

      <h2 style={{ marginTop: 24 }}>Legal</h2>
      <div className="card" style={{ display: 'flex', gap: 16 }}>
        <button
          type="button"
          style={{ background: 'none', border: 'none', color: 'var(--brand)', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 14 }}
          onClick={() => onShowLegal('terms')}
        >
          Terms of Service
        </button>
        <button
          type="button"
          style={{ background: 'none', border: 'none', color: 'var(--brand)', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 14 }}
          onClick={() => onShowLegal('privacy')}
        >
          Privacy Policy
        </button>
      </div>

      <h2 style={{ marginTop: 24 }}>Your data</h2>
      <div className="card">
        <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--ink-soft)' }}>
          Your schedule, history, and profile are saved in this browser on this device only — there's no
          account and nothing is sent anywhere else. Clearing your browser's site data has the same effect
          as the button below, so it's worth saving your own copy.
        </p>
        <button className="btn-secondary" style={{ marginBottom: 8 }} onClick={onExportData}>
          Download my data
        </button>
        <p className="source-cite" style={{ marginTop: 0, marginBottom: 12 }}>
          Saves a JSON file with your schedule, history, and profile — keep it somewhere safe as a backup.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />
        <button className="btn-secondary" style={{ marginBottom: 8 }} onClick={() => fileInputRef.current?.click()}>
          Restore from backup…
        </button>
        <p className="source-cite" style={{ marginTop: 0, marginBottom: 12 }}>
          Loads a previously downloaded backup file. This replaces everything currently on this device —
          it doesn't merge with what's already here.
        </p>
        {importError && (
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--danger)' }}>{importError}</p>
        )}
        {importResult && (
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--safe)' }}>{importResult}</p>
        )}
        {pendingImport && (
          <div className="card severity-danger" style={{ margin: '0 0 12px' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600 }}>
              Restore this backup{pendingImport.exportedAt ? ` (from ${new Date(pendingImport.exportedAt).toLocaleDateString()})` : ''}?
            </p>
            <p style={{ margin: '0 0 8px', fontSize: 13 }}>
              This replaces your current schedule, history, and profile with what's in this file —
              whatever's on this device now will be gone. This can't be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ background: 'var(--danger)' }} onClick={confirmImport}>
                Yes, restore this backup
              </button>
              <button className="btn-secondary" onClick={() => setPendingImport(null)}>Cancel</button>
            </div>
          </div>
        )}

        {!confirmingReset ? (
          <button className="btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setConfirmingReset(true)}>
            Clear all data
          </button>
        ) : (
          <div className="card severity-danger" style={{ margin: 0 }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600 }}>
              This permanently deletes your schedule, medications, history, and profile from this device. This can't be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-primary"
                style={{ background: 'var(--danger)' }}
                onClick={() => {
                  onResetAllData()
                  setConfirmingReset(false)
                }}
              >
                Yes, clear everything
              </button>
              <button className="btn-secondary" onClick={() => setConfirmingReset(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
