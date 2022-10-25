import Onboard from 'bnc-onboard'
import { API, Subscriptions } from 'bnc-onboard/dist/src/interfaces'
import config from '../../config'
import { networkNameToId } from '../../utils/networkNameResolver'

const wallets = [
  {
    walletName: 'metamask',
  },
  {
    walletName: 'portis',
    apiKey: config.portisApiKey,
    label: 'Login with Portis',
  },
  {
    walletName: 'ledger',
    rpcUrl: config.rpcUrl,
  },
  {
    walletName: 'walletConnect',
    infuraKey: config.infuraKey,
  },
]

let onboard: API | null = null

// initOnboard returns onboard singleton. Onboard is only initialized once and stored in global state.
export function initOnboard(subscriptions?: Subscriptions): API {
  if (onboard) {
    return onboard
  }

  onboard = Onboard({
    subscriptions,
    networkId: networkNameToId(config.network)!,
    walletSelect: { wallets },
    walletCheck: [
      { checkName: 'connect' },
      { checkName: 'derivationPath' },
      { checkName: 'accounts' },
      { checkName: 'network' },
    ],
    hideBranding: true,
  })

  return onboard
}

export function getOnboard(): API | null {
  return onboard
}
