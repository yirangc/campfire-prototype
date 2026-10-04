import { useCallback, useEffect, useRef, useState } from 'react'
import { initialState, reduce, type Action, type Result } from './domain/engine'
import { clear, load, save, type LoadResult } from './domain/persistence'
import type { CaseDraft, ReconState } from './domain/types'

export type SaveStatus = { kind: 'idle' } | { kind: 'saved'; at: string } | { kind: 'failed'; error: string }

export interface Recon {
  state: ReconState
  dispatch: (action: Action) => Result
  setDraft: (key: string, draft: CaseDraft | null) => void
  saveStatus: SaveStatus
  retrySave: () => void
  /** Set when saved progress could not be read. The app shows a recovery screen until Maya chooses. */
  unreadable: Extract<LoadResult, { kind: 'unreadable' }> | null
  resetDemo: () => void
  retryLoad: () => void
}

const now = () => new Date().toISOString()

function initial(): { state: ReconState; unreadable: Recon['unreadable'] } {
  const loaded = load()
  if (loaded.kind === 'ok') return { state: loaded.state, unreadable: null }
  if (loaded.kind === 'unreadable') return { state: initialState(), unreadable: loaded }
  return { state: initialState(), unreadable: null }
}

/**
 * Holds reconciliation state, applies actions through the pure reducer and saves after every change.
 * While saved data is unreadable nothing is written, so the original data is never overwritten silently.
 */
export function useRecon(): Recon {
  const [boot] = useState(initial)
  const [state, setState] = useState<ReconState>(boot.state)
  const [unreadable, setUnreadable] = useState<Recon['unreadable']>(boot.unreadable)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: 'idle' })
  const stateRef = useRef(state)
  const dirty = useRef(false)

  useEffect(() => {
    stateRef.current = state
    if (!dirty.current || unreadable) return
    const result = save(state, now())
    setSaveStatus(result.ok ? { kind: 'saved', at: result.at } : { kind: 'failed', error: result.error })
  }, [state, unreadable])

  // Synchronous against the latest state, so two clicks in the same frame see each other (no duplicate entries).
  const dispatch = useCallback((action: Action): Result => {
    const result = reduce(stateRef.current, action, now())
    if (result.ok && result.state !== stateRef.current) {
      stateRef.current = result.state
      dirty.current = true
      setState(result.state)
    }
    return result
  }, [])

  const setDraft = useCallback((key: string, draft: CaseDraft | null) => {
    dispatch({ type: 'set-draft', key, draft })
  }, [dispatch])

  const retrySave = useCallback(() => {
    const result = save(stateRef.current, now())
    setSaveStatus(result.ok ? { kind: 'saved', at: result.at } : { kind: 'failed', error: result.error })
  }, [])

  const resetDemo = useCallback(() => {
    clear()
    const fresh = initialState()
    stateRef.current = fresh
    dirty.current = true
    setUnreadable(null)
    setState(fresh)
  }, [])

  const retryLoad = useCallback(() => {
    const next = initial()
    stateRef.current = next.state
    dirty.current = false
    setUnreadable(next.unreadable)
    setState(next.state)
  }, [])

  return { state, dispatch, setDraft, saveStatus, retrySave, unreadable, resetDemo, retryLoad }
}
