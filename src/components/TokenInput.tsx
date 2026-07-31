import { useState, useEffect, useRef } from 'react'
import { ipcInvoke } from '../hooks/useIpc'

interface TokenValidation {
  valid: boolean
  user?: string
  name?: string
  avatarUrl?: string
  profileUrl?: string
  publicRepos?: number
  privateRepos?: number
  scopes?: string[]
  error?: string
}

interface Props {
  token: string
  onTokenChange: (token: string) => void
}

export default function TokenInput({ token, onTokenChange }: Props) {
  const [localToken, setLocalToken] = useState(token)
  const [validating, setValidating] = useState(false)
  const [status, setStatus] = useState<TokenValidation | null>(null)
  const [showToken, setShowToken] = useState(false)
  const hasAutoValidated = useRef(false)

  const validate = async (tokenToTest = localToken) => {
    if (!tokenToTest.trim()) return
    setValidating(true)
    setStatus(null)
    try {
      const result = await ipcInvoke<TokenValidation>(
        'github:validate-token',
        tokenToTest,
      )
      setStatus(result)
      if (result.valid) {
        onTokenChange(tokenToTest)
      }
    } catch {
      setStatus({ valid: false, error: 'Failed to validate token' })
    } finally {
      setValidating(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalToken(token)
    if (token && !hasAutoValidated.current) {
      hasAutoValidated.current = true
      validate(token)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const disconnect = () => {
    setLocalToken('')
    onTokenChange('')
    setStatus(null)
  }

  return (
    <div className="p-5 bg-[#111820] rounded-xl border border-gray-800/80">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-gray-300"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-100">
            GitHub Account
          </h3>
          <p className="text-xs text-gray-500">
            Connect your GitHub account using a Personal Access Token.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type={showToken ? 'text' : 'password'}
            value={localToken}
            onChange={(e) => {
              setLocalToken(e.target.value)
              if (token) onTokenChange('')
              setStatus(null)
            }}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="w-full bg-[#0a0e14] border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 pr-16"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              {showToken ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              ) : (
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </>
              )}
            </svg>
            {showToken ? 'Hide' : 'Show'}
          </button>
        </div>
        <button
          onClick={() => validate()}
          disabled={validating || !localToken.trim()}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg text-sm font-semibold transition-colors text-white"
        >
          {validating ? 'Connecting...' : 'Connect'}
        </button>
      </div>

      {status?.valid && (
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs text-gray-400">Connected as</span>
          <img
            src={status.avatarUrl}
            alt={status.user}
            className="w-5 h-5 rounded-full"
          />
          <span className="text-xs font-semibold text-gray-200">
            {status.user}
          </span>
          <button
            onClick={disconnect}
            className="text-xs text-orange-400 hover:text-orange-300 ml-1"
          >
            Log out
          </button>
        </div>
      )}

      {status && !status.valid && (
        <div className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 mb-3">
          {status.error}
        </div>
      )}

      <div className="mt-6 p-5 glass-panel rounded-xl border border-gray-800/80">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shadow-inner">
              <svg
                className="w-4 h-4 text-gray-300"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-gray-100">
                Personal Access Token
              </h4>
              <p className="text-[11px] text-gray-400">
                Required to list and clone your repositories securely.
              </p>
            </div>
          </div>
          <a
            href="https://github.com/settings/tokens/new?scopes=repo,read:org&description=GitBackup+Desktop+App"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[11px] font-bold rounded-lg border border-orange-500/20 transition-colors flex items-center gap-1.5"
          >
            Create Token
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </a>
        </div>

        <div className="grid grid-cols-4 gap-4 relative">
          <div className="absolute top-4 left-4 right-4 h-[2px] bg-gray-800/60 z-0 rounded-full" />

          <div className="relative z-10">
            <div className="w-8 h-8 bg-gray-800 rounded-full border-4 border-[#111820] flex items-center justify-center shadow-lg mx-auto mb-2 text-[10px] font-bold text-gray-300">
              1
            </div>
            <p className="text-[11px] font-semibold text-gray-200 text-center">
              Settings
            </p>
            <p className="text-[10px] text-gray-500 text-center mt-1">
              Open Developer settings
            </p>
          </div>

          <div className="relative z-10">
            <div className="w-8 h-8 bg-gray-800 rounded-full border-4 border-[#111820] flex items-center justify-center shadow-lg mx-auto mb-2 text-[10px] font-bold text-gray-300">
              2
            </div>
            <p className="text-[11px] font-semibold text-gray-200 text-center">
              Tokens (classic)
            </p>
            <p className="text-[10px] text-gray-500 text-center mt-1">
              Generate new token
            </p>
          </div>

          <div className="relative z-10">
            <div className="w-8 h-8 bg-orange-500/20 rounded-full border-4 border-[#111820] flex items-center justify-center shadow-lg mx-auto mb-2 text-[10px] font-bold text-orange-400">
              3
            </div>
            <p className="text-[11px] font-semibold text-orange-400 text-center">
              Scopes
            </p>
            <p className="text-[10px] text-gray-400 text-center mt-1">
              Select{' '}
              <code className="bg-black/30 px-1 rounded border border-gray-700/50">
                repo
              </code>{' '}
              and{' '}
              <code className="bg-black/30 px-1 rounded border border-gray-700/50">
                read:org
              </code>
            </p>
          </div>

          <div className="relative z-10">
            <div className="w-8 h-8 bg-green-500/20 rounded-full border-4 border-[#111820] flex items-center justify-center shadow-lg mx-auto mb-2 text-[10px] font-bold text-green-400">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <p className="text-[11px] font-semibold text-green-400 text-center">
              Paste
            </p>
            <p className="text-[10px] text-gray-500 text-center mt-1">
              Paste it above
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
