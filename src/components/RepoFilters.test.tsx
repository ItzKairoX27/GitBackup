import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RepoFilters from './RepoFilters'

describe('RepoFilters', () => {
  const defaultFilters = {
    owned: true,
    organization: false,
    starred: false,
    forked: false,
    collaborator: false,
  }

  it('renders all filter buttons', () => {
    render(<RepoFilters filters={defaultFilters} onFilterChange={vi.fn()} />)

    expect(screen.getByText('Owned')).toBeInTheDocument()
    expect(screen.getByText('Organization')).toBeInTheDocument()
    expect(screen.getByText('Starred')).toBeInTheDocument()
    expect(screen.getByText('Forked')).toBeInTheDocument()
    expect(screen.getByText('Collaborator')).toBeInTheDocument()
  })

  it('calls onFilterChange when a button is clicked', () => {
    const onFilterChange = vi.fn()
    render(
      <RepoFilters filters={defaultFilters} onFilterChange={onFilterChange} />,
    )

    fireEvent.click(screen.getByText('Organization'))

    expect(onFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      organization: true,
    })
  })

  it('applies correct styling for active filters', () => {
    render(<RepoFilters filters={defaultFilters} onFilterChange={vi.fn()} />)

    const ownedBtn = screen.getByText('Owned')
    expect(ownedBtn.className).toContain('text-orange-400')

    const orgBtn = screen.getByText('Organization')
    expect(orgBtn.className).toContain('text-gray-500')
  })
})
