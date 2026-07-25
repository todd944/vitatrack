import { useState } from 'react'
import DisclaimerBanner from './components/DisclaimerBanner'
import Onboarding from './components/Onboarding'
import SupplementLibrary from './components/SupplementLibrary'
import Calendar from './components/Calendar'
import MedicationCheck from './components/MedicationCheck'
import OutcomeLog from './components/OutcomeLog'
import Profile from './components/Profile'
import TermsOfService from './components/TermsOfService'
import PrivacyPolicy from './components/PrivacyPolicy'
import ReminderBanner from './components/ReminderBanner'
import { DEFAULT_PROFILE } from './components/HealthProfileForm'
import { useReminders, getNotificationPermission, requestNotificationPermission } from './lib/reminders'
import { todayKey } from './lib/date'
import { useLocalStorageState, clearStoredState } from './lib/useLocalStorageState'
import { supplements as librarySupplements } from './data/supplements'
import { CalendarIcon, LibraryIcon, ShieldIcon, LogIcon, ProfileIcon } from './components/icons'

// Data that matters across sessions (schedule, history, profile, etc.) is
// persisted to localStorage via useLocalStorageState — see
// src/lib/useLocalStorageState.js. That fixes single-device persistence;
// multi-device sync and real push notifications (reminders firing while the
// app isn't open) still need an actual backend — see README.md.
const PERSISTED_KEYS = ['goal', 'profile', 'tab', 'userSupplements', 'medications', 'log', 'outcomes', 'customSupplements', 'seenHints']

