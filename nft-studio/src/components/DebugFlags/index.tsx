import * as React from 'react'
import { debug } from './config'
import { FlagsState } from './context'

export * from './context'

const DebugFlagsImpl = React.lazy(() => import('./DebugFlags'))

export const DebugFlags: React.FC<{ onChange?: (state: FlagsState) => void }> = ({ children, onChange }) => {
  const fallback = <>{children}</>
  return debug ? (
    <React.Suspense fallback={fallback}>
      <DebugFlagsImpl onChange={onChange}>{children}</DebugFlagsImpl>
    </React.Suspense>
  ) : (
    fallback
  )
}
