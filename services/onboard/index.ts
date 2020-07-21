import Onboard from 'bnc-onboard'
import { networkNameToId } from '../../utils/networkNameResolver'
import config from '../../config'
import { Subscriptions, API } from 'bnc-onboard/dist/src/interfaces'

const wallets = [
  {
    walletName: 'metamask',
    preferred: true,
  },
  {
    walletName: 'portis',
    apiKey: config.portisApiKey,
    label: 'Login with Portis',
    preferred: true,
  },
  {
    walletName: 'ledger',
    rpcUrl: config.rpcUrl,
    preferred: true,
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
