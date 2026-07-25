// Small dependency-free Levenshtein-distance fuzzy matcher, used to suggest
// supplements even when the user's spelling is a bit off (e.g. "ashwaganda"
// instead of "ashwagandha").

function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  let prev = new Array(n + 1)
  let curr = new Array(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      )
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[n]
}

// Words under 3 letters (e.g. "d" from "Vitamin D", "s" from "John's") are
// filtered out — they're not meaningful search targets and, worse, would
// trivially satisfy the substring shortcut below for almost any query.
function tokenize(str) {
  return str.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3)
}

// How many typos to tolerate, scaled to query length — very short queries
// still get a little slack (one typo), so a partial/misspelled start like
// "tum" can still reach "Turmeric" rather than requiring a clean substring.
function tolerance(len) {
  if (len <= 2) return 0
  if (len <= 5) return 1
  return Math.min(3, Math.floor(len / 3))
}

// Best (lowest) edit distance between the query and any of a supplement's
// searchable strings — full name, aliases, and individual words within
// them (so "omeg" still finds "Omega-3 (Fish Oil)" via the word "omega").
function bestDistance(query, supplement) {
  const q = query.toLowerCase().trim()
  if (!q) return Infinity

  const strings = [supplement.name, ...(supplement.aliases || [])]
  const words = new Set()
  strings.forEach((s) => tokenize(s).forEach((w) => words.add(w)))
  const candidates = [...strings.map((s) => s.toLowerCase()), ...words]

  let best = Infinity
  for (const c of candidates) {
    if (c.includes(q) || (q.length > 3 && c.length >= 4 && q.includes(c))) return 0
    // Plain full-string edit distance penalizes a short, partially-typed or
    // typo'd query against a much longer word purely for the length gap —
    // "tum" vs "turmeric" scores ~5 that way even though the first three
    // letters are one typo off. Comparing against just the word's own
    // same-length prefix isolates the typo from the length mismatch.
    if (c.length > q.length) {
      const prefixDist = levenshtein(q, c.slice(0, q.length))
      if (prefixDist < best) best = prefixDist
    }
    const dist = levenshtein(q, c)
    if (dist < best) best = dist
  }
  return best
}

// A bare single letter is normally too short to search on at all (would
// match almost everything, hence the length<2 cutoff below) — but vitamins
// are specifically named by letter ("Vitamin D", "Vitamin B12"), so a
// single letter is actually a complete, unambiguous query in that one
// case. \b keeps "d" from matching some unrelated word that merely
// contains a "d", and \d* lets it also catch "Vitamin B12" etc. when the
// letter is "b".
function matchesVitaminLetter(name, letter) {
  return new RegExp(`\\bvitamin\\s+${letter}\\d*\\b`, 'i').test(name)
}

// Returns supplements ranked by closeness to the query, including
// close-spelling (typo) matches, not just exact substrings.
export function getSuggestions(query, items, { limit = 6 } = {}) {
  const q = query.trim()

  if (q.length === 1) {
    if (!/^[a-z]$/i.test(q)) return []
    return items.filter((s) => matchesVitaminLetter(s.name, q)).slice(0, limit)
  }
  if (q.length < 2) return []

  return items
    .map((s) => ({ supplement: s, distance: bestDistance(q, s) }))
    .filter(({ distance }) => distance <= tolerance(q.length))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ supplement }) => supplement)
}
