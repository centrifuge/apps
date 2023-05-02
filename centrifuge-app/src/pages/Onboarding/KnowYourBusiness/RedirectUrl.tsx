import * as React from 'react'

export function RedirectUrl() {
  React.useEffect(() => {
    const parentWindow = window.parent

    parentWindow.postMessage('manual.onboarding.completed', '*')
  }, [])

  return null
}
