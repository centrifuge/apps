import { useWallet } from '@centrifuge/centrifuge-react'
import { useEventCallback } from '@centrifuge/fabric'
import * as React from 'react'

export function useConnectBeforeAction(fn: () => void) {
  const { showNetworks, walletDialog, connectedType } = useWallet()
  const doAction = useEventCallback(fn)
  const pending = React.useRef(false)

  React.useEffect(() => {
    if (walletDialog.view !== null || !pending.current) return
    pending.current = false
    doAction()
  }, [doAction, walletDialog.view])

  return useEventCallback(() => {
    if (connectedType) {
      doAction()
    } else {
      pending.current = true
      showNetworks()
    }
  })
}
