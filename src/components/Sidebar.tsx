import { NavLink } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'

const links = [
  {
    to: '/setup',
    label: 'Setup',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    to: '/backup',
    label: 'Backup',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
        />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
        />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { settings } = useSettings()
  const isReady = settings.githubToken && settings.backupPath

  return (
    <aside className="w-64 glass-panel z-20 flex flex-col border-r-0 border-y-0 border-l-0 shadow-[4px_0_24px_rgba(0,0,0,0.3)]">
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3.5">
          <img
            src="/gitbackup.png"
            alt="GitBackup Logo"
            className="w-10 h-10 rounded-xl shadow-lg shadow-orange-500/20 object-contain"
          />
          <div>
            <h1 className="text-[15px] font-bold text-white tracking-wide">
              GitBackup
            </h1>
            <p className="text-[11px] font-medium text-gray-400 mt-0.5">
              GitHub Repository Backup
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-200 relative ${
                isActive
                  ? 'text-white bg-orange-500/10 shadow-sm border border-orange-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                )}
                <div
                  className={`${isActive ? 'text-orange-400' : 'text-gray-500'} transition-colors`}
                >
                  {link.icon}
                </div>
                {link.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <div
          className={`p-4 rounded-xl border backdrop-blur-md transition-colors duration-300 ${isReady ? 'bg-green-500/5 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : 'bg-white/5 border-white/10'}`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shadow-inner ${isReady ? 'bg-green-500/20' : 'bg-gray-700/50'}`}
            >
              {isReady ? (
                <svg
                  className="w-3.5 h-3.5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div>
              <p
                className={`text-[13px] font-semibold tracking-wide ${isReady ? 'text-green-400' : 'text-gray-300'}`}
              >
                {isReady ? 'Ready to backup' : 'Setup required'}
              </p>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                {isReady
                  ? 'Your repositories are safe with GitBackup.'
                  : 'Configure token and backup folder.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-white/5 space-y-2 bg-black/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-gray-500 tracking-widest uppercase">
            v1.0.0
          </span>
          <NavLink
            to="/settings"
            className="text-gray-500 hover:text-orange-400 transition-colors duration-200"
            title="Settings"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </NavLink>
        </div>
        <a
          href="https://github.com/ItzKairoX27"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-gray-500 hover:text-orange-400 transition-colors flex items-center gap-1 font-medium"
        >
          A product by ItzKairoX27
        </a>
      </div>
    </aside>
  )
}
