// Small stroke-based icons (feather-icons style, 24x24 viewBox, currentColor
// stroke) shared between the bottom nav and each tab's page header so the
// icon reads as a consistent signature for that section.

const base = { viewBox: '0 0 24 24' }

export function CalendarIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  )
}

export function LibraryIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17z" />
      <line x1="4" y1="19" x2="20" y2="19" />
    </svg>
  )
}

export function ShieldIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" />
      <polyline points="8.5 12 11 14.5 15.5 9.5" />
    </svg>
  )
}

export function LogIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V3" />
      <line x1="8" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="13" y2="15" />
    </svg>
  )
}

export function ProfileIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  )
}
