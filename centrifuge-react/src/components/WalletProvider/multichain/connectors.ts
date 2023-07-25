import walletconnectLogo from '@centrifuge/fabric/assets/logos/walletconnect.svg'
import { WalletConnect as WalletConnectV2 } from '@centrifuge/web3-react-walletconnect-v2-universal'
import { Connector } from '@web3-react/types'
import { createConnector } from './utils'

export type ConnectorMeta = {
  id: string
  title: string
  installUrl: string
  logo: {
    src: string
    alt: string
  }
  connector: Connector
  get installed(): boolean
  get shown(): boolean
}

export function getMultichainConnectors({
  walletConnectId,
  rpcMap,
  chains,
}: {
  walletConnectId?: string
  substrateEvmChainId?: number
  rpcMap: { eip155: { [chainId: string]: string }; polkadot: { [chainId: string]: string } }
  chains: string[]
}): ConnectorMeta[] {
  if (!walletConnectId) {
    throw new Error('WalletConnect ID is required')
  }
  const [walletConnect] = createConnector(
    (actions, store) =>
      // @ts-expect-error
      new WalletConnectV2({
        // @ts-expect-error
        actions,
        // @ts-expect-error
        store,
        chains,
        rpcMap,
        options: {
          projectId: walletConnectId,
        },
      }),
    'caip2'
  )
  return [
    {
      id: 'walletconnect',
      title: 'WalletConnect',
      installUrl: '',
      logo: {
        src: walletconnectLogo,
        alt: 'WalletConnect',
      },
      connector: walletConnect,
      get installed() {
        return true
      },
      get shown() {
        return true
      },
    },
  ]
}
