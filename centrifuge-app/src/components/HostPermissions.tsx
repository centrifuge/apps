import * as React from 'react'
import { isUrl } from '../utils/parseMetadataUrl'

/**
 * Let's users selectively allow loading metadata, in case it links to an external domain that isn't IPFS
 */

type Context = {
  permissions: Record<string, boolean>
  allowHost: (hostname: string) => void
}

const permissionsJSON = localStorage.getItem('hostPermissions')
const initialPermissions = (permissionsJSON ? JSON.parse(permissionsJSON) : {}) as Record<string, boolean>

const HostPermissionsContext = React.createContext<Context>({ permissions: {}, allowHost() {} })

export const HostPermissionsProvider: React.FC = ({ children }) => {
  const [permissions, setPermissions] = React.useState(initialPermissions)

  function allowHost(hostname: string) {
    const newPermissions = {
      ...permissions,
      [hostname]: true,
    }
    setPermissions(newPermissions)
    localStorage.setItem('hostPermissions', JSON.stringify(newPermissions))
  }

  return (
    <HostPermissionsContext.Provider
      value={{
        permissions,
        allowHost,
      }}
    >
      {children}
    </HostPermissionsContext.Provider>
  )
}

export function useHostPermission(uri?: string | string[]) {
  const ctx = React.useContext(HostPermissionsContext)
  if (!ctx) throw new Error('useHostPermission must be used within HostPermissionsProvider')

  let url = ''
  if (Array.isArray(uri) && uri.length > 0) {
    url = uri[0]
  } else if (typeof uri === 'string') {
    url = uri
  }

  if (url && isUrl(url)) {
    const u = new URL(url)
    return {
      allowed: ctx.permissions[u.hostname] ?? false,
      host: u.hostname,
      allowHost: ctx.allowHost,
    }
  }

  return {
    allowed: true,
    host: '',
    allowHost: () => {},
  }
}