export default function App() {
  const [goal, setGoal] = useLocalStorageState('goal', null)
  const [profile, setProfile] = useLocalStorageState('profile', DEFAULT_PROFILE)
  const [tab, setTab] = useLocalStorageState('tab', 'calendar')
  const [userSupplements, setUserSupplements] = useLocalStorageState('userSupplements', [])
  const [medications, setMedications] = useLocalStorageState('medications', [])
  const [log, setLog] = useLocalStorageState('log', {})
  const [outcomes, setOutcomes] = useLocalStorageState('outcomes', [])
  const [legalView, setLegalView] = useState(null) // null | 'terms' | 'privacy'
  const [notifStatus, setNotifStatus] = useState(getNotificationPermission())
  const [customSupplements, setCustomSupplements] = useLocalStorageState('customSupplements', [])
  const [editTarget, setEditTarget] = useState(null)
  const [seenHints, setSeenHints] = useLocalStorageState('seenHints', {})

  // The whole app is local-only storage (see PERSISTED_KEYS comment above),
  // which means one accidental browser cache clear — or losing the device —
  // permanently deletes months of adherence and mood history with no
  // recovery path. This gives people a way to save their own copy outside
  // the browser as a hedge against that, without needing an account/backend.
  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      goal,
      profile,
      userSupplements,
      customSupplements,
      medications,
      log,
      outcomes,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vitatrack-backup-${todayKey()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Loose but real validation — a backup file is untrusted input (could be
  // hand-edited, from a future/older app version, or just the wrong file
  // entirely), so this checks shape before anything gets written to state
  // rather than trusting arbitrary JSON. Individual fields are optional
  // (falling back to empty/default below) so a partial or older-format
  // export still restores what it can instead of being rejected outright.
  const validateBackup = (payload) => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return 'That file doesn\'t look like a VitaTrack backup.'
    }
    const expectedKeys = ['profile', 'userSupplements', 'customSupplements', 'medications', 'log', 'outcomes', 'goal']
    if (!expectedKeys.some((k) => k in payload)) {
      return 'That file doesn\'t look like a VitaTrack backup.'
    }
    const arrayFields = ['userSupplements', 'customSupplements', 'medications', 'outcomes']
    for (const field of arrayFields) {
      if (payload[field] != null && !Array.isArray(payload[field])) {
        return `Backup file is malformed (${field} should be a list).`
      }
    }
    const objectFields = ['profile', 'log']
    for (const field of objectFields) {
      if (payload[field] != null && (typeof payload[field] !== 'object' || Array.isArray(payload[field]))) {
        return `Backup file is malformed (${field} should be an object).`
      }
    }
    return null
  }

  // Restoring fully replaces current data rather than merging — merging
  // log/outcome history from two sources unambiguously is a much harder
  // problem (duplicate dates, conflicting entries) than this needs to solve,
  // and "restore this backup" is the actual use case (recovering after data
  // loss, moving to a new device), not combining two active histories.
  const importData = (payload) => {
    const error = validateBackup(payload)
    if (error) return { success: false, error }
    setGoal(payload.goal ?? null)
    setProfile(payload.profile ?? DEFAULT_PROFILE)
    setUserSupplements(payload.userSupplements ?? [])
    setCustomSupplements(payload.customSupplements ?? [])
    setMedications(payload.medications ?? [])
    setLog(payload.log ?? {})
    setOutcomes(payload.outcomes ?? [])
    return { success: true }
  }

  const resetAllData = () => {
    clearStoredState(PERSISTED_KEYS)
    setGoal(null)
    setProfile(DEFAULT_PROFILE)
    setTab('calendar')
    setUserSupplements([])
    setMedications([])
    setLog({})
    setOutcomes([])
    setCustomSupplements([])
    setSeenHints({})
  }

  const allSupplements = [...librarySupplements, ...customSupplements]

  const goToEditSupplement = (id) => {
    setEditTarget(id)
    setTab('library')
  }
  const { dueReminders, dismiss } = useReminders(userSupplements)

  const scheduleSupplement = (id, schedule) => {
    setUserSupplements((prev) => {
      const existing = prev.find((u) => u.id === id)
      if (existing) {
        // startDate is intentionally left untouched here — it's set once,
        // the day a supplement is first added, not reset on every edit.
        return prev.map((u) => (u.id === id ? { ...u, ...schedule } : u))
      }
      return [...prev, { id, startDate: todayKey(), ...schedule }]
    })
  }

  const removeSupplement = (id) => {
    setUserSupplements((prev) => prev.filter((u) => u.id !== id))
  }

  const addCustomSupplement = (name) => {
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setCustomSupplements((prev) => [
      ...prev,
      {
        id,
        name,
        category: 'custom',
        isCustom: true,
        rdaAdult: 'Not in our reference library — you entered this yourself',
        upperLimit: 'Not in our reference library — dosing and safety info are outside what this app can check',
        excessSymptoms: [],
        deficiencySymptoms: [],
      },
    ])
    return id
  }

  const removeCustomSupplement = (id) => {
    setCustomSupplements((prev) => prev.filter((s) => s.id !== id))
    removeSupplement(id)
  }

  const markTaken = (date, id) => {
    setLog((prev) => ({
      ...prev,
      [date]: { ...(prev[date] || {}), [id]: !(prev[date]?.[id]) },
    }))
  }

  const requestNotifications = async () => {
    const result = await requestNotificationPermission()
    setNotifStatus(result)
  }

  const dismissHint = (id) => {
    setSeenHints((prev) => ({ ...prev, [id]: true }))
  }

  const handleReminderTaken = (r) => {
    setLog((prev) => {
      const key = todayKey()
      return { ...prev, [key]: { ...(prev[key] || {}), [r.supplementId]: true } }
    })
    dismiss(r.key)
  }

  return (
    <>
      <DisclaimerBanner />
      <ReminderBanner dueReminders={dueReminders} onMarkTaken={handleReminderTaken} onDismiss={dismiss} />

      {/* Kept mounted (just hidden) so Onboarding's in-progress step state
          survives a trip to the Terms/Privacy pages and back. */}
      <div style={{ display: legalView ? 'none' : 'block' }}>
        {!goal ? (
          <Onboarding
            onComplete={({ goal: g, profile: p }) => {
              setGoal(g)
              setProfile(p)
            }}
            onShowLegal={setLegalView}
          />
        ) : (
          <div className="app-shell">
            <nav className="nav-tabs">
              <button className={tab === 'calendar' ? 'active' : ''} onClick={() => setTab('calendar')}>
                <CalendarIcon className="nav-icon" />
                Today
              </button>
              <button className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}>
                <LibraryIcon className="nav-icon" />
                Library
              </button>
              <button className={tab === 'meds' ? 'active' : ''} onClick={() => setTab('meds')}>
                <ShieldIcon className="nav-icon" />
                Interactions
              </button>
              <button className={tab === 'outcomes' ? 'active' : ''} onClick={() => setTab('outcomes')}>
                <LogIcon className="nav-icon" />
                Log
              </button>
              <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
                <ProfileIcon className="nav-icon" />
                Profile
              </button>
            </nav>

            <main className="app-main">
            {tab === 'calendar' && (
              <Calendar
                supplements={allSupplements}
                userSupplements={userSupplements}
                medications={medications}
                profile={profile}
                log={log}
                onMarkTaken={markTaken}
                onEditSupplement={goToEditSupplement}
                seenHints={seenHints}
                onDismissHint={dismissHint}
              />
            )}
            {tab === 'library' && (
              <SupplementLibrary
                userSupplements={userSupplements}
                customSupplements={customSupplements}
                profile={profile}
                goal={goal}
                onSchedule={scheduleSupplement}
                onRemove={removeSupplement}
                onAddCustom={addCustomSupplement}
                onRemoveCustom={removeCustomSupplement}
                editTarget={editTarget}
                onClearEditTarget={() => setEditTarget(null)}
                seenHints={seenHints}
                onDismissHint={dismissHint}
              />
            )}
            {tab === 'meds' && (
              <MedicationCheck
                supplements={allSupplements}
                userSupplements={userSupplements}
                profile={profile}
                medications={medications}
                onAddMedication={(m) => setMedications((p) => (p.some((x) => x.toLowerCase() === m.toLowerCase()) ? p : [...p, m]))}
                onRemoveMedication={(m) => setMedications((p) => p.filter((x) => x !== m))}
                seenHints={seenHints}
                onDismissHint={dismissHint}
              />
            )}
            {tab === 'outcomes' && (
              <OutcomeLog
                outcomes={outcomes}
                onAddOutcome={(o) => setOutcomes((p) => [...p, o])}
                userSupplements={userSupplements}
                supplements={allSupplements}
                log={log}
                seenHints={seenHints}
                onDismissHint={dismissHint}
              />
            )}
            {tab === 'profile' && (
              <Profile
                profile={profile}
                onSave={setProfile}
                goal={goal}
                onSaveGoal={setGoal}
                onShowLegal={setLegalView}
                notifStatus={notifStatus}
                onRequestNotifications={requestNotifications}
                seenHints={seenHints}
                onDismissHint={dismissHint}
                onResetAllData={resetAllData}
                onExportData={exportData}
                onImportData={importData}
              />
            )}
            </main>
          </div>
        )}
      </div>

      {legalView === 'terms' && <TermsOfService onBack={() => setLegalView(null)} />}
      {legalView === 'privacy' && <PrivacyPolicy onBack={() => setLegalView(null)} />}
    </>
  )
}
