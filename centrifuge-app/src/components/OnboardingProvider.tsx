import { useWallet } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { useQuery } from 'react-query'
import { OnboardingUser } from '../types'
import { getActiveOnboardingStep } from '../utils/getActiveOnboardingStep'
import { useAuth } from './AuthProvider'

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

interface OnboardingContextType<T> {
  onboardingUser: T | null
  refetchOnboardingUser: () => void
  pool: {
    title: string
    trancheId: string
    id: string
  }
  activeStep: number
  setActiveStep: React.Dispatch<React.SetStateAction<number>>
  nextStep: () => void
  previousStep: () => void
  isLoadingStep: boolean
}

const OnboardingContext = React.createContext<OnboardingContextType<OnboardingUser> | null>(null)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const {
    pendingConnect: { isConnecting },
    substrate: { selectedAccount },
  } = useWallet()
  const { isAuth, isAuthFetched, authToken } = useAuth(AUTHORIZED_ONBOARDING_PROXY_TYPES)
  const [activeStep, setActiveStep] = React.useState<number>(0)

  const nextStep = () => setActiveStep((current) => current + 1)
  const previousStep = () => setActiveStep((current) => current - 1)

  // TODO: get the pool that the user is onboarding to from origin component
  const pool = {
    // this pool is controlled by //Eve
    title: 'Polka Pool 5',
    trancheId: '0xfb2ffeddb7fb9834b502b36f20cfbf66',
    id: '703630827',
  }

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

        return response.json()
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

  return (
    <OnboardingContext.Provider
      value={{
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

export const useOnboarding = <T extends OnboardingUser = OnboardingUser>() => {
  const ctx = React.useContext(OnboardingContext) as OnboardingContextType<T>
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}
