import { useWallet } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { useAuth } from '../components/AuthProvider'
import { useOnboardingUser } from '../components/OnboardingUserProvider'

// TODO: make dynamic based on the pool and tranche that the user is onboarding to
const trancheId = 'FAKETRANCHEID'
const poolId = 'FAKEPOOLID'

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

export const useOnboardingStep = () => {
  const { isConnecting } = useWallet()
  const { isAuth, isAuthFetched } = useAuth(AUTHORIZED_ONBOARDING_PROXY_TYPES)
  const [activeStep, setActiveStep] = React.useState<number>(0)
  const { onboardingUser, isOnboardingUserFetched, isOnboardingUserFetching } = useOnboardingUser()

  const nextStep = () => setActiveStep((current) => current + 1)
  const backStep = () => setActiveStep((current) => current - 1)

  React.useEffect(() => {
    if (!isConnecting) {
      if (isAuthFetched && !isAuth) {
        return setActiveStep(1)
      }

      if (isOnboardingUserFetched && Object.keys(onboardingUser).length) {
        if (onboardingUser.investorType === 'entity') {
          if (onboardingUser.jurisdictionCode === 'us') {
            if (onboardingUser.steps.signAgreements[poolId][trancheId].completed) {
              return setActiveStep(9) // done
            } else if (onboardingUser.steps.verifyAccreditation.completed) {
              return setActiveStep(8)
            }
          } else {
            if (onboardingUser.steps.signAgreements[poolId][trancheId].completed) {
              return setActiveStep(8) // done
            } else if (onboardingUser.steps.verifyAccreditation.completed) {
              return setActiveStep(7)
            }
          }

          if (onboardingUser.steps.verifyTaxInfo.completed) {
            return setActiveStep(7)
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
          if (onboardingUser.countryOfCitizenship === 'us') {
            if (onboardingUser.steps.signAgreements[poolId][trancheId].completed) {
              return setActiveStep(7) // done
            } else if (onboardingUser.steps.verifyAccreditation.completed) {
              return setActiveStep(6)
            }
          } else {
            if (onboardingUser.steps.signAgreements[poolId][trancheId].completed) {
              return setActiveStep(6) // done
            } else if (onboardingUser.steps.verifyAccreditation.completed) {
              return setActiveStep(5)
            }
          }

          if (onboardingUser.steps.verifyTaxInfo.completed) {
            return setActiveStep(5)
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
  }, [onboardingUser, isConnecting, isOnboardingUserFetched, isAuth, isAuthFetched])

  return {
    activeStep,
    nextStep,
    backStep,
    setActiveStep,
    isFetchingStep: activeStep === 0 || isConnecting || isOnboardingUserFetching,
  }
}
