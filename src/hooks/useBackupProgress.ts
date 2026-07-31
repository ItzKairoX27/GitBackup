import { useState, useCallback, useRef, useEffect } from 'react'
import { useIpcListener, ipcInvoke } from './useIpc'
import type { RepoBackupStatus, LogEntry, BackupSummary } from '../types'

export function useBackupProgress() {
  const [statuses, setStatuses] = useState<Map<number, RepoBackupStatus>>(
    new Map(),
  )
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [summary, setSummary] = useState<BackupSummary | null>(null)
  const [running, setRunning] = useState(false)
  const statusesRef = useRef(statuses)

  useEffect(() => {
    statusesRef.current = statuses
  }, [statuses])

  useEffect(() => {
    const fetchState = async () => {
      try {
        const state: any = await ipcInvoke('backup:get-state')
        if (state) {
          if (state.running) setRunning(true)
          if (state.summary) setSummary(state.summary)
          if (state.logs && state.logs.length > 0) setLogs(state.logs)

          if (state.statuses) {
            const nextStatuses = new Map<number, RepoBackupStatus>()
            for (const [key, val] of Object.entries(state.statuses)) {
              nextStatuses.set(Number(key), val as RepoBackupStatus)
            }
            if (nextStatuses.size > 0) {
              setStatuses(nextStatuses)
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch initial backup state:', err)
      }
    }
    fetchState()
  }, [])

  const handleProgress = useCallback((...args: unknown[]) => {
    const status = args[0] as RepoBackupStatus
    setStatuses((prev) => {
      const next = new Map(prev)
      next.set(status.repoId, status)
      return next
    })
  }, [])

  const handleLog = useCallback((...args: unknown[]) => {
    const entry = args[0] as LogEntry
    setLogs((prev) => [...prev, entry])
  }, [])

  const handleComplete = useCallback((...args: unknown[]) => {
    const sum = args[0] as BackupSummary
    setSummary(sum)
    setRunning(false)
  }, [])

  useIpcListener('backup:progress', handleProgress)
  useIpcListener('backup:log', handleLog)
  useIpcListener('backup:complete', handleComplete)

  const reset = useCallback(() => {
    setStatuses(new Map())
    setLogs([])
    setSummary(null)
  }, [])

  const start = useCallback(() => {
    reset()
    setRunning(true)
  }, [reset])

  return {
    statuses: Array.from(statuses.values()),
    logs,
    summary,
    running,
    start,
    reset,
    setRunning,
  }
}
