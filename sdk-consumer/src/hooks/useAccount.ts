import { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { centrifuge } from '../centrifuge'
import { useCentrifugeQuery } from './useCentrifugeQuery'

const tUSD = '0x8503b4452Bf6238cC76CdbEE223b46d7196b1c93'

export function useAccountBalance() {
  const { address } = useAccount()
  const balance$ = useMemo(() => (address ? centrifuge.balance(tUSD, address) : undefined), [address])
  console.log('balance$', balance$)
  return useCentrifugeQuery(balance$)
}
