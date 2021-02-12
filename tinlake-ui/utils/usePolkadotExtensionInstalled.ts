import React from 'react'

let interval: ReturnType<typeof setTimeout> | null = null

/**
 * React hook that checks in an interval whether the polkadot browser extension is installed, returning false as long as
 * the extension is not present. If it is installed, the interval will be cleared and true will be returned. This
 * currently only works in one mounted component.
 */
export const usePolkadotExtensionInstalled = () => {
  const [installed, setInstalled] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (interval !== null) {
      return
    }
    let installed: boolean = false
    function checkInstalled() {
      installed = (window as any).injectedWeb3
      if (installed) {
        setInstalled(true)
        cleanup()
      }
    }
    function cleanup() {
      if (interval !== null) {
        clearTimeout(interval)
      }
    }
    checkInstalled()
    if (!installed) {
      interval = setInterval(checkInstalled, 1000)
    }
    return cleanup
  }, [])

  return installed
}
