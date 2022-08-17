import { useSelector } from 'react-redux'
import { useDebugFlags } from '../components/DebugFlags'

export function useAddress() {
  const connectedAddress = useSelector<any, string | null>((state) => state.auth.address)
  return useDebugFlags().address || connectedAddress
}
