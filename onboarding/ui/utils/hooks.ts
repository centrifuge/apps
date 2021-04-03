import * as React from 'react'

export const useKeyboardEvent = (key: KeyboardEvent['key'], callback: () => void) => {
  React.useEffect(() => {
    const handler = function (event: KeyboardEvent) {
      if (event.key === key) {
        callback()
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [])
}
