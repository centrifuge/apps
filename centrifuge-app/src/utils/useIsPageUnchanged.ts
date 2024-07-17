import { useRef } from 'react'
import { useLocation } from 'react-router-dom'

export function useIsPageUnchanged(): () => boolean {
  const location = useLocation()
  const initialPath = useRef(location.pathname)

  return () => initialPath.current === location.pathname
}
