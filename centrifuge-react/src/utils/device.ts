import { useEffect, useState } from 'react'

export function isMobile() {
  // An easy but perhaps not super accurate way to check if mobile or tablet
  return typeof window !== 'undefined' && window.matchMedia('(pointer: course)').matches
}

let cachedIsMobile = false
export function useIsMobile() {
  const [state, setState] = useState(cachedIsMobile)
  useEffect(() => {
    if (isMobile()) {
      setState(true)
      cachedIsMobile = true
    }
  }, [])
  return state
}
