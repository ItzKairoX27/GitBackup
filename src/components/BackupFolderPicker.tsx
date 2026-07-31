import { ipcInvoke } from '../hooks/useIpc'

interface Props {
  path: string
  onPathChange: (path: string) => void
}

export default function BackupFolderPicker({ path, onPathChange }: Props) {
  const selectFolder = async () => {
    const selected = await ipcInvoke<string | null>('dialog:select-folder')
    if (selected) {
      onPathChange(selected)
    }
  }

  return (
    <div className="p-5 bg-[#111820] rounded-xl border border-gray-800/80">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center">
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
              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-100">Backup Folder</h3>
          <p className="text-xs text-gray-500">
            Choose where your repositories will be cloned locally.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={path}
            readOnly
            placeholder="No folder selected"
            className="w-full bg-[#0a0e14] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 cursor-default focus:outline-none focus:border-orange-500/50"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {path ? (
              <svg
                className="w-4 h-4 text-green-500"
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
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
                />
              </svg>
            )}
          </div>
        </div>
        <button
          onClick={selectFolder}
          className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-gray-300 border border-transparent hover:border-gray-600"
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
              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
            />
          </svg>
          Browse
        </button>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <svg
          className="w-4 h-4 text-orange-500/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <p className="text-[11px] text-gray-400">
          Make sure your selected drive has enough free space to store all your
          codebase histories.
        </p>
      </div>
    </div>
  )
}
