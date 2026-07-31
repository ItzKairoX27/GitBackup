import { useState, useMemo } from 'react'
import type { RepoInfo } from '../types'

interface Props {
  repos: RepoInfo[]
  selectedIds: number[]
  onSelectionChange: (ids: number[]) => void
}

export default function RepoList({
  repos,
  selectedIds,
  onSelectionChange,
}: Props) {
  const [search, setSearch] = useState('')
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const filtered = useMemo(
    () =>
      repos.filter(
        (r) =>
          r.fullName.toLowerCase().includes(search.toLowerCase()) ||
          (r.description || '').toLowerCase().includes(search.toLowerCase()),
      ),
    [repos, search],
  )

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selectedSet.has(r.id))

  const toggleAll = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filtered.map((r) => r.id))
      onSelectionChange(selectedIds.filter((id) => !filteredIds.has(id)))
    } else {
      const newIds = new Set([...selectedIds, ...filtered.map((r) => r.id)])
      onSelectionChange(Array.from(newIds))
    }
  }

  const toggleOne = (id: number) => {
    if (selectedSet.has(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const formatSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`
    if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`
    return `${(kb / (1024 * 1024)).toFixed(1)} GB`
  }

  const sourceColors: Record<string, string> = {
    owned: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    org: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    starred: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    forked: 'text-green-400 bg-green-500/10 border-green-500/20',
    collaborator: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repositories..."
            className="w-full bg-[#0a0e14] border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {selectedIds.length} of {repos.length} selected
        </span>
      </div>

      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <div className="bg-[#0a0e14] px-4 py-2.5 flex items-center gap-3 border-b border-gray-800">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleAll}
            className="rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-orange-500/30"
          />
          <span className="text-xs text-gray-400 font-medium">
            {filtered.length} repositories
          </span>
        </div>

        <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-800/50">
          {filtered.map((repo) => (
            <label
              key={repo.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedSet.has(repo.id)}
                onChange={() => toggleOne(repo.id)}
                className="rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-orange-500/30"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-200 truncate">
                    {repo.fullName}
                  </span>
                  {repo.isPrivate && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                      private
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${sourceColors[repo.source] || 'text-gray-500'}`}
                  >
                    {repo.source}
                  </span>
                </div>
                {repo.description && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {repo.description}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-600 whitespace-nowrap">
                {formatSize(repo.size)}
              </span>
            </label>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              {repos.length === 0
                ? 'No repositories found. Check your filters and token.'
                : 'No repositories match your search.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
