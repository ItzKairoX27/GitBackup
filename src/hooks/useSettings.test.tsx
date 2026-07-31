import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SettingsProvider, useSettings } from './useSettings'
import { ipcInvoke } from './useIpc'

vi.mock('./useIpc', () => ({
  ipcInvoke: vi.fn(),
}))

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SettingsProvider>{children}</SettingsProvider>
  )

  it('fetches settings on mount', async () => {
    const mockSettings = {
      githubToken: 'test-token',
      backupPath: '/tmp/backup',
    }

    ;(ipcInvoke as any).mockResolvedValueOnce(mockSettings)

    const { result } = renderHook(() => useSettings(), { wrapper })

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.settings.githubToken).toBe('test-token')
    expect(result.current.settings.backupPath).toBe('/tmp/backup')
    expect(ipcInvoke).toHaveBeenCalledWith('settings:get')
  })

  it('updates settings optimistically and calls ipcInvoke', async () => {
    const mockSettings = {
      githubToken: 'old-token',
    }

    ;(ipcInvoke as any).mockResolvedValueOnce(mockSettings)

    const { result } = renderHook(() => useSettings(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    ;(ipcInvoke as any).mockResolvedValueOnce(undefined)

    await act(async () => {
      await result.current.updateSettings({ githubToken: 'new-token' })
    })

    expect(result.current.settings.githubToken).toBe('new-token')
    expect(ipcInvoke).toHaveBeenCalledWith('settings:set', {
      githubToken: 'new-token',
    })
  })
})
