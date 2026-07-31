import type { RepoFilterSet } from '../types'

interface Props {
  filters: RepoFilterSet
  onFilterChange: (filters: RepoFilterSet) => void
}

const filterLabels: Record<keyof RepoFilterSet, string> = {
  owned: 'Owned',
  organization: 'Organization',
  starred: 'Starred',
  forked: 'Forked',
  collaborator: 'Collaborator',
}

export default function RepoFilters({ filters, onFilterChange }: Props) {
  const toggle = (key: keyof RepoFilterSet) => {
    onFilterChange({ ...filters, [key]: !filters[key] })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(filterLabels) as Array<keyof RepoFilterSet>).map((key) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            filters[key]
              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
              : 'bg-[#0a0e14] text-gray-500 border-gray-800 hover:border-gray-700 hover:text-gray-400'
          }`}
        >
          {filterLabels[key]}
        </button>
      ))}
    </div>
  )
}
