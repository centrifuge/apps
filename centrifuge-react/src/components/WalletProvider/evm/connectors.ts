import metamaskLogo from '@subwallet/wallet-connect/evm/predefinedWallet/MetaMaskLogo.svg'
import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { MetaMask } from '@web3-react/metamask'
import { Connector } from '@web3-react/types'
import { WalletConnect } from '@web3-react/walletconnect'
import { createConnector, isInjected } from './utils'

export type EvmConnectorMeta = {
  id: string
  title: string
  installUrl: string
  logo: {
    src: string
    alt: string
  }
  connector: Connector
  get installed(): boolean
}

export function getEvmConnectors(
  urls: { [chainId: number]: string[] },
  additionalConnectors?: EvmConnectorMeta[]
): EvmConnectorMeta[] {
  const [metaMask] = createConnector((actions) => new MetaMask({ actions }))
  const [walletConnect] = createConnector(
    (actions) =>
      new WalletConnect({
        actions,
        options: {
          rpc: urls,
        },
      })
  )
  const [coinbase] = createConnector(
    (actions) =>
      new CoinbaseWallet({
        actions,
        options: {
          url: urls[1][0],
          appName: 'Centrifuge',
        },
      })
  )

  return [
    {
      id: 'metamask',
      title: 'MetaMask',
      installUrl: 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn',
      logo: {
        src: metamaskLogo,
        alt: 'MetaMask',
      },
      connector: metaMask,
      get installed() {
        return isInjected()
      },
    },
    {
      id: 'walletconnect',
      title: 'WalletConnect',
      installUrl: '',
      logo: {
        src: metamaskLogo,
        alt: 'WalletConnect',
      },
      connector: walletConnect,
      get installed() {
        return true
      },
    },
    {
      id: 'coinbase',
      title: 'Coinbase Wallet',
      installUrl: '',
      logo: {
        src: metamaskLogo,
        alt: 'Coinbase Wallet',
      },
      connector: coinbase,
      get installed() {
        return true
      },
    },
    ...(additionalConnectors ?? []),
  ]
}
