import { useNavigate } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'
import TokenInput from '../components/TokenInput'
import BackupFolderPicker from '../components/BackupFolderPicker'

export default function SetupPage() {
  const { settings, updateSettings, loading } = useSettings()
  const navigate = useNavigate()

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
            Loading settings...
          </span>
        </div>
      </div>
    )
  }

  const isReady = settings.githubToken && settings.backupPath

  return (
    <div className="h-full flex flex-col max-w-3xl">
      <div className="flex items-end justify-between mb-8 shrink-0">
        <div>
          <h2 className="text-[28px] font-bold mb-1 tracking-tight">Setup</h2>
          <p className="text-[13px] text-gray-400 font-medium">
            Configure your GitHub account and local backup location.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-bold text-orange-500 uppercase tracking-wider mb-1">
            Progress
          </div>
          <div className="flex gap-1">
            <div
              className={`w-10 h-1.5 rounded-full transition-colors ${settings.githubToken ? 'bg-orange-500' : 'bg-gray-800'}`}
            />
            <div
              className={`w-10 h-1.5 rounded-full transition-colors ${settings.backupPath ? 'bg-orange-500' : 'bg-gray-800'}`}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 pb-12 space-y-6 custom-scrollbar">
        <div className="relative">
          {!settings.githubToken && (
            <div className="absolute -left-10 top-6 w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold border border-orange-500/30">
              1
            </div>
          )}
          <TokenInput
            token={settings.githubToken}
            onTokenChange={(token) => updateSettings({ githubToken: token })}
          />
        </div>

        <div className="relative">
          {!settings.backupPath && (
            <div className="absolute -left-10 top-6 w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold border border-orange-500/30">
              2
            </div>
          )}
          <BackupFolderPicker
            path={settings.backupPath}
            onPathChange={(backupPath) => updateSettings({ backupPath })}
          />
        </div>

        {isReady && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 glass-panel !border-green-500/30 !bg-green-500/10 mt-8 shadow-[0_0_30px_rgba(34,197,94,0.15)] rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent pointer-events-none" />
              <div className="flex items-center gap-5 relative z-10 mb-4 sm:mb-0">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                  <svg
                    className="w-6 h-6 text-green-400"
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
                <div>
                  <p className="text-[16px] font-bold text-green-400">
                    Setup complete!
                  </p>
                  <p className="text-[13px] text-gray-400 mt-0.5 font-medium">
                    Everything is ready. Head to the{' '}
                    <span className="text-gray-200">Backup</span> tab to start.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/backup')}
                className="relative z-10 px-6 py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-105"
              >
                Go to Backup
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
