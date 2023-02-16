import { useWallet } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { useAuth } from '../components/AuthProvider'
import { useOnboarding } from '../components/OnboardingProvider'
import { getActiveOnboardingStep } from './getActiveOnboardingStep'

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

export const useOnboardingStep = () => {
  const { isConnecting, selectedAccount } = useWallet()
  const { isAuth, isAuthFetched } = useAuth(AUTHORIZED_ONBOARDING_PROXY_TYPES)
  const [activeStep, setActiveStep] = React.useState<number>(0)
  const { onboardingUser, isOnboardingUserFetched, isOnboardingUserFetching, pool } = useOnboarding()

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
      const activeOnboardingStep = getActiveOnboardingStep(onboardingUser, pool.id, pool.trancheId)

      return setActiveStep(activeOnboardingStep)
    }
  }, [
    onboardingUser,
    isConnecting,
    isOnboardingUserFetched,
    isAuth,
    isAuthFetched,
    selectedAccount,
    pool.id,
    pool.trancheId,
  ])

  return {
    activeStep,
    nextStep,
    backStep,
    setActiveStep,
    isFetchingStep: activeStep === 0 || isConnecting || isOnboardingUserFetching,
  }
}
