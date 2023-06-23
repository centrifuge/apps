import { useWallet } from '@centrifuge/centrifuge-react'
import { Network } from '@centrifuge/centrifuge-react/dist/components/WalletProvider/types'
import { Button } from '@centrifuge/fabric'
import { useHistory } from 'react-router-dom'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { useInvestRedeem } from './InvestRedeemProvider'

export const OnboardingButton = ({ networks }: { networks: Network[] | undefined }) => {
  const { showWallets, connectedType } = useWallet()
  const { state } = useInvestRedeem()
  const pool = usePool(state.poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const isTinlakePool = pool.id.startsWith('0x')

  const trancheName = state.trancheId.split('-')[1] === '0' ? 'junior' : 'senior'
  const centPoolInvestStatus = metadata?.onboarding?.tranches?.[state.trancheId].openForOnboarding ? 'open' : 'closed'
  const investStatus = isTinlakePool ? metadata?.pool?.newInvestmentsStatus?.[trancheName] : centPoolInvestStatus

  const history = useHistory()

  const getOnboardingButtonText = () => {
    if (connectedType) {
      if (investStatus === 'request') {
        return 'Contact issuer'
      }
      if (investStatus === 'closed') {
        return `${state.trancheCurrency?.symbol ?? 'token'} onboarding closed`
      }

      if (investStatus === 'open' || !isTinlakePool) {
        return `Onboard to ${state.trancheCurrency?.symbol ?? 'token'}`
      }
    } else {
      return 'Connect to invest'
    }
  }

  const handleClick = () => {
    if (!connectedType) {
      showWallets(networks?.length === 1 ? networks[0] : undefined)
    } else if (investStatus === 'request') {
      window.open(`mailto:${metadata?.pool?.issuer.email}?subject=New%20Investment%20Inquiry`)
    } else if (metadata?.onboarding?.externalOnboardingUrl) {
      window.open(metadata.onboarding.externalOnboardingUrl)
    } else {
      history.push(`/onboarding?poolId=${state.poolId}&trancheId=${state.trancheId}`)
    }
  }

  return (
    <Button disabled={investStatus === 'closed'} onClick={handleClick}>
      {getOnboardingButtonText()}
    </Button>
  )
}
