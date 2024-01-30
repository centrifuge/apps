import Centrifuge from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeUtils, useEvmProvider, useWallet } from '@centrifuge/centrifuge-react'
import { BigNumber } from '@ethersproject/bignumber'
import { Signer } from '@polkadot/types/types'
import { encodeAddress } from '@polkadot/util-crypto'
import { ethers, utils } from 'ethers'
import * as React from 'react'
import { useMutation, useQuery } from 'react-query'

export const OnboardingAuthContext = React.createContext<{
  session?: { signed: string; payload: any } | null
  login: () => void
  isLoggingIn: boolean
  isOnboardingExternally: boolean
  setIsOnboardingExternally: React.Dispatch<React.SetStateAction<boolean>>
}>(null as any)

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

export function OnboardingAuthProvider({ children }: { children: React.ReactNode }) {
  const [isOnboardingExternally, setIsOnboardingExternally] = React.useState(false)
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
    ['session', selectedAccount?.address, proxy?.delegator, selectedAddress, isOnboardingExternally],
    () => {
      // if user comes from external app
      if (isOnboardingExternally) {
        const externalSignatureSession = sessionStorage.getItem('external-centrifuge-onboarding-auth')
        if (externalSignatureSession) return JSON.parse(externalSignatureSession)
      }

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
    { enabled: !!selectedAccount?.address || !!selectedAddress || isOnboardingExternally }
  )

  const { mutate: login, isLoading: isLoggingIn } = useMutation(async () => {
    try {
      if (selectedAccount?.address && selectedWallet?.signer) {
        await loginWithSubstrate(selectedAccount?.address, selectedWallet.signer as Signer, cent, proxy)
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
      isOnboardingExternally,
      setIsOnboardingExternally,
    }),
    [session, login, isLoggingIn, isOnboardingExternally, setIsOnboardingExternally]
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
  const { session, isOnboardingExternally } = ctx
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
      enabled: (!!selectedAccount?.address || !!selectedAddress || isOnboardingExternally) && !!authToken,
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
    isOnboardingExternally: ctx.isOnboardingExternally,
    setIsOnboardingExternally: ctx.setIsOnboardingExternally,
  }
}

const loginWithSubstrate = async (hexAddress: string, signer: Signer, cent: Centrifuge, proxy?: any) => {
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

  let body

  if (signedMessage === '0x') {
    const messageHash = utils.hashMessage(message)

    const isValid = await isValidSignature(signer, address, messageHash, evmChainId || 1)

    if (isValid) {
      body = JSON.stringify({
        safeAddress: address,
        messageHash,
        evmChainId,
        network: 'evmOnSafe',
        nonce,
      })
    } else {
      throw new Error('Invalid signature')
    }
  } else {
    body = JSON.stringify({
      message,
      signature: signedMessage,
      address,
      nonce,
      network: isEvmOnSubstrate ? 'evmOnSubstrate' : 'evm',
      chainId: evmChainId || 1,
    })
  }

  const tokenRes = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/authenticateWallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body,
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

const isValidSignature = async (provider: any, safeAddress: string, messageHash: string, evmChainId: number) => {
  const MAGIC_VALUE_BYTES = '0x20c13b0b'

  const safeContract = new ethers.Contract(
    safeAddress,
    [
      'function isValidSignature(bytes calldata _data, bytes calldata _signature) public view returns (bytes4)',
      'function getMessageHash(bytes memory message) public view returns (bytes32)',
      'function getThreshold() public view returns (uint256)',
    ],
    provider
  )

  const safeMessageHash = await safeContract.getMessageHash(messageHash)

  const safeMessage = await fetchSafeMessage(safeMessageHash, evmChainId)

  if (!safeMessage) {
    throw new Error('Unable to fetch SafeMessage')
  }

  const threshold = BigNumber.from(await safeContract.getThreshold()).toNumber()

  if (!threshold || threshold > safeMessage.confirmations.length) {
    throw new Error('Threshold has not been met')
  }

  const response = await safeContract.isValidSignature(messageHash, safeMessage?.preparedSignature)

  return response === MAGIC_VALUE_BYTES
}

const TX_SERVICE_URLS: Record<string, string> = {
  '1': 'https://safe-transaction-mainnet.safe.global/api',
  '5': 'https://safe-transaction-goerli.safe.global/api',
}

const fetchSafeMessage = async (safeMessageHash: string, chainId: number) => {
  const TX_SERVICE_URL = TX_SERVICE_URLS[chainId.toString()]

  const response = await fetch(`${TX_SERVICE_URL}/v1/messages/${safeMessageHash}/`, {
    headers: { 'Content-Type': 'application/json' },
  })

  return response.json()
}
