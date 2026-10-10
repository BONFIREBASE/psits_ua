/**
 * Shared validation utilities for Community handles and pseudonym privacy.
 * Kept in a client/server agnostic module so it can be used synchronously
 * in React components and asynchronously in server actions without violating
 * Next.js 'use server' constraints (Server Actions must be async).
 */

export function detectProhibitedHandle(
  rawUsername: string,
  userEmail?: string,
  fullName?: string
): { prohibited: boolean; reason: string } {
  const clean = (rawUsername || '').trim().toLowerCase().replace(/^@/, '')
  if (!clean) return { prohibited: false, reason: '' }

  // 1. Prohibit Student ID / Institutional Email Prefix / ID Patterns
  const emailPrefix = (userEmail || '').split('@')[0].toLowerCase().trim()
  const isStudentIdPattern = /^\d{4}[sS-]?\d{4,}$/.test(clean) || /^\d{5,12}$/.test(clean)

  if (
    (emailPrefix && clean === emailPrefix) ||
    (emailPrefix.length >= 4 && clean.includes(emailPrefix)) ||
    isStudentIdPattern
  ) {
    return { prohibited: true, reason: 'Student ID and email cannot be used as username' }
  }

  // 2. Prohibit Full Legal Name (Single names/nicknames like first or second name ARE allowed)
  if (fullName && fullName.trim().length > 0) {
    const compactFullName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '')
    const strippedUsername = clean.replace(/[^a-z0-9]/g, '')

    // Block exact concatenated full name (e.g. "juandelacruz")
    if (compactFullName.length >= 4 && strippedUsername === compactFullName) {
      return { prohibited: true, reason: 'Full name not allowed · Protect your privacy' }
    }

    // Tokenize full name components (e.g. ["juan", "carlos", "dela", "cruz"])
    const tokens = fullName
      .toLowerCase()
      .split(/[\s,.-]+/)
      .filter((t) => t.length >= 2)

    // If student has multiple name parts (e.g., First & Last), and ALL significant tokens (>2 chars) are in the username
    const significantTokens = tokens.filter((t) => t.length > 2)
    if (significantTokens.length >= 2) {
      const matchCount = significantTokens.filter((t) => strippedUsername.includes(t)).length
      if (matchCount === significantTokens.length) {
        return { prohibited: true, reason: 'Full name not allowed · Protect your privacy' }
      }
    }
  }

  return { prohibited: false, reason: '' }
}
