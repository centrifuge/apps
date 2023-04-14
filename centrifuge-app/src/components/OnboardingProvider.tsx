import { useWallet } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { useQuery } from 'react-query'
import { OnboardingUser } from '../types'
import { getActiveOnboardingStep } from '../utils/getActiveOnboardingStep'
import { useOnboardingAuth } from './OnboardingAuthProvider'

export type OnboardingPool =
  | {
      trancheId: string
      id: string
      name: string
      symbol: string
    }
  | null
  | undefined

interface OnboardingContextType<User, Pool> {
  onboardingUser: User
  refetchOnboardingUser: () => void
  pool: Pool
  activeStep: number
  setActiveStep: React.Dispatch<React.SetStateAction<number>>
  nextStep: () => void
  previousStep: () => void
  isLoadingStep: boolean
  setPool: React.Dispatch<React.SetStateAction<OnboardingPool | undefined>>
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified'

const OnboardingContext = React.createContext<OnboardingContextType<OnboardingUser, OnboardingPool> | null>(null)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const {
    pendingConnect: { isConnecting },
    substrate: { selectedAccount },
  } = useWallet()
  const { isAuth, isAuthFetched, authToken } = useOnboardingAuth()
  const [activeStep, setActiveStep] = React.useState<number>(0)
  const [pool, setPool] = React.useState<OnboardingPool>()

  const nextStep = () => setActiveStep((current) => current + 1)
  const previousStep = () => setActiveStep((current) => current - 1)

  const {
    data: onboardingUser,
    refetch: refetchOnboardingUser,
    isFetched: isOnboardingUserFetched,
    isLoading: isOnboardingUserLoading,
  } = useQuery(
    ['get-user', authToken],
    async () => {
      if (authToken) {
        const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getUser`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (response.status !== 200) {
          throw new Error()
        }

        try {
          const json = await response.json()

          return json
        } catch (error) {
          return null
        }
      }
    },
    {
      refetchOnWindowFocus: false,
      enabled: !!selectedAccount,
      retry: 1,
    }
  )

  React.useEffect(() => {
    // tried to connect but no wallet is connected
    if (!isConnecting && !selectedAccount) {
      return setActiveStep(1)
    }
    // wallet finished connection attempt, authentication was attempted, and user is not authenticated
    if (!isConnecting && isOnboardingUserFetched && !isAuth) {
      return setActiveStep(1)
    }

    // wallet finished connection attempt, user was fetched
    if (!isConnecting && isOnboardingUserFetched) {
      const activeOnboardingStep = getActiveOnboardingStep(onboardingUser, pool?.id, pool?.trancheId)

      return setActiveStep(activeOnboardingStep)
    }
  }, [onboardingUser, isConnecting, isOnboardingUserFetched, isAuth, isAuthFetched, selectedAccount, pool])

  return (
    <OnboardingContext.Provider
      value={{
        setPool,
        onboardingUser: onboardingUser || null,
        refetchOnboardingUser,
        pool,
        activeStep,
        nextStep,
        previousStep,
        setActiveStep,
        isLoadingStep: activeStep === 0 || isConnecting || isOnboardingUserLoading,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = <
  User extends OnboardingUser = OnboardingUser,
  Pool extends OnboardingPool = OnboardingPool
>() => {
  const ctx = React.useContext(OnboardingContext) as OnboardingContextType<User, Pool>
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}

export const useVerificationStatus = (): VerificationStatus => {
  const { onboardingUser } = useOnboarding()

  return onboardingUser
    ? Object.values(onboardingUser.globalSteps)
        .map(({ completed }) => completed)
        .includes(false)
      ? 'pending'
      : 'verified'
    : 'unverified'
}
