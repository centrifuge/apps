import { useAddress, useWallet } from '@centrifuge/centrifuge-react'
import { Navigate } from 'react-router'
import { isEvmAddress } from '../utils/address'

export default function Migrate() {
  const { evm, isEvmOnSubstrate } = useWallet()
  const chainId = evm.chainId ?? undefined
  const address = useAddress(chainId ? 'evm' : 'substrate')

  if (isEvmAddress(address) && !isEvmOnSubstrate) {
    return <Navigate to="/migrate/eth" />
  }
  return <Navigate to="/migrate/cent" />
}
