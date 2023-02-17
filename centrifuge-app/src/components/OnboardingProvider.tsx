import { useWallet } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { useQuery } from 'react-query'
import { OnboardingUser } from '../types'
import { useAuth } from './AuthProvider'

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

const OnboardingContext = React.createContext<{
  onboardingUser: OnboardingUser
  refetchOnboardingUser: () => void
  isOnboardingUserFetching: boolean
  isOnboardingUserFetched: boolean
  pool: {
    title: string
    trancheId: string
    id: string
  }
} | null>(null)

export function OnboardingProvider({ children }: { children?: React.ReactNode }) {
  const { authToken } = useAuth(AUTHORIZED_ONBOARDING_PROXY_TYPES)
  const { selectedAccount } = useWallet()

  // TODO: get the pool that the user is onboarding to from origin component
  const pool = {
    // this pool is controlled by //Eve
    title: 'Polka Pool 5',
    trancheId: '0xfb2ffeddb7fb9834b502b36f20cfbf66',
    id: '703630827',
  }

  const {
    data: onboardingUserData,
    refetch: refetchOnboardingUser,
    isFetching: isOnboardingUserFetching,
    isFetched: isOnboardingUserFetched,
  } = useQuery(
    ['getUser', authToken],
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

  return (
    <OnboardingContext.Provider
      value={{
        onboardingUser: onboardingUserData || {},
        refetchOnboardingUser,
        isOnboardingUserFetching,
        isOnboardingUserFetched,
        pool,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = () => {
  const ctx = React.useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}
