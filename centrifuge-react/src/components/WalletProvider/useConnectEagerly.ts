import SafeAppsSDK from '@safe-global/safe-apps-sdk'
import { getWalletBySource } from '@subwallet/wallet-connect/dotsama/wallets'
import { Wallet } from '@subwallet/wallet-connect/types'
import { GnosisSafe } from '@web3-react/gnosis-safe'
import * as React from 'react'
import { EvmConnectorMeta } from './evm/connectors'
import { createConnector } from './evm/utils'
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

      const gnosisSdk = new SafeAppsSDK()
      // if gnosis safe is not within the context, the getInfo call will never resolve so we need to timeout
      // https://github.com/safe-global/safe-apps-sdk/issues/263#issuecomment-1029835840
      const isGnosis = !!(await Promise.race([
        gnosisSdk.safe.getInfo(),
        new Promise<undefined>((resolve) => setTimeout(resolve, 200)),
      ]))

      if (isGnosis) {
        const [gnosisSafe] = createConnector<GnosisSafe>((actions) => new GnosisSafe({ actions }))

        const gnosisSafeConnector = {
          id: 'gnosis-safe',
          title: 'Gnosis Safe',
          installUrl: '',
          logo: {
            src: '',
            alt: 'Gnosis Safe',
          },
          connector: gnosisSafe,
          get installed() {
            return true
          },
          get shown() {
            return false
          },
        }

        evmConnectors.unshift(gnosisSafeConnector)

        connect(gnosisSafeConnector)
        return
      }
      if ((!source || !type) && !isGnosis) return
      if (type === 'substrate') {
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
      } else if (type === 'evm') {
        const wallets = evmConnectors.filter((c) => c.id === source || c.connector instanceof GnosisSafe)
        const connected = await Promise.allSettled(
          wallets.map(async (wallet) => {
            if (wallet.connector.connectEagerly) {
              await wallet.connector.connectEagerly()
            } else {
              await wallet.connector.activate()
            }
            return wallet
          })
        )
        const first = connected.find((result) => result.status === 'fulfilled') as
          | PromiseFulfilledResult<EvmConnectorMeta>
          | undefined
        if (first) {
          dispatch({ type: 'evmSetState', payload: { selectedWallet: first.value } })
          dispatch({ type: 'setConnectedType', payload: 'evm' })
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
