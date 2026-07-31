import { useSettings } from '../hooks/useSettings'
import type { ScheduleConfig } from '../types'

export default function SettingsPage() {
  const { settings, updateSettings, loading } = useSettings()

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

  const schedule = settings.schedule
  const updateSchedule = (partial: Partial<ScheduleConfig>) => {
    updateSettings({ schedule: { ...schedule, ...partial } })
  }

  return (
    <div className="h-full flex flex-col max-w-3xl">
      <div className="shrink-0 mb-8">
        <h2 className="text-[28px] font-bold mb-1 tracking-tight">Settings</h2>
        <p className="text-[13px] text-gray-400 mt-1 font-medium">
          Configure backup schedule and app preferences.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 pb-12 space-y-6 custom-scrollbar">
        <div className="p-6 glass-panel rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shadow-inner border border-white/5">
                <svg
                  className="w-5 h-5 text-gray-300"
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
                  Scheduled Backups
                </h3>
                <p className="text-[12px] text-gray-400 mt-0.5 font-medium">
                  Automatically run backups on a schedule.
                </p>
              </div>
            </div>

            <button
              onClick={() => updateSchedule({ enabled: !schedule.enabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                schedule.enabled
                  ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                  : 'bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                  schedule.enabled ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {schedule.enabled && (
            <div className="space-y-5 p-5 bg-black/20 rounded-xl border border-white/5 shadow-inner">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() =>
                    updateSchedule({ frequency: 'interval', intervalHours: 6 })
                  }
                  className={`px-3 py-2.5 rounded-lg text-[12px] font-semibold transition-all border ${
                    schedule.frequency === 'interval' &&
                    schedule.intervalHours === 6
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/10'
                  }`}
                >
                  Every 6 Hours
                </button>
                <button
                  onClick={() =>
                    updateSchedule({ frequency: 'interval', intervalHours: 12 })
                  }
                  className={`px-3 py-2.5 rounded-lg text-[12px] font-semibold transition-all border ${
                    schedule.frequency === 'interval' &&
                    schedule.intervalHours === 12
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/10'
                  }`}
                >
                  Every 12 Hours
                </button>
                <button
                  onClick={() =>
                    updateSchedule({ frequency: 'daily', time: '00:00' })
                  }
                  className={`px-3 py-2.5 rounded-lg text-[12px] font-semibold transition-all border ${
                    schedule.frequency === 'daily' && schedule.time === '00:00'
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/10'
                  }`}
                >
                  Daily at Midnight
                </button>
                <button
                  onClick={() =>
                    updateSchedule({
                      frequency: 'weekly',
                      time: '00:00',
                      dayOfWeek: 0,
                    })
                  }
                  className={`px-3 py-2.5 rounded-lg text-[12px] font-semibold transition-all border ${
                    schedule.frequency === 'weekly' &&
                    schedule.time === '00:00' &&
                    schedule.dayOfWeek === 0
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/10'
                  }`}
                >
                  Weekly on Sunday
                </button>
              </div>

              <div className="pt-4 border-t border-white/5">
                <h4 className="text-[12px] font-semibold tracking-wider text-gray-400 uppercase mb-4">
                  Advanced Configuration
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase mb-2">
                      Frequency Type
                    </label>
                    <div className="flex gap-2">
                      {(
                        ['interval', 'daily', 'weekly', 'monthly'] as const
                      ).map((f) => (
                        <button
                          key={f}
                          onClick={() => updateSchedule({ frequency: f })}
                          className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all border ${
                            schedule.frequency === f
                              ? 'bg-white/10 text-white border-white/20'
                              : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/[0.07]'
                          }`}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {schedule.frequency === 'interval' && (
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 uppercase mb-2">
                        Every X Hours
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={72}
                        value={schedule.intervalHours ?? 6}
                        onChange={(e) =>
                          updateSchedule({
                            intervalHours: Number(e.target.value),
                          })
                        }
                        className="glass-input rounded-xl px-4 py-2 text-[13px] text-gray-100 focus:border-orange-500/50 w-full max-w-[200px]"
                      />
                    </div>
                  )}

                  {schedule.frequency !== 'interval' && (
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 uppercase mb-2">
                        Time of Day
                      </label>
                      <input
                        type="time"
                        value={schedule.time}
                        onChange={(e) =>
                          updateSchedule({ time: e.target.value })
                        }
                        className="glass-input rounded-xl px-4 py-2 text-[13px] text-gray-100 focus:border-orange-500/50 w-full max-w-[200px]"
                      />
                    </div>
                  )}

                  {schedule.frequency === 'weekly' && (
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 uppercase mb-2">
                        Day of Week
                      </label>
                      <select
                        value={schedule.dayOfWeek ?? 0}
                        onChange={(e) =>
                          updateSchedule({ dayOfWeek: Number(e.target.value) })
                        }
                        className="glass-input rounded-xl px-4 py-2 text-[13px] text-gray-100 focus:border-orange-500/50 w-full max-w-[200px]"
                      >
                        {[
                          'Sunday',
                          'Monday',
                          'Tuesday',
                          'Wednesday',
                          'Thursday',
                          'Friday',
                          'Saturday',
                        ].map((day, i) => (
                          <option key={i} value={i} className="bg-[#06080a]">
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {schedule.frequency === 'monthly' && (
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 uppercase mb-2">
                        Day of Month
                      </label>
                      <select
                        value={schedule.dayOfMonth ?? 1}
                        onChange={(e) =>
                          updateSchedule({ dayOfMonth: Number(e.target.value) })
                        }
                        className="glass-input rounded-xl px-4 py-2 text-[13px] text-gray-100 focus:border-orange-500/50 w-full max-w-[200px]"
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(
                          (d) => (
                            <option key={d} value={d} className="bg-[#06080a]">
                              {d}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 glass-panel rounded-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shadow-inner border border-white/5">
              <svg
                className="w-5 h-5 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-gray-100">
                Performance
              </h3>
              <p className="text-[12px] text-gray-400 mt-0.5 font-medium">
                Configure parallel processing for backups.
              </p>
            </div>
          </div>

          <div className="bg-black/20 p-5 rounded-xl border border-white/5">
            <label className="block text-[12px] font-semibold tracking-wider text-gray-400 uppercase mb-4">
              Concurrency Limit:{' '}
              <span className="text-orange-400 font-bold ml-1">
                {settings.concurrencyLimit}
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={settings.concurrencyLimit}
              onChange={(e) =>
                updateSettings({ concurrencyLimit: Number(e.target.value) })
              }
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-[11px] font-medium text-gray-500 mt-2">
              <span>1 (slower, less resources)</span>
              <span>10 (faster, more resources)</span>
            </div>
          </div>
        </div>

        <div className="p-6 glass-panel rounded-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shadow-inner border border-white/5">
              <svg
                className="w-5 h-5 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M12 15.75V3m0 0l-3 3m3-3l3 3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-gray-100">
                Retention Policy
              </h3>
              <p className="text-[12px] text-gray-400 mt-0.5 font-medium">
                Manage how many backups are kept per repository.
              </p>
            </div>
          </div>

          <div className="bg-black/20 p-5 rounded-xl border border-white/5">
            <label className="block text-[12px] font-semibold tracking-wider text-gray-400 uppercase mb-4">
              Backups to Keep:{' '}
              <span className="text-orange-400 font-bold ml-1">
                {settings.retentionLimit ?? 10}
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={50}
              value={settings.retentionLimit ?? 10}
              onChange={(e) =>
                updateSettings({ retentionLimit: Number(e.target.value) })
              }
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-[11px] font-medium text-gray-500 mt-2">
              <span>1 (minimum)</span>
              <span>50 (maximum)</span>
            </div>
          </div>
        </div>

        <div className="p-6 glass-panel rounded-2xl border-orange-500/10 bg-gradient-to-br from-orange-500/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18L18.36 7.5 12 10.82 5.64 7.5 12 4.18zM5 8.82l6 3.33v7.03l-6-3.33V8.82zm8 10.36V12.15l6-3.33v7.03l-6 3.33z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-100">
                GitBackup v1.0.0
              </h3>
              <p className="text-[12px] text-gray-400 mt-0.5 font-medium">
                Settings are stored locally and encrypted. Your token never
                leaves this machine.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
