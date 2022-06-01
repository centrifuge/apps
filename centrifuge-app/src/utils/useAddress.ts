import { useDebugFlags } from '../components/DebugFlags'
import { useWeb3 } from '../components/Web3Provider'

export function useAddress() {
  const { selectedAccount, proxy } = useWeb3()
  return (useDebugFlags().address as string) || proxy?.delegator || selectedAccount?.address
}
