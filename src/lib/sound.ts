// Synthesized win chime via the Web Audio API — no audio files, so no media
// assets and no CSP media-src needed. Opt-in only (see useSoundPreference);
// the game stays silent by default per the locked scope.

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined' || !window.AudioContext) return null
  try {
    if (!ctx) ctx = new window.AudioContext()
    return ctx
  } catch {
    return null
  }
}

/** Play a short ascending "ta-da" arpeggio. No-op if Web Audio is unavailable. */
export function playWinChime(): void {
  const audio = getCtx()
  if (!audio) return
  try {
    if (audio.state === 'suspended') void audio.resume()

    const now = audio.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5 · E5 · G5 · C6
    notes.forEach((freq, i) => {
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq

      const start = now + i * 0.12
      const dur = 0.18
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)

      osc.connect(gain).connect(audio.destination)
      osc.start(start)
      osc.stop(start + dur + 0.02)
    })
  } catch {
    /* audio blocked or unavailable — silently ignore */
  }
}
