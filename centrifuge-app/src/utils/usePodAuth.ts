import { CombinedSubstrateAccount, useCentrifuge, useCentrifugeUtils, useWallet } from '@centrifuge/centrifuge-react'
import { useMutation, useQuery } from 'react-query'
import { useSuitableAccounts } from './usePermissions'
import { usePodUrl } from './usePools'

// const AUTHORIZED_POD_PROXY_TYPES = ['Any', 'PodAuth', 'PodAdmin']

export function usePodAuth(poolId: string, accountOverride?: CombinedSubstrateAccount) {
  const { selectedCombinedAccount } = useWallet().substrate
  const podUrl = usePodUrl(poolId)
  const suitableAccounts = useSuitableAccounts({ poolId, poolRole: ['Borrower'], proxyType: ['PodAuth'] })
  const account = accountOverride || selectedCombinedAccount || suitableAccounts[0]
  const cent = useCentrifuge()
  const utils = useCentrifugeUtils()

  const proxy = account?.proxies?.at(-1)
  const proxyType = proxy?.types.includes('Any')
    ? 'Any'
    : proxy?.types.includes('PodAuth')
    ? 'PodAuth'
    : proxy
    ? 'PodAdmin'
    : undefined

  const { data: session, refetch: refetchSession } = useQuery(
    ['session', account?.signingAccount.address, proxy?.delegator, proxyType],
    async () => {
      const rawItem = sessionStorage.getItem(
        getStorageKey(account!.signingAccount.address, proxy?.delegator, proxyType)
      )
      if (rawItem) {
        return JSON.parse(rawItem)
      }
      return null
    },
    { enabled: !!account?.signingAccount.address, staleTime: Infinity }
  )

  const { mutate: login, isLoading: isSigning } = useMutation(async () => {
    try {
      if (account?.signingAccount.address && account.signingAccount.signer) {
        const { address, signer } = account.signingAccount

        const { token, payload } = await cent.auth.generateJw3t(
          utils.formatAddress(address),
          // @ts-ignore
          signer,
          proxy
            ? {
                onBehalfOf: utils.formatAddress(proxy.delegator),
                proxyType,
              }
            : undefined
        )

        sessionStorage.setItem(
          getStorageKey(address, proxy?.delegator, proxyType),
          JSON.stringify({ signed: token, payload })
        )
        refetchSession()
      }
    } catch {}
  })

  const authToken = session?.signed

  const {
    error: authError,
    isLoading: isAuthing,
    isSuccess: isAuthed,
  } = useQuery(['podAccount', podUrl, authToken], () => cent.pod.getSelf([podUrl!, authToken]), {
    enabled: !!podUrl && !!authToken,
    staleTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  return {
    isSigning,
    login,
    token: session?.signed,
    payload: session?.payload,
    isAuthed,
    isAuthing: isSigning || isAuthing,
    authError,
  }
}

function getStorageKey(address: string, onBehalfOf?: string, proxyType?: string) {
  return `centrifuge-auth-${address}${onBehalfOf && proxyType && `-${onBehalfOf}-${proxyType}`}`
}
