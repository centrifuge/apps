import { useWallet } from '@centrifuge/centrifuge-react'
import { useDebugFlags } from '../components/DebugFlags'

export function useAddress() {
  const { selectedAccount, proxy } = useWallet()
  return (useDebugFlags().address as string) || proxy?.delegator || selectedAccount?.address
}
