import Centrifuge from '@centrifuge/centrifuge-js'
import { useCentrifuge, useEvmProvider, useWallet } from '@centrifuge/centrifuge-react'
import { Wallet } from '@subwallet/wallet-connect/types'
import * as React from 'react'
import { useMutation, useQuery } from 'react-query'
import { SiweMessage } from 'siwe'

export const OnboardingAuthContext = React.createContext<{
  session?: { signed: string; payload: any } | null
  login: () => void
  isLoggingIn: boolean
}>(null as any)

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

export function OnboardingAuthProvider({ children }: { children: React.ReactNode }) {
  const { selectedWallet, proxy, selectedAccount } = useWallet().substrate
  const { selectedAddress } = useWallet().evm
  const cent = useCentrifuge()
  const provider = useEvmProvider()
  const walletAddress = selectedAccount?.address ?? selectedAddress

  const { data: session, refetch: refetchSession } = useQuery(
    ['session', selectedAccount?.address, proxy?.delegator, selectedAddress],
    () => {
      if (selectedAccount?.address || selectedAddress) {
        if (proxy) {
          const rawItem = sessionStorage.getItem(`centrifuge-onboarding-auth-${walletAddress}-${proxy.delegator}`)
          if (rawItem) {
            return JSON.parse(rawItem)
          }
        } else {
          const rawItem = sessionStorage.getItem(`centrifuge-onboarding-auth-${walletAddress}`)
          if (rawItem) {
            return JSON.parse(rawItem)
          }
        }
      }
    },
    { enabled: !!selectedAccount?.address || !!selectedAddress }
  )

  const { mutate: login, isLoading: isLoggingIn } = useMutation(async () => {
    try {
      if (selectedAccount?.address && selectedWallet?.signer) {
        await loginWithSubstrate(selectedAccount?.address, selectedWallet.signer, cent, proxy)
      } else if (selectedAddress && provider?.getSigner()) {
        await loginWithEvm(selectedAddress, provider.getSigner())
      }
    } catch {
    } finally {
      refetchSession()
    }
  })

  const ctx = React.useMemo(
    () => ({
      session,
      login,
      isLoggingIn,
    }),
    [session, login, isLoggingIn]
  )

  return <OnboardingAuthContext.Provider value={ctx}>{children}</OnboardingAuthContext.Provider>
}

export function useOnboardingAuth() {
  const {
    substrate: { selectedAccount },
    evm: { selectedAddress },
  } = useWallet()
  const ctx = React.useContext(OnboardingAuthContext)
  if (!ctx) throw new Error('useOnboardingAuth must be used within OnboardingAuthProvider')
  const { session } = ctx
  const authToken = session?.signed ? session.signed : ''

  const {
    refetch: refetchAuth,
    data,
    isFetched,
  } = useQuery(
    ['auth', authToken],
    async () => {
      try {
        const refreshTokenRes = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          credentials: 'include',
        })
        if (refreshTokenRes.status === 200) {
          const refreshToken = await refreshTokenRes.json()
          // TODO: set the new token in session storage
          return { verified: !!refreshToken }
        }
        return { verified: false }
      } catch (error) {
        return {
          verified: false,
        }
      }
    },
    {
      enabled: (!!selectedAccount?.address || !!selectedAddress) && !!authToken,
      retry: 1,
    }
  )

  return {
    authToken,
    isAuth: data?.verified,
    login: ctx.login,
    refetchAuth,
    isAuthFetched: isFetched,
  }
}

const loginWithSubstrate = async (address: string, signer: Wallet['signer'], cent: Centrifuge, proxy?: any) => {
  if (proxy) {
    // @ts-expect-error Signer type version mismatch
    const { token, payload } = await cent.auth.generateJw3t(address, signer, {
      onBehalfOf: proxy.delegator,
    })

    if (token) {
      const isAuthorizedProxy = await cent.auth.verifyProxy(address, proxy.delegator, AUTHORIZED_ONBOARDING_PROXY_TYPES)

      if (isAuthorizedProxy) {
        const authTokenRes = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/verifyWallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ jw3tToken: token }),
        })
        const authToken = await authTokenRes.json()
        sessionStorage.setItem(
          `centrifuge-onboarding-auth-${address}-${proxy.delegator}`,
          JSON.stringify({ signed: authToken.token, payload })
        )
      }
    }
  } else {
    // @ts-expect-error Signer type version mismatch
    const { token, payload } = await cent.auth.generateJw3t(address, signer)

    if (token) {
      const authTokenRes = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/verifyWallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ jw3tToken: token }),
      })
      const authToken = await authTokenRes.json()
      sessionStorage.setItem(
        `centrifuge-onboarding-auth-${address}`,
        JSON.stringify({ signed: authToken.token, payload })
      )
    }
  }
}

const loginWithEvm = async (address: string, signer: any) => {
  const nonceRes = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/nonce`)
  const nonce = await nonceRes.json()
  const domain = window.location.host
  const origin = window.location.origin
  const message = new SiweMessage({
    domain,
    address: address,
    statement: 'This is THE message',
    uri: origin,
    version: '1',
    chainId: 1,
    nonce: nonce.nonce,
  })
  const siweMessage = message.prepareMessage()
  const signedMessage = await signer?.signMessage(siweMessage)
  const tokenRes = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/verifyWallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ message, signature: signedMessage }),
  })
  const token = await tokenRes.json()
  if (token) {
    sessionStorage.setItem(
      `centrifuge-onboarding-auth-${address}`,
      JSON.stringify({ signed: token.token, payload: message })
    )
  }
}
