export default function ReminderBanner({ dueReminders, onMarkTaken, onDismiss }) {
  if (dueReminders.length === 0) return null
  return (
    <div>
      {dueReminders.map((r) => (
        <div key={r.key} className="reminder-toast">
          <span>Time to take <strong>{r.name}</strong> ({r.dosage})</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12, background: 'white' }} onClick={() => onMarkTaken(r)}>
              Mark taken
            </button>
            <button
              onClick={() => onDismiss(r.key)}
              aria-label="Dismiss"
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
