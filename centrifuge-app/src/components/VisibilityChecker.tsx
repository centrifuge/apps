import * as React from 'react'
import { Options as UseVisibilityCheckerOptions, useVisibilityChecker } from '../utils/useVisibilityChecker'

type Props = Omit<UseVisibilityCheckerOptions, 'ref'> & {
  children?: React.ReactNode
}

export const VisibilityChecker: React.FC<Props> = ({ children, ...visibilityCheckerOptions }) => {
  const ref = React.useRef<HTMLDivElement>(null)
  useVisibilityChecker({ ref, ...visibilityCheckerOptions })

  return <div ref={ref}>{children}</div>
}
