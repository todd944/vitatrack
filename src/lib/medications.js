// Matches a user's free-text medication entry against an interaction's
// medication aliases (generic + common brand names), instead of a fragile
// substring match against a single display name. Without this, a user who
// types "Coumadin" instead of "warfarin" gets a false "no flags found."
export function medicationMatches(interactsWith, medications) {
  const aliases = interactsWith.aliases && interactsWith.aliases.length
    ? interactsWith.aliases
    : [interactsWith.name.split(' ')[0].toLowerCase()]

  return medications.some((m) => {
    const mLower = m.toLowerCase().trim()
    if (!mLower) return false
    return aliases.some((alias) => mLower.includes(alias) || alias.includes(mLower))
  })
}
