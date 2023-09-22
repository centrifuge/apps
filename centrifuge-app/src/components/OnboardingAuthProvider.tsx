import Centrifuge from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeUtils, useEvmProvider, useWallet } from '@centrifuge/centrifuge-react'
import { encodeAddress } from '@polkadot/util-crypto'
import { Wallet } from '@subwallet/wallet-connect/types'
import * as React from 'react'
import { useMutation, useQuery } from 'react-query'

export const OnboardingAuthContext = React.createContext<{
  session?: { signed: string; payload: any } | null
  login: () => void
  isLoggingIn: boolean
}>(null as any)

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

export function OnboardingAuthProvider({ children }: { children: React.ReactNode }) {
  const {
    substrate: { selectedWallet, selectedProxies, selectedAccount, evmChainId },
    evm: { selectedAddress, ...evm },
    isEvmOnSubstrate,
  } = useWallet()
  const cent = useCentrifuge()
  const utils = useCentrifugeUtils()
  const provider = useEvmProvider()
  // onboarding-api expects the wallet address in the native substrate format
  const address = selectedAccount?.address ? utils.formatAddress(selectedAccount?.address) : selectedAddress
  const proxy = selectedProxies?.[0]

  const { data: session, refetch: refetchSession } = useQuery(
    ['session', selectedAccount?.address, proxy?.delegator, selectedAddress],
    () => {
      if (address) {
        if (proxy) {
          const rawItem = sessionStorage.getItem(`centrifuge-onboarding-auth-${address}-${proxy.delegator}`)
          if (rawItem) {
            return JSON.parse(rawItem)
          }
        } else {
          const rawItem = sessionStorage.getItem(`centrifuge-onboarding-auth-${address}`)
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
      } else if (isEvmOnSubstrate && selectedAddress && provider?.getSigner()) {
        await loginWithEvm(selectedAddress, provider.getSigner(), evmChainId, isEvmOnSubstrate)
      } else if (selectedAddress && provider?.getSigner()) {
        await loginWithEvm(selectedAddress, provider.getSigner(), evm.chainId)
      }
      throw new Error('network not supported')
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
        const verifiedRes = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          credentials: 'include',
        })
        if (verifiedRes.status === 200) {
          const verified = (await verifiedRes.json()).verified
          return { verified }
        }
        sessionStorage.clear()
        return { verified: false }
      } catch (error) {
        sessionStorage.clear()
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
    isLoading: ctx.isLoggingIn,
  }
}

const loginWithSubstrate = async (hexAddress: string, signer: Wallet['signer'], cent: Centrifuge, proxy?: any) => {
  // onboarding-api expects the wallet address in the native substrate format
  const address = encodeAddress(hexAddress, await cent.getChainId())
  const nonceRes = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/nonce`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ address }),
  })
  const { nonce } = await nonceRes.json()
  if (proxy) {
    // @ts-expect-error Signer type version mismatch
    const { token, payload } = await cent.auth.generateJw3t(address, signer, {
      onBehalfOf: proxy.delegator,
    })

    if (token) {
      const isAuthorizedProxy = await cent.auth.verifyProxy(address, proxy.delegator, AUTHORIZED_ONBOARDING_PROXY_TYPES)

      if (isAuthorizedProxy) {
        const authTokenRes = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/authenticateWallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ jw3t: token, nonce, network: 'substrate' }),
        })
        if (authTokenRes.status !== 200) {
          throw new Error('Failed to authenticate wallet')
        }
        const authToken = await authTokenRes.json()
        sessionStorage.clear()
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
      const centChainId = await cent.getChainId()
      const authTokenRes = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/authenticateWallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ jw3t: token, nonce, network: 'substrate', chainId: centChainId }),
      })
      if (authTokenRes.status !== 200) {
        throw new Error('Failed to authenticate wallet')
      }
      const authToken = await authTokenRes.json()
      sessionStorage.clear()
      sessionStorage.setItem(
        `centrifuge-onboarding-auth-${address}`,
        JSON.stringify({ signed: authToken.token, payload })
      )
    }
  }
}

const loginWithEvm = async (address: string, signer: any, evmChainId?: number, isEvmOnSubstrate?: boolean) => {
  const nonceRes = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/nonce`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ address }),
  })
  const { nonce } = await nonceRes.json()
  const domain = window.location.host
  const origin = window.location.origin

  const message = `${domain} wants you to sign in with your Ethereum account:
${address}

Please sign to authenticate your wallet

URI: ${origin}
Version: 1
Chain ID: ${evmChainId || 1}
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`

  const signedMessage = await signer?.signMessage(message)
  const tokenRes = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/authenticateWallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      message,
      signature: signedMessage,
      address,
      nonce,
      network: isEvmOnSubstrate ? 'evmOnSubstrate' : 'evm',
      chainId: evmChainId || 1,
    }),
  })
  if (tokenRes.status !== 200) {
    throw new Error('Failed to authenticate wallet')
  }
  const token = await tokenRes.json()
  if (token) {
    sessionStorage.clear()
    sessionStorage.setItem(
      `centrifuge-onboarding-auth-${address}`,
      JSON.stringify({ signed: token.token, payload: message })
    )
  }
}
