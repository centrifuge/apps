import { useWallet } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { useAuth } from '../components/AuthProvider'
import { useOnboardingUser } from '../components/OnboardingUserProvider'
import { getActiveOnboardingStep } from './getActiveOnboardingStep'

// TODO: make dynamic based on the pool and tranche that the user is onboarding to
const trancheId = 'FAKETRANCHEID'
const poolId = 'FAKEPOOLID'

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

export const useOnboardingStep = () => {
  const {
    pendingConnect: { isConnecting },
    substrate: { selectedAccount },
  } = useWallet()
  const { isAuth, isAuthFetched } = useAuth(AUTHORIZED_ONBOARDING_PROXY_TYPES)
  const [activeStep, setActiveStep] = React.useState<number>(0)
  const { onboardingUser, isOnboardingUserFetched, isOnboardingUserFetching } = useOnboardingUser()

  const nextStep = () => setActiveStep((current) => current + 1)
  const backStep = () => setActiveStep((current) => current - 1)

  React.useEffect(() => {
    // tried to connect but no wallet is connected
    if (!isConnecting && !selectedAccount) {
      return setActiveStep(1)
    }
    // wallet finished connection attempt, authentication was attempted, and user is not authenticated
    if (!isConnecting && isAuthFetched && !isAuth) {
      return setActiveStep(1)
    }

    // wallet finished connection attempt, user was fetched
    if (!isConnecting && isOnboardingUserFetched) {
      const activeOnboardingStep = getActiveOnboardingStep(onboardingUser, poolId, trancheId)

      return setActiveStep(activeOnboardingStep)
    }
  }, [onboardingUser, isConnecting, isOnboardingUserFetched, isAuth, isAuthFetched, selectedAccount])

  return {
    activeStep,
    nextStep,
    backStep,
    setActiveStep,
    isFetchingStep: activeStep === 0 || isConnecting || isOnboardingUserFetching,
  }
}
