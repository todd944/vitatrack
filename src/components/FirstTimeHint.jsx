// Shown once per screen per session (App.jsx tracks dismissal in `seenHints`,
// keyed by screen id) — since screens unmount when you switch tabs, tracking
// this locally per-component would make the hint reappear every time you
// revisit, so the dismissed state has to live in the always-mounted parent.
export default function FirstTimeHint({ id, seenHints, onDismiss, children }) {
  if (seenHints?.[id]) return null
  return (
    <div className="card" style={{ marginBottom: 12, borderColor: 'var(--brand)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{children}</p>
        <button
          type="button"
          onClick={() => onDismiss(id)}
          aria-label="Dismiss"
          style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}
        >
          ×
        </button>
      </div>
      <button
        type="button"
        className="btn-secondary"
        style={{ marginTop: 10, padding: '6px 12px', fontSize: 13 }}
        onClick={() => onDismiss(id)}
      >
        Got it
      </button>
    </div>
  )
}
