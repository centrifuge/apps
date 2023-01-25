// @ts-expect-error
import metamaskLogo from '@subwallet/wallet-connect/evm/predefinedWallet/MetaMaskLogo.svg'
import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { MetaMask } from '@web3-react/metamask'
import { Connector } from '@web3-react/types'
import { WalletConnect } from '@web3-react/walletconnect'
import { createConnector } from './evm'

// @ ts-expect-error
// import subwalletLogo from '@subwallet/wallet-connect/evm/predefinedWallet/SubWalletLogo.svg'
// import metamaskLogo from '../assets/metamaskLogo.svg'

export type EvmConnectorMeta = {
  name: string
  installUrl: string
  logo: {
    src: string
    alt: string
  }
  connector: Connector
  isInstalled: () => boolean
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
      name: 'MetaMask',
      installUrl: 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn',
      logo: {
        src: metamaskLogo,
        alt: 'MetaMask',
      },
      connector: metaMask,
      isInstalled: () => !!window.ethereum && (window.ethereum as any).isMetaMask,
    },
    {
      name: 'WalletConnect',
      installUrl: '',
      logo: {
        src: metamaskLogo,
        alt: 'WalletConnect',
      },
      connector: walletConnect,
      isInstalled: () => true,
    },
    {
      name: 'Coinbase Wallet',
      installUrl: '',
      logo: {
        src: metamaskLogo,
        alt: 'Coinbase Wallet',
      },
      connector: coinbase,
      isInstalled: () => true,
    },
    ...(additionalConnectors ?? []),
  ]
}
