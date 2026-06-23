// Buzzword matching. Single tokens match on word boundaries; only genuine
// multi-word phrases use substring matching. Already-filled words are skipped.
// Alias hygiene per §4 #16: no `api -> interface` (matches "user interface"),
// no dotted aliases (speech emits no dots).

/** Escape regex metacharacters. */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Normalize text for comparison. */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .trim()
}

/** True if `needle` occurs in `haystack`: boundary match for single tokens, substring for phrases. */
function occurs(haystack: string, needle: string): boolean {
  const n = normalizeText(needle)
  if (!n) return false
  if (n.includes(' ')) return haystack.includes(n)
  return new RegExp(`\\b${escapeRegex(n)}\\b`, 'i').test(haystack)
}

/**
 * Detect which of `cardWords` appear in `transcript`, skipping any already filled.
 */
export function detectWords(
  transcript: string,
  cardWords: string[],
  alreadyFilled: Set<string>,
): string[] {
  const normalized = normalizeText(transcript)
  const detected: string[] = []

  for (const word of cardWords) {
    if (alreadyFilled.has(word.toLowerCase())) continue
    if (occurs(normalized, word)) detected.push(word)
  }

  return detected
}

/**
 * Common spoken variations mapped to card words. Single-token aliases are
 * boundary-matched; multi-word aliases use substring (§4 #16).
 */
export const WORD_ALIASES: Record<string, string[]> = {
  'ci/cd': ['continuous integration', 'ci cd', 'cicd'],
  mvp: ['minimum viable product'],
  roi: ['return on investment'],
  devops: ['dev ops', 'dev-ops'],
}

/** Detection plus alias resolution. */
export function detectWordsWithAliases(
  transcript: string,
  cardWords: string[],
  alreadyFilled: Set<string>,
): string[] {
  const detected = detectWords(transcript, cardWords, alreadyFilled)
  const normalized = normalizeText(transcript)

  for (const word of cardWords) {
    if (alreadyFilled.has(word.toLowerCase())) continue
    if (detected.includes(word)) continue

    const aliases = WORD_ALIASES[word.toLowerCase()]
    if (!aliases) continue

    if (aliases.some((alias) => occurs(normalized, alias))) {
      detected.push(word)
    }
  }

  return detected
}
