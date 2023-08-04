import { getWalletBySource } from '@subwallet/wallet-connect/dotsama/wallets'
import { Wallet } from '@subwallet/wallet-connect/types'
import { GnosisSafe } from '@web3-react/gnosis-safe'
import * as React from 'react'
import { EvmConnectorMeta } from './evm/connectors'
import { Action, getPersisted } from './useWalletState'

let triedEager = false

export function useConnectEagerly(
  connect: (wallet: EvmConnectorMeta | Wallet) => void,
  dispatch: (action: Action) => void,
  evmConnectors: EvmConnectorMeta[]
) {
  const [isTryingEagerly, setIsTrying] = React.useState(false)

  async function tryReconnect() {
    try {
      setIsTrying(true)
      const { wallet: source, type } = getPersisted()
      const isProbablyGnosis = window !== window.parent

      if ((type === 'evm' && source) || isProbablyGnosis) {
        let wallet
        if (isProbablyGnosis) {
          wallet = evmConnectors.find((c) => c.connector instanceof GnosisSafe)
        } else {
          wallet = evmConnectors.find((c) => c.id === source)
        }

        if (!wallet) return

        if (wallet.connector.connectEagerly) {
          await wallet.connector.connectEagerly()
        } else {
          await wallet.connector.activate()
        }

        dispatch({ type: 'evmSetState', payload: { selectedWallet: wallet } })
        dispatch({ type: 'setConnectedType', payload: 'evm' })
      } else if (type === 'substrate' && source) {
        // This script might have loaded quicker than the wallet extension,
        // so we'll wait up to 2 seconds for it to load
        let i = 8
        while (i--) {
          const wallet = getWalletBySource(source)
          if (wallet?.installed) {
            connect(wallet)
            break
          }
          await new Promise((res) => setTimeout(res, 250))
        }
      }
    } finally {
      setIsTrying(false)
    }
  }

  React.useEffect(() => {
    if (!triedEager) {
      tryReconnect()
    }
    triedEager = true
  }, [])

  return isTryingEagerly
}
