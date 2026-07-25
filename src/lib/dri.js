// Picks the right Dietary Reference Intake band for a supplement given a
// user's health profile (sex, age band, pregnancy/lactation), and checks a
// chosen dosage against that band's upper limit (UL).
//
// This is a simplified DRI model (2-3 age bands, no per-trimester nuance)
// intended for a consumer scheduling app, not a clinical dosing tool. Source:
// National Academies DRI tables via NIH ODS fact sheets, per-supplement.

export function pickDri(supplement, profile) {
  if (!supplement.dri || !supplement.dri.bands) return null
  const bands = supplement.dri.bands
  const p = profile || {}

  let band = null
  if (p.pregnant) band = bands.find((b) => b.match.pregnant)
  if (!band && p.lactating) band = bands.find((b) => b.match.lactating)
  if (!band) band = bands.find((b) => b.match.ageBand === p.ageBand && b.match.sex === p.sex)
  if (!band) band = bands.find((b) => b.match.ageBand === p.ageBand && b.match.sex === 'any')
  if (!band) band = bands[0]

  if (!band) return null
  return { rda: band.rda, ul: band.ul ?? null, unit: supplement.dri.unit, label: band.label, note: supplement.dri.note || null }
}

export function parseDosageValue(dosageStr) {
  if (!dosageStr) return null
  const match = String(dosageStr).match(/-?\d+(\.\d+)?/)
  return match ? parseFloat(match[0]) : null
}

// level: 'over' (>=100% of UL), 'near' (>=80%), 'ok', or null if there's no
// DRI/UL data to compare against.
export function ulStatusFor(supplement, dosageStr, profile) {
  const dri = pickDri(supplement, profile)
  if (!dri || !dri.ul) return { dri, level: null, pct: null }
  const value = parseDosageValue(dosageStr)
  if (value == null) return { dri, level: null, pct: null }
  const pct = (value / dri.ul) * 100
  let level = 'ok'
  if (pct >= 100) level = 'over'
  else if (pct >= 80) level = 'near'
  return { dri, level, pct, value }
}
