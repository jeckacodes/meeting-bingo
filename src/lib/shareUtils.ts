import { formatDuration } from './utils'

export interface ShareSummary {
  categoryName: string
  winningWord: string | null
  durationMs: number | null
  squaresFilled: number
}

/** Build the shareable result text (works pasted into Slack/Teams/Discord). */
export function buildShareText(summary: ShareSummary, url: string): string {
  const lines = [
    '🎯 I got BINGO in Meeting Bingo!',
    `Pack: ${summary.categoryName}`,
    summary.winningWord ? `Winning word: ${summary.winningWord}` : null,
    summary.durationMs != null ? `Time to bingo: ${formatDuration(summary.durationMs)}` : null,
    `Squares filled: ${summary.squaresFilled}`,
  ].filter(Boolean)
  return `${lines.join('\n')}\n\nPlay: ${url}`
}

export type ShareOutcome = 'shared' | 'copied' | 'failed'

/**
 * Share via the native share sheet when available (mobile), otherwise copy to
 * the clipboard (PRD US-4.3). Falls back to clipboard if share is cancelled.
 */
export async function shareResult(text: string): Promise<ShareOutcome> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: 'Meeting Bingo', text })
      return 'shared'
    } catch {
      /* user cancelled or share failed — fall back to clipboard */
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
