import React, { useContext } from 'react'
import { useQuery } from 'react-query'
import { OnboardingUser } from '../types'
import { useAuth } from './AuthProvider'
import { useWeb3 } from './Web3Provider'

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

const OnboardingUserContext = React.createContext<{
  onboardingUser: OnboardingUser
  refetchOnboardingUser: () => void
  isOnboardingUserLoading: boolean
  isOnboardingUserFetched: boolean
} | null>(null)

export const OnboardingUserProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuth, authToken } = useAuth(AUTHORIZED_ONBOARDING_PROXY_TYPES)
  const { selectedAccount } = useWeb3()

  const {
    data: onboardingUserData,
    refetch: refetchOnboardingUser,
    isLoading: isOnboardingUserLoading,
    isFetched: isOnboardingUserFetched,
  } = useQuery(
    ['getUser', selectedAccount?.address],
    async () => {
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
    },
    {
      enabled: !!isAuth,
    }
  )

  return (
    <OnboardingUserContext.Provider
      value={{
        onboardingUser: onboardingUserData,
        refetchOnboardingUser,
        isOnboardingUserLoading,
        isOnboardingUserFetched,
      }}
    >
      {children}
    </OnboardingUserContext.Provider>
  )
}

export const useOnboardingUser = () => {
  const ctx = useContext(OnboardingUserContext)
  if (!ctx) throw new Error('useOnboardingUser must be used within OnboardingUserProvider')
  return ctx
}
