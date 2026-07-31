import { useState, useCallback, useRef, useEffect } from 'react'
import { useSettings } from '../hooks/useSettings'
import { ipcInvoke } from '../hooks/useIpc'
import { useBackupProgress } from '../hooks/useBackupProgress'
import RepoFilters from '../components/RepoFilters'
import RepoList from '../components/RepoList'
import type {
  RepoInfo,
  RepoFilterSet,
  RepoBackupStage,
  BackupArchive,
} from '../types'

const stageLabels: Record<RepoBackupStage, string> = {
  pending: 'Pending',
  cloning: 'Cloning',
  updating: 'Updating',
  compressing: 'Compressing',
  done: 'Done',
  failed: 'Failed',
  skipped: 'Skipped',
}

const stageColors: Record<RepoBackupStage, string> = {
  pending: 'text-gray-500',
  cloning: 'text-blue-400',
  updating: 'text-blue-400',
  compressing: 'text-yellow-400',
  done: 'text-green-400',
  failed: 'text-red-400',
  skipped: 'text-gray-500',
}

export default function BackupPage() {
  const { settings, updateSettings, loading } = useSettings()
  const [repos, setRepos] = useState<RepoInfo[]>([])
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [history, setHistory] = useState<BackupArchive[]>([])

  const { statuses, logs, summary, running, start, reset, setRunning } =
    useBackupProgress()
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const fetchRepos = useCallback(async () => {
    if (!settings.githubToken) {
      setFetchError('Please set your GitHub token in Setup first.')
      return
    }
    setFetching(true)
    setFetchError(null)
    try {
      const result = await ipcInvoke<RepoInfo[]>(
        'github:fetch-repos',
        settings.githubToken,
        settings.repoFilters,
      )
      setRepos(result)
    } catch (err: any) {
      setFetchError(err.message || 'Failed to fetch repositories')
    } finally {
      setFetching(false)
    }
  }, [settings.githubToken, settings.repoFilters])

  const fetchHistory = useCallback(async () => {
    try {
      const hist = await ipcInvoke<BackupArchive[]>('backup:history')
      setHistory(hist)
    } catch (e) {
      console.error('Failed to fetch backup history:', e)
    }
  }, [])

  useEffect(() => {
    if (!loading && settings.githubToken) {
      if (repos.length === 0 && !fetching) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchRepos()
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, settings.githubToken])

  useEffect(() => {
    if (summary) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchHistory()
    }
  }, [summary, fetchHistory])

  const handleFilterChange = async (filters: RepoFilterSet) => {
    await updateSettings({ repoFilters: filters })
  }

  const handleSelectionChange = async (ids: number[]) => {
    await updateSettings({ selectedRepoIds: ids })
  }

  const handleStart = async () => {
    const selectedRepos = repos.filter((r) =>
      settings.selectedRepoIds.includes(r.id),
    )
    if (selectedRepos.length === 0) {
      alert('Please select at least one repository to backup.')
      return
    }
    if (!settings.backupPath) {
      alert('Please set a backup folder in Setup first.')
      return
    }

    start()
    try {
      await ipcInvoke('backup:start', selectedRepos)
    } catch (err: any) {
      setRunning(false)
      alert(err.message || err || 'Failed to start backup')
    }
  }

  const handleCancel = async () => {
    await ipcInvoke('backup:cancel')
  }

  const handleOpenFolder = async () => {
    if (settings.backupPath) {
      try {
        await ipcInvoke('backup:open-folder', settings.backupPath)
      } catch {
        alert('Failed to open backup folder')
      }
    }
  }

  const completed = statuses.filter(
    (s) => s.stage === 'done' || s.stage === 'failed' || s.stage === 'skipped',
  ).length
  const total = statuses.length || 1
  const overallPercent = Math.round((completed / total) * 100)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-orange-500/70">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm font-medium tracking-wide">
            Loading backup data...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col pb-4 max-w-[1400px]">
      <div className="flex items-center justify-between shrink-0 mb-8">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight">Backup</h2>
          <p className="text-[13px] text-gray-400 mt-1 font-medium">
            {!running && !summary
              ? 'Select repositories and start your backup.'
              : 'Run and monitor your backup progress.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleOpenFolder}
            className="px-4 py-2.5 glass-button rounded-xl text-[13px] font-semibold flex items-center gap-2 text-gray-300"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0A2.25 2.25 0 001.5 12v4.5c0 1.242 1.008 2.25 2.25 2.25h16.5A2.25 2.25 0 0022.5 16.5V12a2.25 2.25 0 00-1.5-2.224M3.75 9.776V7.5A2.25 2.25 0 016 5.25h4.28a2.25 2.25 0 011.59.65l1.86 1.87h4.02A2.25 2.25 0 0120.25 9.75v.026M12 12.75v2.25m0 0l-1.5-1.5m1.5 1.5l1.5-1.5"
              />
            </svg>
            Open Folder
          </button>

          {!running &&
            repos.some((r) => settings.selectedRepoIds.includes(r.id)) && (
              <button
                onClick={handleStart}
                className="px-5 py-2.5 brand-button rounded-xl text-[13px] font-semibold flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                  />
                </svg>
                Start Backup
              </button>
            )}
          {running && (
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-[13px] font-semibold transition-colors text-red-400 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"
                />
              </svg>
              Cancel
            </button>
          )}
          {summary && !running && (
            <button
              onClick={reset}
              className="px-4 py-2.5 glass-button rounded-xl text-[13px] font-medium text-gray-300"
            >
              Clear Status
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar pb-6">
            {!running && !summary && statuses.length === 0 && (
              <div className="space-y-6">
                <div className="p-6 glass-panel rounded-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shadow-inner border border-white/5">
                        <svg
                          className="w-5 h-5 text-orange-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-gray-100">
                          Repository Filters
                        </h3>
                        <p className="text-[12px] text-gray-400 mt-0.5 font-medium">
                          Choose which types of repositories to fetch.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={fetchRepos}
                        disabled={fetching || !settings.githubToken}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-[13px] font-medium transition-colors text-white flex items-center gap-2"
                      >
                        {fetching ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="w-3.5 h-3.5 animate-spin text-orange-400"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Fetching...
                          </span>
                        ) : (
                          <>
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                              />
                            </svg>
                            Refresh
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <RepoFilters
                    filters={settings.repoFilters}
                    onFilterChange={handleFilterChange}
                  />

                  {!settings.githubToken && (
                    <div className="mt-4 text-xs font-medium text-orange-400 flex items-center gap-2 bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      Set your token in Setup first
                    </div>
                  )}

                  {fetchError && (
                    <div className="mt-4 text-xs font-medium px-4 py-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      {fetchError}
                    </div>
                  )}
                </div>

                {repos.length > 0 && (
                  <div className="p-6 glass-panel rounded-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shadow-inner border border-white/5">
                        <svg
                          className="w-5 h-5 text-orange-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-gray-100">
                          Select Repositories
                        </h3>
                        <p className="text-[12px] text-gray-400 mt-0.5 font-medium">
                          Choose which repositories to include in your backup.
                        </p>
                      </div>
                    </div>

                    <RepoList
                      repos={repos}
                      selectedIds={settings.selectedRepoIds}
                      onSelectionChange={handleSelectionChange}
                    />
                  </div>
                )}
              </div>
            )}

            {summary && (
              <div className="p-6 glass-panel rounded-2xl mb-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-green-500/15 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.15)] border border-green-500/20">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-[17px] font-semibold text-gray-100">
                    Backup Complete
                  </h3>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center">
                  <Stat
                    value={summary.totalRepos}
                    label="Total"
                    color="text-gray-100"
                  />
                  <Stat
                    value={summary.succeeded}
                    label="Succeeded"
                    color="text-green-400"
                  />
                  <Stat
                    value={summary.failed}
                    label="Failed"
                    color="text-red-400"
                  />
                  <Stat
                    value={summary.skipped}
                    label="Skipped"
                    color="text-gray-400"
                  />
                </div>

                <div className="mt-4 text-[12px] font-medium text-gray-500 text-center uppercase tracking-widest">
                  Duration: {(summary.duration / 1000).toFixed(1)}s
                </div>

                {summary.errors.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                      Errors
                    </p>
                    {summary.errors.map((e, i) => (
                      <div
                        key={i}
                        className="text-[13px] text-red-300 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl flex items-start gap-3"
                      >
                        <svg
                          className="w-4 h-4 text-red-400 mt-0.5 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <div>
                          <span className="font-semibold">{e.repoName}:</span>{' '}
                          <span className="opacity-90">{e.error}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {running && statuses.length > 0 && (
              <div className="p-6 glass-panel rounded-2xl mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 animate-pulse pointer-events-none" />
                <div className="flex justify-between text-[13px] font-medium text-gray-300 mb-3 relative z-10">
                  <span>
                    {completed} of {statuses.length} repositories
                  </span>
                  <span className="text-orange-400 font-bold">
                    {overallPercent}%
                  </span>
                </div>
                <div className="h-2.5 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5 relative z-10">
                  <div
                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                    style={{ width: `${overallPercent}%` }}
                  />
                </div>
              </div>
            )}

            {(running || statuses.length > 0) && (
              <div className="p-6 glass-panel rounded-2xl mb-6">
                <h3 className="text-[15px] font-semibold text-gray-100 mb-4">
                  Repository Status
                </h3>
                <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                    {statuses
                      .sort((a, b) => {
                        const order: Record<RepoBackupStage, number> = {
                          cloning: 0,
                          updating: 0,
                          compressing: 1,
                          pending: 2,
                          done: 3,
                          failed: 3,
                          skipped: 4,
                        }
                        return (order[a.stage] ?? 9) - (order[b.stage] ?? 9)
                      })
                      .map((s) => (
                        <div
                          key={s.repoId}
                          className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <span
                              className={`text-[12px] font-bold tracking-wider uppercase w-24 shrink-0 ${stageColors[s.stage]}`}
                            >
                              {stageLabels[s.stage]}
                            </span>
                            <span className="text-[14px] font-medium text-gray-200 truncate">
                              {s.repoName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 ml-4 shrink-0">
                            {s.stage !== 'done' &&
                              s.stage !== 'failed' &&
                              s.stage !== 'skipped' &&
                              s.stage !== 'pending' && (
                                <div className="w-24 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                  <div
                                    className="h-full bg-orange-500 rounded-full transition-all"
                                    style={{ width: `${s.progress}%` }}
                                  />
                                </div>
                              )}
                            {s.error && (
                              <span
                                className="text-[12px] font-medium text-red-400 truncate max-w-40"
                                title={s.error}
                              >
                                {s.error}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {logs.length > 0 && (
              <div className="p-6 glass-panel rounded-2xl mb-6">
                <h3 className="text-[15px] font-semibold text-gray-100 mb-4 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                  Activity Log
                </h3>
                <div className="bg-[#050507] border border-white/10 rounded-xl p-4 max-h-64 overflow-y-auto font-mono text-[11px] leading-relaxed shadow-inner custom-scrollbar">
                  {logs.map((entry, i) => (
                    <div
                      key={i}
                      className="flex gap-3 py-1 hover:bg-white/[0.02] px-2 -mx-2 rounded transition-colors"
                    >
                      <span className="text-gray-600 font-semibold shrink-0">
                        {new Date(entry.timestamp).toLocaleTimeString(
                          undefined,
                          { hour12: false },
                        )}
                      </span>
                      <span
                        className={
                          entry.level === 'error'
                            ? 'text-red-400 font-medium'
                            : entry.level === 'warn'
                              ? 'text-yellow-400 font-medium'
                              : 'text-gray-300'
                        }
                      >
                        {entry.message}
                      </span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-0">
          {!running && !summary && history.length > 0 && (
            <div className="h-full flex flex-col glass-panel rounded-2xl overflow-hidden p-0 mb-6">
              <div className="p-6 shrink-0 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shadow-inner border border-white/5">
                    <svg
                      className="w-5 h-5 text-orange-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-gray-100">
                      Backup History
                    </h3>
                    <p className="text-[12px] text-gray-400 mt-0.5 font-medium">
                      Recent completions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#0c1016] shadow-sm z-10">
                    <tr className="border-b border-white/10 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                      <th className="px-5 py-3">Archive Name</th>
                      <th className="px-5 py-3 w-20">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[12px] font-medium text-gray-300">
                    {history.map((h, i) => (
                      <tr
                        key={i}
                        className="hover:bg-white/[0.03] transition-colors group"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-orange-500 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <div className="min-w-0">
                              <div
                                className="truncate text-gray-200"
                                title={h.name}
                              >
                                {h.name}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {new Date(h.modified_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-400">
                          {(h.size / 1024 / 1024).toFixed(1)}{' '}
                          <span className="text-[10px]">MB</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({
  value,
  label,
  color,
}: {
  value: number
  label: string
  color: string
}) {
  return (
    <div className="p-4 bg-black/30 border border-white/5 rounded-xl shadow-inner">
      <div className={`text-[28px] font-bold ${color}`}>{value}</div>
      <div className="text-[11px] font-semibold tracking-wider uppercase text-gray-500 mt-1">
        {label}
      </div>
    </div>
  )
}
