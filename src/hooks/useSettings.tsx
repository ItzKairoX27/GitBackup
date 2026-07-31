/* eslint-disable react-refresh/only-export-components */
import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from 'react'
import { ipcInvoke } from './useIpc'
import type { AppSettings } from '../types'

const IPC = {
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
}

const defaultSettings: AppSettings = {
  githubToken: '',
  backupPath: '',
  repoFilters: {
    owned: true,
    organization: false,
    starred: false,
    forked: false,
    collaborator: false,
  },
  selectedRepoIds: [],
  schedule: {
    enabled: false,
    frequency: 'daily',
    time: '02:00',
  },
  concurrencyLimit: 5,
  retentionLimit: 10,
}

interface SettingsContextType {
  settings: AppSettings
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  loading: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ipcInvoke<AppSettings>(IPC.SETTINGS_GET).then((s) => {
      setSettings(s)
      setLoading(false)
    })
  }, [])

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }))
    try {
      await ipcInvoke(IPC.SETTINGS_SET, partial)
    } catch (e) {
      console.error('Failed to update settings:', e)
    }
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
