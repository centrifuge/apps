import { useWallet } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { useAuth } from '../components/AuthProvider'
import { useOnboardingUser } from '../components/OnboardingUserProvider'

// TODO: make dynamic based on the pool and tranche that the user is onboarding to
const trancheId = 'FAKETRANCHEID'
const poolId = 'FAKEPOOLID'

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

export const useOnboardingStep = () => {
  const {
    pendingConnect: { isConnecting },
    substrate: { selectedAccount },
  } = useWallet()
  const { isAuth } = useAuth(AUTHORIZED_ONBOARDING_PROXY_TYPES)
  const [activeStep, setActiveStep] = React.useState<number>(0)
  const { onboardingUser, isOnboardingUserFetched, isOnboardingUserFetching } = useOnboardingUser()

  const nextStep = () => setActiveStep((current) => current + 1)
  const backStep = () => setActiveStep((current) => current - 1)

  React.useEffect(() => {
    if (!isConnecting) {
      if (!isAuth) {
        return setActiveStep(1)
      }

      if (selectedAccount && isOnboardingUserFetched && Object.keys(onboardingUser).length) {
        if (onboardingUser.investorType === 'entity') {
          if (onboardingUser.steps.signAgreements[poolId][trancheId].completed) {
            return setActiveStep(7) // done
          } else if (onboardingUser.steps.verifyIdentity.completed) {
            return setActiveStep(6)
          } else if (onboardingUser.steps.confirmOwners.completed) {
            return setActiveStep(5)
          } else if (onboardingUser.steps.verifyBusiness.completed) {
            return setActiveStep(4)
          }

          return setActiveStep(1)
        }

        if (onboardingUser.investorType === 'individual') {
          if (onboardingUser.steps.signAgreements[poolId][trancheId].completed) {
            return setActiveStep(5) // done
          } else if (onboardingUser.steps.verifyIdentity.completed) {
            return setActiveStep(4)
          } else if (onboardingUser.name) {
            return setActiveStep(3)
          }

          return setActiveStep(1)
        }
      }

      if (isOnboardingUserFetched) {
        return setActiveStep(1)
      }
    }
  }, [onboardingUser, isConnecting, selectedAccount, isOnboardingUserFetched, isAuth])

  return {
    activeStep,
    nextStep,
    backStep,
    setActiveStep,
    isFetchingStep: activeStep === 0 || isConnecting || isOnboardingUserFetching,
  }
}
