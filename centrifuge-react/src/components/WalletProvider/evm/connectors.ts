import { IconArrowRight } from '@centrifuge/fabric'
import coinbasewalletLogo from '@centrifuge/fabric/assets/logos/coinbasewallet.svg'
import finoaLogo from '@centrifuge/fabric/assets/logos/finoa.svg'
import metamaskLogo from '@centrifuge/fabric/assets/logos/metamask.svg'
import walletconnectLogo from '@centrifuge/fabric/assets/logos/walletconnect.svg'
import { FinoaEIP1193Provider } from '@finoa/finoa-connect-sdk'
import subWalletLogo from '@subwallet/wallet-connect/dotsama/predefinedWallet/SubWalletLogo.svg'
import talismanLogo from '@subwallet/wallet-connect/dotsama/predefinedWallet/TalismanLogo.svg'
import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { EIP1193 } from '@web3-react/eip1193'
import { GnosisSafe } from '@web3-react/gnosis-safe'
import { MetaMask } from '@web3-react/metamask'
import { WalletConnect as WalletConnectV2 } from '@web3-react/walletconnect-v2'
import { isMobile } from '../../../utils/device'
import {
  Connector,
  createConnector,
  isCoinbaseWallet,
  isInjected,
  isMetaMaskWallet,
  isSubWallet,
  isTalismanWallet,
} from './utils'

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
  get shown(): boolean
}

export function getEvmConnectors(
  urls: { [chainId: number]: string[] },
  {
    walletConnectId,
    additionalConnectors,
  }: {
    walletConnectId?: string
    additionalConnectors?: EvmConnectorMeta[]
    substrateEvmChainId?: number
  } = {}
): EvmConnectorMeta[] {
  const chains = Object.keys(urls).map(Number)
  if (!walletConnectId) {
    throw new Error('WalletConnect ID is required')
  }
  const [walletConnect] = createConnector(
    (actions) =>
      new WalletConnectV2({
        actions,
        options: {
          projectId: walletConnectId,
          optionalChains: chains,
          showQrModal: true,
          rpcMap: Object.entries(urls).reduce((prev, curr) => {
            return { ...prev, [`eip155:${curr[0]}`]: curr[1] }
          }, {}),
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
  const [gnosisSafe] = createConnector<GnosisSafe>((actions) => new GnosisSafe({ actions }))
  const [metaMask] = createConnector((actions) => new MetaMask({ actions }))
  const [finoa] = createConnector<EIP1193>((actions) => new EIP1193({ actions, provider: new FinoaEIP1193Provider() }))

  return [
    {
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
    },
    {
      id: 'finoa',
      title: 'Finoa',
      installUrl: '',
      logo: {
        src: finoaLogo,
        alt: 'Finoa',
      },
      connector: finoa,
      get installed() {
        return true
      },
      get shown() {
        return true
      },
    },

    {
      id: 'metamask',
      get title() {
        return getBrowserWalletMeta().title
      },
      installUrl: 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn',
      get logo() {
        return getBrowserWalletMeta().logo
      },
      connector: metaMask,
      get installed() {
        return isInjected() && !isCoinbaseWallet()
      },
      get shown() {
        return !isMobile() || this.installed
      },
    },
    walletConnect && {
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
        return !isMobile() || !isInjected()
      },
    },
    {
      id: 'coinbase',
      title: 'Coinbase Wallet',
      installUrl: '',
      logo: {
        src: coinbasewalletLogo,
        alt: 'Coinbase Wallet',
      },
      connector: coinbase,
      get installed() {
        return true
      },
      get shown() {
        return true
      },
    },
    ...(additionalConnectors ?? []),
  ].filter(Boolean) as EvmConnectorMeta[]
}

function getBrowserWalletMeta() {
  switch (true) {
    case isSubWallet():
      return {
        title: 'Subwallet (EVM)',
        logo: {
          src: subWalletLogo,
          alt: 'Subwallet',
        },
      }
    case isTalismanWallet():
      return {
        title: 'Talisman (EVM)',
        logo: {
          src: talismanLogo,
          alt: 'Talisman',
        },
      }
    case !isMetaMaskWallet():
      return {
        title: 'Browser Wallet',
        logo: {
          src: IconArrowRight,
          alt: 'Browser Wallet',
        },
      }
    default:
      return {
        title: 'MetaMask',
        logo: {
          src: metamaskLogo,
          alt: 'MetaMask',
        },
      }
  }
}
