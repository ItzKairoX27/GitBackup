import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

export function ipcInvoke<T = unknown>(
  channel: string,
  ...args: any[]
): Promise<T> {
  switch (channel) {
    case 'github:validate-token':
      return invoke(channel, { token: args[0] })
    case 'github:fetch-repos':
      return invoke(channel, { token: args[0], filters: args[1] })
    case 'settings:set':
      return invoke(channel, { partial: args[0] })
    case 'backup:start':
      return invoke(channel, { repos: args[0] })
    case 'backup:open-folder':
      return invoke(channel, { path: args[0] })
    default:
      return invoke(channel)
  }
}

export function useIpcListener(
  channel: string,
  callback: (...args: any[]) => void,
) {
  useEffect(() => {
    let unlisten: (() => void) | undefined

    listen(channel, (event) => {
      callback(event.payload)
    }).then((un) => {
      unlisten = un
    })

    return () => {
      if (unlisten) unlisten()
    }
  }, [channel, callback])
}
