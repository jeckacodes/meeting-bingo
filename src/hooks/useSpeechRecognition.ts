import { useCallback, useEffect, useRef, useState } from 'react'
import { SpeechRecognitionState } from '../types'

const SpeechRecognitionCtor: SpeechRecognitionStatic | undefined =
  typeof window !== 'undefined'
    ? window.SpeechRecognition ?? window.webkitSpeechRecognition
    : undefined

/** Errors that should stop listening and surface a notice (§4 #22a). */
const FATAL_ERRORS = new Set(['not-allowed', 'service-not-allowed'])
/** Cap stored transcript; detection runs on the final fragment only (§4 #22b). */
const MAX_TRANSCRIPT = 500

export interface UseSpeechRecognition extends SpeechRecognitionState {
  startListening: (onFinal?: (finalText: string) => void) => void
  stopListening: () => void
  resetTranscript: () => void
}

/**
 * Web Speech API wrapper. `continuous` + `interimResults`, auto-restart on
 * `onend` while listening (Chrome stops after silence), error classification,
 * capped transcript, and real types — no `(window as any)` (§4 #7, #8, #22).
 */
export function useSpeechRecognition(): UseSpeechRecognition {
  const [state, setState] = useState<SpeechRecognitionState>({
    isSupported: !!SpeechRecognitionCtor,
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const shouldListenRef = useRef(false) // desired state, drives onend restart (§4 #22c)
  const onFinalRef = useRef<((finalText: string) => void) | null>(null)

  useEffect(() => {
    if (!SpeechRecognitionCtor) return

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) final += result[0].transcript
        else interim += result[0].transcript
      }

      if (final) {
        setState((prev) => ({
          ...prev,
          transcript: (prev.transcript + ' ' + final).slice(-MAX_TRANSCRIPT),
          interimTranscript: '',
        }))
        onFinalRef.current?.(final) // detection on final fragments only (§4 #8)
      } else {
        setState((prev) => ({ ...prev, interimTranscript: interim }))
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (FATAL_ERRORS.has(event.error)) {
        shouldListenRef.current = false
        setState((prev) => ({ ...prev, error: event.error, isListening: false }))
      } else {
        // transient (no-speech / aborted / network): keep listening; onend restarts.
        setState((prev) => ({ ...prev, error: event.error }))
      }
    }

    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start()
        } catch {
          /* already started — ignore InvalidStateError */
        }
      } else {
        setState((prev) => ({ ...prev, isListening: false }))
      }
    }

    recognitionRef.current = recognition

    return () => {
      shouldListenRef.current = false
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try {
        recognition.stop()
      } catch {
        /* noop */
      }
      recognitionRef.current = null
    }
  }, [])

  const startListening = useCallback((onFinal?: (finalText: string) => void) => {
    if (!recognitionRef.current) return
    onFinalRef.current = onFinal ?? null
    shouldListenRef.current = true
    setState((prev) => ({ ...prev, isListening: true, error: null }))
    try {
      recognitionRef.current.start()
    } catch {
      /* already running */
    }
  }, [])

  const stopListening = useCallback(() => {
    shouldListenRef.current = false
    onFinalRef.current = null
    setState((prev) => ({ ...prev, isListening: false }))
    try {
      recognitionRef.current?.stop()
    } catch {
      /* noop */
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setState((prev) => ({ ...prev, transcript: '', interimTranscript: '' }))
  }, [])

  return { ...state, startListening, stopListening, resetTranscript }
}
