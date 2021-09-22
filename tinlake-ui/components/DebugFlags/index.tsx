import * as React from 'react'
import { ClientOnlyRender } from '../ClientOnlyRender'
import { debug } from './config'

export * from './context'

const DebugFlagsImpl = React.lazy(() => import('./DebugFlags'))

export const DebugFlags: React.FC = ({ children }) => {
  const fallback = <>{children}</>
  return debug ? (
    <ClientOnlyRender>
      <React.Suspense fallback={fallback}>
        <DebugFlagsImpl>{children}</DebugFlagsImpl>
      </React.Suspense>
    </ClientOnlyRender>
  ) : (
    fallback
  )
}
