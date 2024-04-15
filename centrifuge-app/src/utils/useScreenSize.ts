import { useLayoutEffect, useState } from 'react'

export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight })

  const handleWindowSizeChange = () => {
    setScreenSize({
      width: window.innerWidth,
      height: window.innerHeight,
    } as { width: number; height: number })
  }

  useLayoutEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange)
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange)
    }
  }, [])

  return screenSize
}
